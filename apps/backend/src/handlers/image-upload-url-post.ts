// 共通画像アップロードURL発行
import { S3Client } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import type { APIGatewayProxyHandler } from "aws-lambda";
import { CORS, response } from "../lib/cors.js";
import { errorName } from "../lib/error.js";
import {
  createImageKey,
  createImageUrl,
  imageExtension,
  isImageType,
} from "../lib/images.js";

const s3Client = new S3Client({});
const imageBucket = process.env.IMAGE_BUCKET;
const imageBucketRegion = process.env.IMAGE_BUCKET_REGION;
const maxImageSizeBytes = 5 * 1024 * 1024;
const uploadUrlExpiresSeconds = 300;

export const handler: APIGatewayProxyHandler = async (event) => {
  const requestId = event.requestContext.requestId;

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: CORS,
      body: "",
    };
  }

  if (!imageBucket || !imageBucketRegion) {
    console.error("画像用S3バケットの環境変数が設定されていません", {
      requestId,
    });
    return response(500, {
      message: "サーバー設定に問題があります",
    });
  }

  const cognitoSub = event.requestContext.authorizer?.claims?.sub;
  if (typeof cognitoSub !== "string" || !cognitoSub) {
    return response(401, {
      message: "認証情報を取得できませんでした",
    });
  }

  if (!event.body) {
    return response(400, {
      message: "リクエストボディが必要です",
    });
  }

  let requestBody: unknown;
  try {
    requestBody = JSON.parse(event.body);
  } catch {
    return response(400, {
      message: "JSONの形式が正しくありません",
    });
  }

  if (
    typeof requestBody !== "object" ||
    requestBody === null ||
    Array.isArray(requestBody)
  ) {
    return response(400, {
      message: "リクエストボディが正しくありません",
    });
  }

  const body = requestBody as Record<string, unknown>;
  if (!isImageType(body.imageType)) {
    return response(400, {
      message: "imageTypeが正しくありません",
    });
  }

  const extension = imageExtension(body.contentType);
  if (!extension || typeof body.contentType !== "string") {
    return response(400, {
      message: "JPEG、PNG、WebP形式の画像を指定してください",
    });
  }

  const imageKey = createImageKey(cognitoSub, body.imageType, extension);
  const imageUrl = createImageUrl(
    imageBucket,
    imageBucketRegion,
    imageKey,
  );

  try {
    const upload = await createPresignedPost(s3Client, {
      Bucket: imageBucket,
      Key: imageKey,
      Conditions: [
        ["content-length-range", 1, maxImageSizeBytes],
        ["eq", "$Content-Type", body.contentType],
      ],
      Fields: {
        "Content-Type": body.contentType,
      },
      Expires: uploadUrlExpiresSeconds,
    });

    return response(200, {
      imageUrl,
      upload,
      expiresIn: uploadUrlExpiresSeconds,
      maxImageSizeBytes,
    });
  } catch (error) {
    console.error("画像アップロードURLを発行できませんでした", {
      requestId,
      errorName: errorName(error),
    });
    return response(500, {
      message: "画像アップロードURLを発行できませんでした",
    });
  }
};
