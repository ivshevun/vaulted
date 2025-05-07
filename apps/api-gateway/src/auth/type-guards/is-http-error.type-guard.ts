export function isHttpError(
  err: unknown,
): err is { message: string; status: number } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'message' in err &&
    'status' in err
  );
}
