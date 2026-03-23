"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { validatorAPI } from "@/lib/api";
import { Artisan } from "@/lib/types";
import { Shield, CheckCircle, XCircle, Loader2, ExternalLink, MapPin } from "lucide-react";
import { toast } from "sonner";

export default function VerificationsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [pending, setPending] = useState<Artisan[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) { router.push("/login"); return; }
    if (user && user.role !== "validator") { router.push("/dashboard"); return; }
    if (user) fetchPending();
  }, [user, isLoading]);

  const fetchPending = async () => {
    try {
      const res = await validatorAPI.getPending();
      setPending(res.data.data || []);
    } catch { /* silent */ }
    setLoading(false);
  };

  const handleVerify = async (artisanId: string, isValid: boolean, reason?: string) => {
    setProcessingId(artisanId);
    try {
      await validatorAPI.verify(artisanId, { isValid, reason: reason || "" });
      toast.success(isValid ? `✅ Artisan verified! +1 PT earned` : `❌ Artisan rejected`);
      fetchPending();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Verification failed");
    }
    setProcessingId(null);
  };

  if (isLoading || !user) return <div className="flex h-screen items-center justify-center bg-gray-950"><Loader2 className="h-8 w-8 animate-spin text-amber-500" /></div>;

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Pending Verifications</h1>
          <p className="text-sm text-gray-400 mt-1">Verify artisan GI certificates to earn Parampara Tokens</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-amber-500" /></div>
        ) : pending.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Shield className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No pending verifications</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pending.map((a) => (
              <Card key={a.artisanId} className="bg-gray-900/60 border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{a.name}</h3>
                      <p className="text-sm text-gray-500">{a.artisanId}</p>
                    </div>
                    <Badge className="bg-yellow-500/20 text-yellow-400">PENDING</Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                    <div><span className="text-gray-500">Craft</span><p className="text-white">🎨 {a.craft}</p></div>
                    <div><span className="text-gray-500">Location</span><p className="text-white flex items-center"><MapPin className="h-3 w-3 mr-1" />{a.location}</p></div>
                    <div><span className="text-gray-500">Registered By</span><p className="text-white">{a.registeredBy?.name || "—"}</p></div>
                    <div>
                      <span className="text-gray-500">GI Certificate</span>
                      {a.giCertificateCID ? (
                        <a href={`https://gateway.pinata.cloud/ipfs/${a.giCertificateCID}`} target="_blank" rel="noreferrer" className="flex items-center text-amber-400 hover:text-amber-300">
                          View <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      ) : <p className="text-gray-500">Not uploaded</p>}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={() => handleVerify(a.artisanId, true)} disabled={processingId === a.artisanId}
                      className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600">
                      {processingId === a.artisanId ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                      Approve (+1 PT)
                    </Button>
                    <Button onClick={() => handleVerify(a.artisanId, false, "GI certificate invalid")} disabled={processingId === a.artisanId}
                      variant="outline" className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10">
                      <XCircle className="mr-2 h-4 w-4" /> Reject
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
