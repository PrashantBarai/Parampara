"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Navbar } from "@/components/navbar";
import { Loader2 } from "lucide-react";

import { NGODashboard } from "@/components/dashboards/ngo-dashboard";
import { ValidatorDashboard } from "@/components/dashboards/validator-dashboard";
import { ManufacturerDashboard } from "@/components/dashboards/manufacturer-dashboard";
import { WarehouseDashboard } from "@/components/dashboards/warehouse-dashboard";
import { DistributorDashboard } from "@/components/dashboards/distributor-dashboard";
import { RetailerDashboard } from "@/components/dashboards/retailer-dashboard";
import { CustomerDashboard } from "@/components/dashboards/customer-dashboard";

const dashboards: Record<string, React.ComponentType> = {
  ngo: NGODashboard,
  validator: ValidatorDashboard,
  manufacturer: ManufacturerDashboard,
  warehouse: WarehouseDashboard,
  distributor: DistributorDashboard,
  retailer: RetailerDashboard,
  customer: CustomerDashboard,
};

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if definitively NOT loading and NO user exists
    if (isLoading === false && user === null) {
      console.log("🚫 No user found, redirecting to login...");
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user)
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );

  const DashboardComponent = dashboards[user.role] || NGODashboard;

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <DashboardComponent />
    </div>
  );
}
