import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { api, getErrorMessage } from "@/lib/api";
import type { PendingCollection, WalletSummary, WalletTransaction } from "@/lib/wallet";

// Same refetch-on-focus pattern as useBillCollection.ts - returning to the
// wallet after a collection or a submission shows the updated balance
// immediately, no manual pull-to-refresh needed.
export function useWalletSummary() {
  const [summary, setSummary] = useState<WalletSummary>({
    balance: 0,
    totalCollected: 0,
    submittedThisMonth: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/api/technician/wallet/summary");
      setSummary(res.data);
      setError(null);
    } catch (err: any) {
      setError(getErrorMessage(err, "Failed to load wallet summary"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  return { summary, isLoading, error, refetch };
}

export function useWalletTransactions() {
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/api/technician/wallet/transactions", {
        params: { limit: 10 },
      });
      setTransactions(res.data?.transactions || []);
      setError(null);
    } catch (err: any) {
      setError(getErrorMessage(err, "Failed to load transactions"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  return { transactions, isLoading, error, refetch };
}

export function usePendingCollections() {
  const [collections, setCollections] = useState<PendingCollection[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/api/technician/wallet/pending-collections");
      setCollections(res.data?.collections || []);
      setTotalAmount(res.data?.totalAmount || 0);
      setError(null);
    } catch (err: any) {
      setError(getErrorMessage(err, "Failed to load pending collections"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  return { collections, totalAmount, isLoading, error, refetch };
}
