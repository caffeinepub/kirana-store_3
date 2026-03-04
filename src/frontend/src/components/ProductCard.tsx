import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, ShoppingCart } from "lucide-react";
import type { Product } from "../backend.d";
import { useCart } from "../context/CartContext";
import { getProductImage } from "../utils/productImages";

interface ProductCardProps {
  product: Product;
  index: number;
}

export function ProductCard({ product, index }: ProductCardProps) {
  const { addItem, items } = useCart();
  const isOutOfStock = product.stockQuantity === BigInt(0);
  const cartItem = items.find((i) => i.product.productId === product.productId);
  const inCart = cartItem ? cartItem.quantity : 0;
  const productImage = getProductImage(product.name);

  return (
    <div
      className="kirana-card flex flex-col overflow-hidden group"
      data-ocid={`product.item.${index}`}
    >
      {/* Product Image / Emoji Display */}
      <div className="relative w-full h-28 overflow-hidden bg-muted/30">
        {productImage ? (
          <img
            src={productImage}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted/50 to-secondary/50 flex items-center justify-center text-5xl select-none">
            {product.imageEmoji}
          </div>
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-card/60 flex items-center justify-center">
            <Badge
              variant="secondary"
              className="bg-muted text-muted-foreground text-xs"
            >
              Out of Stock
            </Badge>
          </div>
        )}
        {inCart > 0 && !isOutOfStock && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-primary text-primary-foreground text-xs h-5 px-1.5">
              {inCart} in cart
            </Badge>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        <div className="flex-1">
          <p className="font-semibold text-foreground text-sm leading-tight line-clamp-2">
            {product.name}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{product.unit}</p>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="font-bold text-foreground text-base">
            ₹{product.price.toFixed(0)}
          </span>
          <Button
            size="sm"
            disabled={isOutOfStock}
            onClick={() => addItem(product)}
            className={`h-8 px-3 text-xs gap-1 flex-shrink-0 ${
              isOutOfStock
                ? "opacity-50 cursor-not-allowed"
                : "bg-primary hover:bg-primary/90 text-primary-foreground"
            }`}
            data-ocid={`product.add_button.${index}`}
          >
            {inCart > 0 ? (
              <>
                <ShoppingCart size={12} />
                Add More
              </>
            ) : (
              <>
                <Plus size={12} />
                Add
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
