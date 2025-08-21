import React from "react";
import { useNavigate } from "react-router-dom";

export default function DetailsIntroPage() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center relative"
      style={{
        background: `url('/images/myanmatch-bg.jpg') center center / cover no-repeat`
      }}
    >
      {/* Card container */}
      <div className="bg-white/90 rounded-3xl shadow-2xl max-w-md w-full px-7 py-10 flex flex-col items-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#82144d] text-center mb-1">🌼Be Honest🌼</h1>
        <div className="text-base sm:text-lg text-gray-800 text-center mb-4 font-medium">
          The more you share, the better your <br />matches will be.
        </div>
        <div className="text-center text-lg font-semibold text-[#82144d] leading-snug mb-7">
          🌻သင့်ရဲ့အလိုက်ဖက်ဆုံး🌻<br />
          လက်တွဲဖော်ရှာဖွေရန်<br />
          ရိုးသားစွာခံစားချက်ကို<br />
          ဖြည့်စွက်ပေးပါ။👩‍❤️‍👨
        </div>
        <img
          src="/images/bubble.png" // update if needed
          alt="Owls"
          className="w-48 h-48 mb-8 object-contain drop-shadow"
          draggable={false}
        />
        <button
          onClick={() => navigate("/onboarding/location")}
          className="w-full py-4 text-lg font-semibold rounded-full bg-gradient-to-r from-[#a55596] to-[#82144d] text-white shadow-lg transition hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-pink-200"
        >
          Add more details
        </button>
      </div>
    </div>
  );
}
