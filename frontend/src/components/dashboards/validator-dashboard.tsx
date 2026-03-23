"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { tokenAPI, validatorAPI } from "@/lib/api";
import { TokenBalance, TokenTransaction, Artisan } from "@/lib/types";
import {
  Shield, Coins, ArrowUp, AlertTriangle, Banknote,
  CheckCircle, XCircle, ArrowUpRight, Loader2
} from "lucide-react";

const TX_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  EARNED: { icon: ArrowUp, color: "text-green-400" },
  PENALTY: { icon: AlertTriangle, color: "text-red-400" },
  REDEEMED: { icon: Banknote, color: "text-blue-400" },
};

export function ValidatorDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [balance, setBalance] = useState<TokenBalance | null>(null);
  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
  const [pending, setPending] = useState<Artisan[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [balRes, txRes, pendRes] = await Promise.all([
        tokenAPI.getBalance().catch(() => ({ data: { data: null } })),
        tokenAPI.getTransactions().catch(() => ({ data: { data: [] } })),
        validatorAPI.getPending().catch(() => ({ data: { data: [] } })),
      ]);
      setBalance(balRes.data.data);
      setTransactions(txRes.data.data || []);
      setPending(pendRes.data.data || []);
    } catch { /* silent */ }
    setLoading(false);
  };

  const handleVerify = async (artisanId: string, isValid: boolean) => {
    setProcessingId(artisanId);
    try {
      await validatorAPI.verify(artisanId, { isValid, reason: isValid ? "" : "GI certificate invalid" });
      fetchData();
    } catch { /* silent */ }
    setProcessingId(null);
  };

  if (!user) return null;

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Validator Dashboard</h1>
        <p className="text-gray-400 mt-1">Welcome, {user.name} — verify artisan credentials & earn PT</p>
      </div>

      {/* Token Balance Hero */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <Card className="md:col-span-2 bg-gradient-to-br from-amber-500/20 to-orange-500/10 border-amber-500/30">
          <CardContent className="p-6 flex items-center gap-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25">
              <Coins className="h-8 w-8 text-white" />
            </div>
            <div>
              <p className="text-sm text-amber-400">Token Balance</p>
              <p className="text-4xl font-bold text-white">{loading ? "—" : (balance?.balance || 0)} PT</p>
              <p className="text-sm text-gray-400">= ₹{loading ? "—" : (balance?.valueInINR || 0)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/60 border-white/10">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-gray-500">Total Earned</p>
            <p className="text-3xl font-bold text-green-400 mt-1">{loading ? "—" : (balance?.totalEarned || 0)}</p>
            <p className="text-xs text-gray-500 mt-1">PT</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/60 border-white/10">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-gray-500">Pending Reviews</p>
            <p className="text-3xl font-bold text-yellow-400 mt-1">{loading ? "—" : pending.length}</p>
            <p className="text-xs text-gray-500 mt-1">artisans</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pending Verifications (inline) */}
        <Card className="bg-gray-900/60 border-white/10">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Pending Verifications</CardTitle>
            <button onClick={() => router.push("/verifications")} className="text-sm text-amber-400 hover:text-amber-300 flex items-center gap-1">
              View all <ArrowUpRight className="h-3 w-3" />
            </button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-amber-500" /></div>
            ) : pending.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <Shield className="mx-auto h-10 w-10 mb-2 opacity-50" />
                <p className="text-sm">No pending verifications</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pending.slice(0, 4).map(a => (
                  <div key={a.artisanId} className="rounded-lg border border-white/5 bg-white/5 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-white text-sm">{a.name}</p>
                        <p className="text-xs text-gray-500">🎨 {a.craft} • 📍 {a.location}</p>
                      </div>
                      <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">PENDING</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleVerify(a.artisanId, true)} disabled={processingId === a.artisanId}
                        className="flex-1 h-8 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border-0">
                        <CheckCircle className="mr-1 h-3 w-3" /> Approve
                      </Button>
                      <Button size="sm" onClick={() => handleVerify(a.artisanId, false)} disabled={processingId === a.artisanId}
                        variant="outline" className="flex-1 h-8 border-red-500/20 text-red-400 hover:bg-red-500/10">
                        <XCircle className="mr-1 h-3 w-3" /> Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Token Transactions */}
        <Card className="bg-gray-900/60 border-white/10">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Token Activity</CardTitle>
            <button onClick={() => router.push("/tokens")} className="text-sm text-amber-400 hover:text-amber-300 flex items-center gap-1">
              Manage <ArrowUpRight className="h-3 w-3" />
            </button>
          </CardHeader>
          <CardContent>
            {loading || transactions.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <Coins className="mx-auto h-10 w-10 mb-2 opacity-50" />
                <p className="text-sm">No transactions yet — verify artisans to earn PT</p>
              </div>
            ) : (
              <div className="space-y-2">
                {transactions.slice(0, 5).map((tx, i) => {
                  const info = TX_ICONS[tx.type] || TX_ICONS.EARNED;
                  return (
                    <div key={i} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 p-3">
                      <div className="flex items-center gap-2">
                        <div className={`flex h-7 w-7 items-center justify-center rounded-full bg-white/10 ${info.color}`}>
                          <info.icon className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <p className="text-sm text-white">{tx.reason}</p>
                          <p className="text-xs text-gray-500">{new Date(tx.timestamp).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className={`font-bold text-sm ${info.color}`}>
                        {tx.type === "EARNED" ? "+" : "-"}{tx.amount} PT
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Value Info */}
      <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-center gap-3">
        <Coins className="h-5 w-5 text-amber-400 flex-shrink-0" />
        <div>
          <p className="text-sm text-amber-400 font-medium">1 PT = ₹10</p>
          <p className="text-xs text-gray-400">Earn +1 PT per correct verification. Wrong validations = -2 PT penalty.</p>
        </div>
      </div>
    </main>
  );
}
