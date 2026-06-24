import { requireUser } from "@/lib/require-auth";
import { getBackendUrl } from "@/lib/backend-url";
import { jsonMessage, jsonOk } from "@/lib/api-response";
import { resolveUploadUrl } from "@/lib/resolve-upload-url";
import { nestErrorMessage, forwardAuthorization } from "@/lib/nest-http";

export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return jsonMessage("Invalid form data", 400);
  }

  const file = formData.get("avatar");
  if (!(file instanceof File)) {
    return jsonMessage("Avatar file is required", 422);
  }

  const outbound = new FormData();
  outbound.append("avatar", file);

  const backend = getBackendUrl();
  const res = await fetch(`${backend}/users/me/avatar`, {
    method: "POST",
    headers: { ...forwardAuthorization(req) },
    body: outbound,
  });

  let raw: unknown = null;
  try {
    raw = await res.json();
  } catch {
    raw = null;
  }

  if (!res.ok) {
    return jsonMessage(nestErrorMessage(raw), res.status);
  }

  const envelope = raw as { data?: { avatarUrl?: string } };
  const avatarUrl = envelope?.data?.avatarUrl;
  if (!avatarUrl) {
    return jsonMessage("Invalid avatar response", 500);
  }

  return jsonOk({
    data: { avatarUrl: resolveUploadUrl(avatarUrl) ?? avatarUrl },
  });
}
