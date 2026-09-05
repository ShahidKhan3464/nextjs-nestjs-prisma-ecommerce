import type { User } from "@/modules/auth";
import { normalizeRoles } from "@/modules/auth/utils/roles";
import { resolveUploadUrl } from "@/lib/resolve-upload-url";

/** Backend user shape (Nest JSON). */
export type NestUserDto = {
  id: number;
  email: string;
  roles?: unknown;
  fullName: string;
  avatarUrl?: string;
  isBlocked?: boolean;
  createdAt?: string | Date;
  createDate?: string | Date;
  phoneNumber?: string | null;
};

function toIsoDate(value: string | Date | undefined): string {
  if (value == null) return new Date(0).toISOString();
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime())
    ? new Date(0).toISOString()
    : d.toISOString();
}

export function mapNestUserToClient(dto: NestUserDto): User {
  const createdAt = toIsoDate(dto.createdAt ?? dto.createDate);

  return {
    createdAt,
    email: dto.email,
    id: String(dto.id),
    name: dto.fullName,
    fullName: dto.fullName,
    roles: normalizeRoles(dto.roles),
    isBlocked: dto.isBlocked ?? false,
    phoneNumber: dto.phoneNumber ?? undefined,
    avatarUrl: resolveUploadUrl(dto.avatarUrl),
  };
}
