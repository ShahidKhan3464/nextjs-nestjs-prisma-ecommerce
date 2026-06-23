import type { ApiResponse } from "@/types";

export function jsonOk<T>(body: ApiResponse<T>, init?: ResponseInit) {
  return Response.json(body, { status: 200, ...init });
}

export function jsonMessage(message: string, status = 400) {
  return Response.json({ message }, { status });
}
