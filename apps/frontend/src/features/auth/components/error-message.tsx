import type { ErrorMessageProps } from "../types";

export function ErrorMessage({ id, message }: ErrorMessageProps) {
  return (
    <p id={id} className="mt-2 text-sm text-red-600" role="alert">
      {message}
    </p>
  );
}
