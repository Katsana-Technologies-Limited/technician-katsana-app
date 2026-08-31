// Types/formatting shared between BillCollectionScreen (client list) and
// BillCollectionClientDetailScreen (invoices + collect payment), both
// backed by vts-backend-katsana's technician-scoped bill-collection
// endpoints (billCollectionController.js) - client list is area-matched
// (technician.assigned_area vs customer.city), same identity rules
// installation dispatch already uses.

export type DueStatus = "Overdue" | "Due Soon" | "Current";

// DueStatus -> Badge.tsx's BadgeVariant naming (no spaces, camelCase).
export const DUE_STATUS_BADGE: Record<DueStatus, "overdue" | "dueSoon" | "current"> = {
  Overdue: "overdue",
  "Due Soon": "dueSoon",
  Current: "current",
};

export interface BillCollectionClient {
  customer_id: number;
  name: string;
  phone: string;
  city: string | null;
  outstanding: number;
  invoice_count: number;
  status: DueStatus;
}

export interface BillCollectionInvoice {
  id: number;
  invoice_number: string;
  month: string | null;
  due_date: string | null;
  amount: number;
  status: DueStatus;
}

export interface BillCollectionClientDetail {
  customer: {
    id: number;
    name: string;
    phone: string;
    city: string | null;
    address: string | null;
    status: string;
  };
  totalOutstanding: number;
  totalVehicles: number;
  invoices: BillCollectionInvoice[];
}

// "৳1,600" - same thousands-grouping convention crm-katsana's own money()
// helper uses (CallCenterPage.tsx), just ported to this app's plain-number
// (not string) amounts.
export function formatTaka(amount: number): string {
  return `৳${Math.round(amount).toLocaleString("en-IN")}`;
}

export function formatDueDate(value: string | null): string {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
