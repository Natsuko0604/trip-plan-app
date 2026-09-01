import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
  time,
  unique,
  index,
  text,
} from "drizzle-orm/pg-core";

// Users
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),

  nickName: varchar("nick_name", { length: 30 }).notNull(),

  email: varchar("email", { length: 254 }).notNull().unique(),

  cognitoSub: varchar("cognito_sub", { length: 255 }).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),

  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),

  deletedAt: timestamp("deleted_at"),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// Plans
export const plans = pgTable(
  "plans",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    title: varchar("title").notNull(),
    isPublic: boolean("is_public").default(false).notNull(),
    imageUrl: varchar("image_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    index("plans_title_gin_idx").using(
      "gin",
      table.title.asc().op("gin_trgm_ops"),
    ),
  ],
);

export type Plan = typeof plans.$inferSelect;
export type NewPlan = typeof plans.$inferInsert;

// Prefectures
export const prefectures = pgTable("prefectures", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name").notNull(),
});

export type Prefecture = typeof prefectures.$inferSelect;
export type NewPrefecture = typeof prefectures.$inferInsert;

// PrefecturePlans(prefectureとplansの中間)
export const prefecturePlans = pgTable(
  "prefecture_plans",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    prefectureId: uuid("prefecture_id")
      .notNull()
      .references(() => prefectures.id),
    planId: uuid("plan_id")
      .notNull()
      .references(() => plans.id),
    isCompleted: boolean("is_completed").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    unique("prefecture_plans_plan_id_prefecture_id_unique").on(
      table.planId,
      table.prefectureId,
    ),
  ],
);

export type PrefecturePlans = typeof prefecturePlans.$inferSelect;
export type NewPrefecturePlan = typeof prefecturePlans.$inferInsert;

// Favorites(userとplanの中間)
export const favorites = pgTable(
  "favorites",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    planId: uuid("plan_id")
      .notNull()
      .references(() => plans.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    unique("favorite_user_id_plan_id_unique").on(table.userId, table.planId),
    index("favorites_plan_id_idx").on(table.planId),
  ],
);

export type Favorite = typeof favorites.$inferSelect;
export type NewFavorite = typeof favorites.$inferInsert;

// Hotels
export const hotels = pgTable("hotels", {
  id: uuid("id").primaryKey().defaultRandom(),

  planId: uuid("plan_id")
    .notNull()
    .references(() => plans.id),

  name: varchar("name").notNull(),
  address: varchar("address"),
  phoneNumber: varchar("phone_number"),

  checkInTime: time("check_in_time"),
  checkoutTime: time("checkout_time"),

  dinnerStartedAt: time("dinner_started_at"),
  dinnerEndedAt: time("dinner_ended_at"),

  breakfastStartedAt: time("breakfast_started_at"),
  breakfastEndedAt: time("breakfast_ended_at"),

  bathStartedAt: time("bath_started_at"),
  bathEndedAt: time("bath_ended_at"),

  notes: text("notes"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export type Hotel = typeof hotels.$inferSelect;
export type NewHotel = typeof hotels.$inferInsert;

// HotelImages
export const hotelImages = pgTable("hotel_images", {
  id: uuid("id").primaryKey().defaultRandom(),

  hotelId: uuid("hotel_id")
    .notNull()
    .references(() => hotels.id, { onDelete: "cascade" }),

  imageUrl: varchar("image_url").notNull(),

  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type HotelImage = typeof hotelImages.$inferSelect;
export type NewHotelImage = typeof hotelImages.$inferInsert;

// TouringSpots
export const touringSpots = pgTable("touring_spots", {
  id: uuid("id").defaultRandom().primaryKey(),

  planId: uuid("plan_id")
    .notNull()
    .references(() => plans.id),

  name: varchar("name").notNull(),
  address: varchar("address"),
  phoneNumber: varchar("phone_number"),

  openingTime: time("opening_time"),
  closingTime: time("closing_time"),

  notes: text("notes"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export type TouringSpot = typeof touringSpots.$inferSelect;
export type NewTouringSpot = typeof touringSpots.$inferInsert;

// TouringSpotImages
export const touringSpotImages = pgTable("touring_spot_images", {
  id: uuid("id").defaultRandom().primaryKey(),

  touringSpotId: uuid("touring_spot_id")
    .notNull()
    .references(() => touringSpots.id, { onDelete: "cascade" }),

  imageUrl: varchar("image_url").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type TouringSpotImage = typeof touringSpotImages.$inferSelect;
export type NewTouringSpotImage = typeof touringSpotImages.$inferInsert;

// Restaurants
export const restaurants = pgTable("restaurants", {
  id: uuid("id").defaultRandom().primaryKey(),

  planId: uuid("plan_id")
    .notNull()
    .references(() => plans.id),

  name: varchar("name").notNull(),
  address: varchar("address"),
  phoneNumber: varchar("phone_number"),

  openingTime: time("opening_time"),
  closingTime: time("closing_time"),

  notes: text("notes"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export type Restaurant = typeof restaurants.$inferSelect;
export type NewRestaurant = typeof restaurants.$inferInsert;

// RestaurantImages
export const restaurantImages = pgTable("restaurant_images", {
  id: uuid("id").defaultRandom().primaryKey(),

  restaurantId: uuid("restaurant_id")
    .notNull()
    .references(() => restaurants.id, { onDelete: "cascade" }),

  imageUrl: varchar("image_url").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type RestaurantImage = typeof restaurantImages.$inferSelect;
export type NewRestaurantImage = typeof restaurantImages.$inferInsert;

// PackingItems
export const packingItems = pgTable("packing_items", {
  id: uuid("id").defaultRandom().primaryKey(),

  planId: uuid("plan_id")
    .notNull()
    .references(() => plans.id),

  name: varchar("name").notNull(),

  isReady: boolean("is_ready").default(false).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export type PackingItem = typeof packingItems.$inferSelect;
export type NewPackingItem = typeof packingItems.$inferInsert;

// Timelines
export const timelines = pgTable("timelines", {
  id: uuid("id").defaultRandom().primaryKey(),

  planId: uuid("plan_id")
    .notNull()
    .references(() => plans.id),

  title: varchar("title").notNull(),

  startAt: timestamp("start_at").notNull(),
  endAt: timestamp("end_at").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export type TimeLine = typeof timelines.$inferSelect;
export type NewTimeLine = typeof timelines.$inferInsert;
