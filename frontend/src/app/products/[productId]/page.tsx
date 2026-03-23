"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { productAPI, lifecycleAPI, feedbackAPI } from "@/lib/api";
import { Product, LifecycleEntry, PriceBreakdown, STATUS_COLORS } from "@/lib/types";
import { Package, ArrowRight, Clock, MapPin, DollarSign, QrCode, Shield, Star, Loader2 } from "lucide-react";

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.productId as string;
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [breakdown, setBreakdown] = useState<PriceBreakdown | null>(null);
  const [journey, setJourney] = useState<LifecycleEntry[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrCode, setQrCode] = useState("");

  useEffect(() => {
    if (!isLoading && !user) { router.push("/login"); return; }
    if (user) fetchAll();
  }, [user, isLoading]);

  const fetchAll = async () => {
    try {
      const [prodRes, journeyRes, feedbackRes] = await Promise.all([
        productAPI.getById(productId),
        lifecycleAPI.getJourney(productId).catch(() => ({ data: { data: [] } })),
        feedbackAPI.getByProduct(productId).catch(() => ({ data: { data: { feedbacks: [], stats: { average: 0, count: 0 } } } })),
      ]);
      setProduct(prodRes.data.data.product);
      setBreakdown(prodRes.data.data.priceBreakdown);
      setJourney(journeyRes.data.data || []);
      setFeedbacks(feedbackRes.data.data?.feedbacks || []);
    } catch { /* silent */ }
    setLoading(false);
  };

  const fetchQR = async () => {
    try {
      const res = await productAPI.getQR(productId);
      setQrCode(res.data.data.dataUrl);
    } catch { /* silent */ }
  };

  if (isLoading || loading || !user) return <div className="flex h-screen items-center justify-center bg-gray-950"><Loader2 className="h-8 w-8 animate-spin text-amber-500" /></div>;
  if (!product) return <div className="flex h-screen items-center justify-center bg-gray-950 text-gray-500">Product not found</div>;

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">{product.name}</h1>
            <p className="text-sm text-gray-500 mt-1">{product.productId} • Artisan: {product.artisanId}</p>
          </div>
          <Badge className={`text-sm px-3 py-1 ${STATUS_COLORS[product.status] || "bg-gray-500/20 text-gray-400"}`}>{product.status}</Badge>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-gray-900/60 border border-white/10">
            <TabsTrigger value="overview" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">Overview</TabsTrigger>
            <TabsTrigger value="journey" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">Journey</TabsTrigger>
            <TabsTrigger value="pricing" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">Pricing</TabsTrigger>
            <TabsTrigger value="feedback" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">Feedback</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-gray-900/60 border-white/10">
                <CardHeader><CardTitle className="text-white text-lg">Product Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {product.description && <p className="text-gray-400">{product.description}</p>}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-gray-500">Base Price</span><p className="font-semibold text-white">₹{product.basePrice.toLocaleString()}</p></div>
                    <div><span className="text-gray-500">Current Price</span><p className="font-semibold text-amber-400">₹{product.currentPrice.toLocaleString()}</p></div>
                    <div><span className="text-gray-500">Current Owner</span><p className="font-semibold text-white">{product.currentOwnerOrg}</p></div>
                    <div><span className="text-gray-500">Returns</span><p className="font-semibold text-white">{product.returnCount}/3</p></div>
                  </div>
                  {product.isRetired && <Badge className="bg-red-500/20 text-red-400 mt-2">⚠️ RETIRED</Badge>}
                </CardContent>
              </Card>

              <Card className="bg-gray-900/60 border-white/10">
                <CardHeader><CardTitle className="text-white text-lg">QR Code</CardTitle></CardHeader>
                <CardContent className="flex flex-col items-center">
                  {qrCode ? (
                    <img src={qrCode} alt="QR Code" className="w-48 h-48 rounded-lg" />
                  ) : (
                    <Button onClick={fetchQR} variant="outline" className="border-white/10 text-gray-400 hover:text-white">
                      <QrCode className="mr-2 h-4 w-4" /> Generate QR
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Journey */}
          <TabsContent value="journey">
            <Card className="bg-gray-900/60 border-white/10">
              <CardHeader><CardTitle className="text-white text-lg">Product Journey</CardTitle></CardHeader>
              <CardContent>
                {journey.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">No lifecycle entries yet</p>
                ) : (
                  <div className="relative ml-4">
                    <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-amber-500 to-transparent" />
                    {journey.map((entry, i) => (
                      <div key={i} className="relative pl-8 pb-8 last:pb-0">
                        <div className={`absolute left-0 top-1 w-2.5 h-2.5 rounded-full -translate-x-[5px] ${entry.isReturn ? "bg-orange-500" : "bg-amber-500"}`} />
                        <div className="rounded-lg border border-white/5 bg-white/5 p-4">
                          <div className="flex items-center justify-between mb-1">
                            <Badge className={entry.isReturn ? "bg-orange-500/20 text-orange-400" : "bg-amber-500/20 text-amber-400"}>{entry.stage}</Badge>
                            <span className="text-xs text-gray-500">{new Date(entry.timestamp).toLocaleDateString()}</span>
                          </div>
                          <p className="text-sm text-gray-300">{entry.org}</p>
                          {entry.location && <p className="text-xs text-gray-500 mt-1 flex items-center"><MapPin className="h-3 w-3 mr-1" />{entry.location}</p>}
                          {entry.marginAdded > 0 && <p className="text-xs text-amber-400 mt-1">+₹{entry.marginAdded} margin → ₹{entry.priceAtStage}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pricing */}
          <TabsContent value="pricing">
            <Card className="bg-gray-900/60 border-white/10">
              <CardHeader><CardTitle className="text-white text-lg">Price Breakdown</CardTitle></CardHeader>
              <CardContent>
                {!breakdown ? <p className="text-gray-500">No pricing data</p> : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                      <span className="text-gray-400">Base Price (Artisan)</span>
                      <span className="font-bold text-white">₹{breakdown.basePrice.toLocaleString()}</span>
                    </div>
                    {breakdown.margins.map((m, i) => (
                      <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                        <span className="text-gray-400">{m.org} margin ({m.percentage}%)</span>
                        <span className="font-semibold text-amber-400">+₹{m.value.toLocaleString()}</span>
                      </div>
                    ))}
                    <Separator className="bg-white/10" />
                    <div className="flex justify-between items-center p-3 rounded-lg bg-amber-500/10">
                      <span className="font-bold text-white">Final Price</span>
                      <span className="text-xl font-bold text-amber-400">₹{breakdown.finalPrice.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Feedback */}
          <TabsContent value="feedback">
            <Card className="bg-gray-900/60 border-white/10">
              <CardHeader><CardTitle className="text-white text-lg">Customer Feedback</CardTitle></CardHeader>
              <CardContent>
                {feedbacks.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">No feedback yet</p>
                ) : (
                  <div className="space-y-3">
                    {feedbacks.map((f: any, i: number) => (
                      <div key={i} className="rounded-lg border border-white/5 bg-white/5 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          {Array.from({ length: 5 }).map((_, j) => (
                            <Star key={j} className={`h-4 w-4 ${j < f.rating ? "fill-amber-400 text-amber-400" : "text-gray-600"}`} />
                          ))}
                        </div>
                        {f.comment && <p className="text-sm text-gray-300">{f.comment}</p>}
                        <p className="text-xs text-gray-500 mt-2">{new Date(f.timestamp).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
