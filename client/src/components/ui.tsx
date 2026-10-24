import { X } from "lucide-react";
import { useEffect, useId, useRef, type ButtonHTMLAttributes, type CSSProperties, type InputHTMLAttributes, type ReactNode } from "react";
import type { Member } from "../api";
import { avatarColor, initials } from "../lib/format";

export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
};

export function Button({ variant = "secondary", size = "md", className, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl font-medium whitespace-nowrap transition duration-200 active:translate-y-px disabled:pointer-events-none disabled:opacity-40",
        size === "sm" ? "h-8 px-3 text-[13px]" : "h-10 px-4 text-sm",
        variant === "primary" && "bg-accent text-accent-ink hover:brightness-110 shadow-[0_10px_24px_-14px_var(--color-accent)]",
        variant === "secondary" && "border border-line bg-raised text-ink hover:border-white/20 hover:bg-white/[0.06]",
        variant === "ghost" && "text-muted hover:bg-white/[0.05] hover:text-ink",
        variant === "danger" && "text-negative hover:bg-negative/10",
        className,
      )}
    />
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "h-10 w-full min-w-0 rounded-xl border border-line bg-bg/70 px-3.5 text-sm text-ink transition placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/20",
        className,
      )}
    />
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="grid gap-2">
      <span className="text-[13px] font-medium text-muted">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </div>
  );
}

export function Card({ className, style, children }: { className?: string; style?: CSSProperties; children: ReactNode }) {
  return <section style={style} className={cn("rounded-2xl border border-line bg-surface p-5 sm:p-6", className)}>{children}</section>;
}

export function CardTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-4">
      <h2 className="text-[15px] font-semibold tracking-tight">{children}</h2>
      {action}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-lg bg-white/[0.06]", className)} />;
}

export function Avatar({ member, size = "md" }: { member: Pick<Member, "id" | "name">; size?: "sm" | "md" }) {
  return (
    <span
      title={member.name}
      aria-label={member.name}
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-semibold text-bg ring-2 ring-surface",
        size === "sm" ? "size-7 text-[11px]" : "size-9 text-xs",
      )}
      style={{ background: avatarColor(member.id) }}
    >
      {initials(member.name)}
    </span>
  );
}

export function AvatarStack({ members, max = 5 }: { members: Member[]; max?: number }) {
  const shown = members.slice(0, max);
  const extra = members.length - shown.length;
  return (
    <div className="flex items-center">
      {shown.map((m, i) => (
        <span key={m.id} className={i === 0 ? "" : "-ml-2"}>
          <Avatar member={m} size="sm" />
        </span>
      ))}
      {extra > 0 && (
        <span className="-ml-2 grid size-7 place-items-center rounded-full bg-raised text-[11px] font-semibold text-muted ring-2 ring-surface">
          +{extra}
        </span>
      )}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="grid justify-items-center gap-3 px-4 py-10 text-center">
      <div className="grid size-12 place-items-center rounded-2xl border border-line bg-raised text-accent">{icon}</div>
      <div>
        <p className="font-medium">{title}</p>
        <p className="mx-auto mt-1 max-w-xs text-sm text-muted">{body}</p>
      </div>
      {action}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-labelledby={titleId}
      className="modal m-auto w-[min(calc(100vw-2rem),30rem)] rounded-2xl border border-line bg-surface p-0 text-ink shadow-2xl shadow-black/50"
    >
      {open && (
        <div>
          <div className="flex items-start justify-between gap-4 p-6 pb-4">
            <div>
              <h2 id={titleId} className="text-lg font-semibold tracking-tight">
                {title}
              </h2>
              {description && <p className="mt-1 text-sm text-muted">{description}</p>}
            </div>
            <Button variant="ghost" size="sm" aria-label="Close" onClick={onClose} className="-mr-2 -mt-1 size-8 p-0">
              <X className="size-4" />
            </Button>
          </div>
          <div className="px-6 pb-6">{children}</div>
        </div>
      )}
    </dialog>
  );
}
