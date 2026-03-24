"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { productAPI, validatorAPI, transferAPI } from "@/lib/api";
import { Product, STATUS_COLORS } from "@/lib/types";
import {
  Package, Users, ShoppingBag, AlertTriangle,
  ArrowUpRight, Plus, UserCheck, BarChart3, Loader2, Send
} from "lucide-react";
import { toast } from "sonner";

export function NGODashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [artisanCount, setArtisanCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [transferring, setTransferring] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [prodRes, artRes] = await Promise.all([
        productAPI.getAll({ limit: 6 }),
        validatorAPI.getPending().catch(() => ({ data: { data: [] } })),
      ]);
      setProducts(prodRes.data.data || []);
      setArtisanCount(artRes.data.data?.length || 0);
    } catch { /* silent */ }
    setLoading(false);
  };

  const handleTransfer = async (productId: string) => {
    setTransferring(productId);
    try {
      await transferAPI.transfer({ productId, toOrg: "ManufacturerOrg" });
      toast.success(`Product ${productId} transferred to Manufacturer!`);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Transfer failed");
    }
    setTransferring(null);
  };

  if (!user) return null;

  const registeredProducts = products.filter(p => p.status === "REGISTERED");

  const stats = {
    total: products.length,
    registered: registeredProducts.length,
    inTransit: products.filter(p => ["IN_WAREHOUSE", "IN_DISTRIBUTION", "IN_RETAIL"].includes(p.status)).length,
    sold: products.filter(p => p.status === "SOLD").length,
    returned: products.filter(p => p.status === "RETURNED").length,
    retired: products.filter(p => p.isRetired).length,
  };

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">NGO Dashboard</h1>
          <p className="text-gray-400 mt-1">Welcome, {user.name} — manage artisans & product registrations</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => router.push("/artisans")} variant="outline" className="border-white/20 text-gray-300 hover:text-white">
            <UserCheck className="mr-2 h-4 w-4" /> Artisans
          </Button>
          <Button onClick={() => router.push("/products")} className="bg-gradient-to-r from-amber-500 to-orange-600 text-white">
            <Plus className="mr-2 h-4 w-4" /> Register Product
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
        {[
          { label: "Total Products", value: stats.total, icon: Package, color: "from-blue-500 to-cyan-500" },
          { label: "Registered", value: stats.registered, icon: Package, color: "from-amber-500 to-orange-500" },
          { label: "In Transit", value: stats.inTransit, icon: BarChart3, color: "from-purple-500 to-pink-500" },
          { label: "Sold", value: stats.sold, icon: ShoppingBag, color: "from-emerald-500 to-teal-500" },
          { label: "Returned", value: stats.returned, icon: AlertTriangle, color: "from-orange-500 to-red-500" },
          { label: "Pending Artisans", value: artisanCount, icon: Users, color: "from-indigo-500 to-violet-500" },
        ].map((s, i) => (
          <Card key={i} className="bg-gray-900/60 border-white/10 hover:border-white/20 transition-all group">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${s.color} opacity-80 group-hover:opacity-100 transition-opacity`}>
                  <s.icon className="h-4 w-4 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{loading ? "—" : s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Products + Quick Actions */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-gray-900/60 border-white/10">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Recently Registered Products</CardTitle>
            <button onClick={() => router.push("/products")} className="text-sm text-amber-400 hover:text-amber-300 flex items-center gap-1">
              View all <ArrowUpRight className="h-3 w-3" />
            </button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-amber-500" /></div>
            ) : products.length === 0 ? (
              <p className="text-center py-8 text-gray-500">No products registered yet</p>
            ) : (
              <div className="space-y-2">
                {products.slice(0, 5).map(p => (
                  <div key={p.productId} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 p-3 hover:bg-white/10 transition-colors">
                    <div className="cursor-pointer flex-1" onClick={() => router.push(`/products/${p.productId}`)}>
                      <p className="font-medium text-white text-sm">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.productId} • Artisan: {p.artisanId}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-amber-400">₹{p.basePrice?.toLocaleString()}</span>
                      <Badge className={STATUS_COLORS[p.status] || "bg-gray-500/20 text-gray-400"}>{p.status}</Badge>
                      {p.status === "REGISTERED" && (
                        <Button
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); handleTransfer(p.productId); }}
                          disabled={transferring === p.productId}
                          className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          {transferring === p.productId ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3 mr-1" />}
                          To Manufacturer
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-900/60 border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={() => router.push("/products")} className="w-full justify-start bg-white/5 border border-white/10 text-white hover:bg-white/10" variant="ghost">
              <Package className="mr-3 h-4 w-4 text-amber-400" /> Register New Product
            </Button>
            <Button onClick={() => router.push("/artisans")} className="w-full justify-start bg-white/5 border border-white/10 text-white hover:bg-white/10" variant="ghost">
              <UserCheck className="mr-3 h-4 w-4 text-emerald-400" /> Onboard Artisan
            </Button>
            <Button onClick={() => router.push("/scan")} className="w-full justify-start bg-white/5 border border-white/10 text-white hover:bg-white/10" variant="ghost">
              <BarChart3 className="mr-3 h-4 w-4 text-blue-400" /> Scan & Track Product
            </Button>

            {registeredProducts.length > 0 && (
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 mt-2">
                <p className="text-xs text-emerald-400 font-medium flex items-center gap-1"><Send className="h-3 w-3" /> Ready to Transfer</p>
                <p className="text-xs text-gray-400 mt-1">{registeredProducts.length} product(s) waiting to be sent to Manufacturer</p>
              </div>
            )}

            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 mt-2">
              <p className="text-xs text-amber-400 font-medium">💡 Supply Chain Flow</p>
              <p className="text-xs text-gray-400 mt-1">NGO → Manufacturer → Warehouse → Distributor → Retailer → Customer</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
