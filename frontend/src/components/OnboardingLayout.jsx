import React from 'react';
import { useAuth } from '../context/AuthContext';

const OnboardingLayout = ({ children }) => {
  const { loading, user, profile } = useAuth();

  // CRITICAL FIX: Same logic as Layout.jsx
  if (loading && !user && !profile) {
    return (
      <div
        className="min-h-screen w-full"
        style={{ backgroundColor: "#82142d" }}
        aria-busy="true"
        aria-label="Loading..."
      />
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