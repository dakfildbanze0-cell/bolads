import { useEffect, useState } from "react";
import { motion } from "motion/react";

interface SplashScreenProps {
  authChecked: boolean;
  onComplete: () => void;
}

export default function SplashScreen({ authChecked, onComplete }: SplashScreenProps) {
  const [logoError, setLogoError] = useState(false);
  const [minTimePassed, setMinTimePassed] = useState(false);

  // Minimum duration of 1800ms for premium experience
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimePassed(true);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  // Complete only when both minimum time has passed and auth check has finished
  useEffect(() => {
    if (minTimePassed && authChecked) {
      onComplete();
    }
  }, [minTimePassed, authChecked, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 bg-zinc-900 z-[9999] flex flex-col items-center justify-between p-4 select-none overflow-hidden"
    >
      {/* Top spacer */}
      <div className="h-[5px]" />

      {/* Centered Logo */}
      <div className="flex flex-col items-center justify-center">
        {!logoError ? (
          <img
            src="/dak.png"
            alt="Dak Logo"
            className="w-[120px] h-[120px] object-contain select-none"
            onError={() => setLogoError(true)}
          />
        ) : (
          <div className="w-[120px] h-[120px] rounded-[8px] bg-white text-black flex items-center justify-center font-chivo text-[28px] font-black tracking-tighter shadow-xl">
            Dak
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pb-[5px] flex flex-col items-center">
        <span className="font-chivo text-[15px] font-black uppercase tracking-widest text-neutral-300">
          Boladas
        </span>
      </div>
    </motion.div>
  );
}
