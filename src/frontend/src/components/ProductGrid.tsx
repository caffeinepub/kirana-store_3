import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PackageOpen, Search } from "lucide-react";
import type { Product } from "../backend.d";
import { ProductCard } from "./ProductCard";

interface ProductGridProps {
  products: Product[];
  isLoading: boolean;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

function ProductSkeleton() {
  return (
    <div className="kirana-card overflow-hidden">
      <Skeleton className="h-28 w-full" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/3" />
        <div className="flex justify-between items-center">
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
    </div>
  );
}

export function ProductGrid({
  products,
  isLoading,
  searchTerm,
  onSearchChange,
}: ProductGridProps) {
  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          placeholder="Search products... (e.g. rice, onion, milk)"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-11 bg-card border-border focus-visible:ring-primary"
          data-ocid="search.search_input"
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }, (_, i) => `skeleton-${i}`).map((id) => (
            <ProductSkeleton key={id} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 text-center"
          data-ocid="product.empty_state"
        >
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-foreground font-semibold text-lg">
            No products found
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            {searchTerm
              ? `No results for "${searchTerm}"`
              : "This category is empty"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {products.map((product, idx) => (
            <ProductCard
              key={product.productId.toString()}
              product={product}
              index={idx + 1}
            />
          ))}
        </div>
      )}

      {/* Count */}
      {!isLoading && products.length > 0 && (
        <p className="text-xs text-muted-foreground text-center pb-2">
          Showing {products.length} product{products.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
