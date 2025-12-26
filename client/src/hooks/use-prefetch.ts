import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { sefariaAPI } from "@/lib/sefaria";
import type { TalmudLocation } from "@/types/talmud";
import { getNextPage, getPreviousPage, type TalmudPage } from "@shared/talmud-navigation";

function getNextLocation(location: TalmudLocation): TalmudLocation | null {
  const currentPage: TalmudPage = {
    tractate: location.tractate,
    folio: location.folio,
    side: location.side
  };
  
  const next = getNextPage(currentPage);
  if (!next) return null;
  
  return { ...location, folio: next.folio, side: next.side };
}

function getPrevLocation(location: TalmudLocation): TalmudLocation | null {
  const currentPage: TalmudPage = {
    tractate: location.tractate,
    folio: location.folio,
    side: location.side
  };
  
  const prev = getPreviousPage(currentPage);
  if (!prev) return null;
  
  return { ...location, folio: prev.folio, side: prev.side };
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
