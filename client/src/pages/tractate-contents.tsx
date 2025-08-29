import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HamburgerMenu } from "@/components/navigation/hamburger-menu";
import {
  BreadcrumbNavigation,
  breadcrumbHelpers,
} from "@/components/navigation/breadcrumb-navigation";
import { getChapterDataByTractate } from "@/lib/chapter-data";
import { Footer } from "@/components/footer";
import { useSEO, generateSEOData } from "@/hooks/use-seo";
import { sefariaAPI } from "@/lib/sefaria";
import { getMaxFolio } from "@/lib/tractate-ranges";
import {
  TRACTATE_HEBREW_NAMES,
  normalizeDisplayTractateName,
  isValidTractate,
} from "@shared/tractates";
import hebrewBookIcon from "@/assets/hebrew-book-icon.png";
import type { TalmudLocation } from "@/types/talmud";
import NotFound from "@/pages/not-found";

