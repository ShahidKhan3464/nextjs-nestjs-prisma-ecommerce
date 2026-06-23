import { AdminCategoryForm } from "@/modules/admin/categories";

export const metadata = {
  title: "Create Category",
};

export default function NewCategoryPage() {
  return (
    <div className="space-y-4">
      <header className="space-y-0.5">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Create category
        </h1>
        <p className="text-muted-foreground text-sm">
          Add a name and optional description for a new product category.
        </p>
      </header>
      <AdminCategoryForm />
    </div>
  );
}
