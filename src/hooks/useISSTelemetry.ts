import { useState, useEffect, useCallback } from 'react';
import { fetchISSTelemetryWithMeta } from '../services/issTelemetryService';
import { ISSTelemetry } from '../types';

interface UseISSTelemetryReturn {
  telemetry: ISSTelemetry | null;
  loading: boolean;
  error: string | null;
  isCached: boolean;
  refetch: () => Promise<void>;
}

export function useISSTelemetry(pollingIntervalMs: number = 7000): UseISSTelemetryReturn {
  const [telemetry, setTelemetry] = useState<ISSTelemetry | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState<boolean>(false);

  const getTelemetry = useCallback(async () => {
    try {
      setError(null);
      const res = await fetchISSTelemetryWithMeta();
      setTelemetry(res.data);
      setIsCached(res.source === 'cache');
      setLoading(false);
    } catch (err: any) {
      console.error('Error in useISSTelemetry:', err.message);
      setError(err.message || 'Unable to connect to ISS telemetry server');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getTelemetry();

    if (!pollingIntervalMs || pollingIntervalMs <= 0) return;

    const intervalId = setInterval(() => {
      getTelemetry();
    }, pollingIntervalMs);

    return () => {
      clearInterval(intervalId);
    };
  }, [getTelemetry, pollingIntervalMs]);

  return {
    telemetry,
    loading,
    error,
    isCached,
    refetch: getTelemetry,
  };
}
