"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { productAPI } from "@/lib/api";
import { Product, STATUS_COLORS } from "@/lib/types";
import { Package, ArrowUpRight, Loader2, Hammer, Clock } from "lucide-react";

export function ManufacturerDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await productAPI.getAll({ limit: 10 });
      setProducts(res.data.data || []);
    } catch { /* silent */ }
    setLoading(false);
  };

  if (!user) return null;

  const myProducts = products.filter(p => p.currentOwnerOrg === "ManufacturerOrg");
  const processed = products.filter(p => p.status !== "REGISTERED");

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Manufacturer Dashboard</h1>
        <p className="text-gray-400 mt-1">Welcome, {user.name} — process & prepare products for shipment</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <Card className="bg-gray-900/60 border-white/10 group hover:border-white/20 transition-all">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Awaiting Processing</p>
                <p className="text-3xl font-bold text-white mt-1">{loading ? "—" : myProducts.length}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 opacity-80 group-hover:opacity-100">
                <Hammer className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/60 border-white/10 group hover:border-white/20 transition-all">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Processed</p>
                <p className="text-3xl font-bold text-emerald-400 mt-1">{loading ? "—" : processed.length}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 opacity-80 group-hover:opacity-100">
                <Package className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/60 border-white/10 group hover:border-white/20 transition-all">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Products</p>
                <p className="text-3xl font-bold text-blue-400 mt-1">{loading ? "—" : products.length}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 opacity-80 group-hover:opacity-100">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gray-900/60 border-white/10">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">Products Awaiting Manufacturing</CardTitle>
          <button onClick={() => router.push("/products")} className="text-sm text-amber-400 hover:text-amber-300 flex items-center gap-1">
            View all <ArrowUpRight className="h-3 w-3" />
          </button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-amber-500" /></div>
          ) : myProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Hammer className="mx-auto h-10 w-10 mb-2 opacity-50" />
              <p>No products awaiting manufacturing</p>
            </div>
          ) : (
            <div className="space-y-2">
              {myProducts.map(p => (
                <div key={p.productId} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 p-3 hover:bg-white/10 cursor-pointer transition-colors" onClick={() => router.push(`/products/${p.productId}`)}>
                  <div>
                    <p className="font-medium text-white text-sm">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.productId} • Base ₹{p.basePrice?.toLocaleString()}</p>
                  </div>
                  <Badge className={STATUS_COLORS[p.status] || "bg-gray-500/20 text-gray-400"}>{p.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
