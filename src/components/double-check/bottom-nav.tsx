import { Home, Maximize, ShieldCheck, History } from "lucide-react";

type BottomNavProps = {
  activeTab: "home" | "scan" | "standards" | "history";
  onTabChange: (tab: "home" | "scan" | "standards" | "history") => void;
};

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: "home", label: "Home", Icon: Home },
    { id: "scan", label: "Scanner", Icon: Maximize },
    { id: "standards", label: "Standards", Icon: ShieldCheck },
    { id: "history", label: "History", Icon: History },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 w-full bg-white border-t border-border shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex justify-around items-center h-16">
        {tabs.map(({ id, label, Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? "fill-primary/10" : ""}`} />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
