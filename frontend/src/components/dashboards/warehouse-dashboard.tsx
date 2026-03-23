"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { productAPI } from "@/lib/api";
import { Product, STATUS_COLORS } from "@/lib/types";
import {
  Package, ArrowUpRight, Loader2, Warehouse,
  RotateCcw, ArrowLeftRight, AlertTriangle
} from "lucide-react";

export function WarehouseDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await productAPI.getAll({ limit: 20 });
      setProducts(res.data.data || []);
    } catch { /* silent */ }
    setLoading(false);
  };

  if (!user) return null;

  const inWarehouse = products.filter(p => p.currentOwnerOrg === "WarehouseOrg" && p.status === "IN_WAREHOUSE");
  const returned = products.filter(p => p.status === "RETURNED");
  const retired = products.filter(p => p.isRetired);

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Warehouse Dashboard</h1>
          <p className="text-gray-400 mt-1">Welcome, {user.name} — manage inventory, returns & shipments</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => router.push("/returns")} variant="outline" className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10">
            <RotateCcw className="mr-2 h-4 w-4" /> Returns
          </Button>
          <Button onClick={() => router.push("/transfers")} className="bg-gradient-to-r from-amber-500 to-orange-600 text-white">
            <ArrowLeftRight className="mr-2 h-4 w-4" /> Transfers
          </Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "In Warehouse", value: inWarehouse.length, icon: Warehouse, color: "from-amber-500 to-orange-500" },
          { label: "Returned Products", value: returned.length, icon: RotateCcw, color: "from-orange-500 to-red-500" },
          { label: "Ready to Ship", value: inWarehouse.filter(p => !p.isRetired).length, icon: ArrowLeftRight, color: "from-emerald-500 to-teal-500" },
          { label: "Retired Products", value: retired.length, icon: AlertTriangle, color: "from-red-500 to-rose-500" },
        ].map((s, i) => (
          <Card key={i} className="bg-gray-900/60 border-white/10 hover:border-white/20 transition-all group">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">{s.label}</p>
                  <p className="text-3xl font-bold text-white mt-1">{loading ? "—" : s.value}</p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${s.color} opacity-80 group-hover:opacity-100`}>
                  <s.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Inventory */}
        <Card className="bg-gray-900/60 border-white/10">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Current Inventory</CardTitle>
            <button onClick={() => router.push("/products")} className="text-sm text-amber-400 hover:text-amber-300 flex items-center gap-1">
              View all <ArrowUpRight className="h-3 w-3" />
            </button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-amber-500" /></div>
            ) : inWarehouse.length === 0 ? (
              <p className="text-center py-6 text-gray-500">No products in warehouse</p>
            ) : (
              <div className="space-y-2">
                {inWarehouse.slice(0, 5).map(p => (
                  <div key={p.productId} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 p-3 hover:bg-white/10 cursor-pointer transition-colors" onClick={() => router.push(`/products/${p.productId}`)}>
                    <div>
                      <p className="font-medium text-white text-sm">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.productId}</p>
                    </div>
                    <span className="text-sm font-semibold text-amber-400">₹{p.currentPrice?.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Returns Alert */}
        <Card className="bg-gray-900/60 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Returned Products</CardTitle>
          </CardHeader>
          <CardContent>
            {returned.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <RotateCcw className="mx-auto h-10 w-10 mb-2 opacity-50" />
                <p className="text-sm">No returns pending</p>
              </div>
            ) : (
              <div className="space-y-2">
                {returned.slice(0, 5).map(p => (
                  <div key={p.productId} className="flex items-center justify-between rounded-lg border border-orange-500/10 bg-orange-500/5 p-3">
                    <div>
                      <p className="font-medium text-white text-sm">{p.name}</p>
                      <p className="text-xs text-gray-500">Return #{p.returnCount}/3</p>
                    </div>
                    <Badge className={p.returnCount >= 3 ? "bg-red-500/20 text-red-400" : "bg-orange-500/20 text-orange-400"}>
                      {p.returnCount >= 3 ? "RETIRED" : "RETURNED"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
