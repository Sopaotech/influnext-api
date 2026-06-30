import React from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-orange-500/20 font-sans relative overflow-hidden">
      
      {/* Atmospheric background glows */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Main orange glow — top center */}
        <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-orange-500/5 blur-[120px]" />
        {/* Peach accent — bottom right */}
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-amber-600/3 blur-[100px]" />
        {/* Subtle grid texture */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: 'linear-gradient(rgba(217,107,39,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(217,107,39,0.3) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        {/* Top gradient fade */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-[#faf9f6] to-transparent" />
        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#faf9f6] to-transparent" />
      </div>

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        {children}
      </div>
    </div>
  );
}

