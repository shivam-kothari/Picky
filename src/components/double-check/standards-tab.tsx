import { Leaf, Drumstick, Apple, Check } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { CRITERIA } from "@/lib/criteria";

function getSubtitle(id: string) {
  if (id === "no-dairy") return "Lactose & milk proteins";
  if (id === "no-gluten") return "Wheat, barley, and rye";
  if (id === "no-shellfish") return "Crustaceans & mollusks";
  if (id === "no-peanuts") return "Includes peanuts & tree nuts";
  if (id === "kosher") return "Strict dietary laws";
  if (id === "no-meat") return "All animal flesh";
  return "";
}

type StandardsTabProps = {
  active: Set<string>;
  onChange: (active: Set<string>) => void;
  onSave: () => void;
};

export function StandardsTab({ active, onChange, onSave }: StandardsTabProps) {
  const toggle = (id: string) => {
    const next = new Set(active);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  };

  return (
    <div className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Dietary Standards</h2>
        <p className="text-muted-foreground text-sm">
          Configure your safety filters for a personalized dining experience.
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-bold text-muted-foreground tracking-widest uppercase">
          Dietary Styles
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {["vegan", "vegetarian", "paleo", "keto"].map((style) => {
            // Find corresponding criterion if exists, or just use mock for UI if it doesn't map 1:1
            const isActive = active.has(style);
            const icons: Record<string, React.ReactNode> = {
              vegan: <Leaf className="h-5 w-5" />,
              vegetarian: <Leaf className="h-5 w-5" />,
              paleo: <Drumstick className="h-5 w-5" />,
              keto: <Apple className="h-5 w-5" />,
            };

            return (
              <button
                key={style}
                onClick={() => toggle(style)}
                className={`flex flex-col items-start p-4 border rounded-xl space-y-3 transition-colors ${
                  isActive
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-white text-foreground hover:bg-muted/50"
                }`}
              >
                {icons[style]}
                <span className="font-semibold capitalize">{style}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-muted-foreground tracking-widest uppercase">
            Allergies & Intolerances
          </h3>
          <span className="text-[10px] text-destructive font-bold uppercase flex items-center">
            <span className="mr-1">⚠</span> Strict Mode Active
          </span>
        </div>

        <div className="space-y-3">
          {CRITERIA.filter(c => !["vegan", "vegetarian", "paleo", "keto"].includes(c.id)).map((criterion) => {
            const isActive = active.has(criterion.id);
            return (
              <div
                key={criterion.id}
                className="flex items-center justify-between p-4 border border-border bg-white rounded-xl"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${isActive ? "bg-red-100 text-red-600" : "bg-muted text-muted-foreground"}`}>
                     <div className="h-6 w-6 rounded-sm bg-current opacity-20" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{criterion.label}</p>
                    <p className="text-xs text-muted-foreground">{getSubtitle(criterion.id)}</p>
                  </div>
                </div>
                <Switch
                  checked={isActive}
                  onCheckedChange={() => toggle(criterion.id)}
                  className={isActive ? "bg-red-600" : ""}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-3 pt-4">
        <button
          onClick={onSave}
          className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
        >
          Save Standards <Check className="h-5 w-5" />
        </button>
        <button
          onClick={onSave}
          className="w-full bg-white border border-border text-foreground py-4 rounded-xl font-semibold hover:bg-muted/50 transition-colors"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
