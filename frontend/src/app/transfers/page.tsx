"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { productAPI, transferAPI, lifecycleAPI } from "@/lib/api";
import { Product, STATUS_COLORS } from "@/lib/types";
import { ArrowLeftRight, Loader2, Package } from "lucide-react";
import { toast } from "sonner";

const NEXT_ORG: Record<string, string> = {
  WarehouseOrg: "DistributorOrg",
  DistributorOrg: "RetailerOrg",
  RetailerOrg: "CustomerOrg",
};

export default function TransfersPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [transferringId, setTransferringId] = useState<string | null>(null);
  const [marginValues, setMarginValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isLoading && !user) { router.push("/login"); return; }
    if (user) fetchMyProducts();
  }, [user, isLoading]);

  const fetchMyProducts = async () => {
    try {
      const res = await productAPI.getAll({ org: user!.org });
      setProducts((res.data.data || []).filter((p: Product) => !p.isRetired));
    } catch { /* silent */ }
    setLoading(false);
  };

  const handleAddMarginAndTransfer = async (product: Product) => {
    if (!user) return;
    const nextOrg = NEXT_ORG[user.org];
    if (!nextOrg) { toast.error("No next org in supply chain"); return; }

    const margin = parseFloat(marginValues[product.productId] || "0");
    setTransferringId(product.productId);

    try {
      // Add lifecycle stage + margin
      if (margin > 0) {
        const formData = new FormData();
        formData.append("productId", product.productId);
        formData.append("stage", `${user.org.replace("Org", "").toUpperCase()}_PROCESSED`);
        formData.append("marginValue", String(margin));
        formData.append("location", user.location || "");
        await lifecycleAPI.addStage(formData);
      }

      // Transfer to next org
      await transferAPI.transfer({ productId: product.productId, toOrg: nextOrg });
      toast.success(`Transferred to ${nextOrg}${margin > 0 ? ` (+₹${margin} margin)` : ""}`);
      fetchMyProducts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Transfer failed");
    }
    setTransferringId(null);
  };

  if (isLoading || !user) return <div className="flex h-screen items-center justify-center bg-gray-950"><Loader2 className="h-8 w-8 animate-spin text-amber-500" /></div>;

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-white mb-2">Transfers</h1>
        <p className="text-sm text-gray-400 mb-6">{user.org} → {NEXT_ORG[user.org] || "End of chain"}</p>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-amber-500" /></div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 text-gray-500"><Package className="mx-auto h-12 w-12 mb-4 opacity-50" /><p>No products currently with your org</p></div>
        ) : (
          <div className="space-y-4">
            {products.map((p) => (
              <Card key={p.productId} className="bg-gray-900/60 border-white/10">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-white">{p.name}</h3>
                      <p className="text-xs text-gray-500">{p.productId}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-amber-400">₹{p.currentPrice.toLocaleString()}</p>
                      <Badge className={STATUS_COLORS[p.status] || "bg-gray-500/20 text-gray-400"}>{p.status}</Badge>
                    </div>
                  </div>
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <Label className="text-xs text-gray-500">Add Margin (₹)</Label>
                      <Input type="number" min="0" placeholder="0" value={marginValues[p.productId] || ""}
                        onChange={(e) => setMarginValues({ ...marginValues, [p.productId]: e.target.value })}
                        className="mt-1 bg-gray-800/50 border-white/10 text-white" />
                    </div>
                    <Button onClick={() => handleAddMarginAndTransfer(p)} disabled={transferringId === p.productId}
                      className="bg-gradient-to-r from-amber-500 to-orange-600 text-white">
                      {transferringId === p.productId ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowLeftRight className="mr-2 h-4 w-4" />}
                      Transfer to {NEXT_ORG[user.org]?.replace("Org", "")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
