import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function WelcomePage() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    // Only run the redirect logic AFTER loading is fully complete.
    if (!loading) {
      // If a user and a full profile exist, redirect them appropriately.
      if (user && profile) {
        if (profile.onboarding_complete) {
          navigate("/HomePage", { replace: true });
        } else {
          // This handles logged-in users who haven't finished onboarding.
          navigate("/onboarding/terms", { replace: true });
        }
      }
      // If there is no user, or a user without a profile, this effect does nothing.
      // The Welcome Page content below will be shown, allowing them to sign in.
    }
  }, [user, profile, loading, navigate]);

  // This is the loading screen. It will only show while the AuthContext is
  // actively trying to determine the user's status.
  if (loading) {
    return (
      <div
        className="min-h-screen w-full"
        style={{ backgroundColor: "#82142d" }}
        aria-busy="true"
        aria-label="Loading..."
      />
    );
  }

  // This JSX is now only shown to users who are truly logged out.
  // If you are logged in, the `useEffect` above will redirect you away from this.
  return (
    <div
      className="min-h-screen w-full flex flex-col justify-center items-center relative overflow-hidden p-4"
      style={{
        background: `url('/images/myanmatch-bg.jpg') center center / cover no-repeat, #82142d`,
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-40 z-0" />

      {/* Content */}
      <div className="relative z-20 flex flex-col items-center justify-center flex-grow w-full">
        <img
          src="/images/myanmatch-logo.png"
          alt="MyanMatch"
          className="w-72 h-72 md:w-80 md:h-80 mb-4 shadow-xl rounded-full object-cover"
          draggable={false}
        />
        
        <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg text-center tracking-wide">
          MyanMatch
        </h1>
        <h2 className="text-lg text-white/80 mt-2 mb-10 z-10 text-center">
          🦉 ရွှေမြန်မာတို့ ဆုံဆည်းရာ 🦉
        </h2>

        <div className="w-full max-w-xs flex flex-col items-center gap-4">
          <button
            onClick={() => navigate("/SignUpPage")}
            className="w-full py-3 rounded-full bg-gradient-to-r from-[#cf60ed] to-[#a259c3] text-white shadow-lg transition transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-pink-300/50"
          >
            <span className="text-lg font-bold">Create Account</span>
            <span className="block text-sm font-normal">အကောင့်အသစ် ပြုလုပ်မည်</span>
          </button>
          
          <button
            onClick={() => navigate("/SignInPage")}
            className="w-full py-3 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white shadow-md transition transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-white/30"
          >
            <span className="text-lg font-bold">Sign In</span>
            <span className="block text-sm font-normal">အကောင့်ဝင်မည်</span>
          </button>
        </div>
      </div>
      
      <p className="relative z-20 mt-8 text-xs text-white/80 text-center px-3 pb-4">
        By tapping 'Sign In' or 'Create Account', you agree to our <br />
        <Link to="/TermsPage" className="underline font-semibold hover:text-white">Terms of Service</Link>, 
        <Link to="/PrivacyPage" className="underline font-semibold hover:text-white ml-1">Privacy Policy</Link>, and 
        <Link to="/CookiesPage" className="underline font-semibold hover:text-white ml-1">Cookies Policy</Link>.
        <span className="block mt-2 text-white/60">
          'Sign In' သို့မဟုတ် 'Create Account' ကိုနှိပ်ခြင်းဖြင့် ကျွန်ုပ်တို့၏ ဝန်ဆောင်မှုစည်းမျဉ်းများ၊ ကိုယ်ရေးကိုယ်တာမူဝါဒနှင့် ကွတ်ကီးမူဝါဒကို သဘောတူပါသည်။
        </span>
      </p>
    </div>
  );
}