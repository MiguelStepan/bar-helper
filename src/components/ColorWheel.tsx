"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { hslToHex, hexToHsl } from "@/lib/color";

type Props = {
  value: string;
  onChange: (hex: string) => void;
  size?: number;
};

// Pevná saturace + lightness — uživatel vybírá jen hue.
// Drží konzistenci s ostatními avatary (jasné, ale ne neonové barvy).
const FIXED_S = 70;
const FIXED_L = 55;

export function ColorWheel({ value, onChange, size = 200 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  // Render kola na canvas — jednou při mountu (size se nemění).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Vyšší rozlišení pro retina displeje.
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    // Reset transform matrix před scale — jinak se při remountu scale akumuluje
    // a kolo se postupně zmenšuje.
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2;

    // Plné kolo přes 360 řezů s jemným antialiasingem překryvem.
    const step = 0.5; // stupně
    for (let angle = 0; angle < 360; angle += step) {
      const startRad = ((angle - 0.6) * Math.PI) / 180;
      const endRad = ((angle + step + 0.6) * Math.PI) / 180;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startRad, endRad);
      ctx.closePath();
      ctx.fillStyle = `hsl(${angle}, ${FIXED_S}%, ${FIXED_L}%)`;
      ctx.fill();
    }
  }, [size]);

  // Aktuální hue z value.
  const { h: currentHue } = hexToHsl(value);

  // Pozice indikátoru (kroužku) na obvodu kola.
  const indicatorRadius = size / 2 - 16;
  const indicatorAngle = (currentHue * Math.PI) / 180;
  const indicatorX = size / 2 + Math.cos(indicatorAngle) * indicatorRadius;
  const indicatorY = size / 2 + Math.sin(indicatorAngle) * indicatorRadius;

  const pickFromEvent = useCallback(
    (clientX: number, clientY: number) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const x = clientX - rect.left - rect.width / 2;
      const y = clientY - rect.top - rect.height / 2;
      let angle = (Math.atan2(y, x) * 180) / Math.PI;
      if (angle < 0) angle += 360;
      const hex = hslToHex(angle, FIXED_S, FIXED_L);
      onChange(hex);
    },
    [onChange],
  );

  // Pointer events — fungují pro myš i touch.
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    setDragging(true);
    pickFromEvent(e.clientX, e.clientY);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    pickFromEvent(e.clientX, e.clientY);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setDragging(false);
    try {
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore — pointer už uvolněný
    }
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      tabIndex={0}
      role="slider"
      aria-label="Výběr barvy"
      aria-valuenow={currentHue}
      aria-valuemin={0}
      aria-valuemax={360}
      className="relative inline-block cursor-pointer rounded-full shadow-lg outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30"
      style={{
        width: size,
        height: size,
        touchAction: "none",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: size,
          height: size,
          display: "block",
          borderRadius: "9999px",
        }}
      />
      {/* Indikátor aktuálně vybrané barvy */}
      <div
        className="pointer-events-none absolute h-6 w-6 rounded-full border-[3px] border-white shadow-md"
        style={{
          left: indicatorX - 12,
          top: indicatorY - 12,
          backgroundColor: value,
        }}
      />
    </div>
  );
}
