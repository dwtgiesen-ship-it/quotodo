// Schedulemode brand mark: three stacked, offset rounded bars in a violet
// gradient — the "schedule" motif. Pure SVG, no client hooks, so it can be
// dropped into server components, client components, and the dashboard alike.
// Size it with `className` (e.g. "size-8"); the gradient scales with the box.

export function Logo({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" role="img" aria-label="Schedulemode" className={className}>
      <defs>
        <linearGradient id="sm-logo-grad" x1="6" y1="6.5" x2="35" y2="33.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#B79CF6" />
          <stop offset="1" stopColor="#7C5CE6" />
        </linearGradient>
      </defs>
      {/* top — short, right-aligned */}
      <rect x="17" y="6.5" width="18" height="7.5" rx="3.75" fill="url(#sm-logo-grad)" />
      {/* middle — full width */}
      <rect x="5" y="16.25" width="30" height="7.5" rx="3.75" fill="url(#sm-logo-grad)" />
      {/* bottom — short, left-aligned */}
      <rect x="5" y="26" width="18" height="7.5" rx="3.75" fill="url(#sm-logo-grad)" />
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
