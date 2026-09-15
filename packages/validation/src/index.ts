import { z } from "zod";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isValidDate = (value: string) => {
  if (!DATE_PATTERN.test(value)) {
    return false;
  }
  const parsedDate = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(parsedDate.getTime()) &&
    parsedDate.toISOString().slice(0, 10) === value
  );
};

const requiredString = (message: string, maxLength = 255) =>
  z
    .string({ message })
    .trim()
    .min(1, { message })
    .max(maxLength, { message });

const nullableString = (maxLength = 255) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .nullable()
    .optional()
    .transform((value) => value || null);

const nullableText = z
  .string()
  .trim()
  .nullable()
  .optional()
  .transform((value) => value || null);

const nullableTime = z
  .string()
  .trim()
  .nullable()
  .optional()
  .transform((value) => value || null)
  .refine((value) => value === null || TIME_PATTERN.test(value), {
    message: "時刻はHH:mmまたはHH:mm:ss形式で指定してください",
  });

const sourceIdSchema = requiredString("idの形式が正しくありません");
export const uuidSchema = z.string().trim().regex(UUID_PATTERN, {
  message: "UUIDの形式が正しくありません",
});
export const cognitoSubSchema = z.string().trim().min(1);

export const planIdPathSchema = z.object({
  planId: uuidSchema,
});

export const signupPostSchema = z.object({
  email: z
    .string({ message: "emailとpasswordは必須です" })
    .trim()
    .min(1, { message: "emailとpasswordは必須です" })
    .max(254, { message: "メールアドレスの形式が正しくありません" })
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
      message: "メールアドレスの形式が正しくありません",
    })
    .transform((email) => email.toLowerCase()),
  password: z
    .string({ message: "emailとpasswordは必須です" })
    .min(1, { message: "emailとpasswordは必須です" }),
});

export const imageTypes = [
  "plan-cover",
  "hotel",
  "restaurant",
  "touring-spot",
  "memory",
] as const;
export type ImageType = (typeof imageTypes)[number];

export const imageUploadUrlPostSchema = z.object({
  imageType: z.enum(imageTypes, {
    message: "imageTypeが正しくありません",
  }),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"], {
    message: "JPEG、PNG、WebP形式の画像を指定してください",
  }),
});

export const memoryPlanPostSchema = z.object({
  name: requiredString("都道府県の設定は必須です"),
});

const costSchema = z.object({
  category: requiredString("categoryは必須です", 30),
  name: requiredString("nameは必須です", 100),
  amount: z.number().int().nonnegative(),
  notes: nullableString(),
});

const hotelSchema = z.object({
  id: sourceIdSchema.optional(),
  name: requiredString("ホテル名は必須です"),
  address: nullableString(),
  phoneNumber: nullableString(),
  checkInTime: nullableTime,
  checkOutTime: nullableTime,
  dinnerStartedAt: nullableTime,
  dinnerEndedAt: nullableTime,
  breakfastStartedTime: nullableTime,
  breakfastEndedTime: nullableTime,
  notes: nullableString(),
});

const hotelImageSchema = z.object({
  hotelId: sourceIdSchema,
  imageUrl: requiredString("imageUrlは必須です"),
});

const restaurantSchema = z.object({
  id: sourceIdSchema.optional(),
  name: requiredString("飲食店名は必須です"),
  address: nullableString(),
  phoneNumber: nullableString(),
  openingTime: nullableTime,
  closingTime: nullableTime,
  notes: nullableString(),
});

const restaurantImageSchema = z.object({
  restaurantId: sourceIdSchema,
  imageUrl: requiredString("imageUrlは必須です"),
});

const touringSpotSchema = z.object({
  id: sourceIdSchema.optional(),
  name: requiredString("観光地名は必須です"),
  address: nullableString(),
  phoneNumber: nullableString(),
  openingTime: nullableTime,
  closingTime: nullableTime,
  notes: nullableString(),
});

const touringSpotImageSchema = z.object({
  touringSpotId: sourceIdSchema,
  imageUrl: requiredString("imageUrlは必須です"),
});

const memoryImageSchema = z.object({
  imageUrl: requiredString("imageUrlは必須です"),
});

const packingItemSchema = z.object({
  name: requiredString("持ち物名は必須です"),
  isReady: z.boolean().optional().default(false),
});

const timelineSchema = z
  .object({
    title: requiredString("タイトルは必須です"),
    startedAt: requiredString("開始日時は必須です").transform(
      (value, context) => {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
          context.addIssue({
            code: "custom",
            message: "開始日時の形式が正しくありません",
          });
          return z.NEVER;
        }
        return date;
      },
    ),
    endedAt: requiredString("終了日時は必須です").transform(
      (value, context) => {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
          context.addIssue({
            code: "custom",
            message: "終了日時の形式が正しくありません",
          });
          return z.NEVER;
        }
        return date;
      },
    ),
  })
  .refine((timeline) => timeline.endedAt >= timeline.startedAt, {
    path: ["endedAt"],
    message: "終了日時は開始日時以降にしてください",
  });

const tagSchema = z.object({
  id: uuidSchema.optional(),
  name: requiredString("タグ名は必須です", 50),
});

const prefectureSchema = z.object({
  id: uuidSchema.optional(),
  name: requiredString("都道府県名は必須です"),
  isCompleted: z.boolean().optional().default(false),
});

const duplicatedIds = (items: Array<{ id?: string }>) => {
  const ids = items.flatMap((item) => (item.id ? [item.id] : []));
  return ids.length !== new Set(ids).size;
};

const addReferenceIssue = (
  context: z.RefinementCtx,
  collection: string,
  index: number,
  key: string,
) => {
  context.addIssue({
    code: "custom",
    path: [collection, index, key],
    message: `${key}に対応するデータがありません`,
  });
};

export const selfPlanPostSchema = z
  .object({
    title: requiredString("タイトルは必須です"),
    startedAt: z
      .string({ message: "旅行日はYYYY-MM-DD形式で指定してください" })
      .trim()
      .refine(isValidDate, {
        message: "旅行日はYYYY-MM-DD形式で指定してください",
      }),
    endedAt: z
      .string({ message: "旅行日はYYYY-MM-DD形式で指定してください" })
      .trim()
      .refine(isValidDate, {
        message: "旅行日はYYYY-MM-DD形式で指定してください",
      }),
    comment: nullableText,
    isPublic: z.boolean().optional().default(false),
    imageUrl: nullableString(),
    costs: z.array(costSchema).optional().default([]),
    hotels: z.array(hotelSchema).optional().default([]),
    hotelImages: z.array(hotelImageSchema).optional().default([]),
    memoryImages: z.array(memoryImageSchema).optional().default([]),
    packingItems: z.array(packingItemSchema).optional().default([]),
    prefectures: z.array(prefectureSchema).optional().default([]),
    restaurants: z.array(restaurantSchema).optional().default([]),
    restaurantImages: z.array(restaurantImageSchema).optional().default([]),
    tags: z.array(tagSchema).optional().default([]),
    timelines: z.array(timelineSchema).optional().default([]),
    touringSpots: z.array(touringSpotSchema).optional().default([]),
    touringSpotImages: z.array(touringSpotImageSchema).optional().default([]),
  })
  .superRefine((plan, context) => {
    if (plan.endedAt < plan.startedAt) {
      context.addIssue({
        code: "custom",
        path: ["endedAt"],
        message: "終了日は開始日以降にしてください",
      });
    }

    for (const [key, items] of [
      ["hotels", plan.hotels],
      ["restaurants", plan.restaurants],
      ["touringSpots", plan.touringSpots],
    ] as const) {
      if (duplicatedIds(items)) {
        context.addIssue({
          code: "custom",
          path: [key],
          message: `${key}.idが重複しています`,
        });
      }
    }

    const hotelIds = new Set(plan.hotels.flatMap((hotel) => hotel.id ?? []));
    plan.hotelImages.forEach((image, index) => {
      if (!hotelIds.has(image.hotelId)) {
        addReferenceIssue(context, "hotelImages", index, "hotelId");
      }
    });

    const restaurantIds = new Set(
      plan.restaurants.flatMap((restaurant) => restaurant.id ?? []),
    );
    plan.restaurantImages.forEach((image, index) => {
      if (!restaurantIds.has(image.restaurantId)) {
        addReferenceIssue(context, "restaurantImages", index, "restaurantId");
      }
    });

    const touringSpotIds = new Set(
      plan.touringSpots.flatMap((spot) => spot.id ?? []),
    );
    plan.touringSpotImages.forEach((image, index) => {
      if (!touringSpotIds.has(image.touringSpotId)) {
        addReferenceIssue(context, "touringSpotImages", index, "touringSpotId");
      }
    });
  });

export type PlanIdPathInput = z.input<typeof planIdPathSchema>;
export type SignupPostInput = z.input<typeof signupPostSchema>;
export type SignupPostData = z.output<typeof signupPostSchema>;
export type ImageUploadUrlPostInput = z.input<
  typeof imageUploadUrlPostSchema
>;
export type ImageUploadUrlPostData = z.output<
  typeof imageUploadUrlPostSchema
>;
export type MemoryPlanPostInput = z.input<typeof memoryPlanPostSchema>;
export type MemoryPlanPostData = z.output<typeof memoryPlanPostSchema>;
export type SelfPlanPostInput = z.input<typeof selfPlanPostSchema>;
export type SelfPlanPostData = z.output<typeof selfPlanPostSchema>;
