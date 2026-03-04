import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useCart } from "../context/CartContext";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export function CartDrawer({ isOpen, onClose, onCheckout }: CartDrawerProps) {
  const { items, updateQuantity, removeItem, totalAmount, totalItems } =
    useCart();

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50"
          onClick={onClose}
          onKeyDown={(e) => e.key === "Escape" && onClose()}
          aria-hidden="true"
          role="presentation"
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[380px] bg-card border-l border-border shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Shopping Cart"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} className="text-primary" />
            <h2 className="font-bold text-foreground text-lg">Your Cart</h2>
            {totalItems > 0 && (
              <span className="bg-primary/10 text-primary text-xs font-semibold px-2 py-0.5 rounded-full">
                {totalItems} items
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X size={18} />
          </Button>
        </div>

        {/* Items */}
        {items.length === 0 ? (
          <div
            className="flex-1 flex flex-col items-center justify-center text-center p-6"
            data-ocid="cart.empty_state"
          >
            <div className="text-6xl mb-4">🛒</div>
            <p className="font-semibold text-foreground text-lg">
              Cart is empty
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              Add some fresh products!
            </p>
            <Button variant="outline" className="mt-4" onClick={onClose}>
              Browse Products
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 px-4 py-2">
              <div className="space-y-3 py-2">
                {items.map((item, idx) => (
                  <div
                    key={item.product.productId.toString()}
                    className="flex items-center gap-3 bg-muted/30 rounded-xl p-3"
                    data-ocid={`cart.item.${idx + 1}`}
                  >
                    {/* Emoji */}
                    <div className="text-2xl w-10 h-10 flex items-center justify-center bg-card rounded-lg flex-shrink-0">
                      {item.product.imageEmoji}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground leading-tight truncate">
                        {item.product.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ₹{item.product.price.toFixed(0)} / {item.product.unit}
                      </p>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() =>
                          updateQuantity(
                            item.product.productId,
                            item.quantity - 1,
                          )
                        }
                      >
                        <Minus size={12} />
                      </Button>
                      <span className="w-6 text-center text-sm font-bold">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() =>
                          updateQuantity(
                            item.product.productId,
                            item.quantity + 1,
                          )
                        }
                      >
                        <Plus size={12} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive ml-1"
                        onClick={() => removeItem(item.product.productId)}
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="border-t border-border p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-bold text-foreground text-lg">
                  ₹{totalAmount.toFixed(0)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                🚚 Free delivery within 2km
              </p>
              <Button
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                onClick={onCheckout}
                data-ocid="cart.checkout_button"
              >
                Proceed to Checkout — ₹{totalAmount.toFixed(0)}
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
