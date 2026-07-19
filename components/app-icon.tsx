import type { SVGProps } from "react";

export type AppIconName =
  | "home"
  | "pin"
  | "plus"
  | "map"
  | "user"
  | "folder"
  | "search"
  | "bell"
  | "link"
  | "scan"
  | "edit"
  | "external"
  | "chevron"
  | "back"
  | "food"
  | "attraction"
  | "shopping"
  | "entertainment"
  | "lodging"
  | "other";

const paths: Record<AppIconName, string> = {
  home: "M3 10.8 12 3l9 7.8V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-10.2Z",
  pin: "M12 22s7-6.1 7-12A7 7 0 0 0 5 10c0 5.9 7 12 7 12Z M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  plus: "M12 5v14M5 12h14",
  map: "m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z M9 3v15m6-12v15",
  user: "M20 21a8 8 0 0 0-16 0M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
  folder: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z",
  search: "m21 21-4.4-4.4m2.4-5.1a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4",
  link: "M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1",
  scan: "M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M8 8h8v8H8z",
  edit: "M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3ZM14.5 7.5l3 3",
  external: "M14 4h6v6M20 4l-9 9M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5",
  chevron: "m6 9 6 6 6-6",
  back: "m15 18-6-6 6-6",
  food: "M7 3v8M4 3v5a3 3 0 0 0 6 0V3M7 11v10M17 3v18M17 3c2 2 3 4 3 6h-3",
  attraction: "M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4",
  shopping: "M5 8h14l-1 13H6L5 8ZM8 8a4 4 0 0 1 8 0",
  entertainment: "M4 7h16v12H4zM8 7v12M16 7v12M4 12h16",
  lodging: "M4 19V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v11M4 13h16M7 10h3",
  other: "M12 3 14.8 9l6.2.6-4.7 4.1 1.4 6.1-5.7-3.2-5.7 3.2 1.4-6.1L3 9.6 9.2 9 12 3Z",
};

export function AppIcon({
  name,
  size = 20,
  strokeWidth = 1.8,
  ...props
}: { name: AppIconName; size?: number; strokeWidth?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d={paths[name]} />
    </svg>
  );
}
