import { ImageResponse } from "next/og";

// iOS home-screen icon (iOS ignores SVG touch icons). Same mark as icon.svg.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#b9572b" }}>
        <svg width="180" height="180" viewBox="0 0 64 64">
          <rect x="14" y="22" width="36" height="28" rx="6" fill="none" stroke="#fffdf9" strokeWidth="4" />
          <path d="M25 22v-4a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v4" fill="none" stroke="#fffdf9" strokeWidth="4" strokeLinecap="round" />
          <path d="M24 36l6 6 10-11" fill="none" stroke="#fffdf9" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    ),
    size,
  );
}
