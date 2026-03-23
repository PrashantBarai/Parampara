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
  Package, ArrowUpRight, Loader2, ShoppingBag,
  QrCode, Star, RotateCcw, ShoppingCart
} from "lucide-react";

export function CustomerDashboard() {
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

  const myPurchases = products.filter(p => p.currentOwnerOrg === "CustomerOrg");
  const availableProducts = products.filter(p => p.status === "IN_RETAIL");
  const returnedByMe = products.filter(p => p.status === "RETURNED" && p.returnCount > 0);

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Welcome, {user.name}</h1>
          <p className="text-gray-400 mt-1">Browse authentic artisan products & track your purchases</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => router.push("/scan")} variant="outline" className="border-white/20 text-gray-300 hover:text-white">
            <QrCode className="mr-2 h-4 w-4" /> Scan QR
          </Button>
          <Button onClick={() => router.push("/orders")} className="bg-gradient-to-r from-amber-500 to-orange-600 text-white">
            <ShoppingBag className="mr-2 h-4 w-4" /> My Orders
          </Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: "My Purchases", value: myPurchases.length, icon: ShoppingBag, color: "from-emerald-500 to-teal-500" },
          { label: "Available to Buy", value: availableProducts.length, icon: ShoppingCart, color: "from-blue-500 to-cyan-500" },
          { label: "Returns", value: returnedByMe.length, icon: RotateCcw, color: "from-orange-500 to-red-500" },
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
        {/* My Purchases */}
        <Card className="bg-gray-900/60 border-white/10">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">My Purchases</CardTitle>
            <button onClick={() => router.push("/orders")} className="text-sm text-amber-400 hover:text-amber-300 flex items-center gap-1">
              Manage <ArrowUpRight className="h-3 w-3" />
            </button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-amber-500" /></div>
            ) : myPurchases.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <ShoppingBag className="mx-auto h-10 w-10 mb-2 opacity-50" />
                <p className="text-sm">No purchases yet</p>
                <Button onClick={() => router.push("/orders")} size="sm" className="mt-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white">
                  <ShoppingCart className="mr-1 h-3 w-3" /> Browse Products
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {myPurchases.slice(0, 4).map(p => (
                  <div key={p.productId} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 p-3 hover:bg-white/10 cursor-pointer transition-colors" onClick={() => router.push(`/products/${p.productId}`)}>
                    <div>
                      <p className="font-medium text-white text-sm">{p.name}</p>
                      <p className="text-xs text-gray-500">Returns: {p.returnCount}/3</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-amber-400">₹{p.currentPrice?.toLocaleString()}</p>
                      <Badge className={STATUS_COLORS[p.status] || "bg-gray-500/20 text-gray-400"}>{p.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Available Products */}
        <Card className="bg-gray-900/60 border-white/10">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Available Products</CardTitle>
            <button onClick={() => router.push("/orders")} className="text-sm text-amber-400 hover:text-amber-300 flex items-center gap-1">
              Shop <ArrowUpRight className="h-3 w-3" />
            </button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-amber-500" /></div>
            ) : availableProducts.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <Package className="mx-auto h-10 w-10 mb-2 opacity-50" />
                <p className="text-sm">No products available right now</p>
              </div>
            ) : (
              <div className="space-y-2">
                {availableProducts.slice(0, 4).map(p => (
                  <div key={p.productId} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 p-3 hover:bg-white/10 cursor-pointer transition-colors" onClick={() => router.push(`/products/${p.productId}`)}>
                    <div>
                      <p className="font-medium text-white text-sm">{p.name}</p>
                      <p className="text-xs text-gray-500">Artisan: {p.artisanId}</p>
                    </div>
                    <p className="text-sm font-bold text-amber-400">₹{p.currentPrice?.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Scan Info */}
      <div className="mt-6 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 flex items-center gap-3">
        <QrCode className="h-5 w-5 text-blue-400 flex-shrink-0" />
        <div>
          <p className="text-sm text-blue-400 font-medium">Scan to Verify Authenticity</p>
          <p className="text-xs text-gray-400">Every product has a QR code. Scan it to see the complete journey from artisan to your hands.</p>
        </div>
      </div>
    </main>
  );
}
