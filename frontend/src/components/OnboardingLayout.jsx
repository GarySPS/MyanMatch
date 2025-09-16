// src/components/OnboardingLayout.jsx

import React from 'react';
import { useAuth } from '../context/AuthContext';

const OnboardingLayout = ({ children }) => {
  const { loading } = useAuth();

  // Show a full-page loading screen while AuthContext is busy.
  // This is the true fix for the "stuck on red screen" bug.
  if (loading) {
    return (
      <div
        className="min-h-screen w-full"
        style={{ backgroundColor: "#82142d" }} // Your app's loading color
        aria-busy="true"
        aria-label="Loading..."
      />
    );
  }

  // Once loading is false, render the actual content.
  return (
    <div className="min-h-screen w-full">
      <main className="w-full h-full min-h-screen flex flex-col">
        {children}
      </main>
    </div>
  );
};

export default OnboardingLayout;