"use client";

import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { scanAPI } from "@/lib/api";
import { ScanResult, STATUS_COLORS } from "@/lib/types";
import { QrCode, Search, AlertTriangle, MapPin, Package, Loader2, Shield, Clock } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

export default function ScanPage() {
  const { user } = useAuth();
  const [productId, setProductId] = useState("");
  const [location, setLocation] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId.trim()) { toast.error("Enter a product ID"); return; }
    setLoading(true);
    try {
      const res = await scanAPI.scan({ productId: productId.trim(), location });
      setResult(res.data.data);
      toast.success("Product scanned!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Scan failed");
      setResult(null);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {user && <Navbar />}
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25">
            <QrCode className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Scan Product</h1>
          <p className="text-gray-400 text-sm mt-1">Enter a product ID to view its complete journey</p>
        </div>

        <Card className="bg-gray-900/60 border-white/10 mb-6">
          <CardContent className="p-6">
            <form onSubmit={handleScan} className="flex gap-3">
              <Input placeholder="PROD-XXXXXXXX" value={productId} onChange={(e) => setProductId(e.target.value)} className="flex-1 bg-gray-800/50 border-white/10 text-white placeholder:text-gray-500 text-lg" />
              <Button type="submit" className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-6" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Result */}
        {result && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Fraud Alert */}
            {result.fraudAlert && (
              <Card className="bg-red-500/10 border-red-500/30">
                <CardContent className="p-4 flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-red-400">⚠️ Fraud Alert — {result.fraudAlert.severity}</p>
                    {result.fraudAlert.reasons.map((r, i) => <p key={i} className="text-sm text-red-300">{r}</p>)}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Product Info */}
            <Card className="bg-gray-900/60 border-white/10">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-white">{result.product.name}</CardTitle>
                  <Badge className={STATUS_COLORS[result.product.status] || "bg-gray-500/20 text-gray-400"}>{result.product.status}</Badge>
                </div>
                <p className="text-sm text-gray-500">{result.product.productId}</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-gray-500">Base Price</span><p className="font-semibold text-white">₹{result.product.basePrice?.toLocaleString()}</p></div>
                  <div><span className="text-gray-500">Current Price</span><p className="font-semibold text-amber-400">₹{result.product.currentPrice?.toLocaleString()}</p></div>
                  <div><span className="text-gray-500">Artisan</span><p className="font-semibold text-white">{result.product.artisanId}</p></div>
                  <div><span className="text-gray-500">Current Holder</span><p className="font-semibold text-white">{result.product.currentOwnerOrg}</p></div>
                </div>
              </CardContent>
            </Card>

            {/* Journey */}
            {result.journey && result.journey.length > 0 && (
              <Card className="bg-gray-900/60 border-white/10">
                <CardHeader><CardTitle className="text-white text-lg">Full Journey</CardTitle></CardHeader>
                <CardContent>
                  <div className="relative ml-4">
                    <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-amber-500 to-transparent" />
                    {result.journey.map((entry, i) => (
                      <div key={i} className="relative pl-8 pb-6 last:pb-0">
                        <div className={`absolute left-0 top-1 w-2.5 h-2.5 rounded-full -translate-x-[5px] ${entry.isReturn ? "bg-orange-500" : "bg-amber-500"}`} />
                        <div className="flex items-center justify-between">
                          <div>
                            <Badge className={entry.isReturn ? "bg-orange-500/20 text-orange-400" : "bg-amber-500/20 text-amber-400"} >{entry.stage}</Badge>
                            <span className="ml-2 text-sm text-gray-400">{entry.org}</span>
                          </div>
                          <span className="text-xs text-gray-500 flex items-center"><Clock className="h-3 w-3 mr-1" />{new Date(entry.timestamp).toLocaleDateString()}</span>
                        </div>
                        {entry.location && <p className="text-xs text-gray-500 mt-1 flex items-center"><MapPin className="h-3 w-3 mr-1" />{entry.location}</p>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
