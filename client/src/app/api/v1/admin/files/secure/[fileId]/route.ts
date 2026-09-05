import { jsonMessage } from "@/lib/api-response";
import { requireAdmin } from "@/lib/require-auth";
import { getBackendUrl } from "@/lib/backend-url";
import { nestErrorMessage, forwardAuthorization } from "@/lib/nest-http";

type Props = { params: Promise<{ fileId: string }> };

/** Proxy Nest private files so the browser never calls the backend directly. */
export async function GET(req: Request, { params }: Props) {
  const admin = await requireAdmin(req);
  if (admin instanceof Response) return admin;

  const { fileId } = await params;
  if (!/^\d+$/.test(fileId)) {
    return jsonMessage("Invalid file id", 400);
  }

  const backend = getBackendUrl();
  const res = await fetch(
    `${backend}/files/secure/${encodeURIComponent(fileId)}`,
    {
      headers: { ...forwardAuthorization(req) },
    }
  );

  if (!res.ok) {
    let raw: unknown = null;
    try {
      raw = await res.json();
    } catch {
      raw = null;
    }
    return jsonMessage(nestErrorMessage(raw), res.status);
  }

  const url = new URL(req.url);
  const inline = url.searchParams.get("inline") === "1";

  const headers = new Headers();
  const contentType = res.headers.get("content-type");
  const contentDisposition = res.headers.get("content-disposition");
  const contentLength = res.headers.get("content-length");
  if (contentType) headers.set("Content-Type", contentType);
  if (inline) {
    const filenameMatch = contentDisposition?.match(/filename="?([^"]+)"?/i);
    const filename = filenameMatch?.[1] ?? `file-${fileId}`;
    headers.set(
      "Content-Disposition",
      `inline; filename="${filename.replace(/"/g, "")}"`
    );
  } else if (contentDisposition) {
    headers.set("Content-Disposition", contentDisposition);
  }
  if (contentLength) headers.set("Content-Length", contentLength);
  headers.set("Cache-Control", "private, no-store");

  return new Response(res.body, { status: 200, headers });
}
