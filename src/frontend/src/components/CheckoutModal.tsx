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
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Loader2, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useCart } from "../context/CartContext";
import { usePlaceOrder } from "../hooks/useQueries";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
  const { items, totalAmount, clearCart } = useCart();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [orderId, setOrderId] = useState<bigint | null>(null);
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const placeOrder = usePlaceOrder();

  function validate() {
    const errs: { name?: string; phone?: string } = {};
    if (!name.trim()) errs.name = "Name is required";
    if (!phone.trim()) errs.phone = "Phone number is required";
    else if (!/^\d{10}$/.test(phone.trim()))
      errs.phone = "Enter a valid 10-digit phone number";
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const orderItems = items.map((item) => ({
      productId: item.product.productId,
      productName: item.product.name,
      quantity: BigInt(item.quantity),
      price: item.product.price,
    }));

    try {
      const id = await placeOrder.mutateAsync({
        customerName: name.trim(),
        customerPhone: phone.trim(),
        items: orderItems,
      });
      setOrderId(id);
      clearCart();
      toast.success("Order placed successfully!");
    } catch {
      toast.error("Failed to place order. Please try again.");
    }
  }

  function handleClose() {
    setName("");
    setPhone("");
    setErrors({});
    setOrderId(null);
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md w-full" data-ocid="checkout.dialog">
        {orderId ? (
          /* Success State */
          <div
            className="flex flex-col items-center text-center py-4 gap-4"
            data-ocid="checkout.success_state"
          >
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle2 size={32} className="text-success" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                Order Placed!
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                Your order has been received
              </p>
            </div>
            <div className="bg-muted/50 rounded-xl p-4 w-full">
              <p className="text-muted-foreground text-sm">Order ID</p>
              <p className="text-2xl font-bold text-primary mt-1">
                #{orderId.toString()}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              📱 Track your order using phone:{" "}
              <span className="font-semibold text-foreground">{phone}</span>
            </p>
            <Button
              onClick={handleClose}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Continue Shopping
            </Button>
          </div>
        ) : (
          /* Checkout Form */
          <form onSubmit={handleSubmit} noValidate>
            <DialogHeader className="mb-4">
              <DialogTitle className="flex items-center gap-2">
                <ShoppingBag size={20} className="text-primary" />
                Checkout
              </DialogTitle>
              <DialogDescription>
                Enter your details to place the order
              </DialogDescription>
            </DialogHeader>

            {/* Order Summary */}
            <div className="bg-muted/30 rounded-xl p-3 mb-4 space-y-2">
              <p className="text-sm font-semibold text-foreground mb-2">
                Order Summary ({items.length} items)
              </p>
              {items.map((item) => (
                <div
                  key={item.product.productId.toString()}
                  className="flex justify-between text-sm"
                >
                  <span className="text-muted-foreground truncate mr-2">
                    {item.product.imageEmoji} {item.product.name} ×{" "}
                    {item.quantity}
                  </span>
                  <span className="font-medium text-foreground flex-shrink-0">
                    ₹{(item.product.price * item.quantity).toFixed(0)}
                  </span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between font-bold text-foreground">
                <span>Total</span>
                <span className="text-primary">₹{totalAmount.toFixed(0)}</span>
              </div>
            </div>

            {/* Customer Info */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="checkout-name">Full Name *</Label>
                <Input
                  id="checkout-name"
                  placeholder="e.g. Ramesh Kumar"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  className={`mt-1 ${errors.name ? "border-destructive" : ""}`}
                  data-ocid="checkout.name_input"
                />
                {errors.name && (
                  <p className="text-destructive text-xs mt-1">{errors.name}</p>
                )}
              </div>
              <div>
                <Label htmlFor="checkout-phone">Phone Number *</Label>
                <Input
                  id="checkout-phone"
                  placeholder="10-digit mobile number"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
                    setErrors((prev) => ({ ...prev, phone: undefined }));
                  }}
                  type="tel"
                  inputMode="numeric"
                  className={`mt-1 ${errors.phone ? "border-destructive" : ""}`}
                  data-ocid="checkout.phone_input"
                />
                {errors.phone && (
                  <p className="text-destructive text-xs mt-1">
                    {errors.phone}
                  </p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full mt-6 h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              disabled={placeOrder.isPending}
              data-ocid="checkout.submit_button"
            >
              {placeOrder.isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  Placing Order...
                </>
              ) : (
                `Place Order — ₹${totalAmount.toFixed(0)}`
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
