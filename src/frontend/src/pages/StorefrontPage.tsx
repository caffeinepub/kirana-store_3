import { useEffect, useState } from "react";
import { CartDrawer } from "../components/CartDrawer";
import { CategoryNav } from "../components/CategoryNav";
import { CheckoutModal } from "../components/CheckoutModal";
import { ProductGrid } from "../components/ProductGrid";
import { StorefrontHeader } from "../components/StorefrontHeader";
import { TrackOrder } from "../components/TrackOrder";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  type ProductCategory,
  useGetProductsByCategory,
  useSearchProducts,
} from "../hooks/useQueries";
import { useIsCallerAdmin } from "../hooks/useQueries";

type CategoryFilter = "all" | ProductCategory;

interface StorefrontPageProps {
  onAdminAccess: () => void;
}

export function StorefrontPage({ onAdminAccess }: StorefrontPageProps) {
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [currentView, setCurrentView] = useState<"shop" | "track">("shop");

  const { login, isLoginSuccess, identity } = useInternetIdentity();
  const { data: isAdmin } = useIsCallerAdmin();

  // Redirect to admin after login if admin
  useEffect(() => {
    if (isLoginSuccess && identity && isAdmin) {
      onAdminAccess();
    }
  }, [isLoginSuccess, identity, isAdmin, onAdminAccess]);

  // Category-based fetch
  const { data: categoryProducts, isLoading: categoryLoading } =
    useGetProductsByCategory(searchTerm ? "all" : selectedCategory);

  // Search fetch
  const { data: searchResults, isLoading: searchLoading } =
    useSearchProducts(searchTerm);

  const products = searchTerm ? searchResults || [] : categoryProducts || [];
  const isLoading = searchTerm ? searchLoading : categoryLoading;

  async function handleAdminClick() {
    if (identity) {
      // Already logged in — check admin
      if (isAdmin) {
        onAdminAccess();
      } else {
        // Already authenticated but not admin
        onAdminAccess(); // Let admin panel handle unauthorized
      }
    } else {
      await login();
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <StorefrontHeader
        onCartOpen={() => setCartOpen(true)}
        onTrackOrder={() =>
          setCurrentView((v) => (v === "track" ? "shop" : "track"))
        }
        onAdminClick={handleAdminClick}
        currentView={currentView}
      />

      {currentView === "track" ? (
        <main>
          <TrackOrder />
        </main>
      ) : (
        <>
          <CategoryNav
            selected={selectedCategory}
            onSelect={(cat) => {
              setSelectedCategory(cat);
              setSearchTerm("");
            }}
          />

          <main className="max-w-6xl mx-auto px-4 py-6">
            <ProductGrid
              products={products}
              isLoading={isLoading}
              searchTerm={searchTerm}
              onSearchChange={(term) => {
                setSearchTerm(term);
                if (term) setSelectedCategory("all");
              }}
            />
          </main>
        </>
      )}

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-12 py-6">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            🏪 Ramesh Kirana Store — Fresh produce delivered to your door
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            © {new Date().getFullYear()}. Built with love using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>

      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={() => {
          setCartOpen(false);
          setCheckoutOpen(true);
        }}
      />
      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
      />
    </div>
  );
}
