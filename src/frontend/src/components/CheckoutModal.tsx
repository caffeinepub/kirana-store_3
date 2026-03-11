import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Loader2, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useCart } from "../context/CartContext";
import { PaymentMethod, usePlaceOrderWithPayment } from "../hooks/useQueries";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PAYMENT_OPTIONS = [
  {
    value: PaymentMethod.cashOnDelivery,
    icon: "💵",
    label: "Cash on Delivery",
    shortLabel: "Cash on Delivery",
    description: "Pay with cash when delivered",
  },
  {
    value: PaymentMethod.upi,
    icon: "📱",
    label: "UPI",
    shortLabel: "UPI",
    description: "kiranastore@upi",
  },
  {
    value: PaymentMethod.card,
    icon: "💳",
    label: "Card",
    shortLabel: "Card",
    description: "Swipe card on delivery",
  },
] as const;

function PaymentMethodLabel({ method }: { method: PaymentMethod }) {
  switch (method) {
    case PaymentMethod.upi:
      return (
        <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100">
          📱 Paid via UPI
        </Badge>
      );
    case PaymentMethod.card:
      return (
        <Badge className="bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-100">
          💳 Paid via Card
        </Badge>
      );
    default:
      return (
        <Badge
          variant="outline"
          className="text-muted-foreground border-border"
        >
          💵 Cash on Delivery
        </Badge>
      );
  }
}

export function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
  const { items, totalAmount, clearCart } = useCart();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [orderId, setOrderId] = useState<bigint | null>(null);
  const [errors, setErrors] = useState<{
    name?: string;
    phone?: string;
    address?: string;
  }>({});
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>(
    PaymentMethod.cashOnDelivery,
  );
  const placeOrder = usePlaceOrderWithPayment();

  function validate() {
    const errs: { name?: string; phone?: string; address?: string } = {};
    if (!name.trim()) errs.name = "Name is required";
    if (!phone.trim()) errs.phone = "Phone number is required";
    else if (!/^\d{10}$/.test(phone.trim()))
      errs.phone = "Enter a valid 10-digit phone number";
    if (!address.trim()) errs.address = "Delivery address is required";
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
        paymentMethod: selectedPayment,
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
    setAddress("");
    setErrors({});
    setOrderId(null);
    setSelectedPayment(PaymentMethod.cashOnDelivery);
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
            {address && (
              <div className="bg-muted/30 rounded-xl p-3 w-full text-left">
                <p className="text-xs text-muted-foreground mb-1">Deliver to</p>
                <p className="text-sm font-medium text-foreground flex items-start gap-1.5">
                  <span className="mt-0.5">📍</span>
                  <span>{address}</span>
                </p>
              </div>
            )}
            <PaymentMethodLabel method={selectedPayment} />
            <p className="text-sm text-muted-foreground">
              📱 Track your order using phone:{" "}
              <span className="font-semibold text-foreground">{phone}</span>
            </p>
            <Button
              onClick={handleClose}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              data-ocid="checkout.close_button"
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
                  <p
                    className="text-destructive text-xs mt-1"
                    data-ocid="checkout.name_error"
                  >
                    {errors.name}
                  </p>
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
                  <p
                    className="text-destructive text-xs mt-1"
                    data-ocid="checkout.phone_error"
                  >
                    {errors.phone}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="checkout-address">Delivery Address *</Label>
                <Textarea
                  id="checkout-address"
                  placeholder="e.g. 12, Gandhi Nagar, Near Bus Stand"
                  value={address}
                  rows={3}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    setErrors((prev) => ({ ...prev, address: undefined }));
                  }}
                  className={`mt-1 resize-none ${errors.address ? "border-destructive" : ""}`}
                  data-ocid="checkout.address_input"
                />
                {errors.address && (
                  <p
                    className="text-destructive text-xs mt-1"
                    data-ocid="checkout.address_error"
                  >
                    {errors.address}
                  </p>
                )}
              </div>
            </div>

            {/* Payment Method */}
            <div className="mt-5">
              <Label className="text-sm font-semibold text-foreground mb-3 block">
                Payment Method
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {PAYMENT_OPTIONS.map((option) => {
                  const isSelected = selectedPayment === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSelectedPayment(option.value)}
                      data-ocid={
                        option.value === PaymentMethod.cashOnDelivery
                          ? "checkout.cod_tab"
                          : option.value === PaymentMethod.upi
                            ? "checkout.upi_tab"
                            : "checkout.card_tab"
                      }
                      className={`
                        relative flex flex-col items-center justify-center gap-1.5
                        rounded-xl border-2 p-3 text-center cursor-pointer
                        transition-all duration-150 min-h-[80px]
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                        ${
                          isSelected
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border bg-background hover:border-primary/40 hover:bg-muted/30"
                        }
                      `}
                      aria-pressed={isSelected}
                    >
                      {isSelected && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
                      )}
                      <span className="text-2xl leading-none">
                        {option.icon}
                      </span>
                      <span
                        className={`text-xs font-semibold leading-tight ${
                          isSelected ? "text-primary" : "text-foreground"
                        }`}
                      >
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Payment info box */}
              {selectedPayment === PaymentMethod.upi && (
                <div className="mt-3 rounded-lg bg-blue-50 border border-blue-200 p-3 flex items-start gap-2">
                  <span className="text-lg leading-none mt-0.5">📱</span>
                  <div>
                    <p className="text-xs font-semibold text-blue-800">
                      UPI Payment
                    </p>
                    <p className="text-xs text-blue-700 mt-0.5">
                      UPI ID:{" "}
                      <span className="font-mono font-bold">
                        kiranastore@upi
                      </span>
                    </p>
                    <p className="text-xs text-blue-600 mt-0.5">
                      Pay before delivery
                    </p>
                  </div>
                </div>
              )}
              {selectedPayment === PaymentMethod.card && (
                <div className="mt-3 rounded-lg bg-purple-50 border border-purple-200 p-3 flex items-start gap-2">
                  <span className="text-lg leading-none mt-0.5">💳</span>
                  <div>
                    <p className="text-xs font-semibold text-purple-800">
                      Card Payment
                    </p>
                    <p className="text-xs text-purple-600 mt-0.5">
                      Swipe card on delivery
                    </p>
                  </div>
                </div>
              )}
              {selectedPayment === PaymentMethod.cashOnDelivery && (
                <div className="mt-3 rounded-lg bg-muted/40 border border-border p-3 flex items-start gap-2">
                  <span className="text-lg leading-none mt-0.5">💵</span>
                  <div>
                    <p className="text-xs font-semibold text-foreground">
                      Cash on Delivery
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Pay with cash when your order arrives
                    </p>
                  </div>
                </div>
              )}
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
