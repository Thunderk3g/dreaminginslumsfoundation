import type { ReactNode } from "react";
import Link from "next/link";

/**
 * Internal-tool primitives, tuned for scanning: dense rows, plain language, and
 * status encoded as colour *and* text so it survives a greyscale print or a
 * colour-blind reader.
 *
 * No "use client" and no "server-only" here on purpose — both sides import it.
 */

export type ActionState = { error?: string; ok?: string } | null;

/* ------------------------------------------------------------------ table -- */

export const th =
  "sticky top-0 z-10 bg-paper-deep px-3 py-2 text-left align-bottom spec whitespace-nowrap " +
  "border-b border-rule-strong";
export const td = "px-3 py-2 align-top border-b border-rule";

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[42rem] border-collapse text-sm">{children}</table>
    </div>
  );
}

/* ------------------------------------------------------------------ pills -- */

type Tone = "neutral" | "ok" | "warn" | "bad" | "info";

const tones: Record<Tone, string> = {
  neutral: "bg-paper-deep text-ink-2 border-rule-strong",
  ok: "bg-ok-soft text-ok border-ok",
  warn: "bg-warn-soft text-warn border-warn",
  bad: "bg-bad-soft text-bad border-bad",
  info: "bg-clay-soft text-clay border-clay",
};

export function Pill({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-sm border px-1.5 py-0.5 font-mono text-[0.6875rem] uppercase tracking-wider ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

/** Live or hidden, said in words rather than only in colour. */
export function LivePill({ live }: { live: boolean }) {
  return <Pill tone={live ? "ok" : "neutral"}>{live ? "Live" : "Hidden"}</Pill>;
}

/* ------------------------------------------------------------------ shell -- */

export function PageHeader({
  title,
  meta,
  crumbs,
  actions,
}: {
  title: string;
  meta?: ReactNode;
  crumbs?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 -mx-5 mb-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-rule-strong bg-paper-deep/92 px-5 py-3 backdrop-blur-sm lg:-mx-8 lg:px-8">
      <div className="min-w-0">
        {crumbs ? <div className="spec mb-0.5">{crumbs}</div> : null}
        <h1 className="truncate text-[1.375rem] font-semibold leading-tight tracking-tight text-ink">
          {title}
        </h1>
        {meta ? <div className="mt-0.5 text-sm text-ink-2">{meta}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function Crumbs({ trail }: { trail: { label: string; href?: string }[] }) {
  return (
    <span>
      {trail.map((crumb, index) => (
        <span key={`${crumb.label}-${index}`}>
          {index > 0 ? <span className="px-1.5 opacity-50">/</span> : null}
          {crumb.href ? (
            <Link href={crumb.href} className="hover:text-ink hover:underline">
              {crumb.label}
            </Link>
          ) : (
            crumb.label
          )}
        </span>
      ))}
    </span>
  );
}

/**
 * A plain-language explanation of what a screen is for, shown above it.
 *
 * Every screen in this console has one. It is used by people who did not build
 * it and will not read documentation, and a sentence at the top of the page is
 * the only documentation anybody reads.
 */
export function Explain({ children }: { children: ReactNode }) {
  return (
    <p className="mb-5 max-w-[70ch] border-l-2 border-clay bg-clay-soft/40 py-2 pl-3 text-sm leading-relaxed text-ink-2">
      {children}
    </p>
  );
}

export function Panel({
  title,
  children,
  actions,
}: {
  title?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-sm border border-rule bg-surface">
      {title ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule px-3 py-2.5">
          <h2 className="text-base font-semibold leading-none text-ink">{title}</h2>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function Stat({ label, value, href }: { label: string; value: ReactNode; href?: string }) {
  const body = (
    <>
      <div className="spec">{label}</div>
      <div className="mt-1 font-mono text-2xl tabular-nums tracking-tight">{value}</div>
    </>
  );
  return href ? (
    <Link href={href} className="block rounded-sm border border-rule bg-surface px-3 py-3 hover:border-ink">
      {body}
    </Link>
  ) : (
    <div className="rounded-sm border border-rule bg-surface px-3 py-3">{body}</div>
  );
}

export function Note({ children, tone = "info" }: { children: ReactNode; tone?: Tone }) {
  return <p className={`border px-3 py-2 text-sm ${tones[tone]} [&_a]:underline`}>{children}</p>;
}

/** Nothing here yet — say what would put something here, and offer the way in. */
export function Empty({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="px-3 py-10 text-center">
      <p className="mx-auto max-w-[46ch] text-sm leading-relaxed text-ink-2">{children}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

/* ----------------------------------------------------------------- fields -- */

export const control =
  "w-full rounded-sm border border-rule-strong bg-surface px-2 py-1.5 text-sm text-ink " +
  "focus:border-ink focus:outline-none disabled:bg-paper-deep disabled:text-ink-3";

export function Field({
  label,
  name,
  hint,
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  hint?: string;
  className?: string;
}) {
  const id = `f-${name}`;
  return (
    <div className={className}>
      <label htmlFor={id} className="spec mb-1 block text-ink">
        {label}
        {props.required ? <span className="text-clay"> *</span> : null}
      </label>
      <input id={id} name={name} className={control} {...props} />
      {hint ? <p className="mt-1 text-xs text-ink-2">{hint}</p> : null}
    </div>
  );
}

export function TextArea({
  label,
  name,
  hint,
  className = "",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  name: string;
  hint?: string;
  className?: string;
}) {
  const id = `f-${name}`;
  return (
    <div className={className}>
      <label htmlFor={id} className="spec mb-1 block text-ink">
        {label}
      </label>
      <textarea id={id} name={name} rows={props.rows ?? 4} className={control} {...props} />
      {hint ? <p className="mt-1 text-xs text-ink-2">{hint}</p> : null}
    </div>
  );
}

export function Check({
  label,
  name,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string }) {
  const id = `f-${name}`;
  return (
    <label htmlFor={id} className="flex items-center gap-2 text-sm">
      <input id={id} name={name} type="checkbox" className="h-4 w-4 accent-[#5b2e91]" {...props} />
      {label}
    </label>
  );
}
