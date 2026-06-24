import { getBackendUrl } from "@/lib/backend-url";
import { jsonMessage, jsonOk } from "@/lib/api-response";
import type { ApiResponse, User, UserRole } from "@/types";

type NestRegisterPayload = {
  data?: {
    user?: {
      id: number;
      email: string;
      fullName: string;
      role?: UserRole;
      isBlocked?: boolean;
    };
  };
  message?: string | string[];
};

const DEFAULT_ROLE: UserRole = "customer";

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

  const user: User = {
    id: String(u.id),
    email: u.email,
    name: u.fullName,
    fullName: u.fullName,
    role: u.role ?? DEFAULT_ROLE,
    isBlocked: u.isBlocked ?? false,
    createdAt: new Date().toISOString(),
  };

  const response: ApiResponse<{ user: User }> = {
    data: {
      user,
    },
  };

  return jsonOk(response, { status: 201 });
}
