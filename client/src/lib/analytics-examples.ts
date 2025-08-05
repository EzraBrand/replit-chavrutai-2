// Example implementations for specific event tracking in ChavrutAI

import { trackEvent } from './analytics';

/**
 * Analytics Event Categories and Examples
 * 
 * This file demonstrates how to implement specific event tracking
 * for various user interactions in the ChavrutAI application
 */

// 1. NAVIGATION EVENTS
export const trackNavigationEvents = {
  // Track when users navigate between folios
  trackFolioNavigation: (tractate: string, folio: number, side: 'a' | 'b', direction: 'next' | 'previous') => {
    trackEvent('navigate_folio', 'navigation', `${tractate} ${folio}${side}`, folio);
    trackEvent(`navigate_${direction}`, 'navigation', tractate);
  },

  // Track tractate selection from various sources
  trackTractateSelection: (tractate: string, source: 'contents' | 'dropdown' | 'search' | 'breadcrumb') => {
    trackEvent('select_tractate', 'navigation', tractate);
    trackEvent('select_tractate_source', 'navigation', source);
  },

  // Track when users jump to specific chapters or sections
  trackSectionJump: (tractate: string, section: number) => {
    trackEvent('jump_to_section', 'navigation', `${tractate} section ${section}`, section);
  }
};

// 2. STUDY BEHAVIOR EVENTS
export const trackStudyEvents = {
  // Track time spent reading specific texts
  trackTextEngagement: (tractate: string, folio: number, side: 'a' | 'b', timeSeconds: number) => {
    trackEvent('text_engagement', 'study', `${tractate} ${folio}${side}`, timeSeconds);
  },

  // Track when users scroll through long texts
  trackTextScrolling: (tractate: string, folio: number, scrollPercent: number) => {
    trackEvent('text_scroll', 'study', tractate, scrollPercent);
  },

  // Track language preference patterns
  trackLanguageInteraction: (language: 'hebrew' | 'english', action: 'click' | 'select_text') => {
    trackEvent(`${language}_interaction`, 'study', action);
  },

  // Track popular text sections
  trackPopularSections: (tractate: string, folio: number, side: 'a' | 'b') => {
    trackEvent('access_text', 'study', `${tractate} ${folio}${side}`, folio);
  }
};

// 3. USER PREFERENCES EVENTS
export const trackPreferenceEvents = {
  // Track text size changes
  trackTextSizeChange: (oldSize: string, newSize: string) => {
    trackEvent('change_text_size', 'preferences', `${oldSize}_to_${newSize}`);
  },

  // Track font selection
  trackFontChange: (newFont: string) => {
    trackEvent('change_font', 'preferences', newFont);
  },

  // Track theme switching
  trackThemeChange: (newTheme: 'light' | 'dark') => {
    trackEvent('change_theme', 'preferences', newTheme);
  }
};

// 4. SEARCH AND DISCOVERY EVENTS
export const trackSearchEvents = {
  // Track search queries (if search functionality is added)
  trackSearch: (query: string, resultsCount: number) => {
    trackEvent('search', 'discovery', query, resultsCount);
  },

  // Track suggested pages clicks
  trackSuggestedPageClick: (tractate: string, folio: number) => {
    trackEvent('click_suggested', 'discovery', `${tractate} ${folio}`);
  },

  // Track content discovery patterns
  trackContentDiscovery: (source: 'trending' | 'recent' | 'recommended', content: string) => {
    trackEvent('discover_content', 'discovery', content);
    trackEvent('discovery_source', 'discovery', source);
  }
};

// 5. ERROR AND PERFORMANCE EVENTS
export const trackErrorEvents = {
  // Track API errors
  trackAPIError: (endpoint: string, errorType: string) => {
    trackEvent('api_error', 'error', `${endpoint}_${errorType}`);
  },

  // Track load times for text fetching
  trackLoadTime: (tractate: string, loadTimeMs: number) => {
    trackEvent('load_time', 'performance', tractate, loadTimeMs);
  },

  // Track user errors (like invalid page navigation)
  trackUserError: (errorType: string, context: string) => {
    trackEvent('user_error', 'error', `${errorType}_${context}`);
  }
};

// 6. ENGAGEMENT METRICS
export const trackEngagementEvents = {
  // Track session duration
  trackSessionDuration: (durationMinutes: number) => {
    trackEvent('session_duration', 'engagement', 'minutes', durationMinutes);
  },

  // Track return visits
  trackReturnVisit: (daysSinceLastVisit: number) => {
    trackEvent('return_visit', 'engagement', 'days_since_last', daysSinceLastVisit);
  },

  // Track deep study sessions (multiple folios read)
  trackDeepStudy: (tractate: string, folioCount: number) => {
    trackEvent('deep_study', 'engagement', tractate, folioCount);
  }
};

// IMPLEMENTATION EXAMPLES:

// Example 1: Track when user spends significant time on a page
export const implementTimeTracking = () => {
  let startTime = Date.now();
  let tractate = 'Berakhot';
  let folio = 2;
  let side: 'a' | 'b' = 'a';

  // Track when user leaves the page
  const handleBeforeUnload = () => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    if (timeSpent > 30) { // Only track if user spent more than 30 seconds
      trackStudyEvents.trackTextEngagement(tractate, folio, side, timeSpent);
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
};

// Example 2: Track scroll depth to measure engagement
export const implementScrollTracking = () => {
  let maxScrollPercent = 0;
  let tractate = 'Berakhot';
  let folio = 2;

  const handleScroll = () => {
    const scrollPercent = Math.round(
      (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
    );
    
    if (scrollPercent > maxScrollPercent) {
      maxScrollPercent = scrollPercent;
      
      // Track at 25%, 50%, 75%, and 100% milestones
      if ([25, 50, 75, 100].includes(scrollPercent)) {
        trackStudyEvents.trackTextScrolling(tractate, folio, scrollPercent);
      }
    }
  };

  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
};

// Example 3: Track popular study times (useful for server optimization)
export const trackStudyTime = () => {
  const hour = new Date().getHours();
  const timeOfDay = hour < 6 ? 'night' : hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  trackEvent('study_time', 'usage_patterns', timeOfDay, hour);
};

/**
 * TO USE THESE TRACKING EVENTS:
 * 
 * 1. Import the specific tracking function you need:
 *    import { trackNavigationEvents } from '@/lib/analytics-examples';
 * 
 * 2. Call it at the appropriate time:
 *    trackNavigationEvents.trackFolioNavigation('Berakhot', 2, 'a', 'next');
 * 
 * 3. In components, add the tracking calls to event handlers:
 *    const handleNextPage = () => {
 *      // Your existing navigation logic
 *      trackNavigationEvents.trackFolioNavigation(tractate, folio, side, 'next');
 *    };
 * 
 * GOOGLE ANALYTICS WILL SHOW:
 * - Event Action: The first parameter (e.g., 'navigate_folio')
 * - Event Category: The second parameter (e.g., 'navigation')
 * - Event Label: The third parameter (e.g., 'Berakhot 2a')
 * - Event Value: The fourth parameter (e.g., folio number)
 * 
 * This data helps you understand:
 * - Which tractates are most popular
 * - How users navigate through texts
 * - What features they use most
 * - When they study and for how long
 * - Which preferences they change
 * - Where they encounter problems
 */