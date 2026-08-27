export type RootStackParamList = {
  Login: undefined;
  Tabs: undefined;
  // Numeric assignments.id (the real primary key), not the display
  // KTS-YYYY-NNNNN assignment number - mirrors technician-katsana (web)'s
  // route param, which is also the numeric id.
  AssignmentDetails: { id: number };
  InstallationProgress: { id: number };
  StartInstallation: { id: number };
  InstallationForm: { id: number };
  InstallationCompleted: { id: number };
  Profile: undefined;
  ChangePassword: undefined;
  Notifications: undefined;
};

export type TabParamList = {
  Home: undefined;
  Assignments: undefined;
  BillCollection: undefined;
  Settings: undefined;
};
