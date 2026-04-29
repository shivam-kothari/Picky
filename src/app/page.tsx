"use client";

import { useEffect, useState } from "react";
import { TopNav } from "@/components/double-check/top-nav";
import { BottomNav } from "@/components/double-check/bottom-nav";
import { HomeTab } from "@/components/double-check/home-tab";
import { StandardsTab } from "@/components/double-check/standards-tab";
import { ScannerTab } from "@/components/double-check/scanner-tab";
import { VerdictCard } from "@/components/double-check/verdict-card";
import type { ScanVerdict } from "@/lib/scan";

export type TabState = "home" | "scan" | "standards" | "history";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabState>("home");
  const [active, setActive] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);
  const [history, setHistory] = useState<ScanVerdict[]>([]);

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
      setIsLoaded(true);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(
        "double-check:active-criteria",
        JSON.stringify(Array.from(active))
      );
    }
  }, [active, isLoaded]);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "") as TabState;
    if (["scan", "standards", "history"].includes(hash)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab(hash);
    }

    const handlePopState = (event: PopStateEvent) => {
      if (event.state?.tab) {
        setActiveTab(event.state.tab);
      } else {
        const fallbackHash = window.location.hash.replace("#", "");
        if (["scan", "standards", "history"].includes(fallbackHash)) {
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

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background">
      <TopNav />
      <main className="flex-1 flex flex-col relative pb-16">
        <div className="flex-1 flex flex-col">
          {activeTab === "home" && <HomeTab onTabChange={handleTabChange} />}
          {activeTab === "standards" && (
            <StandardsTab 
              active={active} 
              onChange={setActive} 
              onSave={() => handleTabChange("scan")} 
            />
          )}
          {activeTab === "scan" && (
            <ScannerTab 
              active={active} 
              onScanComplete={(verdict) => setHistory(prev => [verdict, ...prev])}
            />
          )}
          {activeTab === "history" && (
            <div className="p-6 pt-12 flex flex-col items-center justify-start text-center animate-in fade-in duration-500 flex-1">
              <h2 className="text-2xl font-bold text-foreground mb-4">History</h2>
              
              {history.length === 0 ? (
                <div className="bg-muted/50 border border-border p-6 rounded-2xl max-w-sm w-full mt-10">
                  <p className="text-muted-foreground mb-4">Your previous menu scans from this session will appear here.</p>
                  <div className="bg-warning/20 border border-warning/30 p-3 rounded-lg text-left">
                    <p className="text-xs text-warning-foreground font-medium leading-relaxed">
                      <strong>Privacy Note:</strong> Double Check does not collect or retain your data. Your history is only stored locally during your current visit and will be completely wiped as soon as you refresh the page or leave the app.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="w-full max-w-lg mx-auto flex flex-col gap-8 pb-8 text-left">
                  <div className="bg-warning/20 border border-warning/30 p-3 rounded-lg">
                    <p className="text-xs text-warning-foreground font-medium leading-relaxed">
                      <strong>Privacy Note:</strong> Your history is only stored locally during your current visit and will be wiped when you leave the app.
                    </p>
                  </div>
                  {history.map((verdict, i) => (
                    <div key={i} className="border border-border bg-white rounded-2xl overflow-hidden shadow-sm">
                      <div className="bg-muted/30 px-4 py-2 border-b border-border">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Scan {history.length - i}</span>
                      </div>
                      <div className="p-6">
                        <VerdictCard result={verdict} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}
