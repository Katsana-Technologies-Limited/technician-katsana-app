import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { api, getErrorMessage } from "@/lib/api";
import type { BillCollectionClient, BillCollectionClientDetail } from "@/lib/billCollection";

// Same refetch-on-focus pattern as useAssignments.ts - returning to the
// list after collecting a payment on the detail screen shows the updated
// outstanding amounts immediately, no manual pull-to-refresh needed.
export function useBillCollectionClients(search: string) {
  const [clients, setClients] = useState<BillCollectionClient[]>([]);
  const [totalClients, setTotalClients] = useState(0);
  const [totalOutstanding, setTotalOutstanding] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/api/technician/bill-collection/clients", {
        params: search ? { q: search } : undefined,
      });
      setClients(res.data?.clients || []);
      setTotalClients(res.data?.totalClients || 0);
      setTotalOutstanding(res.data?.totalOutstanding || 0);
      setError(null);
    } catch (err: any) {
      setError(getErrorMessage(err, "Failed to load clients"));
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  return { clients, totalClients, totalOutstanding, isLoading, error, refetch };
}

export function useBillCollectionClientDetail(customerId: number | undefined) {
  const [detail, setDetail] = useState<BillCollectionClientDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!customerId) return;
    setIsLoading(true);
    try {
      const res = await api.get(`/api/technician/bill-collection/clients/${customerId}`);
      setDetail(res.data);
      setError(null);
    } catch (err: any) {
      setError(getErrorMessage(err, "Failed to load client detail"));
    } finally {
      setIsLoading(false);
    }
  }, [customerId]);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  return { detail, isLoading, error, refetch };
}
