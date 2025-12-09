import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { sefariaAPI } from "@/lib/sefaria";
import type { TalmudLocation } from "@/types/talmud";
import { TRACTATE_FOLIO_RANGES } from "@shared/tractates";

function getNextLocation(location: TalmudLocation): TalmudLocation | null {
  const maxFolio = TRACTATE_FOLIO_RANGES[location.tractate as keyof typeof TRACTATE_FOLIO_RANGES];
  if (!maxFolio) return null;

  if (location.side === 'a') {
    return { ...location, side: 'b' };
  } else {
    if (location.folio >= maxFolio) {
      return null;
    }
    return { ...location, folio: location.folio + 1, side: 'a' };
  }
}

function getPrevLocation(location: TalmudLocation): TalmudLocation | null {
  if (location.side === 'b') {
    return { ...location, side: 'a' };
  } else {
    if (location.folio <= 2) {
      return null;
    }
    return { ...location, folio: location.folio - 1, side: 'b' };
  }
}

export function usePrefetchAdjacentPages(location: TalmudLocation) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const prefetchWithDelay = (loc: TalmudLocation, delay: number) => {
      const timeoutId = setTimeout(() => {
        const queryKey = ['/api/text', loc.work, loc.tractate, loc.chapter, loc.folio, loc.side];
        
        const existingData = queryClient.getQueryData(queryKey);
        if (!existingData) {
          queryClient.prefetchQuery({
            queryKey,
            queryFn: () => sefariaAPI.getText(loc),
            staleTime: 5 * 60 * 1000,
          });
        }
      }, delay);
      return timeoutId;
    };

    const timeouts: NodeJS.Timeout[] = [];
    
    const nextLoc = getNextLocation(location);
    if (nextLoc) {
      timeouts.push(prefetchWithDelay(nextLoc, 1000));
    }
    
    const prevLoc = getPrevLocation(location);
    if (prevLoc) {
      timeouts.push(prefetchWithDelay(prevLoc, 2000));
    }

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [location.work, location.tractate, location.folio, location.side, queryClient]);
}
