// Ported from technician-katsana (web) src/lib/assignments.ts - identical
// shapes/logic, since both clients talk to the exact same
// /api/technician/assignments* endpoints (vts-backend-katsana).
export type AssignmentStatus =
  | "New"
  | "Accepted"
  | "In Progress"
  | "Completed"
  | "Rescheduled"
  | "Cancelled";

export interface RawAssignment {
  id: number;
  assignment_number: string;
  type: "Installation" | "Maintenance" | "Removal";
  status: AssignmentStatus;
  assigned_on: string;
  accepted_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  subscription_id: number;
  subscription_number: string;
  package_details: string;
  discount_amount: string | number | null;
  first_billing_date: string;
  registration_no: string | null;
  customer_name: string;
  customer_mobile: string;
  present_address: string | null;
  permanent_address: string | null;
  city: string | null;
}

export interface AssignmentVehicle {
  device_id: number | null;
  sim_id: number | null;
  vehicle_type_id: number | null;
  vehicle_model: string | null;
  registration_no: string | null;
  colour: string | null;
  chassis_no: string | null;
  engine_no: string | null;
  device_imei: string | null;
  device_model: string | null;
  sim_iccid: string | null;
  vehicle_type_name: string | null;
}

export interface InstallationRecord {
  vehicle_type_id: number | null;
  registration_no: string | null;
  chassis_no: string | null;
  engine_no: string | null;
  installation_location: string | null;
  ign_connection: string | null;
  relay_installed: string | null;
  fuel_type: string | null;
  battery_voltage: string | null;
  acc_wire_connected: string | null;
  engine_cutoff_configured: string | null;
  sos_button_installed: string | null;
  customer_mobile: string | null;
  otp_verified: number;
  remarks: string | null;
  completed_at: string | null;
}

export interface AssignmentDetailResponse {
  assignment: RawAssignment;
  vehicle: AssignmentVehicle | null;
  installation: InstallationRecord | null;
}

export interface DisplayAssignment {
  id: number;
  assignmentNumber: string;
  type: string;
  status: AssignmentStatus;
  customerName: string;
  vehicleNumber: string;
  city: string;
  scheduleLabel: string;
  assignedOn: string;
  subscriptionNumber: string;
  packageName: string;
  monthlyFee: number;
  billingStartDate: string;
  customerMobile: string;
  customerAddress: string;
}

export function parsePackageDetails(json: string | null | undefined): any {
  if (!json) return {};
  try {
    return typeof json === "string" ? JSON.parse(json) : json;
  } catch {
    return {};
  }
}

export function formatDateTime(value: string | null): string {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatDate(value: string | null): string {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatScheduleLabel(value: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  const now = new Date();
  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const time = date.toLocaleTimeString("en-GB", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (isSameDay(date, now)) return `Today, ${time}`;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(date, yesterday)) return `Yesterday, ${time}`;

  return `${formatDate(value)}, ${time}`;
}

export function toDisplayAssignment(raw: RawAssignment): DisplayAssignment {
  const pkg = parsePackageDetails(raw.package_details);
  const monthlyCharge = Number(pkg.monthly_charge || pkg.annual_charge) || 0;
  const discount = Number(raw.discount_amount) || 0;
  return {
    id: raw.id,
    assignmentNumber: raw.assignment_number,
    type: raw.type,
    status: raw.status,
    customerName: raw.customer_name,
    vehicleNumber: raw.registration_no || "Not yet confirmed",
    city: raw.city || "-",
    scheduleLabel: formatScheduleLabel(raw.assigned_on),
    assignedOn: formatDateTime(raw.assigned_on),
    subscriptionNumber: raw.subscription_number,
    packageName: pkg.name || "-",
    monthlyFee: monthlyCharge - discount,
    billingStartDate: formatDate(raw.first_billing_date),
    customerMobile: raw.customer_mobile,
    customerAddress: [raw.present_address || raw.permanent_address, raw.city]
      .filter(Boolean)
      .join(", "),
  };
}
