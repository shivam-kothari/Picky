import { Maximize, ShieldCheck, History } from "lucide-react";

type HomeTabProps = {
  onTabChange: (tab: "home" | "scan" | "standards" | "history") => void;
};

export function HomeTab({ onTabChange }: HomeTabProps) {
  return (
    <div className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Welcome!</h2>
        <p className="text-muted-foreground">Ready to eat safely today?</p>
      </div>

      <button
        onClick={() => document.getElementById("global-camera-input")?.click()}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl p-8 flex flex-col items-center justify-center space-y-4 shadow-lg transition-transform active:scale-95"
      >
        <div className="bg-white/20 p-4 rounded-full">
          <Maximize className="h-8 w-8 text-white" />
        </div>
        <span className="text-2xl font-semibold">Scan a Menu</span>
      </button>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => onTabChange("standards")}
          className="bg-white border border-border rounded-2xl p-6 flex flex-col items-center justify-center space-y-3 shadow-sm hover:shadow-md transition-shadow active:scale-95"
        >
          <div className="bg-orange-100 p-3 rounded-full text-orange-600">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <span className="font-semibold text-sm text-center">Set Your Standards</span>
        </button>

        <button
          onClick={() => onTabChange("history")}
          className="bg-white border border-border rounded-2xl p-6 flex flex-col items-center justify-center space-y-3 shadow-sm hover:shadow-md transition-shadow active:scale-95"
        >
          <div className="bg-red-100 p-3 rounded-full text-red-600">
            <History className="h-6 w-6" />
          </div>
          <span className="font-semibold text-sm text-center">View History</span>
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Tips for Safe Dining</h3>
          <button className="text-primary text-sm font-semibold hover:underline">View All</button>
        </div>

        <div className="space-y-3">
          <div className="bg-white border border-border p-4 rounded-xl flex gap-4 items-center">
            <div className="h-16 w-16 bg-muted rounded-lg shrink-0 flex items-center justify-center text-3xl">
              🧑‍🍳
            </div>
            <div>
              <h4 className="font-semibold text-sm">Asking About Cross-Contamination</h4>
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                Learn the best questions to ask servers to ensure your meal is prepared safely in the kitchen.
              </p>
            </div>
          </div>
          <div className="bg-white border border-border p-4 rounded-xl flex gap-4 items-center">
            <div className="h-16 w-16 bg-muted rounded-lg shrink-0 flex items-center justify-center text-3xl">
              🧑‍🍳
            </div>
            <div>
              <h4 className="font-semibold text-sm">Hidden Sources of Gluten</h4>
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                Sauces, marinades, and dressings often contain hidden gluten. Here is a quick guide.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
