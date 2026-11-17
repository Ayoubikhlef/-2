/**
 * Full-page gradient background component with glowing effects
 * Used in customer login page redesign
 */
export function GradientBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Dark blue gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] to-[#1e3a8a]" />

      {/* Glowing ambient effects */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        {/* Top-left blue glow */}
        <div
          className="absolute top-[-20%] left-[-10%] h-[60vh] w-[50vw] rounded-full bg-blue-500/10 blur-[100px]"
        />

        {/* Bottom-right indigo glow */}
        <div
          className="absolute bottom-[-20%] right-[-10%] h-[60vh] w-[50vw] rounded-full bg-indigo-500/10 blur-[100px]"
          style={{ animationDelay: '-3s' }}
        />

        {/* Center cyan glow */}
        <div
          className="absolute top-1/2 left-1/2 h-[40vh] w-[30vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/8 blur-[80px]"
          style={{ animationDelay: '-6s' }}
        />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255, 255, 255, .1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, .1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Sweep effect */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute -inset-full h-[200%] w-[200%] bg-gradient-to-r from-transparent via-white/8 to-transparent blur-lg"
            style={{ animation: 'sweep 8s linear infinite' }}
          />
        </div>
      </div>

      {/* Main content area */}
      <main className="relative z-10 flex flex-col">{children}</main>

      <style>{`
        @keyframes sweep {
          0% { transform: translateX(-50%) translateY(-50%); }
          100% { transform: translateX(150%) translateY(150%); }
        }
      `}</style>
    </div>
  );
}
