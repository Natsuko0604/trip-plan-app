// Error型ならエラー名を取得し、それ以外ならUnknownErrorを返す
export function errorName(error: unknown): string {
  return error instanceof Error ? error.name : "UnknownError";
}
