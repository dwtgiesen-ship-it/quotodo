// Schedulemode brand mark: three stacked, offset rounded bars in a violet
// gradient — the "schedule" motif. Pure SVG, no client hooks, so it can be
// dropped into server components, client components, and the dashboard alike.
// Size it with `className` (e.g. "size-8"); the gradient scales with the box.

export function Logo({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" role="img" aria-label="Schedulemode" className={className}>
      <defs>
        <linearGradient id="sm-logo-grad" x1="34" y1="6" x2="8" y2="34" gradientUnits="userSpaceOnUse">
          <stop stopColor="#C4A7F5" />
          <stop offset="1" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      <rect x="15" y="6.5" width="21" height="7.5" rx="3.75" fill="url(#sm-logo-grad)" />
      <rect x="6" y="16.25" width="28" height="7.5" rx="3.75" fill="url(#sm-logo-grad)" />
      <rect x="9" y="26" width="19" height="7.5" rx="3.75" fill="url(#sm-logo-grad)" />
    </svg>
  );
}

// The mark on a soft rounded tile — used where the logo needs a container
// (app icons, avatars on dark chrome). `tile` controls the backdrop.
export function LogoTile({ className = "size-8", tile = "bg-white" }: { className?: string; tile?: string }) {
  return (
    <span className={`grid place-items-center rounded-xl ${tile} ${className}`}>
      <Logo className="size-[68%]" />
    </span>
  );
}
