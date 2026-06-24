export type AdminCategoryOption = {
  id: number;
  name: string;
  isRemoved?: boolean;
  description?: string | null;
};

export type CreateCategoryInput = {
  name: string;
  description?: string;
};
