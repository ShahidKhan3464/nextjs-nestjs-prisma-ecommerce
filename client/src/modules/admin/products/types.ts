export type CreateAdminProductInput = {
  categoryId: number;
  name: string;
  description?: string;
  variants: {
    size: string;
    color: string;
    sku: string;
    stockQuantity: number;
    price: number;
  }[];
  images: File[];
};

export type UpdateAdminProductInput = {
  categoryId?: number;
  name?: string;
  description?: string;
  variants?: CreateAdminProductInput["variants"];
  retainImagePaths?: string[];
  newImages?: File[];
};
