import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchSatellites, calculateSatellitePosition } from '../services/satelliteService';
import { SatelliteCategory, SatelliteItem, SatelliteGPData } from '../types';

interface UseSatelliteExplorerReturn {
  category: SatelliteCategory;
  setCategory: (cat: SatelliteCategory) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedSatellite: SatelliteItem | null;
  setSelectedSatId: (id: string | null) => void;
  filteredSatellites: SatelliteItem[];
  allSatellitesCount: number;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
  refetch: () => Promise<void>;
}

export function useSatelliteExplorer(
  initialCategory: SatelliteCategory = 'visual'
): UseSatelliteExplorerReturn {
  const [category, setCategoryState] = useState<SatelliteCategory>(initialCategory);
  const [rawGpList, setRawGpList] = useState<SatelliteGPData[]>([]);
  const [satellites, setSatellites] = useState<SatelliteItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSatId, setSelectedSatId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  // Load satellite catalog from CelesTrak API
  const loadCategoryData = useCallback(async (cat: SatelliteCategory) => {
    try {
      setLoading(true);
      setError(null);
      const gpList = await fetchSatellites(cat);
      setRawGpList(gpList);

      const now = Date.now();
      const initialItems: SatelliteItem[] = gpList.map((gp) => ({
        id: String(gp.NORAD_CAT_ID),
        name: gp.OBJECT_NAME,
        noradId: gp.NORAD_CAT_ID,
        designator: gp.OBJECT_ID,
        category: cat,
        gpData: gp,
        position: calculateSatellitePosition(gp, now),
      }));

      setSatellites(initialItems);
      setLastUpdated(now);
      setLoading(false);

      // Auto-select first satellite if none currently selected
      if (initialItems.length > 0) {
        setSelectedSatId((prev) => {
          if (prev && initialItems.some((s) => s.id === prev)) return prev;
          return initialItems[0].id;
        });
      } else {
        setSelectedSatId(null);
      }
    } catch (err: unknown) {
      console.error('Error loading satellite category data:', err);
      if (err instanceof Error) {
        setError(err.message || 'Unable to connect to satellite telemetry service.');
      } else {
        setError('Failed to fetch satellite telemetry.');
      }
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategoryData(category);
  }, [category, loadCategoryData]);

  // Recalculate satellite positions locally every 3 seconds
  useEffect(() => {
    if (rawGpList.length === 0) return;

    const intervalId = setInterval(() => {
      const now = Date.now();
      setSatellites((prevList) =>
        prevList.map((sat) => ({
          ...sat,
          position: calculateSatellitePosition(sat.gpData, now),
        }))
      );
      setLastUpdated(now);
    }, 3000);

    return () => clearInterval(intervalId);
  }, [rawGpList]);

  // Category switch handler
  const setCategory = useCallback((cat: SatelliteCategory) => {
    if (cat === category) return;
    setCategoryState(cat);
    setSearchQuery('');
  }, [category]);

  // Client-side search filtering
  const filteredSatellites = useMemo(() => {
    if (!searchQuery.trim()) return satellites;
    const query = searchQuery.trim().toLowerCase();
    return satellites.filter(
      (sat) =>
        sat.name.toLowerCase().includes(query) ||
        String(sat.noradId).includes(query) ||
        sat.designator.toLowerCase().includes(query)
    );
  }, [satellites, searchQuery]);

  // Selected satellite object
  const selectedSatellite = useMemo(() => {
    if (!selectedSatId) return filteredSatellites[0] || null;
    return (
      satellites.find((s) => s.id === selectedSatId) ||
      filteredSatellites[0] ||
      null
    );
  }, [selectedSatId, satellites, filteredSatellites]);

  const refetch = useCallback(async () => {
    await loadCategoryData(category);
  }, [category, loadCategoryData]);

  return {
    category,
    setCategory,
    searchQuery,
    setSearchQuery,
    selectedSatellite,
    setSelectedSatId,
    filteredSatellites,
    allSatellitesCount: satellites.length,
    loading,
    error,
    lastUpdated,
    refetch,
  };
}
