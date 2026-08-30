// Dashboard's "Good Morning," was a static leftover from the mockup - never
// actually computed, so it kept showing regardless of the real time. Always
// evaluated in Asia/Dhaka time specifically (not the device's own
// timezone), same convention the backend uses everywhere (nowBD/todayBD),
// since this is shown to a Bangladesh-based technician regardless of what
// timezone their device happens to be set to.
export function getBDGreeting(): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: "Asia/Dhaka",
    }).format(new Date()),
  );
  if (hour < 12) return "Good Morning,";
  if (hour < 17) return "Good Afternoon,";
  if (hour < 20) return "Good Evening,";
  return "Good Night,";
}
