import { getBackendUrl } from "@/lib/backend-url";
import { requireAdmin } from "@/lib/require-auth";
import { jsonMessage, jsonOk } from "@/lib/api-response";
import { type NestUserDto, mapNestUserToClient } from "@/lib/nest-user-mapper";
import {
  nestErrorMessage,
  forwardAuthorization,
  unwrapNestDataResponsePayload,
} from "@/lib/nest-http";
import {
  type NestOrderPayload,
  normalizeNestOrderPayload,
} from "@/lib/nest-order-mapper";

type Props = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Props) {
  const admin = await requireAdmin(req);
  if (admin instanceof Response) return admin;

  const { id } = await params;
  const backend = getBackendUrl();
  const res = await fetch(`${backend}/users/${encodeURIComponent(id)}/detail`, {
    headers: { ...forwardAuthorization(req) },
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

  const payload = unwrapNestDataResponsePayload(raw);
  if (payload === null || typeof payload !== "object") {
    return jsonMessage("Unexpected user detail response", 502);
  }

  const detail = payload as {
    user: NestUserDto;
    totalOrders: number;
    totalSpending: number;
    wishlistCount: number;
    profilePhotoUrl?: string;
    recentOrders: NestOrderPayload[];
    defaultAddress?: NestOrderPayload["shippingAddress"];
    billingAddresses: NestOrderPayload["shippingAddress"][];
    shippingAddresses: NestOrderPayload["shippingAddress"][];
  };

  const backendBase = getBackendUrl();
  const profilePhotoUrl = detail.profilePhotoUrl
    ? detail.profilePhotoUrl.startsWith("/")
      ? `${backendBase}${detail.profilePhotoUrl}`
      : detail.profilePhotoUrl
    : undefined;

  return jsonOk({
    data: {
      profilePhotoUrl,
      totalOrders: detail.totalOrders,
      totalSpending: detail.totalSpending,
      wishlistCount: detail.wishlistCount,
      defaultAddress: detail.defaultAddress,
      user: mapNestUserToClient(detail.user),
      billingAddresses: detail.billingAddresses ?? [],
      shippingAddresses: detail.shippingAddresses ?? [],
      recentOrders: (detail.recentOrders ?? []).map(normalizeNestOrderPayload),
    },
  });
}
