// ログインと会員登録の共通コンポーネント

import Image from "next/image";
import Link from "next/link";
import { AuthPageShellProps } from "../types";

export function AuthPageShell({
  imageSrc,
  imageAlt,
  title,
  description,
  alternateText,
  alternateHref,
  alternateLabel,
  children,
}: AuthPageShellProps) {
  return (
    <main className="min-h-svh bg-white px-5 py-10 text-neutral-900 sm:px-8 sm:py-14">
      <section className="mx-auto flex w-full max-w-130 flex-col items-center">
        <Image
          src={imageSrc}
          alt={imageAlt}
          width={240}
          height={180}
          priority
          className="h-37.5 w-50 object-contain sm:h-45 sm:w-60"
        />

        <h1 className="mt-2 text-center text-2xl font-bold tracking-tight sm:text-[28px]">
          {title}
        </h1>
        <div className="mt-5 text-center text-sm leading-6 text-neutral-500 sm:text-base">
          {description}
        </div>

        <div className="mt-14 w-full sm:mt-16">{children}</div>

        <div className="mt-9 flex w-full items-center gap-4 text-sm text-neutral-400">
          <span className="h-px flex-1 bg-neutral-300" />
          <span>または</span>
          <span className="h-px flex-1 bg-neutral-300" />
        </div>

        <button
          type="button"
          aria-label="Googleで続ける"
          className="mt-7 rounded-full p-2 transition hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8bbfba]"
        >
          <Image src="/images/auth/google.svg" alt="" width={34} height={34} />
        </button>

        <p className="mt-8 text-center text-sm leading-6 text-neutral-500 sm:mt-10 sm:text-base">
          {alternateText}{" "}
          <Link
            href={alternateHref}
            className="font-medium text-[#83bbb5] underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8bbfba]"
          >
            {alternateLabel}
          </Link>
        </p>
      </section>
    </main>
  );
}
