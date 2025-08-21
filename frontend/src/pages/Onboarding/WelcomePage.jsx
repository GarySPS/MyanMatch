import React from "react";
import { useNavigate } from "react-router-dom";

export default function WelcomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col justify-between bg-white">
      <div className="flex-1 flex flex-col items-center justify-center">
        <h1 className="text-3xl md:text-4xl font-bold text-center mt-16 mb-10">
          You're one of a kind.<br />
          Your profile should be, too.<br />
          သာယာပျော်ရွင်သောဘဝခရီးလမ်းကိုအခုဖဲစတင်လိုက်ပါရှင်💐
        </h1>
        {/* Replace with your image path */}
        <img
          src="/images/fluffy.png"
          alt="Fluffy Character"
          className="w-44 h-44 mx-auto"
          style={{ marginBottom: "3rem" }}
        />
      </div>
      <button
        className="w-full py-4 text-lg font-semibold text-white bg-[#6e2263] rounded-none"
        onClick={() => navigate("/onboarding/name")}
        style={{ letterSpacing: 0.5 }}
      >
        Enter basic info
      </button>
    </div>
  );
}
