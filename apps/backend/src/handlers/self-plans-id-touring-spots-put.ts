// 観光地情報の更新
import { HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";
import {
  planIdPathSchema,
  touringSpotPutSchema,
  type ImageType,
} from "@tripla/validation";
import type { APIGatewayProxyHandler } from "aws-lambda";
import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "../db";
import { plans, touringSpotImages, touringSpots, users } from "../db/schema";
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

  const parsedRequest = touringSpotPutSchema.safeParse(requestBody);

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
      parsedRequest.data.touringSpotImages.map((image) =>
        validateUploadedImage(image.imageUrl, cognitoSub, "touring-spot"),
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

    const updatedTouringSpotData = await db.transaction(async (tx) => {
      await tx.delete(touringSpots).where(eq(touringSpots.planId, planId));

      if (!parsedRequest.data.touringSpots.length) {
        return {
          touringSpots: [],
          touringSpotImages: [],
        };
      }

      const touringSpotList = await tx
        .insert(touringSpots)
        .values(
          parsedRequest.data.touringSpots.map((touringSpot) => ({
            planId,
            name: touringSpot.name,
            address: touringSpot.address,
            phoneNumber: touringSpot.phoneNumber,
            openingTime: touringSpot.openingTime,
            closingTime: touringSpot.closingTime,
            notes: touringSpot.notes,
          })),
        )
        .returning({
          id: touringSpots.id,
          name: touringSpots.name,
          address: touringSpots.address,
          phoneNumber: touringSpots.phoneNumber,
          openingTime: touringSpots.openingTime,
          closingTime: touringSpots.closingTime,
          notes: touringSpots.notes,
          createdAt: touringSpots.createdAt,
          updatedAt: touringSpots.updatedAt,
        });

      const touringSpotIdMap = new Map<string, string>();
      parsedRequest.data.touringSpots.forEach((touringSpot, index) => {
        if (touringSpot.id) {
          touringSpotIdMap.set(touringSpot.id, touringSpotList[index].id);
        }
      });

      const touringSpotImageList = parsedRequest.data.touringSpotImages.length
        ? await tx
            .insert(touringSpotImages)
            .values(
              parsedRequest.data.touringSpotImages.map((image) => ({
                touringSpotId: touringSpotIdMap.get(
                  image.touringSpotId,
                ) as string,
                imageUrl: image.imageUrl,
              })),
            )
            .returning({
              id: touringSpotImages.id,
              touringSpotId: touringSpotImages.touringSpotId,
              imageUrl: touringSpotImages.imageUrl,
              createdAt: touringSpotImages.createdAt,
            })
        : [];

      return {
        touringSpots: touringSpotList,
        touringSpotImages: touringSpotImageList,
      };
    });

    return response(200, {
      ...updatedTouringSpotData,
      message: "観光地情報の更新に成功しました",
    });
  } catch (error) {
    console.error("観光地情報の更新に失敗しました", {
      requestId,
      errorName: errorName(error),
    });

    return response(500, {
      message: "観光地情報の更新に失敗しました",
    });
  }
};
