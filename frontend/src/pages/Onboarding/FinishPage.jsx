// src/pages/Onboarding/FinishPage.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboarding } from "../../context/OnboardingContext";

export default function FinishPage() {
  const navigate = useNavigate();
  const { resetProfileData } = useOnboarding();

  // Clean up the temporary onboarding data from localStorage now that we are done.
  useEffect(() => {
    resetProfileData();
  }, [resetProfileData]);

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-[#82142d] relative overflow-hidden">
      {/* Heart curves background */}
      <img
        src="/images/heart-curve-topleft.png"
        alt=""
        className="absolute top-0 left-0 w-36 md:w-44 opacity-90 pointer-events-none select-none z-0"
        draggable={false}
      />
      <img
        src="/images/heart-curve-bottomright.png"
        alt=""
        className="absolute bottom-0 right-0 w-48 md:w-60 opacity-90 pointer-events-none select-none z-0"
        draggable={false}
      />

      {/* Centered content */}
      <div className="flex-1 flex flex-col items-center justify-center z-10 px-4">
        <div className="bg-white/95 border border-[#f7d2ef] rounded-3xl shadow-2xl px-7 py-10 w-full max-w-md flex flex-col items-center card-animate">
          <div className="w-24 h-24 md:w-28 md:h-28 mb-2 animate-bounce-slow">
            <img
              src="/images/bubble.png"
              alt="Mascot"
              className="w-full h-full object-contain"
              style={{ filter: "drop-shadow(0 2px 16px rgba(120,0,120,0.13))" }}
              draggable={false}
            />
          </div>
          <h1 className="text-3xl font-bold logo-hinge mb-2 text-center leading-tight drop-shadow-lg tracking-tight">
            Welcome to <span className="text-[#cf60ed]">MyanMatch!</span>
          </h1>
          <div className="mb-5">
            <p className="text-base text-[#a259c3] text-center font-medium prompt-hinge">
              Your profile is ready!
              <br />
              Start sending likes and see who matches with you.
            </p>
          </div>
        </div>
      </div>

      {/* Sticky Button */}
      <button
        className="w-full py-5 font-bold text-lg shadow-xl tracking-wide transition duration-150 rounded-t-3xl button-glow bg-gradient-to-r from-[#cf60ed] to-[#a259c3] hover:opacity-90 text-white"
        onClick={() => navigate("/HomePage", { replace: true })}
      >
        Start Matching
      </button>
    </div>
  );
}