import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Pencil, Plus, Sprout, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Product } from "../../backend.d";
import {
  useDeleteProduct,
  useGetProducts,
  useSeedProducts,
} from "../../hooks/useQueries";
import { ProductFormModal } from "./ProductFormModal";

const CATEGORY_LABELS: Record<string, string> = {
  groceries: "🍚 Groceries",
  fruits: "🍎 Fruits",
  vegetables: "🥦 Vegetables",
  dairy: "🥛 Dairy",
  snacks: "🍪 Snacks",
  beverages: "🥤 Beverages",
  personalCare: "🧴 Personal Care",
  household: "🏠 Household",
  medicines: "💊 Medicines",
};

export function AdminProductsTab() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const { data: products, isLoading } = useGetProducts();
  const deleteProduct = useDeleteProduct();
  const seedProducts = useSeedProducts();

  async function handleDelete(productId: bigint) {
    try {
      await deleteProduct.mutateAsync(productId);
      toast.success("Product deleted");
    } catch {
      toast.error("Failed to delete product");
    }
  }

  async function handleSeed() {
    try {
      await seedProducts.mutateAsync();
      toast.success("Sample products added!");
    } catch {
      toast.error("Failed to seed products");
    }
  }

  function handleEdit(product: Product) {
    setEditProduct(product);
    setIsFormOpen(true);
  }

  function handleAddNew() {
    setEditProduct(null);
    setIsFormOpen(true);
  }

  const isEmpty = !products || products.length === 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-bold text-foreground text-lg">
          Products
          {products && (
            <span className="text-muted-foreground font-normal text-sm ml-2">
              ({products.length} total)
            </span>
          )}
        </h2>
        <div className="flex gap-2">
          {!isLoading && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeed}
              disabled={seedProducts.isPending}
              className="flex items-center gap-1.5"
              data-ocid="admin.seed_button"
            >
              {seedProducts.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Sprout size={14} />
              )}
              Seed Products
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleAddNew}
            className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-1.5"
            data-ocid="admin.add_product_button"
          >
            <Plus size={14} />
            Add Product
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2" data-ocid="admin.products_loading_state">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : isEmpty ? (
        <div
          className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-xl"
          data-ocid="admin.products_empty_state"
        >
          <div className="text-4xl mb-3">📦</div>
          <p className="font-semibold text-foreground">No products yet</p>
          <p className="text-muted-foreground text-sm mt-1 mb-4">
            Add products manually or seed sample data
          </p>
          <Button
            variant="outline"
            onClick={handleSeed}
            disabled={seedProducts.isPending}
            data-ocid="admin.seed_button_empty"
          >
            {seedProducts.isPending ? (
              <Loader2 size={14} className="animate-spin mr-2" />
            ) : (
              <Sprout size={14} className="mr-2" />
            )}
            Seed Sample Products
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-12">Emoji</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="hidden sm:table-cell">Unit</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product, idx) => (
                <TableRow
                  key={product.productId.toString()}
                  className="hover:bg-muted/20"
                  data-ocid={`admin.product.item.${idx + 1}`}
                >
                  <TableCell className="text-2xl">
                    {product.imageEmoji}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {product.name}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="secondary" className="text-xs">
                      {CATEGORY_LABELS[product.category] || product.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold text-primary">
                    ₹{product.price.toFixed(0)}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                    {product.unit}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-sm font-semibold ${
                        product.stockQuantity === BigInt(0)
                          ? "text-destructive"
                          : "text-foreground"
                      }`}
                    >
                      {product.stockQuantity.toString()}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => handleEdit(product)}
                        data-ocid={`admin.edit_button.${idx + 1}`}
                      >
                        <Pencil size={14} />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            data-ocid={`admin.delete_button.${idx + 1}`}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Product?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{product.name}"?
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel data-ocid="admin.delete_cancel_button">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(product.productId)}
                              className="bg-destructive hover:bg-destructive/90"
                              data-ocid="admin.delete_confirm_button"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ProductFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditProduct(null);
        }}
        editProduct={editProduct}
      />
    </div>
  );
}
