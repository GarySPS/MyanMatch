import { Link, useNavigate } from "react-router-dom";

export default function WelcomePage() {
  const navigate = useNavigate();

  // [!BUG FIXED!] The useEffect hook that was calling supabase.auth.signOut() has been removed.
  // This page should not have any logic and should only display content.
  // The automatic sign-out was destroying the session for new users during onboarding.

  return (
    <div
      className="min-h-screen w-full flex flex-col justify-center items-center relative overflow-hidden"
      style={{
        background: `url('/images/myanmatch-bg.jpg') center center / cover no-repeat, #82142d`,
      }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-30 z-0" />
      <img src="/images/heart-curve-topleft.png" alt="" className="absolute top-0 left-0 w-32 opacity-90 pointer-events-none select-none z-1" draggable={false} />
      <img src="/images/heart-curve-bottomright.png" alt="" className="absolute bottom-0 right-0 w-40 opacity-90 pointer-events-none select-none z-1" draggable={false} />

      <img
        src="/images/myanmatch-logo.png"
        alt="MyanMatch"
        className="w-64 h-64 z-10 mt-2 mb-4 shadow-xl rounded-full object-cover bg-white"
        style={{ background: "transparent" }}
        draggable={false}
      />

      <h1 className="text-4xl font-bold text-white z-10 mb-1 drop-shadow-lg text-center tracking-wide">
        MyanMatch
      </h1>
      <h2 className="text-lg text-white/80 mb-8 z-10 text-center">
        🦉ရွှေမြန်မာတို့ ဆုံဆည်းရာ🦉
      </h2>

      <button
        onClick={() => navigate("/SignUpPage")}
        className="w-80 max-w-xs py-4 mb-4 rounded-full bg-gradient-to-r from-[#cf60ed] to-[#a259c3] text-white text-lg font-bold shadow-lg transition hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-pink-200 z-10"
        style={{ letterSpacing: "0.02em" }}
      >
        Create အကောင့်ဖောက်
      </button>
      <button
        onClick={() => navigate("/SignInPage")}
        className="w-80 max-w-xs py-4 mb-2 rounded-full bg-white bg-opacity-30 border border-white text-white text-lg font-bold shadow-md transition hover:bg-opacity-40 active:scale-95 focus:outline-none focus:ring-4 focus:ring-pink-200 z-10"
        style={{ letterSpacing: "0.02em" }}
      >
        Sign in ဝင်
      </button>

      <p className="mt-10 text-xs text-white text-center z-10 px-3">
        By tapping <b>'Sign in'</b> / <b>'Create account'</b>, you agree to our <br />
        <Link to="/TermsPage" className="underline">Terms of Service</Link>. Learn how we process your data in our <br />
        <Link to="/PrivacyPage" className="underline">Privacy Policy</Link> and <Link to="/CookiesPage" className="underline">Cookies Policy</Link>.
      </p>
    </div>
  );
}