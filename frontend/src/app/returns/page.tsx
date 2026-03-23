"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { returnAPI } from "@/lib/api";
import { ReturnRecord } from "@/lib/types";
import { RotateCcw, Loader2, Check, Wrench } from "lucide-react";
import { toast } from "sonner";

const STATUS_COLORS_RETURN: Record<string, string> = {
  INITIATED: "bg-yellow-500/20 text-yellow-400",
  IN_TRANSIT: "bg-blue-500/20 text-blue-400",
  RECEIVED_BY_WAREHOUSE: "bg-purple-500/20 text-purple-400",
  REPAIRED: "bg-green-500/20 text-green-400",
  REJECTED: "bg-red-500/20 text-red-400",
};

export default function ReturnsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) { router.push("/login"); return; }
    if (user && user.role !== "warehouse") { router.push("/dashboard"); return; }
    if (user) fetchReturns();
  }, [user, isLoading]);

  const fetchReturns = async () => {
    // Warehouse can view returns for products they have
    // For now, we use a placeholder approach
    setLoading(false);
  };

  const handleReceive = async (returnId: string) => {
    setProcessingId(returnId);
    try {
      await returnAPI.receive(returnId);
      toast.success("Return received at warehouse");
      fetchReturns();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed");
    }
    setProcessingId(null);
  };

  const handleRepair = async (returnId: string) => {
    setProcessingId(returnId);
    try {
      await returnAPI.repair(returnId, { notes: "Inspected and repaired" });
      toast.success("Product repaired and ready for re-distribution");
      fetchReturns();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed");
    }
    setProcessingId(null);
  };

  if (isLoading || !user) return <div className="flex h-screen items-center justify-center bg-gray-950"><Loader2 className="h-8 w-8 animate-spin text-amber-500" /></div>;

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">Return Management</h1>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-amber-500" /></div>
        ) : returns.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <RotateCcw className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No pending returns</p>
            <p className="text-xs mt-2">Returns will appear here when customers initiate them</p>
          </div>
        ) : (
          <div className="space-y-4">
            {returns.map((r) => (
              <Card key={r.returnId} className="bg-gray-900/60 border-white/10">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-white">{r.returnId}</h3>
                      <p className="text-xs text-gray-500">Product: {r.productId} • Return #{r.returnNumber}</p>
                    </div>
                    <Badge className={STATUS_COLORS_RETURN[r.status] || "bg-gray-500/20 text-gray-400"}>{r.status}</Badge>
                  </div>
                  <p className="text-sm text-gray-400 mb-4">Reason: {r.reason}</p>
                  <div className="flex gap-3">
                    {r.status === "INITIATED" && (
                      <Button onClick={() => handleReceive(r.returnId)} disabled={processingId === r.returnId} className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                        {processingId === r.returnId ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                        Mark Received
                      </Button>
                    )}
                    {r.status === "RECEIVED_BY_WAREHOUSE" && (
                      <Button onClick={() => handleRepair(r.returnId)} disabled={processingId === r.returnId} className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                        {processingId === r.returnId ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wrench className="mr-2 h-4 w-4" />}
                        Repair & Release
                      </Button>
                    )}
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
