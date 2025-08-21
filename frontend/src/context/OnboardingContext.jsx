import React, { createContext, useContext, useState } from "react";

// Add your default profile fields here
const DEFAULT_PROFILE = {
  birthdate: "",
  age: "",
  gender: "",
  sexuality: "",
  interested_in: "",
  location: "",
  hometown: "",
  height: "",
  ethnicity: [],           // array, correct
  job_title: "",
  workplace: "",
  education_level: "",
  school_name: "",
  religion: "",
  political_belief: "",
  relationship: "",
  monogamy: "",
  children: "",
  family_plans: "",
  drinking: "",
  smoking: "",
  drugs: "",
  weed_usage: "",
  prompts: [],             // array, correct
  photos: [],              // array, correct
  voice_prompt_url: "",
  created_at: null,        // timestamp, correct
  updated_at: null,        // add if you use updated_at field!
};

const OnboardingContext = createContext();

export function OnboardingProvider({ children }) {
  const [profileData, setProfileData] = useState(DEFAULT_PROFILE);

  // Helper to reset all data
  const resetProfileData = () => setProfileData(DEFAULT_PROFILE);

  return (
    <OnboardingContext.Provider value={{ profileData, setProfileData, resetProfileData }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  return useContext(OnboardingContext);
}
