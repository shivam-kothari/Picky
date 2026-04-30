export function TopNav({ onHomeClick }: { onHomeClick?: () => void }) {
  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-border shadow-sm">
      <div className="flex h-14 items-center justify-center px-4">
        <button 
          onClick={onHomeClick}
          className="text-xl font-bold text-primary tracking-tight hover:opacity-80 transition-opacity"
        >
          Double Check
        </button>
      </div>
    </header>
  );
}
