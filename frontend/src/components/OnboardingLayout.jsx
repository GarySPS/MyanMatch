const OnboardingLayout = ({ children }) => (
  <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden">
    {/* Overlay for dimming (optional) */}
    <div className="absolute inset-0 bg-black bg-opacity-20 z-0 pointer-events-none" />
    <main className="relative z-10 w-full flex-1 flex flex-col justify-center items-center px-0">
      {children}
    </main>
  </div>
);

export default OnboardingLayout;
