import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PreferencesProvider } from "@/context/preferences-context";
import Home from "@/pages/home";
import About from "@/pages/about";
import Contents from "@/pages/contents";
import TractateContents from "@/pages/tractate-contents";
import TractateView from "./pages/tractate-view";
import TractateOutlinePage from "@/pages/tractate-outline";
import BlogPostsPage from "@/pages/blog-posts";
import BiblicalIndexPage from "@/pages/biblical-index";
import BiblicalBookPage from "@/pages/biblical-book";
import SuggestedPages from "@/pages/suggested-pages";
import Sitemap from "@/pages/sitemap";
import Changelog from "@/pages/changelog";
import Contact from "@/pages/contact";
import Privacy from "@/pages/privacy";
import Dictionary from "@/pages/dictionary";
import NotFound from "@/pages/not-found";
import { useEffect } from "react";
import { initGA } from "@/lib/analytics";
import { useAnalytics } from "@/hooks/use-analytics";
import { preloadChapterData } from "@/lib/chapter-data";

function Router() {
  // Track page views when routes change
  useAnalytics();
  
  return (
    <Switch>
      <Route path="/" component={Contents} />
      <Route path="/about" component={About} />
      <Route path="/blog-posts" component={BlogPostsPage} />
      <Route path="/biblical-index" component={BiblicalIndexPage} />
      <Route path="/biblical-index/book/:bookName" component={BiblicalBookPage} />
      <Route path="/suggested-pages" component={SuggestedPages} />
      <Route path="/sitemap" component={Sitemap} />
      <Route path="/changelog" component={Changelog} />
      <Route path="/contact" component={Contact} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/dictionary" component={Dictionary} />
      <Route path="/contents" component={Contents} />
      <Route path="/contents/:tractate" component={TractateContents} />
      <Route path="/tractate/:tractate/:folio" component={TractateView} />
      <Route path="/outline/:tractate/:chapter" component={TractateOutlinePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Initialize Google Analytics and preload chapter data when app loads
  useEffect(() => {
    // Verify required environment variable is present
    if (!import.meta.env.VITE_GA_MEASUREMENT_ID) {
      console.warn('Missing required Google Analytics key: VITE_GA_MEASUREMENT_ID');
    } else {
      initGA();
    }
    
    // Preload chapter data for faster navigation
    preloadChapterData().catch(error => {
      console.warn('Failed to preload chapter data:', error);
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <PreferencesProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </PreferencesProvider>
    </QueryClientProvider>
  );
}

export default App;
