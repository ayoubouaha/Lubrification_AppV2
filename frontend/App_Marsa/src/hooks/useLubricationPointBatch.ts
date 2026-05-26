import { useCallback, useEffect, useState, useRef } from 'react';
import { fetchLubricationPoint } from '../services/lubricationApi';
import { type LubricationPointDto } from '../types/lubricationPoint';

const POLL_INTERVAL_MS = 5000;

export const useLubricationPointBatch = (names: string[]) => {
  const [lubricationDataMap, setLubricationDataMap] = useState<Map<string, LubricationPointDto>>(new Map());
  const [hasLoaded, setHasLoaded] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAll = useCallback(async () => {
    if (!names.length) {
      await Promise.resolve();
      setHasLoaded(true);
      return;
    }

    const newMap = new Map<string, LubricationPointDto>();
    const results = await Promise.allSettled(
      names.map(name =>
        fetchLubricationPoint(name).then(data => ({ name, data }))
      )
    );

    results.forEach(result => {
      if (result.status === 'fulfilled') {
        newMap.set(result.value.name, result.value.data);
      }
    });

    setLubricationDataMap(newMap);
    setHasLoaded(true);
  }, [names]);

  useEffect(() => {
    fetchAll();
    intervalRef.current = window.setInterval(fetchAll, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [fetchAll]);

  return { lubricationDataMap, hasLoaded };
};
