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
  Package, ArrowUpRight, Loader2, Truck,
  ArrowLeftRight, DollarSign
} from "lucide-react";

export function DistributorDashboard() {
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

  const myProducts = products.filter(p => p.currentOwnerOrg === "DistributorOrg");
  const totalMarginEarned = myProducts.reduce((sum, p) => {
    const margin = (p.currentPrice || 0) - (p.basePrice || 0);
    return sum + Math.max(0, margin);
  }, 0);

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Distributor Dashboard</h1>
          <p className="text-gray-400 mt-1">Welcome, {user.name} — manage distribution & add margins</p>
        </div>
        <Button onClick={() => router.push("/transfers")} className="bg-gradient-to-r from-amber-500 to-orange-600 text-white">
          <ArrowLeftRight className="mr-2 h-4 w-4" /> Transfer Products
        </Button>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Products in Hand", value: myProducts.length, icon: Truck, color: "from-purple-500 to-pink-500" },
          { label: "Total Products", value: products.length, icon: Package, color: "from-blue-500 to-cyan-500" },
          { label: "Margin Value", value: `₹${totalMarginEarned.toLocaleString()}`, icon: DollarSign, color: "from-emerald-500 to-teal-500" },
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

      <Card className="bg-gray-900/60 border-white/10">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">Products for Distribution</CardTitle>
          <button onClick={() => router.push("/products")} className="text-sm text-amber-400 hover:text-amber-300 flex items-center gap-1">
            View all <ArrowUpRight className="h-3 w-3" />
          </button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-amber-500" /></div>
          ) : myProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Truck className="mx-auto h-10 w-10 mb-2 opacity-50" />
              <p>No products awaiting distribution</p>
            </div>
          ) : (
            <div className="space-y-2">
              {myProducts.map(p => (
                <div key={p.productId} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 p-3 hover:bg-white/10 cursor-pointer transition-colors" onClick={() => router.push(`/products/${p.productId}`)}>
                  <div>
                    <p className="font-medium text-white text-sm">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.productId} • Base ₹{p.basePrice?.toLocaleString()}</p>
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
    </main>
  );
}
