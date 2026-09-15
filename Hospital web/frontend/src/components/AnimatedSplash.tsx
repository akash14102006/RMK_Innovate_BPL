import { useEffect, useState } from 'react';
import logoImage from '../assets/bharat-pulselink-logo.png';

interface AnimatedSplashProps {
  onFinish?: () => void;
  minDurationMs?: number;
}

export default function AnimatedSplash({ onFinish, minDurationMs = 2200 }: AnimatedSplashProps) {
  const [phase, setPhase] = useState<'intro' | 'pulse' | 'settle' | 'ready'>('intro');
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Check user preference for reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      const timer = setTimeout(() => {
        setIsFadingOut(true);
        setTimeout(() => onFinish?.(), 300);
      }, 1000);
      return () => clearTimeout(timer);
    }

    const t1 = setTimeout(() => setPhase('pulse'), 400);
    const t2 = setTimeout(() => setPhase('settle'), 1200);
    const t3 = setTimeout(() => setPhase('ready'), 1700);
    const t4 = setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(() => onFinish?.(), 400);
    }, minDurationMs);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onFinish, minDurationMs]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 transition-opacity duration-500 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      role="region"
      aria-label="Bharat PulseLink Loading Screen"
    >
      {/* Background ambient medical grid glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.15),transparent_70%)] pointer-events-none" />

      {/* Main Brand Lockup */}
      <div className="relative z-10 flex flex-col items-center max-w-lg px-6 text-center">
        {/* Animated Logo Container with Heartbeat Ring */}
        <div className="relative mb-6">
          {/* Subtle Heartbeat Pulse Ring */}
          <div
            className={`absolute -inset-4 rounded-full bg-teal-500/20 blur-xl transition-all duration-700 ${
              phase === 'pulse' || phase === 'settle' || phase === 'ready'
                ? 'scale-125 opacity-100'
                : 'scale-90 opacity-0'
            }`}
          />

          <div
            className={`relative w-28 h-28 md:w-32 md:h-32 rounded-3xl p-3 bg-white/95 backdrop-blur-xl shadow-2xl border-2 border-teal-500/30 flex items-center justify-center transition-all duration-700 ${
              phase === 'intro'
                ? 'scale-75 opacity-0 -translate-y-4'
                : phase === 'pulse'
                ? 'scale-105 opacity-100 translate-y-0'
                : 'scale-100 opacity-100 translate-y-0'
            }`}
          >
            <img
              src={logoImage}
              alt="Bharat PulseLink Logo"
              className="w-full h-full object-contain filter drop-shadow-md"
            />
          </div>
        </div>

        {/* ECG Heartbeat Line Drawing Animation */}
        <div className="w-64 h-12 mb-4 flex items-center justify-center overflow-hidden">
          <svg
            viewBox="0 0 300 60"
            className="w-full h-full text-teal-400 stroke-current fill-none"
            style={{ strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' }}
          >
            <path
              d="M 10 30 L 70 30 L 85 10 L 100 50 L 115 20 L 130 40 L 145 30 L 290 30"
              className="animate-ecg-draw"
              strokeDasharray="300"
              strokeDashoffset={phase === 'intro' ? '300' : '0'}
              style={{
                transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
                filter: 'drop-shadow(0 0 6px rgba(45, 212, 191, 0.6))',
              }}
            />
          </svg>
        </div>

        {/* Brand Title: Bharat PulseLink */}
        <div
          className={`transition-all duration-500 ${
            phase === 'settle' || phase === 'ready'
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-3'
          }`}
        >
          <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-white to-cyan-200 tracking-tight mb-2 drop-shadow-sm">
            Bharat PulseLink
          </h1>
        </div>

        {/* Secondary Primary Tagline: India's Shared Memory for Every Patient, Every Hospital */}
        <div
          className={`transition-all duration-500 delay-100 ${
            phase === 'ready' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
        >
          <p className="text-sm md:text-base font-semibold text-teal-100/90 mb-2 leading-relaxed">
            India's Shared Memory for Every Patient, Every Hospital
          </p>

          {/* Supporting Line: Connecting Every Pulse to Better Health */}
          <p className="text-xs md:text-sm text-teal-300/70 font-medium flex items-center justify-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping inline-block" />
            Connecting Every Pulse to Better Health.
          </p>
        </div>
      </div>

      {/* Subtle loader bar at the bottom */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-48 h-1 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r from-teal-400 to-cyan-300 transition-all duration-1000 ${
            phase === 'intro' ? 'w-1/4' : phase === 'pulse' ? 'w-2/3' : 'w-full'
          }`}
        />
      </div>
    </div>
  );
}
