// src/components/BottomNav.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Heart, MessageCircle, User, Star, Store } from "lucide-react";

// Navigation items configuration
// This structure is great, no changes needed here.
const NAV_ITEMS = [
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
  const navRef = useRef(null);
  const [navWidth, setNavWidth] = useState(0);

  // 1. Find the active navigation item
  const activeIndex = useMemo(() => 
    Math.max(
      0,
      NAV_ITEMS.findIndex((n) => (n.match ? n.match(pathname) : n.to === pathname))
    ), [pathname]);

  // 2. Measure the width of the nav bar for precise animation
  useEffect(() => {
    const el = navRef.current;
    if (!el) return;

    const resizeObserver = new ResizeObserver(() => {
      setNavWidth(el.clientWidth);
    });
    resizeObserver.observe(el);
    setNavWidth(el.clientWidth); // Set initial width

    return () => resizeObserver.disconnect();
  }, []);

  // 3. Calculate the position for the sliding "active pill"
  const itemWidth = navWidth / NAV_ITEMS.length;
  const pillOffset = useMemo(() => activeIndex * itemWidth, [activeIndex, itemWidth]);

  return (
    <div 
      className="fixed left-1/2 -translate-x-1/2 w-[95%] max-w-md px-2"
      style={{ bottom: `calc(env(safe-area-inset-bottom) + 10px)` }}
    >
      <nav
        ref={navRef}
        aria-label="Primary"
        className="relative flex items-center h-[64px] p-1.5
                   bg-gray-900/60 backdrop-blur-xl 
                   border border-white/10 rounded-full shadow-2xl shadow-black/40"
      >
        {/* Sliding "Pill" for Active State */}
        {navWidth > 0 && (
           <div
            className="absolute top-1.5 left-0 h-[52px] rounded-full
                       bg-gradient-to-br from-pink-500 via-red-500 to-rose-600
                       transition-transform duration-300 ease-in-out"
            style={{
              width: `${itemWidth}px`,
              transform: `translateX(${pillOffset}px)`,
            }}
            aria-hidden="true"
          />
        )}

        {/* Navigation Links */}
        {NAV_ITEMS.map(({ to, Icon, label }, i) => {
          const isActive = i === activeIndex;
          return (
            <Link
              key={to}
              to={to}
              aria-current={isActive ? "page" : undefined}
              aria-label={label}
              className="relative z-10 flex-1 flex flex-col items-center justify-center 
                         gap-0.5 h-full rounded-full text-center
                         transition-colors duration-300"
            >
              <Icon
                size={22}
                className={isActive ? "text-white" : "text-gray-400"}
              />
              <span
                className={`text-[10px] font-semibold transition-all duration-300
                           ${isActive ? "text-white" : "text-gray-400"}`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}