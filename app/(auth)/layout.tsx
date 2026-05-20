"use client"

import { motion } from "framer-motion"

// Configuration for each floating gradient orb
const ORBS = [
  {
    // Large indigo — top-left anchor, very slow drift
    size: 700,
    color: "rgba(99,102,241,0.30)",
    left: "-8%",
    top: "-5%",
    x: [0, 50, -30, 40, 0],
    y: [0, 35, -45, 25, 0],
    scale: [1, 1.12, 0.93, 1.08, 1],
    duration: 32,
    delay: 0,
  },
  {
    // Large violet — bottom-right, medium drift
    size: 600,
    color: "rgba(139,92,246,0.25)",
    left: "55%",
    top: "45%",
    x: [0, -55, 35, -25, 0],
    y: [0, -40, 55, -15, 0],
    scale: [1, 0.88, 1.18, 0.95, 1],
    duration: 26,
    delay: 5,
  },
  {
    // Medium cyan — top-right, slightly faster
    size: 480,
    color: "rgba(6,182,212,0.18)",
    left: "68%",
    top: "-12%",
    x: [0, -35, 25, -45, 0],
    y: [0, 50, -25, 38, 0],
    scale: [1, 1.22, 0.85, 1.1, 1],
    duration: 22,
    delay: 9,
  },
  {
    // Medium blue — center-left
    size: 420,
    color: "rgba(59,130,246,0.20)",
    left: "15%",
    top: "58%",
    x: [0, 60, -40, 50, 0],
    y: [0, -50, 30, -35, 0],
    scale: [1, 1.06, 0.92, 1.14, 1],
    duration: 28,
    delay: 14,
  },
  {
    // Small pink/rose — bottom-center accent
    size: 320,
    color: "rgba(236,72,153,0.14)",
    left: "38%",
    top: "75%",
    x: [0, -45, 60, -30, 0],
    y: [0, -55, 20, -40, 0],
    scale: [1, 1.18, 0.88, 1.08, 1],
    duration: 20,
    delay: 3,
  },
]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    // "dark" class forces all shadcn dark: variants — login is always dark
    <div className="dark min-h-screen relative overflow-hidden flex items-center justify-center p-4"
         style={{ background: "#060b18" }}>

      {/* ── Animated gradient orbs ─────────────────────────────────────── */}
      {ORBS.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.left,
            top: orb.top,
            background: `radial-gradient(circle at center, ${orb.color} 0%, transparent 68%)`,
            filter: "blur(48px)",
          }}
          animate={{ x: orb.x, y: orb.y, scale: orb.scale }}
          transition={{
            duration: orb.duration,
            delay: orb.delay,
            repeat: Infinity,
            repeatType: "loop",
            ease: "easeInOut",
          }}
        />
      ))}

      {/* ── Dot grid ──────────────────────────────────────────────────── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(99,102,241,0.55) 1px, transparent 1px)",
          backgroundSize: "30px 30px",
          opacity: 0.07,
        }}
      />

      {/* ── Radial vignette — darkens edges so card pops ──────────────── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, #060b18 100%)",
        }}
      />

      {/* ── Content ───────────────────────────────────────────────────── */}
      <div className="relative z-10 w-full flex justify-center">
        {children}
      </div>
    </div>
  )
}
