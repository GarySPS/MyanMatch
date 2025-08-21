import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Heart, MessageCircle, User, Star, Store } from "lucide-react";

/** Visual constants */
const BAR_H = 56;      // bar height
const R = 26;          // notch radius
const CIRCLE = 46;     // active red circle diameter
const ROUNDED = 16;    // bar corner radius

/** Smarter matching so sections stay active on sub-routes */
const NAV = [
  {
    to: "/HomePage",
    label: "Home",
    Icon: Home,
    match: (p) => p === "/" || p.startsWith("/Home"),
  },
  {
    to: "/ExplorePage",
    label: "Explore",
    Icon: Star,
    match: (p) => p.startsWith("/Explore"),
  },
  {
    to: "/MatchesPage",
    label: "Matches",
    Icon: Heart,
    match: (p) => p.startsWith("/Matches"),
  },
  {
    to: "/ChatPage",
    label: "Chats",
    Icon: MessageCircle,
    match: (p) => p.startsWith("/ChatPage") || p === "/Messages",
  },
  {
    to: "/MarketPage",
    label: "Market",
    Icon: Store,
    match: (p) => p.startsWith("/Market"),
  },
  {
    to: "/Profile",
    label: "Profile",
    Icon: User,
    match: (p) =>
      p.startsWith("/Profile") ||
      p === "/me" ||
      p.startsWith("/settings") ||
      p.startsWith("/EditProfile"),
  },
];

export default function BottomNav() {
  const { pathname } = useLocation();

  // Which item is active?
  const activeIndex = Math.max(
    0,
    NAV.findIndex((n) => (n.match ? n.match(pathname) : n.to === pathname))
  );

  // measure width for the morphing SVG
  const wrapRef = useRef(null);
  const [w, setW] = useState(360);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth || 360));
    ro.observe(el);
    setW(el.clientWidth || 360);
    return () => ro.disconnect();
  }, []);

  // notch center x for active item
  const cx = useMemo(() => {
    const seg = w / NAV.length;
    return seg * activeIndex + seg / 2;
  }, [w, activeIndex]);

  return (
    <nav
      ref={wrapRef}
      aria-label="Primary"
      className="fixed left-1/2 z-30 -translate-x-1/2 w-[92%] max-w-md"
      style={{ bottom: `calc(env(safe-area-inset-bottom) + 14px)` }}
    >
      <div className="relative select-none">
        {/* Morphing cream bar with concave notch */}
        <svg width="100%" height={BAR_H + R} viewBox={`0 0 ${w} ${BAR_H + R}`} className="drop-shadow-xl">
          <defs>
            {/* Soft gradient to match app */}
            <linearGradient id="mm-cream-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#FFF4E6" />
              <stop offset="100%" stopColor="#FCEAD8" />
            </linearGradient>

            {/* Mask: show bar, hide the notch circle */}
            <mask id="mm-notch-mask">
              <rect x="0" y={R} width={w} height={BAR_H} rx={ROUNDED} ry={ROUNDED} fill="white" />
              <g style={{ transition: "transform 260ms ease" }} transform={`translate(${cx}, 0)`}>
                <circle cx="0" cy={R + 6} r={R} fill="black" />
              </g>
            </mask>

            {/* Depth */}
            <filter id="mm-soft" x="-20%" y="-40%" width="140%" height="200%">
              <feDropShadow dx="0" dy="6" stdDeviation="8" floodOpacity="0.16" />
            </filter>
          </defs>

          <g filter="url(#mm-soft)">
            <rect
              x="0"
              y={R}
              width={w}
              height={BAR_H}
              rx={ROUNDED}
              ry={ROUNDED}
              fill="url(#mm-cream-grad)"
              stroke="#F2DCCA"
              strokeWidth="1"
              mask="url(#mm-notch-mask)"
            />
          </g>
        </svg>

        {/* Active floating chip (inside the notch) */}
        <div
          className="absolute will-change-transform"
          style={{
            left: cx - CIRCLE / 2,
            top: R + 6 - CIRCLE / 2,
            width: CIRCLE,
            height: CIRCLE,
            transition: "left 260ms ease, top 260ms ease",
          }}
        >
          <div
            className="rounded-full flex items-center justify-center shadow-lg ring-4 ring-black/10"
            style={{
              width: "100%",
              height: "100%",
              background:
                "radial-gradient(120% 120% at 30% 30%, #ff8aa6 0%, #ef476f 45%, #c81e45 100%)",
            }}
            aria-hidden
          >
            <ActiveIcon index={activeIndex} />
          </div>
        </div>

        {/* Row of icons (non-active shown, active hidden under chip) */}
        <div className="absolute inset-x-0" style={{ top: R, height: BAR_H }}>
          <div className="flex items-center justify-between px-4 h-full">
            {NAV.map(({ to, Icon, label }, i) => {
              const isActive = i === activeIndex;
              return (
                <Link
                  key={to}
                  to={to}
                  aria-current={isActive ? "page" : undefined}
                  aria-label={label}
                  className="relative flex-1 flex items-center justify-center"
                >
                  <Icon
                    size={22}
                    className={`transition-opacity duration-200 ${
                      isActive ? "opacity-0" : "opacity-100 text-rose-900/70"
                    }`}
                  />
                  <span className="sr-only">{label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}

/** Active icon rendered inside the red chip */
function ActiveIcon({ index }) {
  const I = [Home, Star, Heart, MessageCircle, Store, User][index] || Home;
  return <I size={20} className="text-white" />;
}
