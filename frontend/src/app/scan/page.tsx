"use client";

import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { QRScanner } from "@/components/QRScanner";
import { OfflineIndicator, useOfflineSync } from "@/components/OfflineSync";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { scanAPI, lifecycleAPI, transferAPI } from "@/lib/api";
import { ScanResult, STATUS_COLORS, ORG_MAP } from "@/lib/types";
import {
  QrCode, Search, AlertTriangle, MapPin, Package, Loader2,
  Shield, Clock, Camera, ArrowRightLeft, Plus, Layers
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

const SUPPLY_CHAIN_ROLES = ["warehouse", "distributor", "retailer"];
const NEXT_ORG_MAP: Record<string, string> = {
  warehouse: "DistributorOrg",
  distributor: "RetailerOrg",
  retailer: "CustomerOrg",
};
const STAGE_MAP: Record<string, string> = {
  warehouse: "WAREHOUSED",
  distributor: "DISTRIBUTED",
  retailer: "IN_RETAIL",
};

export default function ScanPage() {
  const { user } = useAuth();
  const { isOnline, saveScanForLater } = useOfflineSync();
  const [productId, setProductId] = useState("");
  const [location, setLocation] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scanMode, setScanMode] = useState<"qr" | "manual">("qr");

  // Lifecycle action state
  const [actionLoading, setActionLoading] = useState(false);
  const [marginValue, setMarginValue] = useState("");
  const [stageLocation, setStageLocation] = useState("");

  const performScan = async (id: string, sig: string = "") => {
    if (!id.trim()) { toast.error("Enter a product ID"); return; }
    setLoading(true);
    try {
      if (!isOnline) {
        await saveScanForLater(id, sig, location);
        toast.info("Offline — scan saved and will sync when online");
        setLoading(false);
        return;
      }
      const res = await scanAPI.scan({ productId: id.trim(), location, ...(sig ? { sig } : {}) });
      setResult(res.data.data);
      setProductId(id.trim());
      toast.success("Product scanned!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Scan failed");
      setResult(null);
    }
    setLoading(false);
  };

  const handleManualScan = async (e: React.FormEvent) => {
    e.preventDefault();
    await performScan(productId);
  };

  const handleQRScan = async (scannedId: string, sig: string) => {
    setShowScanner(false);
    setProductId(scannedId);
    await performScan(scannedId, sig);
  };

  const handleAddLifecycle = async () => {
    if (!user || !result) return;
    setActionLoading(true);
    try {
      const formData = new FormData();
      formData.append("productId", result.product.productId);
      formData.append("stage", STAGE_MAP[user.role] || user.role.toUpperCase());
      formData.append("marginValue", marginValue || "0");
      if (stageLocation) formData.append("location", stageLocation);
      await lifecycleAPI.addStage(formData);
      toast.success("Lifecycle stage added!");

      // Re-scan to refresh data
      await performScan(result.product.productId);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to add stage");
    }
    setActionLoading(false);
  };

  const handleTransfer = async () => {
    if (!user || !result) return;
    const toOrg = NEXT_ORG_MAP[user.role];
    if (!toOrg) { toast.error("No transfer target for your role"); return; }
    setActionLoading(true);
    try {
      await transferAPI.transfer({ productId: result.product.productId, toOrg });
      toast.success(`Transferred to ${toOrg}!`);
      await performScan(result.product.productId);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Transfer failed");
    }
    setActionLoading(false);
  };

  const isSupplyChainUser = user && SUPPLY_CHAIN_ROLES.includes(user.role);
  const isCustomer = user?.role === "customer";

  return (
    <div className="min-h-screen bg-gray-950">
      {user && <Navbar />}
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25">
            <QrCode className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Scan Product</h1>
          <p className="text-gray-400 text-sm mt-1">Scan a QR code or enter a product ID to view its journey</p>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-4 justify-center">
          <Button
            variant={scanMode === "qr" ? "default" : "outline"}
            onClick={() => { setScanMode("qr"); setShowScanner(true); }}
            className={scanMode === "qr" ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white" : "border-white/10 text-gray-400"}
            size="sm"
          >
            <Camera className="mr-2 h-4 w-4" /> Scan QR Code
          </Button>
          <Button
            variant={scanMode === "manual" ? "default" : "outline"}
            onClick={() => { setScanMode("manual"); setShowScanner(false); }}
            className={scanMode === "manual" ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white" : "border-white/10 text-gray-400"}
            size="sm"
          >
            <Search className="mr-2 h-4 w-4" /> Enter ID Manually
          </Button>
        </div>

        {/* QR Scanner */}
        {showScanner && scanMode === "qr" && (
          <Card className="bg-gray-900/60 border-white/10 mb-6">
            <CardContent className="p-4">
              <QRScanner
                onScan={handleQRScan}
                onError={(msg) => toast.error(msg)}
                onClose={() => setShowScanner(false)}
              />
            </CardContent>
          </Card>
        )}

        {/* Manual Input */}
        {scanMode === "manual" && (
          <Card className="bg-gray-900/60 border-white/10 mb-6">
            <CardContent className="p-6">
              <form onSubmit={handleManualScan} className="flex gap-3">
                <Input placeholder="PROD-XXXXXXXX" value={productId} onChange={(e) => setProductId(e.target.value)} className="flex-1 bg-gray-800/50 border-white/10 text-white placeholder:text-gray-500 text-lg" />
                <Button type="submit" className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-6" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          </div>
        )}

        {/* Result */}
        {result && !loading && (
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

            {/* Supply Chain Actions */}
            {isSupplyChainUser && (
              <Card className="bg-gray-900/60 border-amber-500/20 border-2">
                <CardHeader>
                  <CardTitle className="text-amber-400 text-lg flex items-center gap-2">
                    <Layers className="h-5 w-5" /> Supply Chain Actions
                  </CardTitle>
                  <p className="text-xs text-gray-500">Add lifecycle stage or transfer ownership</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Add Lifecycle Stage */}
                  <div className="rounded-lg border border-white/10 p-4 space-y-3">
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Plus className="h-4 w-4 text-amber-400" /> Add Lifecycle Stage
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-gray-400">Margin (₹)</Label>
                        <Input type="number" min="0" placeholder="200" value={marginValue} onChange={(e) => setMarginValue(e.target.value)}
                          className="mt-1 bg-gray-800/50 border-white/10 text-white text-sm" />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-400">Location</Label>
                        <Input placeholder="City" value={stageLocation} onChange={(e) => setStageLocation(e.target.value)}
                          className="mt-1 bg-gray-800/50 border-white/10 text-white text-sm" />
                      </div>
                    </div>
                    <Button onClick={handleAddLifecycle} disabled={actionLoading} className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white" size="sm">
                      {actionLoading ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Plus className="mr-2 h-3 w-3" />}
                      Add {STAGE_MAP[user!.role] || "Stage"}
                    </Button>
                  </div>

                  {/* Transfer */}
                  <div className="rounded-lg border border-white/10 p-4">
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
                      <ArrowRightLeft className="h-4 w-4 text-purple-400" /> Transfer Ownership
                    </h4>
                    <p className="text-xs text-gray-400 mb-3">
                      Transfer to: <span className="text-purple-400 font-medium">{NEXT_ORG_MAP[user!.role] || "N/A"}</span>
                    </p>
                    <Button onClick={handleTransfer} disabled={actionLoading} variant="outline"
                      className="w-full border-purple-500/30 text-purple-400 hover:bg-purple-500/10" size="sm">
                      {actionLoading ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <ArrowRightLeft className="mr-2 h-3 w-3" />}
                      Transfer Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

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
      <OfflineIndicator />
    </div>
  );
}
