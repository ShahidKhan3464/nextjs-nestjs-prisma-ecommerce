import type { User, UserRole } from "@/modules/auth";
import { resolveUploadUrl } from "@/lib/resolve-upload-url";

/** Backend user shape (TypeORM entity JSON). */
export type NestUserDto = {
  id: number;
  role: string;
  email: string;
  fullName: string;
  isBlocked?: boolean;
  avatarUrl?: string;
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
  const role =
    dto.role === "admin" || dto.role === "customer"
      ? (dto.role as UserRole)
      : "customer";

  return {
    role,
    createdAt,
    email: dto.email,
    id: String(dto.id),
    name: dto.fullName,
    fullName: dto.fullName,
    isBlocked: dto.isBlocked ?? false,
    phoneNumber: dto.phoneNumber ?? undefined,
    avatarUrl: resolveUploadUrl(dto.avatarUrl),
  };
}
