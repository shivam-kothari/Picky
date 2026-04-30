"use client";

import { useCallback, useEffect, useState } from "react";
import { TopNav } from "@/components/double-check/top-nav";
import { BottomNav } from "@/components/double-check/bottom-nav";
import { HomeTab } from "@/components/double-check/home-tab";
import { StandardsTab } from "@/components/double-check/standards-tab";
import { ScannerTab } from "@/components/double-check/scanner-tab";
import { VerdictCard } from "@/components/double-check/verdict-card";
import { NearbyTab } from "@/components/double-check/nearby-tab";
import { ThumbsUp, ThumbsDown, Trash2, WifiOff } from "lucide-react";
import type { ScanVerdict } from "@/lib/scan";
import {
  addScanToHistory,
  getScanHistory,
  setScanFeedback,
  clearScanHistory,
  type ScanHistoryEntry,
} from "@/lib/scan-history";

export type TabState = "home" | "scan" | "standards" | "history" | "nearby";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabState>("home");
  const [active, setActive] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);
  const [history, setHistory] = useState<ScanHistoryEntry[]>([]);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  const handleGlobalFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPendingFile(file);
      handleTabChange("scan");
    }
    e.target.value = "";
  };

  // Load persisted criteria
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        const stored = localStorage.getItem("double-check:active-criteria");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setActive(new Set(parsed));
          }
        }
      } catch (e) {
        console.error("Failed to parse stored criteria", e);
      }

      // Load persisted scan history
      setHistory(getScanHistory());
      setIsLoaded(true);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  // Persist criteria changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(
        "double-check:active-criteria",
        JSON.stringify(Array.from(active))
      );
    }
  }, [active, isLoaded]);

  // Online/offline detection
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

  // Hash-based navigation
  useEffect(() => {
    const hash = window.location.hash.replace("#", "") as TabState;
    if (["scan", "standards", "history", "nearby"].includes(hash)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab(hash);
    }

    const handlePopState = (event: PopStateEvent) => {
      if (event.state?.tab) {
        setActiveTab(event.state.tab);
      } else {
        const fallbackHash = window.location.hash.replace("#", "");
        if (["scan", "standards", "history", "nearby"].includes(fallbackHash)) {
          setActiveTab(fallbackHash as TabState);
        } else {
          setActiveTab("home");
        }
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleTabChange = (tab: TabState) => {
    if (tab === activeTab) return;
    
    if (tab === "home") {
      window.history.back();
      setActiveTab("home");
    } else {
      if (activeTab === "home") {
        window.history.pushState({ tab }, "", `#${tab}`);
      } else {
        window.history.replaceState({ tab }, "", `#${tab}`);
      }
      setActiveTab(tab);
    }
  };

  const handleScanComplete = useCallback((verdict: ScanVerdict) => {
    addScanToHistory(verdict);
    setHistory(getScanHistory());
  }, []);

  const handleFeedback = useCallback((entryId: string, type: "positive" | "negative") => {
    setScanFeedback(entryId, type);
    setHistory(getScanHistory());
  }, []);

  const handleClearHistory = useCallback(() => {
    clearScanHistory();
    setHistory([]);
  }, []);

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background">
      <TopNav onHomeClick={() => handleTabChange("home")} />

      {/* Offline banner */}
      {!isOnline && (
        <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-2 flex items-center gap-2 justify-center">
          <WifiOff className="h-4 w-4 text-destructive" />
          <span className="text-xs font-medium text-destructive">You are offline. Some features are unavailable.</span>
        </div>
      )}

      <main className="flex-1 flex flex-col relative pb-16">
        <input 
          type="file" 
          id="global-camera-input" 
          accept="image/*" 
          capture="environment" 
          className="hidden" 
          onChange={handleGlobalFile} 
        />
        <div className="flex-1 flex flex-col">
          {activeTab === "home" && <HomeTab onTabChange={handleTabChange} />}
          {activeTab === "standards" && (
            <StandardsTab 
              active={active} 
              onChange={setActive} 
              onSave={() => handleTabChange("home")} 
            />
          )}
          {activeTab === "scan" && (
            <ScannerTab 
              active={active} 
              pendingFile={pendingFile}
              clearPendingFile={() => setPendingFile(null)}
              onScanComplete={handleScanComplete}
            />
          )}
          {activeTab === "history" && (
            <div className="p-6 pt-12 flex flex-col items-center justify-start text-center animate-in fade-in duration-500 flex-1">
              <div className="flex items-center justify-between w-full max-w-lg mb-4">
                <h2 className="text-2xl font-bold text-foreground">History</h2>
                {history.length > 0 && (
                  <button
                    onClick={handleClearHistory}
                    className="text-xs text-destructive hover:underline flex items-center gap-1 font-medium"
                  >
                    <Trash2 className="h-3 w-3" />
                    Clear All
                  </button>
                )}
              </div>
              
              {history.length === 0 ? (
                <div className="bg-muted/50 border border-border p-6 rounded-2xl max-w-sm w-full mt-10">
                  <p className="text-muted-foreground mb-4">Your previous menu scans will appear here.</p>
                  <div className="bg-warning/20 border border-warning/30 p-3 rounded-lg text-left">
                    <p className="text-xs text-warning-foreground font-medium leading-relaxed">
                      <strong>Privacy Note:</strong> Your scan history is stored only on this device and never sent to any server. You can clear it any time.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="w-full max-w-lg mx-auto flex flex-col gap-8 pb-8 text-left">
                  <div className="bg-warning/20 border border-warning/30 p-3 rounded-lg">
                    <p className="text-xs text-warning-foreground font-medium leading-relaxed">
                      <strong>Privacy Note:</strong> Your history is stored only on this device and never sent to any server.
                    </p>
                  </div>
                  {history.map((entry, i) => (
                    <div key={entry.id} className="border border-border bg-white rounded-2xl overflow-hidden shadow-sm">
                      <div className="bg-muted/30 px-4 py-2 border-b border-border flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                          Scan {history.length - i}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">
                            {new Date(entry.timestamp).toLocaleDateString(undefined, {
                              month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                            })}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleFeedback(entry.id, "positive")}
                              className={`p-1 rounded transition-colors ${
                                entry.feedback === "positive"
                                  ? "bg-green-100 text-green-700"
                                  : "text-muted-foreground hover:bg-muted"
                              }`}
                              title="Accurate result"
                            >
                              <ThumbsUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleFeedback(entry.id, "negative")}
                              className={`p-1 rounded transition-colors ${
                                entry.feedback === "negative"
                                  ? "bg-red-100 text-red-700"
                                  : "text-muted-foreground hover:bg-muted"
                              }`}
                              title="Inaccurate result"
                            >
                              <ThumbsDown className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="p-6">
                        <VerdictCard result={entry.verdict} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {activeTab === "nearby" && (
            <NearbyTab active={active} />
          )}
        </div>
      </main>
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}
