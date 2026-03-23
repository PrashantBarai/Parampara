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
import { tokenAPI } from "@/lib/api";
import { TokenBalance, TokenTransaction } from "@/lib/types";
import { Coins, ArrowDown, ArrowUp, AlertTriangle, Loader2, Banknote } from "lucide-react";
import { toast } from "sonner";

const TX_COLORS: Record<string, { icon: React.ElementType; color: string; prefix: string }> = {
  EARNED: { icon: ArrowUp, color: "text-green-400", prefix: "+" },
  PENALTY: { icon: AlertTriangle, color: "text-red-400", prefix: "-" },
  REDEEMED: { icon: ArrowDown, color: "text-blue-400", prefix: "-" },
};

export default function TokensPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [balance, setBalance] = useState<TokenBalance | null>(null);
  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeemOpen, setRedeemOpen] = useState(false);
  const [redeemAmount, setRedeemAmount] = useState("");
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) { router.push("/login"); return; }
    if (user && user.role !== "validator") { router.push("/dashboard"); return; }
    if (user) fetchData();
  }, [user, isLoading]);

  const fetchData = async () => {
    try {
      const [balRes, txRes] = await Promise.all([tokenAPI.getBalance(), tokenAPI.getTransactions()]);
      setBalance(balRes.data.data);
      setTransactions(txRes.data.data || []);
    } catch { /* silent */ }
    setLoading(false);
  };

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    setRedeeming(true);
    try {
      const res = await tokenAPI.redeem({ amount: parseInt(redeemAmount) });
      toast.success(`Redeemed ${redeemAmount} PT for ₹${parseInt(redeemAmount) * 10}!`);
      setRedeemOpen(false);
      setRedeemAmount("");
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Redeem failed");
    }
    setRedeeming(false);
  };

  if (isLoading || !user) return <div className="flex h-screen items-center justify-center bg-gray-950"><Loader2 className="h-8 w-8 animate-spin text-amber-500" /></div>;

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">Parampara Tokens</h1>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-amber-500" /></div>
        ) : (
          <>
            {/* Balance Cards */}
            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              <Card className="bg-gradient-to-br from-amber-500/20 to-orange-500/10 border-amber-500/30">
                <CardContent className="p-5 text-center">
                  <Coins className="mx-auto h-8 w-8 text-amber-400 mb-2" />
                  <p className="text-3xl font-bold text-white">{balance?.balance || 0} PT</p>
                  <p className="text-sm text-amber-400 mt-1">₹{balance?.valueInINR || 0}</p>
                </CardContent>
              </Card>
              <Card className="bg-gray-900/60 border-white/10">
                <CardContent className="p-5 text-center">
                  <p className="text-sm text-gray-500">Total Earned</p>
                  <p className="text-2xl font-bold text-green-400">{balance?.totalEarned || 0} PT</p>
                </CardContent>
              </Card>
              <Card className="bg-gray-900/60 border-white/10">
                <CardContent className="p-5 text-center">
                  <p className="text-sm text-gray-500">Total Penalised</p>
                  <p className="text-2xl font-bold text-red-400">{balance?.totalPenalised || 0} PT</p>
                </CardContent>
              </Card>
            </div>

            {/* Redeem */}
            <Dialog open={redeemOpen} onOpenChange={setRedeemOpen}>
              <DialogTrigger render={<Button className="mb-6 bg-gradient-to-r from-emerald-500 to-teal-500 text-white" />}>
                  <Banknote className="mr-2 h-4 w-4" /> Redeem Tokens
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-white/10 text-white">
                <DialogHeader><DialogTitle>Redeem Parampara Tokens</DialogTitle></DialogHeader>
                <p className="text-sm text-gray-400 mb-4">1 PT = ₹10 • Balance: {balance?.balance || 0} PT</p>
                <form onSubmit={handleRedeem} className="space-y-4">
                  <div>
                    <Label className="text-gray-300">Amount (PT)</Label>
                    <Input type="number" min="1" max={balance?.balance} value={redeemAmount} onChange={(e) => setRedeemAmount(e.target.value)} required className="mt-1 bg-gray-800/50 border-white/10 text-white" />
                    {redeemAmount && <p className="text-sm text-amber-400 mt-1">= ₹{parseInt(redeemAmount || "0") * 10}</p>}
                  </div>
                  <Button type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white" disabled={redeeming}>
                    {redeeming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Redeem
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            {/* Transaction History */}
            <Card className="bg-gray-900/60 border-white/10">
              <CardHeader><CardTitle className="text-white">Transaction History</CardTitle></CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">No transactions yet</p>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((tx, i) => {
                      const info = TX_COLORS[tx.type] || TX_COLORS.EARNED;
                      return (
                        <div key={i} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 p-4">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/10 ${info.color}`}>
                              <info.icon className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-sm text-white">{tx.reason}</p>
                              <p className="text-xs text-gray-500">{new Date(tx.timestamp).toLocaleString()}</p>
                            </div>
                          </div>
                          <span className={`font-bold ${info.color}`}>{info.prefix}{tx.amount} PT</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
