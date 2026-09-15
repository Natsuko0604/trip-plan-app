// 自分の旅行計画詳細を取得
import { APIGatewayProxyHandler } from "aws-lambda";
import { getDb } from "../db";
import { CORS, response } from "../lib/cors";
import { errorName } from "../lib/error";
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
} from "../db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { planIdPathSchema } from "@tripla/validation";

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
  try {
    const db = await getDb();
    const parsedPath = planIdPathSchema.safeParse(event.pathParameters);
    if (!parsedPath.success) {
      return response(400, {
        message: event.pathParameters?.planId
          ? "旅行計画IDの形式が正しくありません"
          : "旅行計画IDがありません",
      });
    }

    const { planId } = parsedPath.data;
    // cognitoからcognitoSub取得
    const cognitoSub = event.requestContext.authorizer?.claims?.sub;

    if (typeof cognitoSub !== "string" || !cognitoSub) {
      return response(401, {
        message: "ユーザーが見つかりませんでした",
      });
    }

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

    // Plansテーブルから旅行計画一覧を取得
    const [plan] = await db
      .select({
        id: plans.id,
        userId: plans.userId,
        title: plans.title,
        startedAt: plans.startedAt,
        endedAt: plans.endedAt,
        comment: plans.comment,
        imageUrl: plans.imageUrl,
        createdAt: plans.createdAt,
        updatedAt: plans.updatedAt,
      })
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

    // Usersテーブルからユーザー情報取得
    const [author] = await db
      .select({
        id: users.id,
        nickname: users.nickName,
      })
      .from(users)
      .where(eq(users.id, plan.userId))
      .limit(1);

    // Hotelsテーブルからホテル情報取得
    const hotelList = await db
      .select({
        id: hotels.id,
        name: hotels.name,
        address: hotels.address,
        phoneNumber: hotels.phoneNumber,
        checkInTime: hotels.checkInTime,
        checkOutTime: hotels.checkoutTime,
        dinnerStartedAt: hotels.dinnerStartedAt,
        dinnerEndedAt: hotels.dinnerEndedAt,
        breakfastStartedTime: hotels.breakfastStartedAt,
        breakfastEndedTime: hotels.breakfastEndedAt,
        notes: hotels.notes,
        createdAt: hotels.createdAt,
        updatedAt: hotels.updatedAt,
      })
      .from(hotels)
      .where(and(eq(hotels.planId, plan.id)));

    // HotelImagesテーブルからホテル画像を取得
    const hotelImageList = await db
      .select({
        id: hotelImages.id,
        hotelId: hotelImages.hotelId,
        imageUrl: hotelImages.imageUrl,
        createdAt: hotelImages.createdAt,
      })
      .from(hotelImages)
      .innerJoin(hotels, eq(hotelImages.hotelId, hotels.id))
      .where(eq(hotels.planId, plan.id));

    // Restaurantsテーブルから飲食店情報取得
    const restaurantList = await db
      .select({
        id: restaurants.id,
        name: restaurants.name,
        address: restaurants.address,
        phoneNumber: restaurants.phoneNumber,
        openingTime: restaurants.openingTime,
        closingTime: restaurants.closingTime,
        notes: restaurants.notes,
        createdAt: restaurants.createdAt,
        updatedAt: restaurants.updatedAt,
      })
      .from(restaurants)
      .where(eq(restaurants.planId, plan.id));

    // RestaurantsImagesテーブルから飲食店画像を取得
    const restaurantImageList = await db
      .select({
        id: restaurantImages.id,
        restaurantId: restaurantImages.restaurantId,
        imageUrl: restaurantImages.imageUrl,
        createdAt: restaurantImages.createdAt,
      })
      .from(restaurantImages)
      .innerJoin(restaurants, eq(restaurantImages.restaurantId, restaurants.id))
      .where(eq(restaurants.planId, plan.id));

    // TouringSpotsテーブルから観光地情報を取得
    const touringSpotList = await db
      .select({
        id: touringSpots.id,
        name: touringSpots.name,
        address: touringSpots.address,
        phoneNumber: touringSpots.phoneNumber,
        openingTime: touringSpots.openingTime,
        closingTime: touringSpots.closingTime,
        notes: touringSpots.notes,
        createdAt: touringSpots.createdAt,
        updatedAt: touringSpots.updatedAt,
      })
      .from(touringSpots)
      .where(eq(touringSpots.planId, plan.id));

    // TouringSpotImagesテーブルから観光地画像を取得
    const touringSpotImageList = await db
      .select({
        id: touringSpotImages.id,
        touringSpotId: touringSpotImages.touringSpotId,
        imageUrl: touringSpotImages.imageUrl,
        createdAt: touringSpotImages.createdAt,
      })
      .from(touringSpotImages)
      .innerJoin(
        touringSpots,
        eq(touringSpotImages.touringSpotId, touringSpots.id),
      )
      .where(eq(touringSpots.planId, plan.id));

    // PackingItemsテーブルから持ち物情報取得
    const packingItemList = await db
      .select({
        id: packingItems.id,
        name: packingItems.name,
        isReady: packingItems.isReady,
        createdAt: packingItems.createdAt,
        updatedAt: packingItems.updatedAt,
      })
      .from(packingItems)
      .where(eq(packingItems.planId, plan.id));

    // TimeLinesテーブルからタイムスケジュール取得
    const timelineList = await db
      .select({
        id: timelines.id,
        title: timelines.title,
        startedAt: timelines.startAt,
        endedAt: timelines.endAt,
        createdAt: timelines.createdAt,
        updatedAt: timelines.updatedAt,
      })
      .from(timelines)
      .where(eq(timelines.planId, plan.id));

    // Costsテーブルから費用情報を取得
    const costList = await db
      .select({
        id: costs.id,
        category: costs.category,
        name: costs.name,
        amount: costs.amount,
        notes: costs.notes,
        createdAt: costs.createdAt,
        updatedAt: costs.updatedAt,
      })
      .from(costs)
      .where(eq(costs.planId, plan.id));

    // MemoryImagesテーブルから思い出画像を取得
    const memoryImageList = await db
      .select({
        id: memoryImages.id,
        imageUrl: memoryImages.imageUrl,
        createdAt: memoryImages.createdAt,
      })
      .from(memoryImages)
      .where(eq(memoryImages.planId, plan.id));

    // tagテーブルからタグ情報を取得
    const tagList = await db
      .select({
        id: tags.id,
        name: tags.name,
      })
      .from(planTags)
      .innerJoin(tags, eq(planTags.tagId, tags.id))
      .where(eq(planTags.planId, plan.id));

    // prefecturesテーブルから都道府県情報を取得
    const prefectureList = await db
      .select({
        id: prefectures.id,
        name: prefectures.name,
        isCompleted: prefecturePlans.isCompleted,
      })
      .from(prefecturePlans)
      .innerJoin(prefectures, eq(prefecturePlans.prefectureId, prefectures.id))
      .where(eq(prefecturePlans.planId, plan.id));

    // コスト合計・円グラフ用
    const categoryTotalsMap: Record<string, number> = {};
    let totalAmount = 0;

    for (const cost of costList) {
      totalAmount += cost.amount;

      categoryTotalsMap[cost.category] =
        (categoryTotalsMap[cost.category] ?? 0) + cost.amount;
    }

    const categoryTotals = Object.entries(categoryTotalsMap).map(
      ([category, amount]) => ({
        category,
        amount,
      }),
    );

    return response(200, {
      plan: {
        ...plan,
        costs: costList,
        costSummary: {
          totalAmount,
          categoryTotals,
        },
        author: author,
        hotels: hotelList,
        hotelImages: hotelImageList,
        restaurants: restaurantList,
        restaurantImages: restaurantImageList,
        touringSpots: touringSpotList,
        touringSpotImages: touringSpotImageList,
        packingItems: packingItemList,
        timelines: timelineList,
        memoryImages: memoryImageList,
        tags: tagList,
        prefectures: prefectureList,
      },
      message: "旅行計画詳細の取得に成功しました",
    });
  } catch (error) {
    console.error("旅行計画詳細の取得に失敗しました", {
      requestId,
      errorName: errorName(error),
    });
    return response(500, {
      message: "旅行計画詳細取得に失敗しました",
    });
  }
};
