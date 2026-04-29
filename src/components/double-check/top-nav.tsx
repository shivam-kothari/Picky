import { Menu, UserCircle } from "lucide-react";

export function TopNav() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-border shadow-sm">
      <div className="flex h-14 items-center justify-between px-4">
        <button className="p-2 text-foreground/80 hover:bg-muted rounded-full">
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold text-primary tracking-tight">Double Check</h1>
        <button className="p-1 rounded-full border border-border bg-muted overflow-hidden hover:bg-muted/80">
          <UserCircle className="h-6 w-6 text-foreground/70" />
        </button>
      </div>
    </header>
  );
}
