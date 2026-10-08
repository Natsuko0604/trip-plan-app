// 旅行計画作成フォーム
"use client";

import Image from "next/image";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type SubmitEvent,
} from "react";
import type {
  Cost,
  Hotel,
  HotelImage,
  PackingItem,
  PendingMemoryImage,
  Restaurant,
  RestaurantImage,
  SectionButtonProps,
  Tag,
  TouringSpot,
  TouringSpotImage,
} from "../types";
import {
  Bed,
  ImagePlus,
  Luggage,
  MapPin,
  Timeline,
  Trash2,
  Utensils,
} from "lucide-react";

const inputClassName =
  "h-12 w-full rounded-xl border border-neutral-300 bg-white px-4 text-base text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-[#7eb9b4] focus:ring-2 focus:ring-[#7eb9b4]/20";
const allowedMemoryImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const maxMemoryImageSizeBytes = 5 * 1024 * 1024;

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
  const [pendingMemoryImages, setPendingMemoryImages] = useState<
    PendingMemoryImage[]
  >([]);
  const [memoryImageError, setMemoryImageError] = useState("");
  const [restaurants] = useState<Restaurant[]>([]);
  const [restaurantImages] = useState<RestaurantImage[]>([]);
  const [tags] = useState<Tag[]>([]);
  const [touringSpots] = useState<TouringSpot[]>([]);
  const [touringSpotImages] = useState<TouringSpotImage[]>([]);
  const [packingItems] = useState<PackingItem[]>([]);
  const memoryImagePreviewUrls = useRef(new Set<string>());

  useEffect(() => {
    const previewUrls = memoryImagePreviewUrls.current;

    return () => {
      previewUrls.forEach((previewUrl) => URL.revokeObjectURL(previewUrl));
      previewUrls.clear();
    };
  }, []);

  function validateMemoryImage(file: File) {
    if (!allowedMemoryImageTypes.has(file.type)) {
      return "JPEG、PNG、WebP形式の画像を選択してください";
    }
    if (file.size === 0) {
      return "空の画像ファイルは追加できません";
    }
    if (file.size > maxMemoryImageSizeBytes) {
      return "画像は1枚5MB以下にしてください";
    }
    return null;
  }

  function handleMemoryImageChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const selectedFiles = Array.from(input.files ?? []);
    input.value = "";

    if (!selectedFiles.length) {
      return;
    }

    const validImages: PendingMemoryImage[] = [];
    const validationErrors: string[] = [];

    selectedFiles.forEach((file) => {
      if (!(file instanceof File)) {
        validationErrors.push("画像ファイルを選択してください");
        return;
      }

      const validationError = validateMemoryImage(file);
      if (validationError) {
        validationErrors.push(`${file.name}: ${validationError}`);
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      memoryImagePreviewUrls.current.add(previewUrl);
      validImages.push({
        id: crypto.randomUUID(),
        file,
        previewUrl,
      });
    });

    if (validImages.length) {
      setPendingMemoryImages((currentImages) => [
        ...currentImages,
        ...validImages,
      ]);
    }

    setMemoryImageError(
      validationErrors.length
        ? `${validationErrors[0]}${
            validationErrors.length > 1
              ? `（ほか${validationErrors.length - 1}件）`
              : ""
          }`
        : "",
    );
  }

  function handleMemoryImageRemove(imageId: string) {
    const targetImage = pendingMemoryImages.find(
      (image) => image.id === imageId,
    );
    if (targetImage) {
      URL.revokeObjectURL(targetImage.previewUrl);
      memoryImagePreviewUrls.current.delete(targetImage.previewUrl);
    }
    setPendingMemoryImages((currentImages) =>
      currentImages.filter((image) => image.id !== imageId),
    );
    setMemoryImageError("");
  }

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

        <section aria-labelledby="memory-images-heading">
          <h2 id="memory-images-heading" className="mb-2 font-bold">
            思い出の写真
          </h2>
          <label className="flex min-h-20 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-300 bg-white px-4 text-neutral-500 transition hover:border-[#8fc1bd] hover:bg-[#f4faf9] hover:text-[#6ca9a4] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#70aaa5]">
            <ImagePlus
              aria-hidden="true"
              className="size-6"
              strokeWidth={1.75}
            />
            <span>思い出の写真を追加する</span>
            <input
              type="file"
              name="memoryImageFiles"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleMemoryImageChange}
              aria-describedby={
                memoryImageError ? "memory-images-error" : undefined
              }
              className="sr-only"
            />
          </label>

          {memoryImageError && (
            <p
              id="memory-images-error"
              role="alert"
              className="mt-2 text-sm text-red-600"
            >
              {memoryImageError}
            </p>
          )}

          {pendingMemoryImages.length > 0 && (
            <ul className="mt-3 grid grid-cols-3 gap-2.5">
              {pendingMemoryImages.map((image) => (
                <li
                  key={image.id}
                  className="group relative aspect-square overflow-hidden rounded-xl bg-neutral-100"
                >
                  <Image
                    src={image.previewUrl}
                    alt={image.file.name}
                    fill
                    unoptimized
                    sizes="(max-width: 640px) 30vw, 160px"
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleMemoryImageRemove(image.id)}
                    aria-label={`${image.file.name}を削除`}
                    className="absolute right-1.5 top-1.5 flex size-8 items-center justify-center rounded-full bg-black/65 text-white transition hover:bg-black/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    <Trash2 aria-hidden="true" className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

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
