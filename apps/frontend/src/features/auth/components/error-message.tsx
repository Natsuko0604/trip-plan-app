import { ErrorMessageProps } from "../types";

// エラー文言
export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <p className="text-red-600 text-sm mt-2" role="alert">
      {message}
    </p>
  );
}
