import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import { AdminPanel } from "./components/admin/AdminPanel";
import { CartProvider } from "./context/CartContext";
import { StorefrontPage } from "./pages/StorefrontPage";

type AppView = "storefront" | "admin";

export default function App() {
  const [view, setView] = useState<AppView>("storefront");

  return (
    <CartProvider>
      <div className="min-h-screen bg-background">
        {view === "storefront" ? (
          <StorefrontPage onAdminAccess={() => setView("admin")} />
        ) : (
          <>
            {/* Admin Header Bar */}
            <header className="sticky top-0 z-40 bg-foreground text-background px-4 h-14 flex items-center gap-3 shadow-md">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-sm flex-shrink-0">
                🔐
              </div>
              <span className="font-bold text-sm">
                Ramesh Kirana Store — Admin
              </span>
            </header>
            <AdminPanel onBack={() => setView("storefront")} />
          </>
        )}
      </div>
      <Toaster position="top-right" richColors />
    </CartProvider>
  );
}
