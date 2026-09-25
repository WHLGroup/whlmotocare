type AdminIconName = "edit" | "upload" | "eye" | "eye-off" | "logout" | "lock" | "grid" | "refresh" | "image";
const paths: Record<AdminIconName, React.ReactNode> = {
  edit: <><path d="m16 3 5 5L8 21H3v-5L16 3ZM13 6l5 5" /></>,
  upload: <><path d="M12 16V3m-5 5 5-5 5 5M4 16v5h16v-5" /></>,
  eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
  "eye-off": <><path d="m3 3 18 18M10 5h2c6 0 10 7 10 7a23 23 0 0 1-3 4M6 6a21 21 0 0 0-4 6s4 7 10 7c2 0 4-.8 5-1.5M9 10a3 3 0 0 0 4 4" /></>,
  logout: <><path d="M10 3H3v18h7M9 12h13m-5-5 5 5-5 5" /></>,
  lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V6a4 4 0 0 1 8 0v4M12 14v3" /></>,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  refresh: <><path d="M20 7a8 8 0 0 0-14-2L3 8m0-5v5h5M4 17a8 8 0 0 0 14 2l3-3m0 5v-5h-5" /></>,
  image: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8" cy="8" r="1.5" /><path d="m3 17 5-5 4 4 4-6 5 7" /></>,
};
export function AdminIcon({ name, size = 20 }: { name: AdminIconName; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
