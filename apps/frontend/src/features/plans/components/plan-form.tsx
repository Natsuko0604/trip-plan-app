"use client";

import { useState, type SubmitEvent } from "react";
import type {
  Cost,
  Hotel,
  HotelImage,
  MemoryImage,
  PackingItem,
  Restaurant,
  RestaurantImage,
  SectionButtonProps,
  TouringSpot,
  TouringSpotImage,
} from "../types";
import { Bed, Luggage, MapPin, Timeline, Utensils } from "lucide-react";

const inputClassName =
  "h-12 w-full rounded-xl border border-neutral-300 bg-white px-4 text-base text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-[#7eb9b4] focus:ring-2 focus:ring-[#7eb9b4]/20";

function SectionButton({
  icon: Icon,
  label,
  wide = false,
}: SectionButtonProps) {
  return (
    <button
      type="button"
      className={`flex min-h-24 flex-col items-center justify-center gap-1.5 rounded-xl border border-[#9bcac6] bg-white px-3 py-4 text-[#79b5b0] transition hover:bg-[#f1f9f8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#70aaa5] ${
        wide ? "col-span-3 min-h-14 flex-row py-3" : ""
      }`}
    >
      <Icon className="size-8" strokeWidth={1.75} />
      <span className="font-semibold">{label}</span>
    </button>
  );
}

export function PlanForm() {
  const [costs] = useState<Cost[]>([]);
  const [hotels] = useState<Hotel[]>([]);
  const [hotelImages] = useState<HotelImage[]>([]);
  const [memoryImages] = useState<MemoryImage[]>([]);
  const [restaurants] = useState<Restaurant[]>([]);
  const [restaurantImages] = useState<RestaurantImage[]>([]);
  const [touringSpots] = useState<TouringSpot[]>([]);
  const [touringSpotImages] = useState<TouringSpotImage[]>([]);
  const [packingItems] = useState<PackingItem[]>([]);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const title = formData.get("title");
    const destination = formData.get("destination");
    const startedAt = formData.get("startedAt");
    const endedAt = formData.get("endedAt");
    const comment = formData.get("comment");
    const tag = formData.get("tag");
    const isPublic = formData.get("isPublic");
    const coverImage = formData.get("coverImage");

    if (
      typeof title !== "string" ||
      typeof destination !== "string" ||
      typeof startedAt !== "string" ||
      typeof endedAt !== "string" ||
      typeof comment !== "string" ||
      typeof tag !== "string" ||
      typeof isPublic !== "string" ||
      (isPublic !== "true" && isPublic !== "false") ||
      !(coverImage instanceof File)
    ) {
      return;
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-xl bg-white px-5 pb-12 pt-5 text-neutral-900 sm:px-8"
    >
      <label className="flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-50 px-6 text-center transition hover:border-[#8fc1bd] hover:bg-[#f4faf9] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#70aaa5]">
        <span aria-hidden="true" className="mb-3 text-4xl text-[#88bdb8]">
          ＋
        </span>
        <span className="font-medium text-neutral-600">カバー画像を選択</span>
        <span className="mt-1 text-sm text-neutral-400">JPEG・PNG・WebP</span>
        <input
          type="file"
          name="coverImage"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
        />
      </label>

      <div className="mt-6 space-y-5">
        <div>
          <label htmlFor="title" className="mb-2 block font-bold">
            旅行タイトル
          </label>
          <input
            id="title"
            name="title"
            type="text"
            placeholder="旅行タイトルをつける"
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="destination" className="mb-2 block font-bold">
            旅行先
          </label>
          <input
            id="destination"
            name="destination"
            type="text"
            placeholder="都道府県を選択する"
            className={inputClassName}
          />
        </div>

        <section aria-labelledby="author-heading">
          <h2 id="author-heading" className="font-bold">
            作成者
          </h2>
          <p className="mt-1 text-neutral-500">ニックネーム</p>
        </section>

        <fieldset>
          <legend className="mb-2 font-bold">旅行日時</legend>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium text-neutral-600">
              開始日
              <input
                name="startedAt"
                type="date"
                className={`${inputClassName} mt-1.5`}
              />
            </label>
            <label className="text-sm font-medium text-neutral-600">
              終了日
              <input
                name="endedAt"
                type="date"
                className={`${inputClassName} mt-1.5`}
              />
            </label>
          </div>
        </fieldset>

        <div>
          <label htmlFor="tag" className="mb-2 block font-bold">
            タグ
          </label>
          <div className="flex gap-2">
            <input
              id="tag"
              name="tag"
              type="text"
              placeholder="タグを入力する"
              className={inputClassName}
            />
            <button
              type="button"
              className="shrink-0 rounded-xl border border-[#8fc1bd] px-4 font-semibold text-[#6ca9a4] transition hover:bg-[#eef8f7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#70aaa5]"
            >
              追加
            </button>
          </div>
        </div>

        <section aria-labelledby="schedule-heading">
          <h2 id="schedule-heading" className="mb-3 font-bold">
            スケジュール
          </h2>
          <div className="grid grid-cols-3 gap-2.5">
            <SectionButton icon={Timeline} label="タイムライン" wide />
            <SectionButton icon={Bed} label="宿泊場所" />
            <SectionButton icon={MapPin} label="観光地" />
            <SectionButton icon={Utensils} label="飲食店" />
            <SectionButton icon={Luggage} label="持ち物" wide />
          </div>
        </section>

        <section aria-labelledby="cost-heading">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="cost-heading" className="font-bold">
              コスト
            </h2>
          </div>
          <button
            type="button"
            className="flex h-14 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-300 text-neutral-500 transition hover:border-[#8fc1bd] hover:bg-[#f4faf9] hover:text-[#6ca9a4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#70aaa5]"
          >
            <span aria-hidden="true">＋</span>
            費用を追加する
          </button>
        </section>

        <div>
          <label htmlFor="comment" className="mb-2 block font-bold">
            コメント
          </label>
          <textarea
            id="comment"
            name="comment"
            rows={4}
            placeholder="旅行についてのメモを入力する"
            className="w-full resize-y rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-[#7eb9b4] focus:ring-2 focus:ring-[#7eb9b4]/20"
          />
        </div>

        <fieldset>
          <legend className="mb-2 font-bold">公開設定</legend>
          <div className="grid grid-cols-2 rounded-xl bg-neutral-100 p-1">
            <label className="cursor-pointer">
              <input
                type="radio"
                name="isPublic"
                value="false"
                defaultChecked
                className="peer sr-only"
              />
              <span className="flex h-11 items-center justify-center rounded-lg font-semibold text-neutral-500 transition peer-checked:bg-white peer-checked:text-neutral-900 peer-checked:shadow-sm peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#70aaa5]">
                非公開
              </span>
            </label>
            <label className="cursor-pointer">
              <input
                type="radio"
                name="isPublic"
                value="true"
                className="peer sr-only"
              />
              <span className="flex h-11 items-center justify-center rounded-lg font-semibold text-neutral-500 transition peer-checked:bg-white peer-checked:text-[#4e928d] peer-checked:shadow-sm peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#70aaa5]">
                公開
              </span>
            </label>
          </div>
          <p className="mt-2 text-sm text-neutral-500">
            公開すると、他のユーザーもこの旅行計画を閲覧できます。
          </p>
        </fieldset>
      </div>

      <button
        type="submit"
        className="mt-8 h-14 w-full rounded-xl bg-[#8fc4bf] text-lg font-bold text-white transition hover:bg-[#7ab6b0] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#619e99]"
      >
        旅行計画を作成する
      </button>
    </form>
  );
}
