//src/context/OnboardingContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

// This is a custom hook that combines useState with localStorage for persistence.
function useLocalStorageState(key, defaultValue) {
  const [state, setState] = useState(() => {
    try {
      const storedValue = window.localStorage.getItem(key);
      // If a value is stored, parse and use it. Otherwise, use the default.
      return storedValue ? JSON.parse(storedValue) : defaultValue;
    } catch (error) {
      console.error("Error reading from localStorage", error);
      return defaultValue;
    }
  });

  // This effect runs whenever the state changes, saving the new state to localStorage.
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error("Error writing to localStorage", error);
    }
  }, [key, state]);

  return [state, setState];
}

const OnboardingContext = createContext();

export function OnboardingProvider({ children }) {
  // We now use our persistent state hook instead of the regular useState.
  // The data will be stored in a localStorage item named 'onboardingProfile'.
  const [profileData, setProfileData] = useLocalStorageState("onboardingProfile", {});

  // This function will clear the state and remove the item from localStorage.
  const resetProfileData = useCallback(() => {
    setProfileData({});
    window.localStorage.removeItem("onboardingProfile");
  }, [setProfileData]);

  const value = { profileData, setProfileData, resetProfileData };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export const useOnboarding = () => {
    const context = useContext(OnboardingContext);
    if (context === undefined) {
        throw new Error('useOnboarding must be used within an OnboardingProvider');
    }
    return context;
};