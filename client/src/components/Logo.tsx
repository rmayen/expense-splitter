export function Logo() {
  return (
    <span className="flex items-center gap-2.5 text-[15px] font-semibold tracking-tight">
      <span aria-hidden className="grid size-7 place-items-center rounded-lg bg-accent text-accent-ink">
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 4v16M17 4v16M4 9h6M14 15h6" />
        </svg>
      </span>
      Expense Splitter
    </span>
  );
}
