// Ported from technician-katsana (web app) src/lib/mockData.ts. The backend
// (vts-backend-katsana) doesn't have assignment/installation endpoints yet -
// only technician auth is real (see AuthContext) - so this app mirrors the
// web app's current mocked-data state rather than inventing new endpoints
// that don't exist on either client.
export type AssignmentStatus =
  | "New"
  | "Accepted"
  | "In Progress"
  | "Completed"
  | "Rescheduled"
  | "Cancelled";

export interface Assignment {
  id: string;
  type: "Installation" | "Maintenance" | "Removal";
  status: AssignmentStatus;
  customerName: string;
  vehicleNumber: string;
  area: string;
  city: string;
  scheduleLabel: string;
  assignedOn: string;
  subscriptionId: string;
  packageName: string;
  monthlyFee: number;
  billingStartDate: string;
  vehicleCount: number;
  customerMobile: string;
  customerAlternateMobile: string;
  customerAddress: string;
}

export const dashboardStats = {
  newAssignments: 4,
  accepted: 2,
  inProgress: 1,
  completedToday: 5,
  rescheduled: 1,
  cancelled: 0,
};

export const assignments: Assignment[] = [
  {
    id: "KTS-2026-00125",
    type: "Installation",
    status: "New",
    customerName: "Abdullah Al Mamun",
    vehicleNumber: "DHAKA METRO-GA-12-3456",
    area: "Badda",
    city: "Dhaka",
    scheduleLabel: "Today, 10:30 AM",
    assignedOn: "20 May 2026, 09:15 AM",
    subscriptionId: "SUB-2026-00125",
    packageName: "Basic Package",
    monthlyFee: 300,
    billingStartDate: "05 Jun 2026",
    vehicleCount: 2,
    customerMobile: "01712-345678",
    customerAlternateMobile: "01998-765432",
    customerAddress: "House 123, Road 5, Badda, Dhaka-1212",
  },
  {
    id: "KTS-2026-00124",
    type: "Installation",
    status: "Accepted",
    customerName: "Shakib Hossain",
    vehicleNumber: "DHAKA METRO-NA-11-2233",
    area: "Uttara",
    city: "Dhaka",
    scheduleLabel: "Today, 10:00 PM",
    assignedOn: "20 May 2026, 08:40 AM",
    subscriptionId: "SUB-2026-00124",
    packageName: "Advanced Package",
    monthlyFee: 500,
    billingStartDate: "05 Jun 2026",
    vehicleCount: 1,
    customerMobile: "01711-223344",
    customerAlternateMobile: "-",
    customerAddress: "Sector 7, Road 12, Uttara, Dhaka-1230",
  },
  {
    id: "KTS-2026-00123",
    type: "Maintenance",
    status: "In Progress",
    customerName: "Farhan Ahmed",
    vehicleNumber: "DHAKA METRO-CHA-18-7788",
    area: "Mirpur",
    city: "Dhaka",
    scheduleLabel: "Today, 03:30 PM",
    assignedOn: "19 May 2026, 04:10 PM",
    subscriptionId: "SUB-2026-00123",
    packageName: "Basic Package",
    monthlyFee: 300,
    billingStartDate: "12 Apr 2026",
    vehicleCount: 1,
    customerMobile: "01755-667788",
    customerAlternateMobile: "01611-998877",
    customerAddress: "Block C, Road 3, Mirpur-10, Dhaka-1216",
  },
  {
    id: "KTS-2026-00122",
    type: "Installation",
    status: "Completed",
    customerName: "Rashedul Islam",
    vehicleNumber: "DHAKA METRO-BA-15-1122",
    area: "Motijheel",
    city: "Dhaka",
    scheduleLabel: "Yesterday, 05:20 PM",
    assignedOn: "19 May 2026, 09:00 AM",
    subscriptionId: "SUB-2026-00122",
    packageName: "Basic Package",
    monthlyFee: 300,
    billingStartDate: "26 May 2026",
    vehicleCount: 1,
    customerMobile: "01822-334455",
    customerAlternateMobile: "-",
    customerAddress: "45/2 Dilkusha C/A, Motijheel, Dhaka-1000",
  },
];

export function getAssignmentById(id: string | undefined): Assignment | undefined {
  return assignments.find((a) => a.id === id);
}

export interface ProgressStep {
  label: string;
  time?: string;
  state: "done" | "current" | "pending";
}

export const installationProgressSteps: ProgressStep[] = [
  { label: "Assigned", time: "09:15 AM", state: "done" },
  { label: "Technician Accepted", time: "09:20 AM", state: "done" },
  { label: "On the Way", time: "09:25 AM", state: "done" },
  { label: "Arrived at Location", time: "10:05 AM", state: "done" },
  { label: "Installation Started", time: "10:10 AM", state: "current" },
  { label: "Device Installed", state: "pending" },
  { label: "Testing in Progress", state: "pending" },
  { label: "Customer Handover", state: "pending" },
  { label: "Installation Completed", state: "pending" },
];

export const testingChecklist: string[] = [
  "Device Online",
  "GPS Location Received",
  "ACC On Status",
  "ACC Off Status",
  "Vehicle Movement",
  "Main Power",
  "Backup Battery",
  "Engine Cut-off Command",
  "Engine Restore Command",
  "Mobile App Login",
  "Web Tracking Login",
  "Notification Alerts",
  "SIM Network Connection",
];

export const vehicleTypes = ["Car", "Motorcycle", "Truck", "Bus", "CNG", "Pickup"];
export const brandModels = [
  "Toyota Axio",
  "Toyota Premio",
  "Honda Civic",
  "Nissan X-Trail",
  "Mitsubishi Pajero",
];
export const vehicleColors = ["White", "Black", "Silver", "Red", "Blue", "Grey"];
export const installLocations = [
  "Under Dashboard",
  "Behind Ignition Switch",
  "Engine Bay",
  "Under Seat",
];
export const ignConnectionOptions = ["Connected", "Not Connected"];
export const relayOptions = ["Yes", "No"];
export const fuelTypes = ["Petrol", "Diesel", "CNG", "Electric", "Hybrid"];
export const batteryVoltages = ["12V", "24V"];
