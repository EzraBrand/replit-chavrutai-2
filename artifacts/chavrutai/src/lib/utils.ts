import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

import { CANONICAL_BASE_URL } from "@shared/brand";

export const SITE_URL = CANONICAL_BASE_URL;

export function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return SITE_URL;
}
