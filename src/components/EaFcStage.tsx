"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

type Props = {
  active: boolean;
  isWalkout?: boolean;
  children: ReactNode;
};

interface Ember {
  id: number;
  left: number; // percentage
  size: number; // px
  duration: number; // s
  delay: number; // s
  opacity: number;
}

export function EaFcStage({ active, isWalkout = false, children }: Props) {
  const [flash, setFlash] = useState(false);
  const [embers, setEmbers] = useState<Ember[]>([]);

  useEffect(() => {
    if (!active) {
      setEmbers([]);
      setFlash(false);
      return;
    }

    if (isWalkout) {
      setFlash(true);
      const flashTimer = setTimeout(() => setFlash(false), 1200);
      return () => clearTimeout(flashTimer);
    }
  }, [active, isWalkout]);

  useEffect(() => {
    if (!active) return;

    const items: Ember[] = Array.from({ length: 24 }, (_, i) => ({
      id: i,
      left: 8 + Math.random() * 84,
      size: 3 + Math.random() * 5,
      duration: 3 + Math.random() * 3.5,
      delay: Math.random() * 4,
      opacity: 0.4 + Math.random() * 0.6,
    }));

    setEmbers(items);
  }, [active]);

  if (!active) {
    return <>{children}</>;
  }

  return (
    <div className="eafc-stage-container relative flex h-full w-full min-h-[300px] items-center justify-center overflow-hidden">
      {/* 1. Flash Burst Inicial do Walkout */}
      {flash && (
        <div className="eafc-flash-burst pointer-events-none fixed inset-0 z-50 bg-radial from-white via-[#ffe27a]/40 to-transparent" />
      )}

      {/* 2. Spotlights Volumétricos de Arena Estilo EA FC */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {/* Spotlight Esquerdo */}
        <div className="eafc-spotlight-left absolute -left-[20%] -top-[10%] h-[130%] w-[70%] origin-top-left" />

        {/* Spotlight Direito */}
        <div className="eafc-spotlight-right absolute -right-[20%] -top-[10%] h-[130%] w-[70%] origin-top-right" />

        {/* Feixe Superior Central (God Ray) */}
        <div className="eafc-godray-top absolute left-1/2 top-0 h-[100%] w-[60%] -translate-x-1/2" />

        {/* Pedestal / Piso de Luz Dourada */}
        <div className="eafc-pedestal absolute bottom-0 left-1/2 h-36 w-[120%] -translate-x-1/2" />

        {/* Partículas / Embers Dourados Flutuantes */}
        {embers.map((e) => (
          <div
            key={e.id}
            className="eafc-ember absolute bottom-4 rounded-full bg-[#FFE27A] shadow-[0_0_8px_#D4AF37]"
            style={{
              left: `${e.left}%`,
              width: `${e.size}px`,
              height: `${e.size}px`,
              opacity: e.opacity,
              animationDuration: `${e.duration}s`,
              animationDelay: `${e.delay}s`,
            }}
          />
        ))}
      </div>

      {/* 3. Card com Animação 3D Walkout e Brilho Holográfico */}
      <div className={`relative z-10 flex w-full items-center justify-center ${isWalkout ? "eafc-walkout-entrance" : "eafc-card-float"}`}>
        {children}
      </div>
    </div>
  );
}
