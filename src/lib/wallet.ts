// Types shared between WalletScreen, WalletSubmitReviewScreen and
// WalletSubmitSuccessScreen, backed by vts-backend-katsana's
// walletController.js. Mirrors technician-katsana (web)'s own
// src/lib/wallet.ts - same field names.

export type WalletTransactionType = "COLLECTION" | "SUBMISSION" | "REJECTION";

export interface WalletTransaction {
  id: number;
  type: WalletTransactionType;
  amount: number;
  balance_after: number;
  description: string;
  created_at: string;
}

export interface WalletSummary {
  balance: number;
  totalCollected: number;
  submittedThisMonth: number;
}

export interface PendingCollection {
  id: number;
  invoice_id: number;
  amount: number;
  collected_at: string;
  customer_name: string;
  invoice_number: string;
}

export interface WalletSubmission {
  id: number;
  submission_number: string;
  total_amount: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  submitted_at: string;
}
