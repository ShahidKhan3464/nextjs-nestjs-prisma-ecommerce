import type { ApiResponse, User } from "@/types";
import { getBackendUrl } from "@/lib/backend-url";
import { jsonMessage, jsonOk } from "@/lib/api-response";
import { normalizeRoles } from "@/modules/auth/utils/roles";

type NestRegisterPayload = {
  data?: {
    user?: {
      id: number;
      email: string;
      fullName: string;
      roles?: unknown;
      isBlocked?: boolean;
    };
  };
  message?: string | string[];
};

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonMessage("Invalid JSON body", 400);
  }

  const res = await fetch(`${getBackendUrl()}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  let payload: NestRegisterPayload | null = null;
  try {
    payload = (await res.json()) as NestRegisterPayload;
  } catch {
    payload = null;
  }

  if (!res.ok) {
    const raw = payload?.message;
    const message = Array.isArray(raw)
      ? raw.join(", ")
      : typeof raw === "string"
        ? raw
        : "Registration failed";
    return jsonMessage(message, res.status);
  }

  const u = payload?.data?.user;
  if (
    u?.email === undefined ||
    u.fullName === undefined ||
    u.id === undefined
  ) {
    return jsonMessage("Unexpected response from server", 502);
  }

  const roles = normalizeRoles(u.roles);
  const user: User = {
    email: u.email,
    id: String(u.id),
    name: u.fullName,
    fullName: u.fullName,
    isBlocked: u.isBlocked ?? false,
    createdAt: new Date().toISOString(),
    roles: roles.length > 0 ? roles : ["BUYER"],
  };

  const response: ApiResponse<{ user: User }> = {
    data: {
      user,
    },
  };

  return jsonOk(response, { status: 201 });
}
