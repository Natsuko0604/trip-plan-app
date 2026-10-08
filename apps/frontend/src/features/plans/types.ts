import type { SelfPlanPostInput } from "@tripla/validation";
import { type LucideIcon } from "lucide-react";

export type Cost = NonNullable<SelfPlanPostInput["costs"]>[number];
export type Hotel = NonNullable<SelfPlanPostInput["hotels"]>[number];
export type HotelImage = NonNullable<SelfPlanPostInput["hotelImages"]>[number];
export type MemoryImage = NonNullable<
  SelfPlanPostInput["memoryImages"]
>[number];
export type Restaurant = NonNullable<SelfPlanPostInput["restaurants"]>[number];
export type RestaurantImage = NonNullable<
  SelfPlanPostInput["restaurantImages"]
>[number];
export type Tag = NonNullable<SelfPlanPostInput["tags"]>[number];
export type TouringSpot = NonNullable<
  SelfPlanPostInput["touringSpots"]
>[number];
export type TouringSpotImage = NonNullable<
  SelfPlanPostInput["touringSpotImages"]
>[number];
export type Timeline = NonNullable<SelfPlanPostInput["timelines"]>[number];
export type PackingItem = NonNullable<
  SelfPlanPostInput["packingItems"]
>[number];

export type SectionButtonProps = {
  icon: LucideIcon;
  label: string;
  wide?: boolean;
};

export type PendingMemoryImage = {
  id: string;
  file: File;
  previewUrl: string;
};
