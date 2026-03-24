"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Navbar } from "@/components/navbar";
import { CameraCapture } from "@/components/CameraCapture";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { productAPI } from "@/lib/api";
import { Product, STATUS_COLORS } from "@/lib/types";
import { Package, Plus, Search, Loader2, ArrowRight, Camera } from "lucide-react";
import { toast } from "sonner";

export default function ProductsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: "", description: "", artisanId: "", basePrice: "" });
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!isLoading && !user) { router.push("/login"); return; }
    if (user) fetchProducts();
  }, [user, isLoading, page]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await productAPI.getAll({ page, limit: 12 });
      setProducts(res.data.data || []);
      setTotalPages(res.data.pagination?.pages || 1);
    } catch { toast.error("Failed to fetch products"); }
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const formData = new FormData();
      formData.append("name", newProduct.name);
      formData.append("description", newProduct.description);
      formData.append("artisanId", newProduct.artisanId);
      formData.append("basePrice", newProduct.basePrice);
      if (imageBlob) formData.append("image", imageBlob, "camera-capture.jpg");
      await productAPI.create(formData);
      toast.success("Product registered on blockchain!");
      setCreateOpen(false);
      setNewProduct({ name: "", description: "", artisanId: "", basePrice: "" });
      setImageBlob(null);
      setShowCamera(false);
      fetchProducts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create product");
    }
    setCreating(false);
  };

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.productId.toLowerCase().includes(search.toLowerCase()));

  if (isLoading || !user) return <div className="flex h-screen items-center justify-center bg-gray-950"><Loader2 className="h-8 w-8 animate-spin text-amber-500" /></div>;

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Products</h1>
          {user.role === "ngo" && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger render={<Button className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white" />}>
                  <Plus className="mr-2 h-4 w-4" /> Register Product
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-white/10 text-white">
                <DialogHeader><DialogTitle>Register New Product</DialogTitle></DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div><Label className="text-gray-300">Product Name</Label><Input placeholder="Handloom Saree" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} required className="mt-1 bg-gray-800/50 border-white/10 text-white" /></div>
                  <div><Label className="text-gray-300">Description</Label><Input placeholder="Describe the product" value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} className="mt-1 bg-gray-800/50 border-white/10 text-white" /></div>
                  <div><Label className="text-gray-300">Artisan ID</Label><Input placeholder="ART-XXXXXXXX" value={newProduct.artisanId} onChange={(e) => setNewProduct({ ...newProduct, artisanId: e.target.value })} required className="mt-1 bg-gray-800/50 border-white/10 text-white" /></div>
                  <div><Label className="text-gray-300">Base Price (₹)</Label><Input type="number" min="1" placeholder="1500" value={newProduct.basePrice} onChange={(e) => setNewProduct({ ...newProduct, basePrice: e.target.value })} required className="mt-1 bg-gray-800/50 border-white/10 text-white" /></div>
                  <div>
                    <Label className="text-gray-300">Product Image</Label>
                    {showCamera ? (
                      <div className="mt-2">
                        <CameraCapture
                          onCapture={(blob) => { setImageBlob(blob); setShowCamera(false); toast.success("Photo captured!"); }}
                          onCancel={() => setShowCamera(false)}
                        />
                      </div>
                    ) : (
                      <div className="mt-2">
                        {imageBlob ? (
                          <div className="flex items-center gap-3">
                            <div className="flex-1 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-sm text-emerald-400">📸 Photo captured</div>
                            <Button type="button" variant="outline" size="sm" onClick={() => setShowCamera(true)} className="border-white/10 text-gray-300">
                              Retake
                            </Button>
                          </div>
                        ) : (
                          <Button type="button" onClick={() => setShowCamera(true)} variant="outline" className="w-full mt-1 border-dashed border-white/20 text-gray-400 hover:bg-gray-800 hover:text-white">
                            <Camera className="mr-2 h-4 w-4" /> Open Camera to Capture
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                  <Button type="submit" className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white" disabled={creating}>
                    {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Package className="mr-2 h-4 w-4" />}
                    Register on Blockchain
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-gray-900/60 border-white/10 text-white placeholder:text-gray-500" />
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-amber-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500"><Package className="mx-auto h-12 w-12 mb-4 opacity-50" /><p>No products found</p></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p) => (
              <Card key={p.productId} className="bg-gray-900/60 border-white/10 hover:border-white/20 transition-all cursor-pointer group" onClick={() => router.push(`/products/${p.productId}`)}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-white group-hover:text-amber-400 transition-colors">{p.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{p.productId}</p>
                    </div>
                    <Badge className={STATUS_COLORS[p.status] || "bg-gray-500/20 text-gray-400"}>{p.status}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Base ₹{p.basePrice.toLocaleString()}</p>
                      <p className="text-lg font-bold text-amber-400">₹{p.currentPrice.toLocaleString()}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-600 group-hover:text-amber-500 transition-colors" />
                  </div>
                  {p.returnCount > 0 && <Badge variant="outline" className="mt-2 border-orange-500/30 text-orange-400 text-xs">Returns: {p.returnCount}/3</Badge>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)} className="border-white/10 text-gray-400">Previous</Button>
            <span className="flex items-center text-sm text-gray-500">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="border-white/10 text-gray-400">Next</Button>
          </div>
        )}
      </main>
    </div>
  );
}
