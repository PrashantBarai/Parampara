export interface User {
  id: string;
  name: string;
  email: string;
  role: "ngo" | "validator" | "manufacturer" | "warehouse" | "distributor" | "retailer" | "customer";
  org: "NGOOrg" | "ValidatorOrg" | "ManufacturerOrg" | "WarehouseOrg" | "DistributorOrg" | "RetailerOrg" | "CustomerOrg";
  location?: string;
}

export interface Product {
  productId: string;
  name: string;
  description?: string;
  artisanId: string;
  basePrice: number;
  currentPrice: number;
  imageCID?: string;
  imageHash?: string;
  currentOwnerOrg: string;
  ownerCustomerHash?: string;
  status: string;
  returnCount: number;
  isRetired: boolean;
  qrCodeData?: string;
  blockchainTxId?: string;
  createdAt: string;
}

export interface PriceBreakdown {
  basePrice: number;
  margins: { org: string; value: number; percentage: string }[];
  totalMargins: number;
  finalPrice: number;
}

export interface LifecycleEntry {
  productId: string;
  stage: string;
  org: string;
  userId: { name: string; org: string };
  imageCID?: string;
  marginAdded: number;
  priceAtStage: number;
  location?: string;
  isReturn: boolean;
  timestamp: string;
}

export interface Artisan {
  artisanId: string;
  name: string;
  craft: string;
  location: string;
  giCertificateCID?: string;
  verificationStatus: "PENDING_VERIFICATION" | "VERIFIED" | "REJECTED" | "FLAGGED_FRAUDULENT";
  verifiedBy?: { name: string };
  verifiedAt?: string;
  registeredBy: { name: string; org: string };
}

export interface TokenBalance {
  balance: number;
  valueInINR: number;
  totalEarned: number;
  totalPenalised: number;
  totalRedeemed: number;
}

export interface TokenTransaction {
  type: "EARNED" | "PENALTY" | "REDEEMED";
  amount: number;
  reason: string;
  referenceId?: string;
  timestamp: string;
}

export interface ReturnRecord {
  returnId: string;
  productId: string;
  reason: string;
  returnNumber: number;
  status: string;
  warehouseNotes?: string;
  createdAt: string;
}

export interface ScanResult {
  product: Product;
  journey: LifecycleEntry[];
  fraudAlert: { severity: string; reasons: string[] } | null;
}

export const ROLE_LABELS: Record<string, string> = {
  ngo: "NGO",
  validator: "Validator",
  manufacturer: "Manufacturer",
  warehouse: "Warehouse",
  distributor: "Distributor",
  retailer: "Retailer",
  customer: "Customer",
};

export const ORG_MAP: Record<string, string> = {
  ngo: "NGOOrg",
  validator: "ValidatorOrg",
  manufacturer: "ManufacturerOrg",
  warehouse: "WarehouseOrg",
  distributor: "DistributorOrg",
  retailer: "RetailerOrg",
  customer: "CustomerOrg",
};

export const STATUS_COLORS: Record<string, string> = {
  REGISTERED: "bg-blue-500/20 text-blue-400",
  IN_WAREHOUSE: "bg-amber-500/20 text-amber-400",
  IN_DISTRIBUTION: "bg-purple-500/20 text-purple-400",
  IN_RETAIL: "bg-emerald-500/20 text-emerald-400",
  SOLD: "bg-green-500/20 text-green-400",
  DELIVERED: "bg-teal-500/20 text-teal-400",
  RETURNED: "bg-orange-500/20 text-orange-400",
  RETIRED: "bg-red-500/20 text-red-400",
};
