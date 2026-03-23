"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ORG_MAP, ROLE_LABELS } from "@/lib/types";

const roles = ["ngo", "validator", "manufacturer", "warehouse", "distributor", "retailer", "customer"] as const;

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "", location: "" });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.role) { toast.error("Please select a role"); return; }
    setLoading(true);
    try {
      await register({ ...form, org: ORG_MAP[form.role] });
      toast.success("Account created!");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/10 via-gray-950 to-gray-950" />

      <Card className="relative z-10 w-full max-w-md bg-gray-900/80 border-white/10 backdrop-blur-xl shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25">
            <Package className="h-7 w-7 text-white" />
          </div>
          <CardTitle className="text-2xl text-white">Create Account</CardTitle>
          <CardDescription className="text-gray-400">Join ParamparaChain</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Full Name</Label>
              <Input placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="bg-gray-800/50 border-white/10 text-white placeholder:text-gray-500" />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Email</Label>
              <Input type="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="bg-gray-800/50 border-white/10 text-white placeholder:text-gray-500" />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Password</Label>
              <Input type="password" placeholder="Min 6 characters" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} className="bg-gray-800/50 border-white/10 text-white placeholder:text-gray-500" />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Role</Label>
              <div className="grid grid-cols-2 gap-2">
                {roles.map((role) => (
                  <button key={role} type="button" onClick={() => setForm({ ...form, role })}
                    className={`rounded-lg border px-3 py-2 text-sm transition-all ${form.role === role ? "border-amber-500 bg-amber-500/20 text-amber-400" : "border-white/10 bg-gray-800/50 text-gray-400 hover:border-white/20"}`}>
                    {ROLE_LABELS[role]}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Location (optional)</Label>
              <Input placeholder="City, State" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="bg-gray-800/50 border-white/10 text-white placeholder:text-gray-500" />
            </div>
            <Button type="submit" className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create Account
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/login" className="text-amber-400 hover:text-amber-300 font-medium">Sign In</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
