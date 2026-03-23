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
import { validatorAPI } from "@/lib/api";
import { Artisan } from "@/lib/types";
import { UserCheck, Plus, Loader2, Upload, MapPin } from "lucide-react";
import { toast } from "sonner";

const VERIFICATION_COLORS: Record<string, string> = {
  PENDING_VERIFICATION: "bg-yellow-500/20 text-yellow-400",
  VERIFIED: "bg-green-500/20 text-green-400",
  REJECTED: "bg-red-500/20 text-red-400",
  FLAGGED_FRAUDULENT: "bg-red-500/20 text-red-400",
};

export default function ArtisansPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", craft: "", location: "", issuedBy: "", craftType: "", region: "" });
  const [certFile, setCertFile] = useState<File | null>(null);

  useEffect(() => {
    if (!isLoading && !user) { router.push("/login"); return; }
    if (user) fetchArtisans();
  }, [user, isLoading]);

  const fetchArtisans = async () => {
    try {
      const res = await validatorAPI.getPending();
      setArtisans(res.data.data || []);
    } catch { /* silent */ }
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      if (certFile) formData.append("giCertificate", certFile);
      await validatorAPI.registerArtisan(formData);
      toast.success("Artisan registered! Pending GI verification.");
      setCreateOpen(false);
      setForm({ name: "", craft: "", location: "", issuedBy: "", craftType: "", region: "" });
      setCertFile(null);
      fetchArtisans();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Registration failed");
    }
    setCreating(false);
  };

  if (isLoading || !user) return <div className="flex h-screen items-center justify-center bg-gray-950"><Loader2 className="h-8 w-8 animate-spin text-amber-500" /></div>;

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Artisans</h1>
          {user.role === "ngo" && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger render={<Button className="bg-gradient-to-r from-amber-500 to-orange-600 text-white" />}>
                <Plus className="mr-2 h-4 w-4" /> Register Artisan
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-white/10 text-white max-w-lg">
                <DialogHeader><DialogTitle>Register New Artisan</DialogTitle></DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label className="text-gray-300">Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="mt-1 bg-gray-800/50 border-white/10 text-white" /></div>
                    <div><Label className="text-gray-300">Craft</Label><Input value={form.craft} onChange={(e) => setForm({ ...form, craft: e.target.value })} required className="mt-1 bg-gray-800/50 border-white/10 text-white" /></div>
                  </div>
                  <div><Label className="text-gray-300">Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required className="mt-1 bg-gray-800/50 border-white/10 text-white" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label className="text-gray-300">Issued By</Label><Input value={form.issuedBy} onChange={(e) => setForm({ ...form, issuedBy: e.target.value })} className="mt-1 bg-gray-800/50 border-white/10 text-white" /></div>
                    <div><Label className="text-gray-300">Region</Label><Input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} className="mt-1 bg-gray-800/50 border-white/10 text-white" /></div>
                  </div>
                  <div><Label className="text-gray-300">GI Certificate</Label><Input type="file" accept="image/*,.pdf" onChange={(e) => setCertFile(e.target.files?.[0] || null)} className="mt-1 bg-gray-800/50 border-white/10 text-white file:text-gray-400" /></div>
                  <Button type="submit" className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white" disabled={creating}>
                    {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                    Register & Upload to IPFS
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-amber-500" /></div>
        ) : artisans.length === 0 ? (
          <div className="text-center py-16 text-gray-500"><UserCheck className="mx-auto h-12 w-12 mb-4 opacity-50" /><p>No artisans registered yet</p></div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {artisans.map((a) => (
              <Card key={a.artisanId} className="bg-gray-900/60 border-white/10 hover:border-white/20 transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-white">{a.name}</h3>
                      <p className="text-xs text-gray-500">{a.artisanId}</p>
                    </div>
                    <Badge className={VERIFICATION_COLORS[a.verificationStatus] || "bg-gray-500/20 text-gray-400"}>{a.verificationStatus.replace(/_/g, " ")}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>🎨 {a.craft}</span>
                    <span className="flex items-center"><MapPin className="h-3 w-3 mr-1" />{a.location}</span>
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
