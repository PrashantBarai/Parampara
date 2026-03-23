"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Shield, QrCode, ArrowRight, Coins, RotateCcw, UserCheck } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-950 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/20 via-gray-950 to-gray-950" />

      {/* Nav */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25">
            <Package className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">ParamparaChain</span>
        </div>
        <div className="flex gap-3">
          <Link href="/login"><Button variant="ghost" className="text-gray-400 hover:text-white">Login</Button></Link>
          <Link href="/register"><Button className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-amber-500/25">Get Started</Button></Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-24 pb-16 max-w-4xl mx-auto">
        <Badge variant="outline" className="mb-6 border-amber-500/30 text-amber-400 px-4 py-1">
          Powered by Hyperledger Fabric
        </Badge>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
          <span className="bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">Sovereign</span>{" "}
          <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">Traceability</span>
        </h1>
        <p className="mt-6 text-lg md:text-xl text-gray-400 max-w-2xl leading-relaxed">
          Fair value distribution for indigenous artisan products. Track every hand that touches a product,
          from rural artisan to your doorstep — all on an immutable blockchain.
        </p>
        <div className="mt-10 flex gap-4">
          <Link href="/register">
            <Button size="lg" className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-8 shadow-xl shadow-amber-500/25">
              Start Tracking <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/scan">
            <Button size="lg" variant="outline" className="border-white/20 text-gray-300 hover:bg-white/5 px-8">
              <QrCode className="mr-2 h-4 w-4" /> Scan Product
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: QrCode, title: "QR Traceability", desc: "Scan any product to see its full journey — origin, artisan, every transfer, transparent pricing.", color: "from-blue-500 to-cyan-500" },
            { icon: Shield, title: "GI Verification", desc: "Government validators verify artisan credentials. Earn Parampara Tokens for correct validations.", color: "from-amber-500 to-orange-500" },
            { icon: Coins, title: "Fair Pricing", desc: "Immutable base price + transparent margins. Price cap ensures artisans get fair value.", color: "from-emerald-500 to-teal-500" },
            { icon: UserCheck, title: "Artisan Protection", desc: "NGO-led onboarding with GI certificate verification. Fraud detection protects authenticity.", color: "from-purple-500 to-pink-500" },
            { icon: RotateCcw, title: "Return System", desc: "Customer returns tracked on-chain with max 3 returns per product. Quality accountability.", color: "from-rose-500 to-red-500" },
            { icon: Package, title: "Black Market Guard", desc: "Buyer identity on-chain forever. Traceable accountability deters unauthorized resale.", color: "from-indigo-500 to-violet-500" },
          ].map((feature, i) => (
            <div key={i} className="group relative rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10">
              <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color} shadow-lg`}>
                <feature.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Supply Chain Visual */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-16 text-center">
        <h2 className="text-2xl font-bold text-white mb-8">Supply Chain Flow</h2>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {["NGO", "Validator", "Manufacturer", "Warehouse", "Distributor", "Retailer", "Customer"].map((org, i) => (
            <div key={org} className="flex items-center gap-3">
              <div className="rounded-lg bg-white/10 border border-white/20 px-4 py-2 text-sm font-medium text-white">
                {org}
              </div>
              {i < 6 && <ArrowRight className="h-4 w-4 text-amber-500" />}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-8 text-center text-gray-500 text-sm">
        <p>ParamparaChain © {new Date().getFullYear()} — Sovereign Traceability & Fair Value Distribution</p>
      </footer>
    </div>
  );
}
