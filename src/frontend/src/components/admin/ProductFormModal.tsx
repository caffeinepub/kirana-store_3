import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Product } from "../../backend.d";
import { ProductCategory } from "../../hooks/useQueries";
import { useAddProduct, useUpdateProduct } from "../../hooks/useQueries";
import { getProductImage } from "../../utils/productImages";

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editProduct?: Product | null;
}

const CATEGORIES = [
  { value: ProductCategory.groceries, label: "🍚 Groceries" },
  { value: ProductCategory.fruits, label: "🍎 Fruits" },
  { value: ProductCategory.vegetables, label: "🥦 Vegetables" },
  { value: ProductCategory.dairy, label: "🥛 Dairy" },
  { value: ProductCategory.snacks, label: "🍪 Snacks" },
  { value: ProductCategory.beverages, label: "🥤 Beverages" },
  { value: ProductCategory.personalCare, label: "🧴 Personal Care" },
  { value: ProductCategory.household, label: "🏠 Household" },
  { value: ProductCategory.medicines, label: "💊 Medicines" },
];

const UNITS = [
  { value: "kg", label: "kg" },
  { value: "piece", label: "Piece" },
  { value: "litre", label: "Litre" },
  { value: "pack", label: "Pack" },
  { value: "dozen", label: "Dozen" },
  { value: "500g", label: "500g" },
  { value: "strip", label: "Strip" },
  { value: "bottle", label: "Bottle" },
  { value: "bar", label: "Bar" },
  { value: "100ml", label: "100ml" },
  { value: "25g", label: "25g" },
  { value: "1L", label: "1L" },
  { value: "340ml", label: "340ml" },
  { value: "50ml", label: "50ml" },
  { value: "200ml", label: "200ml" },
  { value: "2L", label: "2L" },
  { value: "400g", label: "400g" },
  { value: "200g", label: "200g" },
  { value: "500ml", label: "500ml" },
  { value: "5kg", label: "5kg" },
];

interface FormData {
  name: string;
  price: string;
  unit: string;
  category: ProductCategory | "";
  stockQuantity: string;
  imageEmoji: string;
}

const EMPTY_FORM: FormData = {
  name: "",
  price: "",
  unit: "",
  category: "",
  stockQuantity: "",
  imageEmoji: "",
};

export function ProductFormModal({
  isOpen,
  onClose,
  editProduct,
}: ProductFormModalProps) {
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const addProduct = useAddProduct();
  const updateProduct = useUpdateProduct();

  useEffect(() => {
    if (editProduct) {
      setForm({
        name: editProduct.name,
        price: editProduct.price.toString(),
        unit: editProduct.unit,
        category: editProduct.category,
        stockQuantity: editProduct.stockQuantity.toString(),
        imageEmoji: editProduct.imageEmoji,
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
  }, [editProduct]);

  function validate(): boolean {
    const errs: Partial<FormData> = {};
    if (!form.name.trim()) errs.name = "Required";
    if (
      !form.price ||
      Number.isNaN(Number(form.price)) ||
      Number(form.price) <= 0
    )
      errs.price = "Enter valid price";
    if (!form.unit) errs.unit = "Required";
    if (!form.category) errs.category = "Required" as ProductCategory;
    if (!form.stockQuantity || Number.isNaN(Number(form.stockQuantity)))
      errs.stockQuantity = "Required";
    if (!form.imageEmoji.trim()) errs.imageEmoji = "Required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const productData = {
      name: form.name.trim(),
      price: Number(form.price),
      unit: form.unit,
      category: form.category as ProductCategory,
      stockQuantity: BigInt(Math.floor(Number(form.stockQuantity))),
      imageEmoji: form.imageEmoji.trim(),
    };

    try {
      if (editProduct) {
        await updateProduct.mutateAsync({
          productId: editProduct.productId,
          ...productData,
        });
        toast.success("Product updated successfully");
      } else {
        await addProduct.mutateAsync(productData);
        toast.success("Product added successfully");
      }
      handleClose();
    } catch {
      toast.error("Failed to save product");
    }
  }

  function handleClose() {
    setForm(EMPTY_FORM);
    setErrors({});
    onClose();
  }

  const isLoading = addProduct.isPending || updateProduct.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md w-full" data-ocid="addproduct.dialog">
        <DialogHeader>
          <DialogTitle>
            {editProduct ? "Edit Product" : "Add New Product"}
          </DialogTitle>
          <DialogDescription>
            {editProduct
              ? "Update product details"
              : "Fill in the product information"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Name */}
          <div>
            <Label htmlFor="pf-name">Product Name *</Label>
            <Input
              id="pf-name"
              placeholder="e.g. Basmati Rice"
              value={form.name}
              onChange={(e) => {
                setForm((p) => ({ ...p, name: e.target.value }));
                setErrors((p) => ({ ...p, name: undefined }));
              }}
              className={`mt-1 ${errors.name ? "border-destructive" : ""}`}
            />
            {errors.name && (
              <p className="text-destructive text-xs mt-1">{errors.name}</p>
            )}
          </div>

          {/* Price & Stock */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="pf-price">Price (₹) *</Label>
              <Input
                id="pf-price"
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 60"
                value={form.price}
                onChange={(e) => {
                  setForm((p) => ({ ...p, price: e.target.value }));
                  setErrors((p) => ({ ...p, price: undefined }));
                }}
                className={`mt-1 ${errors.price ? "border-destructive" : ""}`}
              />
              {errors.price && (
                <p className="text-destructive text-xs mt-1">{errors.price}</p>
              )}
            </div>
            <div>
              <Label htmlFor="pf-stock">Stock Qty *</Label>
              <Input
                id="pf-stock"
                type="number"
                min="0"
                placeholder="e.g. 50"
                value={form.stockQuantity}
                onChange={(e) => {
                  setForm((p) => ({ ...p, stockQuantity: e.target.value }));
                  setErrors((p) => ({ ...p, stockQuantity: undefined }));
                }}
                className={`mt-1 ${errors.stockQuantity ? "border-destructive" : ""}`}
              />
              {errors.stockQuantity && (
                <p className="text-destructive text-xs mt-1">
                  {errors.stockQuantity}
                </p>
              )}
            </div>
          </div>

          {/* Unit & Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Unit *</Label>
              <Select
                value={form.unit}
                onValueChange={(v) => {
                  setForm((p) => ({ ...p, unit: v }));
                  setErrors((p) => ({ ...p, unit: undefined }));
                }}
              >
                <SelectTrigger
                  className={`mt-1 ${errors.unit ? "border-destructive" : ""}`}
                >
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u.value} value={u.value}>
                      {u.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.unit && (
                <p className="text-destructive text-xs mt-1">{errors.unit}</p>
              )}
            </div>
            <div>
              <Label>Category *</Label>
              <Select
                value={form.category}
                onValueChange={(v) => {
                  setForm((p) => ({ ...p, category: v as ProductCategory }));
                  setErrors((p) => ({ ...p, category: undefined }));
                }}
              >
                <SelectTrigger
                  className={`mt-1 ${errors.category ? "border-destructive" : ""}`}
                >
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-destructive text-xs mt-1">
                  {errors.category}
                </p>
              )}
            </div>
          </div>

          {/* Emoji */}
          <div>
            <Label htmlFor="pf-emoji">Emoji *</Label>
            <div className="flex gap-2 mt-1 items-center">
              <Input
                id="pf-emoji"
                placeholder="e.g. 🌾"
                value={form.imageEmoji}
                onChange={(e) => {
                  setForm((p) => ({ ...p, imageEmoji: e.target.value }));
                  setErrors((p) => ({ ...p, imageEmoji: undefined }));
                }}
                className={`${errors.imageEmoji ? "border-destructive" : ""}`}
                maxLength={4}
              />
              {form.imageEmoji && (
                <span className="text-3xl">{form.imageEmoji}</span>
              )}
              {getProductImage(form.name) && (
                <img
                  src={getProductImage(form.name)!}
                  alt={form.name}
                  className="w-10 h-10 rounded object-cover border border-border flex-shrink-0"
                  title="Product image preview"
                />
              )}
            </div>
            {errors.imageEmoji && (
              <p className="text-destructive text-xs mt-1">
                {errors.imageEmoji}
              </p>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleClose}
              disabled={isLoading}
              data-ocid="addproduct.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={isLoading}
              data-ocid="addproduct.submit_button"
            >
              {isLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin mr-2" />
                  Saving...
                </>
              ) : editProduct ? (
                "Save Changes"
              ) : (
                "Add Product"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
