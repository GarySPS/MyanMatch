import { useLocation } from "react-router-dom";
import BottomNav from "./BottomNav";
import { useAuth } from "../context/AuthContext";

const NAV_HEIGHT = 88; // px

export default function Layout({ children }) {
  const { loading } = useAuth();
  const { pathname } = useLocation();

  // Keep the loading fallback
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

  // Avoid template literal parsing issues: build the string plainly
  const contentPadBottom = hideBottomNav
    ? "pb-[calc(env(safe-area-inset-bottom)+14px)]"
    : "pb-[calc(env(safe-area-inset-bottom)+" + NAV_HEIGHT + "px)]";

  const mainClasses =
    (fullBleed
      ? "flex-1 w-full pt-0"
      : "flex-1 w-full max-w-[480px] mx-auto pt-0 px-2") +
    " " +
    contentPadBottom;

  return (
    <div
      className="min-h-dvh flex flex-col relative overflow-hidden"
      style={
        fullBleed
          ? undefined
          : { background: "url('/images/myanmatch-bg.jpg') center center / cover no-repeat, #82142d" }
      }
    >
      {!fullBleed && <div className="absolute inset-0 bg-black/20 z-0" />}

      <div className="relative z-10 flex flex-col flex-1">
        <main className={mainClasses}>
          {children}
        </main>

        {!hideBottomNav && <BottomNav />}
      </div>
    </div>
  );
}