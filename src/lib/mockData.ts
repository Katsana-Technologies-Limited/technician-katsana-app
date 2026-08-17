// Static form option lists only - all assignment/installation data is real
// now (see src/lib/assignments.ts + src/hooks/useAssignments.ts), fetched
// from the same /api/technician/* endpoints technician-katsana (web) uses.
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
