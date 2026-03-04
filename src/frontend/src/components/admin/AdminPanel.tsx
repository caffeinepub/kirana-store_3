import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, LogOut, ShieldAlert } from "lucide-react";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import { useIsCallerAdmin } from "../../hooks/useQueries";
import { AdminOrdersTab } from "./AdminOrdersTab";
import { AdminProductsTab } from "./AdminProductsTab";

interface AdminPanelProps {
  onBack: () => void;
}

export function AdminPanel({ onBack }: AdminPanelProps) {
  const { data: isAdmin, isLoading: checkingAdmin } = useIsCallerAdmin();
  const { clear, identity } = useInternetIdentity();

  function handleLogout() {
    clear();
    onBack();
  }

  if (checkingAdmin) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="space-y-4" data-ocid="admin.loading_state">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div
          className="flex flex-col items-center gap-4"
          data-ocid="admin.error_state"
        >
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldAlert size={28} className="text-destructive" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Unauthorized</h2>
            <p className="text-muted-foreground text-sm mt-1">
              You don't have admin access to this store.
            </p>
          </div>
          <Button variant="outline" onClick={onBack} className="mt-2">
            Back to Store
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Admin Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Ramesh Kirana Store — Management Dashboard
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <p className="text-xs text-muted-foreground">Logged in as</p>
            <p className="text-xs font-mono text-foreground truncate max-w-[140px]">
              {identity?.getPrincipal().toString().slice(0, 20)}...
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="flex items-center gap-1.5"
            data-ocid="admin.logout_button"
          >
            <LogOut size={14} />
            Logout
          </Button>
          <Button variant="ghost" size="sm" onClick={onBack}>
            ← Store
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="products">
        <TabsList className="bg-muted/50 mb-6">
          <TabsTrigger value="products" data-ocid="admin.products_tab">
            📦 Products
          </TabsTrigger>
          <TabsTrigger value="orders" data-ocid="admin.orders_tab">
            📋 Orders
          </TabsTrigger>
        </TabsList>
        <TabsContent value="products">
          <AdminProductsTab />
        </TabsContent>
        <TabsContent value="orders">
          <AdminOrdersTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
