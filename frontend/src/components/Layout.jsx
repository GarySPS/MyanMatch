import { useLocation } from "react-router-dom";
import BottomNav from "./BottomNav";
import { useAuth } from "../context/AuthContext"; // <-- 1. Import useAuth

const NAV_HEIGHT = 88; // px — roughly your BottomNav height

export default function Layout({ children }) {
  const { loading } = useAuth(); // <-- 2. Get the loading state
  const { pathname } = useLocation();

  // 3. If the auth state is loading, show a simple full-screen loader.
  // This prevents the broken layout from ever appearing on refresh.
  if (loading) {
    return (
      <div
        className="min-h-dvh w-full"
        style={{ background: "#82142d" }}
      />
    );
  }

  const hideBottomNav = /^\/chat\/[^/]+$/i.test(pathname);

  const fullBleed = /^\/(?:HomePage|Profile|UserProfilePage|settings|me|profile)(?:\/.*)?$/i
    .test(pathname.replace(/\/+$/, ""));

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