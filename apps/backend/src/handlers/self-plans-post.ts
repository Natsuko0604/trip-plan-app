// 旅行計画作成
import { HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { selfPlanPostSchema, type ImageType } from "@tripla/validation";
import { eq } from "drizzle-orm";
import type { APIGatewayProxyHandler } from "aws-lambda";
import { getDb } from "../db/index.js";
import {
  costs,
  hotelImages,
  hotels,
  memoryImages,
  packingItems,
  plans,
  planTags,
  prefecturePlans,
  prefectures,
  restaurantImages,
  restaurants,
  tags,
  timelines,
  touringSpotImages,
  touringSpots,
  users,
} from "../db/schema.js";
import { CORS, response } from "../lib/cors.js";
import { errorName } from "../lib/error.js";
import { imageKeyFromUrl } from "../lib/images.js";

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
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS, body: "" };
  }
  if (!event.body) {
    return response(400, { message: "リクエストボディが必要です" });
  }

  let requestBody: unknown;
  try {
    requestBody = JSON.parse(event.body);
  } catch {
    return response(400, { message: "JSONの形式が正しくありません" });
  }
  const parsedRequest = selfPlanPostSchema.safeParse(requestBody);
  if (!parsedRequest.success) {
    const issue = parsedRequest.error.issues[0];
    const fieldName = issue?.path[0];
    const relatedFields = new Set([
      "costs",
      "hotels",
      "hotelImages",
      "memoryImages",
      "packingItems",
      "prefectures",
      "restaurants",
      "restaurantImages",
      "tags",
      "timelines",
      "touringSpots",
      "touringSpotImages",
    ]);
    let message = issue?.path.length
      ? issue.message
      : "リクエストボディが正しくありません";
    if (typeof fieldName === "string" && relatedFields.has(fieldName)) {
      message = `${fieldName}の形式が正しくありません`;
    } else if (fieldName === "isPublic") {
      message = "isPublicはbooleanで指定してください";
    } else if (fieldName === "imageUrl") {
      message = "imageUrlの形式が正しくありません";
    } else if (fieldName === "comment") {
      message = "commentの形式が正しくありません";
    }

    return response(400, {
      message,
    });
  }

  const {
    title,
    startedAt,
    endedAt,
    comment,
    isPublic,
    imageUrl,
    ...relatedData
  } = parsedRequest.data;

  try {
    const cognitoSub = event.requestContext.authorizer?.claims?.sub;
    if (typeof cognitoSub !== "string" || !cognitoSub) {
      return response(401, { message: "認証情報を取得できませんでした" });
    }

    const imageValidationResults = await Promise.all([
      ...(imageUrl
        ? [validateUploadedImage(imageUrl, cognitoSub, "plan-cover")]
        : []),
      ...relatedData.hotelImages.map((image) =>
        validateUploadedImage(image.imageUrl, cognitoSub, "hotel"),
      ),
      ...relatedData.restaurantImages.map((image) =>
        validateUploadedImage(image.imageUrl, cognitoSub, "restaurant"),
      ),
      ...relatedData.touringSpotImages.map((image) =>
        validateUploadedImage(image.imageUrl, cognitoSub, "touring-spot"),
      ),
      ...relatedData.memoryImages.map((image) =>
        validateUploadedImage(image.imageUrl, cognitoSub, "memory"),
      ),
    ]);
    const imageValidationError = imageValidationResults.find(
      (result) => result !== null,
    );
    if (imageValidationError) {
      return response(400, { message: imageValidationError });
    }

    const db = await getDb();
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.cognitoSub, cognitoSub))
      .limit(1);
    if (!user) {
      return response(404, { message: "ユーザーが見つかりません" });
    }

    const resolvedPrefectures = new Map<
      string,
      { id: string; isCompleted: boolean }
    >();
    for (const prefecture of relatedData.prefectures) {
      const [found] = prefecture.id
        ? await db
            .select({ id: prefectures.id })
            .from(prefectures)
            .where(eq(prefectures.id, prefecture.id))
            .limit(1)
        : await db
            .select({ id: prefectures.id })
            .from(prefectures)
            .where(eq(prefectures.name, prefecture.name))
            .limit(1);

      if (!found) {
        return response(404, {
          message: `都道府県「${prefecture.name}」が見つかりません`,
        });
      }
      resolvedPrefectures.set(found.id, {
        id: found.id,
        isCompleted: prefecture.isCompleted,
      });
    }

    const selfPlan = await db.transaction(async (tx) => {
      const [createdPlan] = await tx
        .insert(plans)
        .values({
          userId: user.id,
          title,
          startedAt,
          endedAt,
          comment,
          isPublic,
          imageUrl,
        })
        .returning({
          id: plans.id,
          title: plans.title,
          startedAt: plans.startedAt,
          endedAt: plans.endedAt,
          comment: plans.comment,
          isPublic: plans.isPublic,
          imageUrl: plans.imageUrl,
          createdAt: plans.createdAt,
          updatedAt: plans.updatedAt,
        });
      if (!createdPlan) throw new Error("旅行計画を作成できませんでした");

      if (relatedData.costs.length) {
        await tx.insert(costs).values(
          relatedData.costs.map((item) => ({
            planId: createdPlan.id,
            ...item,
          })),
        );
      }
      if (relatedData.memoryImages.length) {
        await tx.insert(memoryImages).values(
          relatedData.memoryImages.map((item) => ({
            planId: createdPlan.id,
            ...item,
          })),
        );
      }
      if (relatedData.packingItems.length) {
        await tx.insert(packingItems).values(
          relatedData.packingItems.map((item) => ({
            planId: createdPlan.id,
            ...item,
          })),
        );
      }
      if (relatedData.timelines.length) {
        await tx.insert(timelines).values(
          relatedData.timelines.map((item) => ({
            planId: createdPlan.id,
            title: item.title,
            startAt: item.startedAt,
            endAt: item.endedAt,
          })),
        );
      }

      const hotelIdMap = new Map<string, string>();
      if (relatedData.hotels.length) {
        const created = await tx
          .insert(hotels)
          .values(
            relatedData.hotels.map((item) => ({
              planId: createdPlan.id,
              name: item.name,
              address: item.address,
              phoneNumber: item.phoneNumber,
              checkInTime: item.checkInTime,
              checkoutTime: item.checkOutTime,
              dinnerStartedAt: item.dinnerStartedAt,
              dinnerEndedAt: item.dinnerEndedAt,
              breakfastStartedAt: item.breakfastStartedTime,
              breakfastEndedAt: item.breakfastEndedTime,
              notes: item.notes,
            })),
          )
          .returning({ id: hotels.id });
        relatedData.hotels.forEach((item, index) => {
          if (item.id) hotelIdMap.set(item.id, created[index].id);
        });
      }
      if (relatedData.hotelImages.length) {
        await tx.insert(hotelImages).values(
          relatedData.hotelImages.map((image) => ({
            hotelId: hotelIdMap.get(image.hotelId) as string,
            imageUrl: image.imageUrl,
          })),
        );
      }

      const restaurantIdMap = new Map<string, string>();
      if (relatedData.restaurants.length) {
        const created = await tx
          .insert(restaurants)
          .values(
            relatedData.restaurants.map(({ id: _id, ...item }) => ({
              planId: createdPlan.id,
              ...item,
            })),
          )
          .returning({ id: restaurants.id });
        relatedData.restaurants.forEach((item, index) => {
          if (item.id) {
            restaurantIdMap.set(item.id, created[index].id);
          }
        });
      }
      if (relatedData.restaurantImages.length) {
        await tx.insert(restaurantImages).values(
          relatedData.restaurantImages.map((image) => ({
            restaurantId: restaurantIdMap.get(image.restaurantId) as string,
            imageUrl: image.imageUrl,
          })),
        );
      }

      const touringSpotIdMap = new Map<string, string>();
      if (relatedData.touringSpots.length) {
        const created = await tx
          .insert(touringSpots)
          .values(
            relatedData.touringSpots.map(({ id: _id, ...item }) => ({
              planId: createdPlan.id,
              ...item,
            })),
          )
          .returning({ id: touringSpots.id });
        relatedData.touringSpots.forEach((item, index) => {
          if (item.id) {
            touringSpotIdMap.set(item.id, created[index].id);
          }
        });
      }
      if (relatedData.touringSpotImages.length) {
        await tx.insert(touringSpotImages).values(
          relatedData.touringSpotImages.map((image) => ({
            touringSpotId: touringSpotIdMap.get(image.touringSpotId) as string,
            imageUrl: image.imageUrl,
          })),
        );
      }

      const tagIds = new Set<string>();
      for (const tag of relatedData.tags) {
        let tagId: string | undefined;
        if (tag.id) {
          const [found] = await tx
            .select({ id: tags.id })
            .from(tags)
            .where(eq(tags.id, tag.id))
            .limit(1);
          tagId = found?.id;
        }
        if (!tagId) {
          const [created] = await tx
            .insert(tags)
            .values({ name: tag.name })
            .onConflictDoNothing({ target: tags.name })
            .returning({ id: tags.id });
          tagId = created?.id;
          if (!tagId) {
            const [found] = await tx
              .select({ id: tags.id })
              .from(tags)
              .where(eq(tags.name, tag.name))
              .limit(1);
            tagId = found?.id;
          }
        }
        if (!tagId) throw new Error("タグを保存できませんでした");
        tagIds.add(tagId);
      }
      if (tagIds.size) {
        await tx.insert(planTags).values(
          [...tagIds].map((tagId) => ({ planId: createdPlan.id, tagId })),
        );
      }

      if (resolvedPrefectures.size) {
        await tx.insert(prefecturePlans).values(
          [...resolvedPrefectures.values()].map((prefecture) => ({
            planId: createdPlan.id,
            prefectureId: prefecture.id,
            isCompleted: prefecture.isCompleted,
          })),
        );
      }
      return createdPlan;
    });

    return response(201, {
      message: "新しい旅行計画を作成しました",
      plans: selfPlan,
    });
  } catch (error) {
    console.error("新しい旅行計画を作成できませんでした", {
      requestId,
      errorName: errorName(error),
    });
    return response(500, { message: "旅行計画を作成できませんでした" });
  }
};
