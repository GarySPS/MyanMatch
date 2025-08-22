// src/components/Layout.jsx
import { useLocation } from "react-router-dom";
import BottomNav from "./BottomNav";

const NAV_HEIGHT = 88; // px — roughly your BottomNav height

export default function Layout({ children }) {
  const { pathname } = useLocation();

  // Hide bottom bar for full-screen threads like /chat/:userId
  const hideBottomNav = /^\/chat\/[^/]+$/i.test(pathname);

// Pages that draw their own full-screen background (no Layout PNG)
const fullBleed = /^(?:\/(?:HomePage|Profile|UserProfilePage|settings|me|profile)(?:\/|$))$/i.test(
  pathname.replace(/\/+$/, "") // ignore trailing slash
);

  // Dynamic bottom padding
  const contentPadBottom = hideBottomNav
    ? "pb-[calc(env(safe-area-inset-bottom)+14px)]"
    : `pb-[calc(env(safe-area-inset-bottom)+${NAV_HEIGHT}px)]`;

  return (
    <div
      className="min-h-dvh flex flex-col relative overflow-hidden"
      style={
        fullBleed
          ? {}
          : { background: "url('/images/myanmatch-bg.jpg') center center / cover no-repeat, #82142d" }
      }
    >
      {/* Soft dark overlay for readability only when Layout paints the background */}
      {!fullBleed && <div className="absolute inset-0 bg-black/20 z-0" />}

      <div className="relative z-10 flex flex-col flex-1">
        <main
          className={`${fullBleed ? "flex-1 w-full pt-0" : "flex-1 w-full max-w-[480px] mx-auto pt-0 px-2"} ${contentPadBottom}`}
        >
          {children}
        </main>

        {!hideBottomNav && <BottomNav />}
      </div>
    </div>
  );
}
