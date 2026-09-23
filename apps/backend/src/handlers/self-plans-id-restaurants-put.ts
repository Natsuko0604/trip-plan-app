// レストラン情報の更新
import { HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";
import {
  planIdPathSchema,
  restaurantPutSchema,
  type ImageType,
} from "@tripla/validation";
import type { APIGatewayProxyHandler } from "aws-lambda";
import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "../db";
import { plans, restaurantImages, restaurants, users } from "../db/schema";
import { CORS, response } from "../lib/cors";
import { errorName } from "../lib/error";
import { imageKeyFromUrl } from "../lib/images";

const s3Client = new S3Client({});
const imageBucket = process.env.IMAGE_BUCKET;
const imageBucketRegion = process.env.IMAGE_BUCKET_REGION;

const validateUploadedImage = async (
  imageUrl: string,
  cognitoSub: string,
  imageType: ImageType,
) => {
  if (!imageBucket || !imageBucketRegion) {
    throw new Error("画像用S3バケットの環境変数が設定されていません");
  }

  const imageKey = imageKeyFromUrl(imageUrl, imageBucket, imageBucketRegion);
  if (!imageKey?.startsWith(`images/${cognitoSub}/${imageType}/`)) {
    return "指定された画像を使用できません";
  }

  try {
    await s3Client.send(
      new HeadObjectCommand({ Bucket: imageBucket, Key: imageKey }),
    );
  } catch (error) {
    const name = errorName(error);
    if (name === "NotFound" || name === "NoSuchKey") {
      return "アップロード済み画像が見つかりません";
    }
    throw error;
  }

  return null;
};

export const handler: APIGatewayProxyHandler = async (event) => {
  const requestId = event.requestContext.requestId;
  // OPTIONSリクエストにCORS事前確認の成功レスポンスを返す
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: CORS,
      body: "",
    };
  }

  const parsedPath = planIdPathSchema.safeParse(event.pathParameters);
  if (!parsedPath.success) {
    return response(400, {
      message: event.pathParameters?.planId
        ? "旅行計画IDの形式が正しくありません"
        : "旅行計画IDがありません",
    });
  }

  // リクエスト本文がない場合
  if (!event.body) {
    return response(400, {
      message: "リクエストボディが必要です",
    });
  }

  // リクエストの形式が正しくない場合
  let requestBody: unknown;

  try {
    requestBody = JSON.parse(event.body);
  } catch {
    return response(400, {
      message: "JSONの形式が正しくありません",
    });
  }

  const parsedRequest = restaurantPutSchema.safeParse(requestBody);

  if (!parsedRequest.success) {
    return response(400, {
      message: parsedRequest.error.issues[0]?.path.length
        ? parsedRequest.error.issues[0].message
        : "リクエストボディが正しくありません",
    });
  }

  try {
    const { planId } = parsedPath.data;
    const cognitoSub = event.requestContext.authorizer?.claims?.sub;

    if (typeof cognitoSub !== "string" || !cognitoSub) {
      return response(401, {
        message: "ユーザーが見つかりませんでした",
      });
    }

    const db = await getDb();

    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.cognitoSub, cognitoSub), isNull(users.deletedAt)))
      .limit(1);

    if (!user) {
      return response(404, {
        message: "ユーザーが見つかりません",
      });
    }

    const [plan] = await db
      .select({ id: plans.id })
      .from(plans)
      .where(
        and(
          eq(plans.id, planId),
          eq(plans.userId, user.id),
          isNull(plans.deletedAt),
        ),
      )
      .limit(1);

    if (!plan) {
      return response(404, {
        message: "旅行計画が見つかりません",
      });
    }

    const imageValidationResults = await Promise.all(
      parsedRequest.data.restaurantImages.map((image) =>
        validateUploadedImage(image.imageUrl, cognitoSub, "restaurant"),
      ),
    );
    const imageValidationError = imageValidationResults.find(
      (result) => result !== null,
    );

    if (imageValidationError) {
      return response(400, {
        message: imageValidationError,
      });
    }

    const updatedRestaurantData = await db.transaction(async (tx) => {
      await tx.delete(restaurants).where(eq(restaurants.planId, planId));

      if (!parsedRequest.data.restaurants.length) {
        return {
          restaurants: [],
          restaurantImages: [],
        };
      }

      const restaurantList = await tx
        .insert(restaurants)
        .values(
          parsedRequest.data.restaurants.map((restaurant) => ({
            planId,
            name: restaurant.name,
            address: restaurant.address,
            phoneNumber: restaurant.phoneNumber,
            openingTime: restaurant.openingTime,
            closingTime: restaurant.closingTime,
            notes: restaurant.notes,
          })),
        )
        .returning({
          id: restaurants.id,
          name: restaurants.name,
          address: restaurants.address,
          phoneNumber: restaurants.phoneNumber,
          openingTime: restaurants.openingTime,
          closingTime: restaurants.closingTime,
          notes: restaurants.notes,
          createdAt: restaurants.createdAt,
          updatedAt: restaurants.updatedAt,
        });

      const restaurantIdMap = new Map<string, string>();
      parsedRequest.data.restaurants.forEach((restaurant, index) => {
        if (restaurant.id) {
          restaurantIdMap.set(restaurant.id, restaurantList[index].id);
        }
      });

      const restaurantImageList = parsedRequest.data.restaurantImages.length
        ? await tx
            .insert(restaurantImages)
            .values(
              parsedRequest.data.restaurantImages.map((image) => ({
                restaurantId: restaurantIdMap.get(
                  image.restaurantId,
                ) as string,
                imageUrl: image.imageUrl,
              })),
            )
            .returning({
              id: restaurantImages.id,
              restaurantId: restaurantImages.restaurantId,
              imageUrl: restaurantImages.imageUrl,
              createdAt: restaurantImages.createdAt,
            })
        : [];

      return {
        restaurants: restaurantList,
        restaurantImages: restaurantImageList,
      };
    });

    return response(200, {
      ...updatedRestaurantData,
      message: "レストラン情報の更新に成功しました",
    });
  } catch (error) {
    console.error("レストラン情報の更新に失敗しました", {
      requestId,
      errorName: errorName(error),
    });

    return response(500, {
      message: "レストラン情報の更新に失敗しました",
    });
  }
};
