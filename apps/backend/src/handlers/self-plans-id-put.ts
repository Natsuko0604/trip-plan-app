// 自分の旅行計画を更新
import { HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";
import {
  planIdPathSchema,
  selfPlanPutSchema,
  type ImageType,
} from "@tripla/validation";
import { and, eq, isNull } from "drizzle-orm";
import type { APIGatewayProxyHandler } from "aws-lambda";
import { getDb } from "../db";
import {
  costs,
  memoryImages,
  plans,
  planTags,
  prefecturePlans,
  prefectures,
  tags,
  users,
} from "../db/schema";
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

  const parsedRequest = selfPlanPutSchema.safeParse(requestBody);
  if (!parsedRequest.success) {
    const issue = parsedRequest.error.issues[0];
    const fieldName = issue?.path[0];
    const relatedFields = new Set([
      "costs",
      "memoryImages",
      "prefectures",
      "tags",
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

  const { planId } = parsedPath.data;
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
      return response(401, {
        message: "認証情報を取得できませんでした",
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

    const [existingPlan] = await db
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

    if (!existingPlan) {
      return response(404, {
        message: "旅行計画が見つかりません",
      });
    }

    const imageValidationResults = await Promise.all([
      ...(imageUrl
        ? [validateUploadedImage(imageUrl, cognitoSub, "plan-cover")]
        : []),
      ...relatedData.memoryImages.map((image) =>
        validateUploadedImage(image.imageUrl, cognitoSub, "memory"),
      ),
    ]);
    const imageValidationError = imageValidationResults.find(
      (result) => result !== null,
    );

    if (imageValidationError) {
      return response(400, {
        message: imageValidationError,
      });
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

    const updatedPlan = await db.transaction(async (tx) => {
      const [plan] = await tx
        .update(plans)
        .set({
          title,
          startedAt,
          endedAt,
          comment,
          isPublic,
          imageUrl,
        })
        .where(
          and(
            eq(plans.id, planId),
            eq(plans.userId, user.id),
            isNull(plans.deletedAt),
          ),
        )
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

      if (!plan) {
        return null;
      }

      await tx.delete(costs).where(eq(costs.planId, planId));
      await tx.delete(memoryImages).where(eq(memoryImages.planId, planId));
      await tx.delete(planTags).where(eq(planTags.planId, planId));
      await tx
        .delete(prefecturePlans)
        .where(eq(prefecturePlans.planId, planId));

      if (relatedData.costs.length) {
        await tx.insert(costs).values(
          relatedData.costs.map((item) => ({
            planId,
            ...item,
          })),
        );
      }

      if (relatedData.memoryImages.length) {
        await tx.insert(memoryImages).values(
          relatedData.memoryImages.map((item) => ({
            planId,
            ...item,
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

        if (!tagId) {
          throw new Error("タグを保存できませんでした");
        }
        tagIds.add(tagId);
      }

      if (tagIds.size) {
        await tx.insert(planTags).values(
          [...tagIds].map((tagId) => ({
            planId,
            tagId,
          })),
        );
      }

      if (resolvedPrefectures.size) {
        await tx.insert(prefecturePlans).values(
          [...resolvedPrefectures.values()].map((prefecture) => ({
            userId: user.id,
            planId,
            prefectureId: prefecture.id,
            isCompleted: prefecture.isCompleted,
          })),
        );
      }

      return plan;
    });

    if (!updatedPlan) {
      return response(404, {
        message: "旅行計画が見つかりません",
      });
    }

    return response(200, {
      message: "旅行計画の更新に成功しました",
      plan: updatedPlan,
    });
  } catch (error) {
    console.error("旅行計画の更新に失敗しました", {
      requestId,
      errorName: errorName(error),
    });
    return response(500, {
      message: "旅行計画の更新に失敗しました",
    });
  }
};
