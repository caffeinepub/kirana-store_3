import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Order {
    customerName: string;
    status: OrderStatus;
    customerPhone: string;
    createdAt: Time;
    orderId: bigint;
    totalAmount: number;
    items: Array<OrderedProduct>;
}
export type Time = bigint;
export interface OrderedProduct {
    productId: bigint;
    productName: string;
    quantity: bigint;
    price: number;
}
export interface UserProfile {
    name: string;
}
export interface Product {
    stockQuantity: bigint;
    name: string;
    unit: string;
    productId: bigint;
    imageEmoji: string;
    category: ProductCategory;
    price: number;
}
export enum OrderStatus {
    pending = "pending",
    outForDelivery = "outForDelivery",
    delivered = "delivered",
    accepted = "accepted"
}
export enum ProductCategory {
    groceries = "groceries",
    snacks = "snacks",
    fruits = "fruits",
    beverages = "beverages",
    vegetables = "vegetables",
    personalCare = "personalCare",
    dairy = "dairy",
    household = "household"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addProduct(name: string, price: number, unit: string, category: ProductCategory, stockQuantity: bigint, imageEmoji: string): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteProduct(productId: bigint): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getOrderById(orderId: bigint): Promise<Order | null>;
    getOrdersByPhone(phone: string): Promise<Array<Order>>;
    getOrdersInLast24Hours(): Promise<Array<Order>>;
    getOrdersPaginated(offset: bigint, limit: bigint): Promise<Array<Order>>;
    getOutOfStockProducts(): Promise<Array<Product>>;
    getProductById(productId: bigint): Promise<Product | null>;
    getProducts(): Promise<Array<Product>>;
    getProductsByCategory(category: ProductCategory): Promise<Array<Product>>;
    getProductsPaginated(offset: bigint, limit: bigint): Promise<Array<Product>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    placeOrder(customerName: string, customerPhone: string, items: Array<OrderedProduct>): Promise<bigint>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    searchProducts(searchTerm: string): Promise<Array<Product>>;
    seedProducts(): Promise<void>;
    updateOrderStatus(orderId: bigint, status: OrderStatus): Promise<void>;
    updateProduct(productId: bigint, name: string, price: number, unit: string, category: ProductCategory, stockQuantity: bigint, imageEmoji: string): Promise<void>;
    updateStock(productId: bigint, newStock: bigint): Promise<void>;
}
