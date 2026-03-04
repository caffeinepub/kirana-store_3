import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Settings, ShoppingCart } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface StorefrontHeaderProps {
  onCartOpen: () => void;
  onTrackOrder: () => void;
  onAdminClick: () => void;
  currentView: "shop" | "track";
}

export function StorefrontHeader({
  onCartOpen,
  onTrackOrder,
  onAdminClick,
  currentView,
}: StorefrontHeaderProps) {
  const { totalItems } = useCart();
  const { isLoggingIn } = useInternetIdentity();

  return (
    <header className="sticky top-0 z-40 bg-card border-b border-border shadow-xs">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground text-lg flex-shrink-0">
            🏪
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-foreground text-base leading-tight truncate">
              Ramesh Kirana Store
            </h1>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Fresh & Quality Guaranteed
            </p>
          </div>
        </div>

        {/* Nav Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant={currentView === "track" ? "default" : "ghost"}
            size="sm"
            onClick={onTrackOrder}
            className="hidden sm:flex items-center gap-1.5"
            data-ocid="nav.track_order_link"
          >
            <Package size={15} />
            Track Order
          </Button>

          <Button
            variant={currentView === "track" ? "default" : "ghost"}
            size="icon"
            onClick={onTrackOrder}
            className="sm:hidden"
            data-ocid="nav.track_order_mobile_link"
          >
            <Package size={16} />
          </Button>

          {/* Cart */}
          <Button
            variant="outline"
            size="sm"
            onClick={onCartOpen}
            className="relative flex items-center gap-1.5 border-primary/30 hover:border-primary"
            data-ocid="cart.open_modal_button"
          >
            <ShoppingCart size={16} className="text-primary" />
            <span className="hidden sm:inline font-medium">Cart</span>
            {totalItems > 0 && (
              <Badge className="h-5 min-w-5 px-1 text-xs bg-primary text-primary-foreground animate-pop">
                {totalItems}
              </Badge>
            )}
          </Button>

          {/* Admin (subtle) */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onAdminClick}
            disabled={isLoggingIn}
            title="Admin Login"
            className="text-muted-foreground hover:text-foreground"
            data-ocid="admin.login_button"
          >
            {isLoggingIn ? (
              <span className="animate-spin text-xs">⟳</span>
            ) : (
              <Settings size={16} />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
