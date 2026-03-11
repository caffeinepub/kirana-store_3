import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type ProductCategory as BackendProductCategory,
  OrderStatus,
  PaymentMethod,
} from "../backend.d";
import type { Order, OrderedProduct, Product } from "../backend.d";
import { useActor } from "./useActor";

// Local enum that extends the backend ProductCategory with medicines support.
// Values intentionally match the backend enum strings.
export enum ProductCategory {
  groceries = "groceries",
  fruits = "fruits",
  vegetables = "vegetables",
  dairy = "dairy",
  snacks = "snacks",
  beverages = "beverages",
  personalCare = "personalCare",
  household = "household",
  medicines = "medicines",
}

export function useGetProducts() {
  const { actor, isFetching } = useActor();
  return useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getProducts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetProductsByCategory(category: ProductCategory | "all") {
  const { actor, isFetching } = useActor();
  return useQuery<Product[]>({
    queryKey: ["products", "category", category],
    queryFn: async () => {
      if (!actor) return [];
      if (category === "all") return actor.getProducts();
      return actor.getProductsByCategory(
        category as unknown as BackendProductCategory,
      );
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSearchProducts(term: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Product[]>({
    queryKey: ["products", "search", term],
    queryFn: async () => {
      if (!actor || !term.trim()) return [];
      return actor.searchProducts(term);
    },
    enabled: !!actor && !isFetching && term.trim().length > 0,
  });
}

export function usePlaceOrder() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({
      customerName,
      customerPhone,
      items,
    }: {
      customerName: string;
      customerPhone: string;
      items: OrderedProduct[];
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.placeOrder(customerName, customerPhone, items);
    },
  });
}

export function usePlaceOrderWithPayment() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({
      customerName,
      customerPhone,
      items,
      paymentMethod,
    }: {
      customerName: string;
      customerPhone: string;
      items: OrderedProduct[];
      paymentMethod: PaymentMethod;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.placeOrderWithPayment(
        customerName,
        customerPhone,
        items,
        paymentMethod,
      );
    },
  });
}

export function useGetOrdersByPhone(phone: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Order[]>({
    queryKey: ["orders", "phone", phone],
    queryFn: async () => {
      if (!actor || !phone.trim()) return [];
      return actor.getOrdersByPhone(phone);
    },
    enabled: !!actor && !isFetching && phone.trim().length > 0,
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetOrdersPaginated(offset: bigint, limit: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery<Order[]>({
    queryKey: ["orders", "paginated", offset.toString(), limit.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getOrdersPaginated(offset, limit);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateOrderStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderId,
      status,
    }: {
      orderId: bigint;
      status: OrderStatus;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateOrderStatus(orderId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useAddProduct() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (product: {
      name: string;
      price: number;
      unit: string;
      category: ProductCategory;
      stockQuantity: bigint;
      imageEmoji: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addProduct(
        product.name,
        product.price,
        product.unit,
        product.category as unknown as BackendProductCategory,
        product.stockQuantity,
        product.imageEmoji,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useUpdateProduct() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (product: {
      productId: bigint;
      name: string;
      price: number;
      unit: string;
      category: ProductCategory;
      stockQuantity: bigint;
      imageEmoji: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateProduct(
        product.productId,
        product.name,
        product.price,
        product.unit,
        product.category as unknown as BackendProductCategory,
        product.stockQuantity,
        product.imageEmoji,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useDeleteProduct() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (productId: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteProduct(productId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useSeedProducts() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.seedProducts();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export { OrderStatus, PaymentMethod };
export type { Product, Order, OrderedProduct };
