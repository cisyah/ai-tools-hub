import { NextResponse } from "next/server";

export function ok<T>(data: T): NextResponse<T> {
  return NextResponse.json(data);
}

export function error(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function serverError(errorValue: unknown) {
  const message = errorValue instanceof Error ? errorValue.message : "服务器错误。";
  return error(message, 500);
}
