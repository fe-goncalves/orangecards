"use client";

import { useEffect, useState } from "react";

type Props = {
  active: boolean;
  type?: "gold" | "mint" | "rainbow";
  count?: number;
};

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
  rotation: number;
}

export function ConfettiCelebration({
  active,
  type = "gold",
  count = 45,
}: Props) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!active) {
      setParticles([]);
      return;
    }

    const goldColors = ["#D4AF37", "#FFDF73", "#FFF2B2", "#00FFAB", "#FFFFFF"];
    const mintColors = ["#00FFAB", "#00C985", "#6BFFCE", "#FFFFFF", "#F4F7F5"];
    const colors = type === "gold" ? goldColors : mintColors;

    const items: Particle[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100, // %
      y: -10 - Math.random() * 20, // %
      size: 5 + Math.random() * 8, // px
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.8,
      duration: 2.2 + Math.random() * 1.8,
      rotation: Math.random() * 360,
    }));

    setParticles(items);

    const timer = setTimeout(() => {
      setParticles([]);
    }, 4500);

    return () => clearTimeout(timer);
  }, [active, type, count]);

  if (!active || particles.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[300] overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-sm shadow-sm"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size * (Math.random() > 0.5 ? 1.6 : 1)}px`,
            backgroundColor: p.color,
            transform: `rotate(${p.rotation}deg)`,
            animation: `confetti-drop ${p.duration}s cubic-bezier(0.25, 1, 0.5, 1) ${p.delay}s forwards`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes confetti-drop {
          0% {
            transform: translateY(0) rotate(0deg) scale(0.8);
            opacity: 1;
          }
          80% {
            opacity: 1;
          }
          100% {
            transform: translateY(115vh) rotate(720deg) scale(1);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
