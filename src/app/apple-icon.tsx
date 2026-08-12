import { ImageResponse } from "next/og";

/**
 * The touch icon iOS uses when someone adds Voicebox to their home screen.
 *
 * Generated rather than committed as a binary so it can't drift from the mark
 * in `brand.tsx`. Apple ignores transparency and rounds the corners itself, so
 * this paints a solid square edge to edge.
 */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#09090B",
        }}
      >
        <svg width="118" height="118" viewBox="0 0 24 24" fill="none">
          <path
            d="M3 5h18M6 12h12M10 19h4"
            stroke="#00C48C"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </svg>
      </div>
    ),
    size,
  );
}
