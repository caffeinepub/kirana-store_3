import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  Clock,
  Package,
  Search,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { useState } from "react";
import type { Order } from "../backend.d";
import { OrderStatus } from "../hooks/useQueries";
import { useGetOrdersByPhone } from "../hooks/useQueries";

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  [OrderStatus.pending]: {
    label: "Pending",
    color: "text-warning",
    bg: "bg-warning/10",
    icon: <Clock size={14} />,
  },
  [OrderStatus.accepted]: {
    label: "Accepted",
    color: "text-info",
    bg: "bg-info/10",
    icon: <ShoppingBag size={14} />,
  },
  [OrderStatus.outForDelivery]: {
    label: "Out for Delivery",
    color: "text-orange-status",
    bg: "bg-orange-status/10",
    icon: <Truck size={14} />,
  },
  [OrderStatus.delivered]: {
    label: "Delivered",
    color: "text-success",
    bg: "bg-success/10",
    icon: <CheckCircle2 size={14} />,
  },
};

function OrderCard({ order }: { order: Order }) {
  const status = STATUS_CONFIG[order.status];
  const date = new Date(Number(order.createdAt / BigInt(1_000_000)));

  return (
    <div className="kirana-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold text-foreground">
            Order #{order.orderId.toString()}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {date.toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <span
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${status.color} ${status.bg}`}
        >
          {status.icon}
          {status.label}
        </span>
      </div>

      {/* Items */}
      <div className="bg-muted/30 rounded-lg p-3 space-y-1.5">
        {order.items.map((item) => (
          <div
            key={item.productId.toString()}
            className="flex justify-between text-sm"
          >
            <span className="text-muted-foreground">
              {item.productName} × {item.quantity.toString()}
            </span>
            <span className="font-medium text-foreground">
              ₹{(item.price * Number(item.quantity)).toFixed(0)}
            </span>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <span className="text-muted-foreground text-sm">Total Amount</span>
        <span className="font-bold text-primary text-lg">
          ₹{order.totalAmount.toFixed(0)}
        </span>
      </div>
    </div>
  );
}

export function TrackOrder() {
  const [phoneInput, setPhoneInput] = useState("");
  const [searchPhone, setSearchPhone] = useState("");

  const { data: orders, isLoading } = useGetOrdersByPhone(searchPhone);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (phoneInput.trim().length === 10) {
      setSearchPhone(phoneInput.trim());
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <div className="text-4xl mb-2">📦</div>
        <h2 className="text-2xl font-bold text-foreground">Track Your Order</h2>
        <p className="text-muted-foreground mt-1">
          Enter your mobile number to track all orders
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <div className="flex-1 relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Enter 10-digit mobile number"
            value={phoneInput}
            onChange={(e) =>
              setPhoneInput(e.target.value.replace(/\D/g, "").slice(0, 10))
            }
            type="tel"
            inputMode="numeric"
            className="pl-9 h-11"
            data-ocid="trackorder.search_input"
          />
        </div>
        <Button
          type="submit"
          disabled={phoneInput.length !== 10}
          className="h-11 bg-primary hover:bg-primary/90 text-primary-foreground px-6"
          data-ocid="trackorder.submit_button"
        >
          Track
        </Button>
      </form>

      {/* Results */}
      {isLoading && searchPhone && (
        <div className="space-y-3" data-ocid="trackorder.loading_state">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && searchPhone && orders && orders.length === 0 && (
        <div
          className="text-center py-12 text-muted-foreground"
          data-ocid="trackorder.empty_state"
        >
          <Package size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No orders found</p>
          <p className="text-sm mt-1">
            No orders placed with number {searchPhone}
          </p>
        </div>
      )}

      {!isLoading && orders && orders.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground font-medium">
            {orders.length} order{orders.length !== 1 ? "s" : ""} found for{" "}
            {searchPhone}
          </p>
          {orders.map((order) => (
            <OrderCard key={order.orderId.toString()} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
