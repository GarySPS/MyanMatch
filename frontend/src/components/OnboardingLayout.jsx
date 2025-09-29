//src>components>OnboardingLayout.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';

const OnboardingLayout = ({ children }) => {
  const { loading, user, profile } = useAuth();

  // FIXED: Show loading ONLY during initial app load  
if (loading) {
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center"
      style={{ backgroundColor: "#82142d" }}
      aria-busy="true"
      aria-label="Loading..."
    >
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
    </div>
  );
}

  return (
    <div className="min-h-screen w-full">
      <main className="w-full h-full min-h-screen flex flex-col">
        {children}
      </main>
    </div>
  );
};

export default OnboardingLayout;