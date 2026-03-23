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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { productAPI, orderAPI, returnAPI, feedbackAPI } from "@/lib/api";
import { Product, STATUS_COLORS } from "@/lib/types";
import { ShoppingBag, ShoppingCart, Loader2, RotateCcw, Star, MessageSquare } from "lucide-react";
import { toast } from "sonner";

export default function OrdersPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [returningId, setReturningId] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState("");
  const [returnDialogProduct, setReturnDialogProduct] = useState<string | null>(null);
  const [feedbackDialogProduct, setFeedbackDialogProduct] = useState<string | null>(null);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) { router.push("/login"); return; }
    if (user) fetchProducts();
  }, [user, isLoading]);

  const fetchProducts = async () => {
    try {
      const res = await productAPI.getAll({});
      setProducts(res.data.data || []);
    } catch { /* silent */ }
    setLoading(false);
  };

  const handleBuy = async (productId: string) => {
    setBuyingId(productId);
    try {
      await orderAPI.create({ productId });
      toast.success("Product purchased! Ownership transferred on blockchain.");
      fetchProducts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Purchase failed");
    }
    setBuyingId(null);
  };

  const handleReturn = async () => {
    if (!returnDialogProduct || !returnReason) return;
    setReturningId(returnDialogProduct);
    try {
      const formData = new FormData();
      formData.append("productId", returnDialogProduct);
      formData.append("reason", returnReason);
      await returnAPI.initiate(formData);
      toast.success("Return initiated! Product sent to warehouse.");
      setReturnDialogProduct(null);
      setReturnReason("");
      fetchProducts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Return failed");
    }
    setReturningId(null);
  };

  const handleFeedback = async () => {
    if (!feedbackDialogProduct) return;
    setSubmittingFeedback(true);
    try {
      const formData = new FormData();
      formData.append("productId", feedbackDialogProduct);
      formData.append("rating", String(feedbackRating));
      formData.append("comment", feedbackComment);
      await feedbackAPI.submit(formData);
      toast.success("Feedback submitted on blockchain!");
      setFeedbackDialogProduct(null);
      setFeedbackComment("");
      setFeedbackRating(5);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Feedback failed");
    }
    setSubmittingFeedback(false);
  };

  if (isLoading || !user) return <div className="flex h-screen items-center justify-center bg-gray-950"><Loader2 className="h-8 w-8 animate-spin text-amber-500" /></div>;

  const availableProducts = products.filter((p) => p.status === "IN_RETAIL");
  const myProducts = products.filter((p) => p.currentOwnerOrg === "CustomerOrg");

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">My Orders</h1>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-amber-500" /></div>
        ) : (
          <>
            {/* My purchased products */}
            {myProducts.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-white mb-4">Purchased Products</h2>
                <div className="space-y-4">
                  {myProducts.map((p) => (
                    <Card key={p.productId} className="bg-gray-900/60 border-white/10">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-white">{p.name}</h3>
                            <p className="text-xs text-gray-500">{p.productId}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-amber-400">₹{p.currentPrice.toLocaleString()}</p>
                            <Badge className={STATUS_COLORS[p.status] || "bg-gray-500/20 text-gray-400"}>{p.status}</Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {(p.status === "SOLD" || p.status === "DELIVERED") && !p.isRetired && p.returnCount < 3 && (
                            <Dialog open={returnDialogProduct === p.productId} onOpenChange={(open) => { if (!open) setReturnDialogProduct(null); }}>
                              <DialogTrigger render={<Button variant="outline" size="sm" className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10" onClick={() => setReturnDialogProduct(p.productId)} />}>
                                  <RotateCcw className="mr-1 h-3 w-3" /> Return ({p.returnCount}/3)
                              </DialogTrigger>
                              <DialogContent className="bg-gray-900 border-white/10 text-white">
                                <DialogHeader><DialogTitle>Return Product</DialogTitle></DialogHeader>
                                <div className="space-y-4">
                                  <div><Label className="text-gray-300">Reason for return</Label><Input placeholder="Describe the issue..." value={returnReason} onChange={(e) => setReturnReason(e.target.value)} className="mt-1 bg-gray-800/50 border-white/10 text-white" /></div>
                                  <Button onClick={handleReturn} className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white" disabled={returningId === p.productId}>
                                    {returningId === p.productId ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
                                    Initiate Return
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                          <Dialog open={feedbackDialogProduct === p.productId} onOpenChange={(open) => { if (!open) setFeedbackDialogProduct(null); }}>
                            <DialogTrigger render={<Button variant="outline" size="sm" className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10" onClick={() => setFeedbackDialogProduct(p.productId)} />}>
                                <Star className="mr-1 h-3 w-3" /> Feedback
                            </DialogTrigger>
                            <DialogContent className="bg-gray-900 border-white/10 text-white">
                              <DialogHeader><DialogTitle>Submit Feedback</DialogTitle></DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label className="text-gray-300">Rating</Label>
                                  <div className="flex gap-1 mt-2">
                                    {[1, 2, 3, 4, 5].map((r) => (
                                      <button key={r} onClick={() => setFeedbackRating(r)} className="p-1">
                                        <Star className={`h-6 w-6 ${r <= feedbackRating ? "fill-amber-400 text-amber-400" : "text-gray-600"}`} />
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <div><Label className="text-gray-300">Comment</Label><Input placeholder="Your review..." value={feedbackComment} onChange={(e) => setFeedbackComment(e.target.value)} className="mt-1 bg-gray-800/50 border-white/10 text-white" /></div>
                                <Button onClick={handleFeedback} className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white" disabled={submittingFeedback}>
                                  {submittingFeedback ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageSquare className="mr-2 h-4 w-4" />}
                                  Submit on Blockchain
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Available to purchase */}
            <h2 className="text-lg font-semibold text-white mb-4">Available for Purchase</h2>
            {availableProducts.length === 0 ? (
              <div className="text-center py-12 text-gray-500"><ShoppingBag className="mx-auto h-12 w-12 mb-4 opacity-50" /><p>No products available to buy right now</p></div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {availableProducts.map((p) => (
                  <Card key={p.productId} className="bg-gray-900/60 border-white/10 hover:border-white/20 transition-all">
                    <CardContent className="p-5">
                      <h3 className="font-semibold text-white mb-1">{p.name}</h3>
                      <p className="text-xs text-gray-500 mb-3">{p.productId}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-lg font-bold text-amber-400">₹{p.currentPrice.toLocaleString()}</p>
                        <Button onClick={() => handleBuy(p.productId)} disabled={buyingId === p.productId} size="sm"
                          className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                          {buyingId === p.productId ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <ShoppingCart className="mr-1 h-3 w-3" />}
                          Buy
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
