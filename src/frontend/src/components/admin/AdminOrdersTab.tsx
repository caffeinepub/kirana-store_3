import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Order } from "../../backend.d";
import {
  OrderStatus,
  PaymentMethod,
  useGetOrdersPaginated,
  useUpdateOrderStatus,
} from "../../hooks/useQueries";

const STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> =
  {
    [OrderStatus.pending]: {
      label: "Pending",
      className: "bg-warning/10 text-warning border-warning/20",
    },
    [OrderStatus.accepted]: {
      label: "Accepted",
      className: "bg-info/10 text-info border-info/20",
    },
    [OrderStatus.outForDelivery]: {
      label: "Out for Delivery",
      className:
        "bg-orange-status/10 text-orange-status border-orange-status/20",
    },
    [OrderStatus.delivered]: {
      label: "Delivered",
      className: "bg-success/10 text-success border-success/20",
    },
  };

const PAYMENT_CONFIG: Record<
  PaymentMethod,
  { icon: string; label: string; className: string }
> = {
  [PaymentMethod.cashOnDelivery]: {
    icon: "💵",
    label: "COD",
    className: "bg-muted/50 text-muted-foreground border-border",
  },
  [PaymentMethod.upi]: {
    icon: "📱",
    label: "UPI",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  [PaymentMethod.card]: {
    icon: "💳",
    label: "Card",
    className: "bg-purple-50 text-purple-700 border-purple-200",
  },
};

const ALL_STATUSES = [
  { value: "all", label: "All Orders" },
  { value: OrderStatus.pending, label: "Pending" },
  { value: OrderStatus.accepted, label: "Accepted" },
  { value: OrderStatus.outForDelivery, label: "Out for Delivery" },
  { value: OrderStatus.delivered, label: "Delivered" },
];

function OrderRow({
  order,
  index,
}: {
  order: Order;
  index: number;
}) {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(
    order.status,
  );
  const updateStatus = useUpdateOrderStatus();
  const date = new Date(Number(order.createdAt / BigInt(1_000_000)));

  async function handleUpdate() {
    try {
      await updateStatus.mutateAsync({
        orderId: order.orderId,
        status: selectedStatus,
      });
      toast.success(`Order #${order.orderId} status updated`);
    } catch {
      toast.error("Failed to update status");
    }
  }

  const statusConfig = STATUS_CONFIG[order.status];
  const isModified = selectedStatus !== order.status;

  return (
    <TableRow
      data-ocid={`admin.order.item.${index}`}
      className="hover:bg-muted/20"
    >
      <TableCell className="font-mono text-sm text-muted-foreground">
        #{order.orderId.toString()}
      </TableCell>
      <TableCell>
        <div>
          <p className="font-semibold text-foreground text-sm">
            {order.customerName}
          </p>
          <p className="text-xs text-muted-foreground">{order.customerPhone}</p>
          {order.paymentMethod &&
            (() => {
              const pm = PAYMENT_CONFIG[order.paymentMethod];
              return pm ? (
                <Badge
                  variant="outline"
                  className={`mt-1 text-xs px-1.5 py-0 h-5 ${pm.className}`}
                  data-ocid={`admin.order.payment.${index}`}
                >
                  {pm.icon} {pm.label}
                </Badge>
              ) : null;
            })()}
        </div>
      </TableCell>
      <TableCell className="hidden lg:table-cell">
        <div className="max-w-[180px]">
          {order.items.slice(0, 2).map((item) => (
            <p
              key={item.productId.toString()}
              className="text-xs text-muted-foreground truncate"
            >
              {item.productName} ×{item.quantity.toString()}
            </p>
          ))}
          {order.items.length > 2 && (
            <p className="text-xs text-muted-foreground">
              +{order.items.length - 2} more
            </p>
          )}
        </div>
      </TableCell>
      <TableCell className="font-bold text-primary">
        ₹{order.totalAmount.toFixed(0)}
      </TableCell>
      <TableCell>
        <Badge
          variant="outline"
          className={`text-xs ${statusConfig.className}`}
        >
          {statusConfig.label}
        </Badge>
      </TableCell>
      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
        {date.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Select
            value={selectedStatus}
            onValueChange={(v) => setSelectedStatus(v as OrderStatus)}
          >
            <SelectTrigger
              className="h-8 text-xs w-36"
              data-ocid={`admin.status_select.${index}`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={OrderStatus.pending}>Pending</SelectItem>
              <SelectItem value={OrderStatus.accepted}>Accepted</SelectItem>
              <SelectItem value={OrderStatus.outForDelivery}>
                Out for Delivery
              </SelectItem>
              <SelectItem value={OrderStatus.delivered}>Delivered</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant={isModified ? "default" : "outline"}
            className={`h-8 px-2 text-xs ${
              isModified
                ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                : ""
            }`}
            onClick={handleUpdate}
            disabled={updateStatus.isPending || !isModified}
            data-ocid={`admin.update_status_button.${index}`}
          >
            {updateStatus.isPending ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              "Update"
            )}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function AdminOrdersTab() {
  const [filterStatus, setFilterStatus] = useState<OrderStatus | "all">("all");
  const queryClient = useQueryClient();
  const { data: orders, isLoading } = useGetOrdersPaginated(
    BigInt(0),
    BigInt(100),
  );

  const filteredOrders =
    filterStatus === "all"
      ? orders || []
      : (orders || []).filter((o) => o.status === filterStatus);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-bold text-foreground text-lg">
          Orders
          {orders && (
            <span className="text-muted-foreground font-normal text-sm ml-2">
              ({filteredOrders.length} shown)
            </span>
          )}
        </h2>
        <div className="flex items-center gap-2">
          {/* Filter */}
          <Select
            value={filterStatus}
            onValueChange={(v) => setFilterStatus(v as OrderStatus | "all")}
          >
            <SelectTrigger className="h-9 text-sm w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ALL_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ["orders"] })
            }
            className="h-9"
          >
            <RefreshCw size={14} />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2" data-ocid="admin.orders_loading_state">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-xl"
          data-ocid="admin.orders_empty_state"
        >
          <div className="text-4xl mb-3">📋</div>
          <p className="font-semibold text-foreground">No orders found</p>
          <p className="text-muted-foreground text-sm mt-1">
            {filterStatus !== "all"
              ? `No ${filterStatus} orders`
              : "No orders have been placed yet"}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="hidden lg:table-cell">Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead>Update Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order, idx) => (
                <OrderRow
                  key={order.orderId.toString()}
                  order={order}
                  index={idx + 1}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
