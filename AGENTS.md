<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Marketing homepage product shots

The homepage product previews are **live HTML/Tailwind mockups** in
`src/components/marketing/mockups.tsx` (DashboardMock, CalendarMock,
ClientsMock, SyncMock, ReportsMock) — not screenshots. They intentionally
reuse the dashboard's design tokens and the brand `<Logo>`. If you change a
dashboard screen's layout or visual language, update the matching mockup so
the homepage keeps reflecting the real app.

# Brand

The logo is `src/components/brand/logo.tsx` (`<Logo>`); browser/OS icons are
`src/app/icon.svg` and `src/app/apple-icon.svg`. Keep all three in sync.
