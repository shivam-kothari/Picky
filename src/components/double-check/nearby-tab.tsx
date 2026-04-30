"use client";

import { useState, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MapPin, Navigation, ExternalLink, RefreshCw, Info, ThumbsUp, ThumbsDown, WifiOff } from "lucide-react";
import type { RestaurantResult, RestaurantSearchResponse } from "@/lib/restaurants";
import { getCachedRestaurants, setCachedRestaurants } from "@/lib/restaurant-cache";

type NearbyTabProps = {
  active: Set<string>;
};

type State = "idle" | "locating" | "searching" | "result" | "error";

const SEARCHING_MESSAGES = [
  "Locating you...",
  "Finding nearby options...",
  "Matching your standards...",
  "Curating results."
];

export function NearbyTab({ active }: NearbyTabProps) {
  const [state, setState] = useState<State>("idle");
  const [results, setResults] = useState<RestaurantResult[]>([]);
  const [fallbackUsed, setFallbackUsed] = useState(false);
  const [cachedResult, setCachedResult] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [ticks, setTicks] = useState(0);
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [feedback, setFeedback] = useState<Record<string, "positive" | "negative">>({});

  const messageIndex = Math.min(Math.floor(ticks / 2), SEARCHING_MESSAGES.length - 1);
  const dotsCount = ticks % 4;

  const message = useMemo(() => {
    return SEARCHING_MESSAGES[messageIndex];
  }, [messageIndex]);

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (state !== "searching" && state !== "locating") return;
    const interval = setInterval(() => {
      setTicks((current) => current + 1);
    }, 800);
    return () => clearInterval(interval);
  }, [state]);

  const handleFeedback = (restaurantId: string, type: "positive" | "negative") => {
    setFeedback((prev) => {
      const current = prev[restaurantId];
      // Toggle off if same feedback is clicked again
      if (current === type) {
        const next = { ...prev };
        delete next[restaurantId];
        return next;
      }
      return { ...prev, [restaurantId]: type };
    });
  };

  const findRestaurants = (forceRefresh = false) => {
    if (active.size === 0) {
      setErrorMsg("Please select at least one dietary standard first.");
      setState("error");
      return;
    }

    if (!isOnline) {
      setErrorMsg("You are currently offline. Please connect to the internet and try again.");
      setState("error");
      return;
    }

    setState("locating");
    setTicks(0);
    setCachedResult(false);
    setFeedback({});

    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser.");
      setState("error");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const criteriaIds = Array.from(active);

        // Check cache first (unless force refresh)
        if (!forceRefresh) {
          const cached = getCachedRestaurants(lat, lon, criteriaIds);
          if (cached) {
            setResults(cached.restaurants);
            setFallbackUsed(cached.fallbackUsed);
            setCachedResult(true);
            setState("result");
            return;
          }
        }

        setState("searching");
        fetchRestaurants(lat, lon);
      },
      () => {
        setErrorMsg("Unable to retrieve your location. Please check your browser permissions.");
        setState("error");
      },
      { timeout: 10000 }
    );
  };

  const fetchRestaurants = async (lat: number, lon: number) => {
    const criteriaIds = Array.from(active);
    try {
      const response = await fetch("/api/restaurants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lon, criteriaIds }),
      });

      if (!response.ok) {
        throw new Error("Server error");
      }

      const data = (await response.json()) as RestaurantSearchResponse;
      setResults(data.restaurants);
      setFallbackUsed(data.fallbackUsed);
      setState("result");

      // Save to cache
      setCachedRestaurants(lat, lon, criteriaIds, data);
    } catch {
      setErrorMsg("Failed to find restaurants. Please try again later.");
      setState("error");
    }
  };

  if (state === "idle") {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center h-full animate-in fade-in duration-500">
        {!isOnline && (
          <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg mb-6 flex gap-2 items-center max-w-sm">
            <WifiOff className="h-4 w-4 text-destructive shrink-0" />
            <p className="text-xs text-destructive font-medium">You are offline. This feature requires an internet connection.</p>
          </div>
        )}
        <div className="bg-primary/10 p-6 rounded-full mb-6">
          <MapPin className="h-12 w-12 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-3">Restaurants Near You</h2>
        <p className="text-muted-foreground mb-8 max-w-sm">
          Discover places around you that match your exact dietary standards. Powered by AI and OpenStreetMap.
        </p>
        <button
          onClick={() => findRestaurants()}
          disabled={!isOnline}
          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 py-4 font-semibold shadow-lg transition-transform active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Navigation className="h-5 w-5" />
          Find Restaurants
        </button>
      </div>
    );
  }

  if (state === "locating" || state === "searching") {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <motion.div
          key="searching"
          className="text-center z-10"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.35 } }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={messageIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.2 } }}
              exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
              className="text-xl font-medium tracking-tight text-foreground flex justify-center"
            >
              <div className="relative inline-flex">
                <span>{message}</span>
                <span className="absolute left-full text-left w-8">
                  {'.'.repeat(dotsCount)}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center h-full animate-in fade-in duration-500">
        <div className="bg-destructive/10 p-4 rounded-full mb-4 text-destructive">
          <Info className="h-8 w-8" />
        </div>
        <p className="text-foreground font-medium mb-6">{errorMsg}</p>
        <button
          onClick={() => setState("idle")}
          className="bg-muted hover:bg-muted/80 text-foreground rounded-full px-6 py-2 font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">Nearby</h2>
        <div className="flex items-center gap-2">
          {cachedResult && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">Cached</span>
          )}
          <button 
            onClick={() => findRestaurants(true)} 
            className="p-2 bg-muted rounded-full hover:bg-muted/80 text-foreground transition-colors"
            title="Refresh results"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="bg-warning/20 border border-warning/30 p-3 rounded-lg mb-6 flex gap-3 items-start">
        <Info className="h-5 w-5 text-warning-foreground shrink-0 mt-0.5" />
        <p className="text-xs text-warning-foreground font-medium leading-relaxed">
          <strong>AI-Assisted:</strong> These recommendations are generated by AI {fallbackUsed ? "based on your general area" : "using nearby map data"}. Always verify with the restaurant staff before dining.
        </p>
      </div>

      {results.length === 0 ? (
        <div className="text-center p-8 border border-border rounded-2xl bg-muted/30">
          <p className="text-muted-foreground">No matching restaurants found nearby. Try selecting different standards.</p>
        </div>
      ) : (
        <div className="space-y-4 pb-8">
          {results.map((r, i) => (
            <div key={r.id || i} className="border border-border bg-white rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg text-foreground">{r.name}</h3>
                  <p className="text-sm text-muted-foreground capitalize">{r.cuisine}</p>
                </div>
                {r.confidence && (
                  <span className={`text-xs font-semibold px-2 py-1 rounded-md ${
                    r.confidence === 'high' ? 'bg-green-100 text-green-700' :
                    r.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {r.confidence.toUpperCase()} MATCH
                  </span>
                )}
              </div>
              
              <p className="text-sm leading-relaxed text-foreground">{r.matchSummary}</p>
              
              {r.cautions && r.cautions.length > 0 && (
                <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Watch out for</span>
                  <ul className="list-disc pl-4 space-y-1">
                    {r.cautions.map((caution, idx) => (
                      <li key={idx} className="text-xs text-muted-foreground">{caution}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-2 flex justify-between items-center">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleFeedback(r.id, "positive")}
                    className={`p-1.5 rounded-md transition-colors ${
                      feedback[r.id] === "positive" 
                        ? "bg-green-100 text-green-700" 
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                    title="Good recommendation"
                  >
                    <ThumbsUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleFeedback(r.id, "negative")}
                    className={`p-1.5 rounded-md transition-colors ${
                      feedback[r.id] === "negative" 
                        ? "bg-red-100 text-red-700" 
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                    title="Bad recommendation"
                  >
                    <ThumbsDown className="h-4 w-4" />
                  </button>
                </div>
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.name)}${r.lat && r.lon ? `+${r.lat},${r.lon}` : ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  Search Maps
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
