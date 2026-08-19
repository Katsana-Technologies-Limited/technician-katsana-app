import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { api, getErrorMessage } from "@/lib/api";
import type { AssignmentDetailResponse, RawAssignment } from "@/lib/assignments";

// Refetches on every screen focus (not just mount) - the RN-native
// equivalent of technician-katsana (web)'s `queryClient.invalidateQueries`
// after accept/start/complete, since there's no shared query cache here to
// invalidate. Returning to a list/detail screen after an action always
// shows fresh data.
export function useAssignmentsList() {
  const [assignments, setAssignments] = useState<RawAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/api/technician/assignments");
      setAssignments(res.data?.assignments || []);
      setError(null);
    } catch (err: any) {
      setError(getErrorMessage(err, "Failed to load assignments"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  return { assignments, isLoading, error, refetch };
}

export function useAssignmentDetail(id: number | undefined) {
  const [detail, setDetail] = useState<AssignmentDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = await api.get(`/api/technician/assignments/${id}`);
      setDetail(res.data);
      setError(null);
    } catch (err: any) {
      setError(getErrorMessage(err, "Failed to load assignment"));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  return { detail, isLoading, error, refetch };
}
