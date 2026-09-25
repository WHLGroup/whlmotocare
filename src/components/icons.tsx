import type { CSSProperties } from "react";

export type IconName = "arrow-right" | "arrow-up-right" | "search" | "bag" | "wrench" | "pin" | "phone" | "check" | "shield" | "truck" | "clock" | "menu" | "x" | "plus" | "minus" | "chevron-down" | "chevron-right" | "mail" | "motorcycle" | "whatsapp" | "package" | "star" | "filter" | "info" | "trash" | "calendar" | "check-circle" | "headphones" | "bolt";

const paths: Record<IconName, React.ReactNode> = {
  "arrow-right": <><path d="M4 12h16M14 6l6 6-6 6" /></>,
  "arrow-up-right": <><path d="M6 18 18 6M6 6h12v12" /></>,
  search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></>,
  bag: <><path d="M5 7h14l1 14H4L5 7Z" /><path d="M8 8V6a4 4 0 0 1 8 0v2" /></>,
  wrench: <><path d="M14.8 6.2a5 5 0 0 0-6.4 6.4l-5.8 5.8a2.1 2.1 0 0 0 3 3l5.8-5.8a5 5 0 0 0 6.4-6.4l-3 3-3-3 3-3Z" /></>,
  pin: <><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
  phone: <><path d="m7 3 3 5-2.5 2a14 14 0 0 0 6.5 6.5l2-2.5 5 3-.7 3.2c-.2 1-1.1 1.6-2.1 1.5C9.8 20.8 3.2 14.2 2.3 5.8c-.1-1 .5-1.9 1.5-2.1L7 3Z" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  shield: <><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" /><path d="m8 12 3 3 5-6" /></>,
  truck: <><path d="M3 5h12v12H3zM15 9h4l3 4v4h-7" /><circle cx="7" cy="18" r="2" /><circle cx="18" cy="18" r="2" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  x: <path d="m6 6 12 12M6 18 18 6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  "chevron-down": <path d="m6 9 6 6 6-6" />,
  "chevron-right": <path d="m9 6 6 6-6 6" />,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 6 9 7 9-7" /></>,
  motorcycle: <><circle cx="5" cy="17" r="4" /><circle cx="19" cy="17" r="4" /><path d="m5 17 6-9 8 9M7 8h5M14 4h3l2 13M10 11h6M9 17h5" /></>,
  whatsapp: <><path d="M21 11.5a9 9 0 0 1-13.3 7.9L3 21l1.5-4.9A9 9 0 1 1 21 11.5Z" /><path d="m8 7 1.5 3-1 1c.7 1.5 1.7 2.5 3.2 3.2l1-1 3 1.5c-.1 2.4-2.1 2.6-4.5 1.4-2.1-1-3.8-2.7-4.8-4.8C5.2 8.9 5.6 7 8 7Z" /></>,
  package: <><path d="m12 3 9 5v9l-9 5-9-5V8l9-5ZM3 8l9 5 9-5M12 13v9M7 5.8l9 5V15" /></>,
  star: <path d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6Z" />,
  filter: <><path d="M4 7h16M7 12h10M10 17h4" /><circle cx="8" cy="7" r="2" fill="currentColor" stroke="none" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7v.2" /></>,
  trash: <><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4M17 3v4M3 11h18M7 15h2M12 15h2M7 18h2" /></>,
  "check-circle": <><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></>,
  headphones: <><path d="M3 14v-3a9 9 0 0 1 18 0v3M19 18v1c0 2-3 3-7 3" /><rect x="2" y="12" width="5" height="7" rx="2" /><rect x="17" y="12" width="5" height="7" rx="2" /></>,
  bolt: <path d="m13 2-9 12h7l-1 8 10-13h-7l1-7Z" />,
};

export function Icon({ name, size = 20, className = "", style }: { name: IconName; size?: number; className?: string; style?: CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className} style={style}>{paths[name]}</svg>;
}

export { BrandMark } from "@/components/brand-mark";
