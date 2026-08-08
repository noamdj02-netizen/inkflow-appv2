import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  Series,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { C, font } from "./theme";

const D = {
  intro: 240,
  mockups: 360,
  journey: 300,
  outro: 240,
};

/** Durée totale — garder aligné avec `Root.tsx` → `durationInFrames`. */
export const INKFLOW_DEMO_TOTAL_FRAMES = D.intro + D.mockups + D.journey + D.outro;
const totalFrames = INKFLOW_DEMO_TOTAL_FRAMES;

export const InkflowDemo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, overflow: "hidden", ...font }}>
      <Series>
        <Series.Sequence durationInFrames={D.intro}>
          <IntroScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={D.mockups}>
          <MockupsScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={D.journey}>
          <JourneyScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={D.outro}>
          <OutroScene />
        </Series.Sequence>
      </Series>
      {/* Grain léger + vignette pour rendu “produit” */}
      <Vignette totalFrames={totalFrames} />
    </AbsoluteFill>
  );
};

function Vignette({ totalFrames }: { totalFrames: number }) {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [totalFrames - 45, totalFrames], [0, 0.5], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        boxShadow: `inset 0 0 180px rgba(0,0,0,${0.35 + o})`,
      }}
    />
  );
}

function IntroScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 14, mass: 0.7 } });
  const logoY = interpolate(enter, [0, 1], [40, 0]);
  const logoOp = interpolate(enter, [0, 1], [0, 1]);
  const titleY = spring({ frame: frame - 8, fps, config: { damping: 16 } });
  const subOp = interpolate(frame, [35, 75], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const chipsOp = interpolate(frame, [85, 140], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const pulse = 1 + Math.sin(frame * 0.08) * 0.015;

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse 90% 70% at 50% 0%, ${C.surface} 0%, ${C.bg} 65%)` }}>
      <FloatingOrbs />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          padding: 80,
        }}
      >
        <div
          style={{
            opacity: logoOp,
            transform: `translateY(${logoY}px) scale(${pulse})`,
            marginBottom: 36,
            filter: "drop-shadow(0 24px 48px rgba(0,0,0,0.45))",
          }}
        >
          <Img
            src={staticFile("media/logo-inkflow.png")}
            style={{ width: 140, height: "auto", borderRadius: 28 }}
          />
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: 96,
            fontWeight: 900,
            letterSpacing: "-0.05em",
            color: C.text,
            textTransform: "uppercase",
            transform: `translateY(${interpolate(titleY, [0, 1], [32, 0])}px)`,
            opacity: interpolate(titleY, [0, 1], [0, 1]),
            textShadow: "0 4px 60px rgba(201,169,110,0.15)",
          }}
        >
          Inkflow
        </h1>
        <p
          style={{
            margin: "28px 0 0",
            fontSize: 34,
            fontWeight: 500,
            color: C.muted,
            textAlign: "center",
            maxWidth: 1100,
            lineHeight: 1.4,
            opacity: subOp,
          }}
        >
          Agenda studio, réservation client, acomptes Stripe — tout ce dont un tatoueur a besoin, dans une seule app.
        </p>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 14,
            justifyContent: "center",
            marginTop: 40,
            opacity: chipsOp,
          }}
        >
          {["Dashboard pro", "Espace client", "Paiement sécurisé"].map((label, i) => (
            <span
              key={label}
              style={{
                padding: "12px 22px",
                borderRadius: 999,
                border: `1px solid ${C.border}`,
                background: "rgba(22,22,22,0.6)",
                color: C.text,
                fontSize: 20,
                fontWeight: 600,
                transform: `translateY(${interpolate(chipsOp, [0, 1], [16, 0]) * (1 - i * 0.05)}px)`,
                opacity: interpolate(frame, [95 + i * 10, 130 + i * 10], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
}

function FloatingOrbs() {
  const frame = useCurrentFrame();
  return (
    <>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: 320 + i * 80,
            height: 320 + i * 80,
            borderRadius: "50%",
            left: `${15 + i * 28}%`,
            top: `${8 + i * 12}%`,
            background: `radial-gradient(circle, rgba(201,169,110,${0.06 - i * 0.015}) 0%, transparent 70%)`,
            transform: `translate(${Math.sin((frame + i * 40) * 0.02) * 24}px, ${Math.cos((frame + i * 30) * 0.018) * 18}px)`,
            pointerEvents: "none",
          }}
        />
      ))}
    </>
  );
}

function MockupsScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dur = D.mockups;

  const titleOp = interpolate(frame, [0, 45], [0, 1], { extrapolateRight: "clamp" });
  const rowOp = spring({ frame: frame - 25, fps, config: { damping: 17 } });

  const paths = [
    staticFile("media/hero-dashboard-mockup.png"),
    staticFile("media/mockup-profil.png"),
    staticFile("media/hero-tattoo-artist.png"),
  ];
  const labels = ["Planning & CRM", "Vitrine studio", "Parcours client"];

  return (
    <AbsoluteFill style={{ padding: "72px 64px" }}>
      <h2
        style={{
          margin: "0 0 8px",
          fontSize: 44,
          fontWeight: 800,
          color: C.text,
          textAlign: "center",
          opacity: titleOp,
          letterSpacing: "-0.03em",
        }}
      >
        Une app pensée pour le tatouage
      </h2>
      <p
        style={{
          margin: "0 auto 48px",
          fontSize: 24,
          color: C.muted,
          textAlign: "center",
          maxWidth: 900,
          opacity: titleOp,
        }}
      >
        Du premier contact à l’acompte : interfaces claires, mobile-first, comme vos maquettes produit.
      </p>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-end",
          gap: 36,
          transform: `translateY(${interpolate(rowOp, [0, 1], [80, 0])}px)`,
          opacity: interpolate(rowOp, [0, 1], [0, 1]),
        }}
      >
        {paths.map((src, i) => {
          const stagger = i * 18;
          const local = frame - stagger;
          const kb = interpolate(local, [0, dur - 40], [1, 1.06], { extrapolateRight: "clamp" });
          const tx = interpolate(local, [0, dur - 40], [0, -12], { extrapolateRight: "clamp" });
          const cardOp = interpolate(frame, [20 + stagger, 55 + stagger], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const float = Math.sin((frame + i * 50) * 0.06) * 6;
          return (
            <div
              key={src}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                opacity: cardOp,
                transform: `translateY(${float}px)`,
              }}
            >
              <div
                style={{
                  width: 420,
                  height: 520,
                  borderRadius: 36,
                  overflow: "hidden",
                  border: `1px solid ${C.border}`,
                  boxShadow: "0 40px 100px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)",
                  background: C.surface,
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                    transform: `scale(${kb}) translateX(${tx}px)`,
                  }}
                >
                  <Img src={src} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              </div>
              <span
                style={{
                  marginTop: 20,
                  fontSize: 20,
                  fontWeight: 700,
                  color: C.accent,
                  letterSpacing: "0.02em",
                }}
              >
                {labels[i]}
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

function JourneyScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const steps = [
    { t: "1 — Flash & acompte", d: "Le client choisit un design, l’acompte est encadré (Stripe, Apple Pay…)." },
    { t: "2 — Fiche studio", d: "Vitrine, avis, dispo : tout ce qu’il faut pour réserver en confiance." },
    { t: "3 — Dans ton agenda", d: "Le RDV apparaît côté studio : suivi, rappels, historique." },
  ];

  return (
    <AbsoluteFill style={{ padding: "64px 80px", display: "flex", gap: 56 }}>
      <div style={{ flex: 1.1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <h2
          style={{
            margin: "0 0 12px",
            fontSize: 48,
            fontWeight: 800,
            color: C.text,
            letterSpacing: "-0.03em",
            opacity: interpolate(frame, [0, 35], [0, 1], { extrapolateRight: "clamp" }),
          }}
        >
          Parcours réservation
        </h2>
        <p
          style={{
            margin: "0 0 40px",
            fontSize: 24,
            color: C.muted,
            lineHeight: 1.5,
            opacity: interpolate(frame, [15, 50], [0, 1], { extrapolateRight: "clamp" }),
          }}
        >
          Le même flux que vos écrans produit : simple pour le client, synchronisé pour vous.
        </p>
        {steps.map((step, i) => {
          const start = 55 + i * 65;
          const op = spring({
            frame: Math.max(0, frame - start),
            fps,
            config: { damping: 16 },
          });
          return (
            <div
              key={step.t}
              style={{
                marginBottom: 28,
                padding: "22px 26px",
                borderRadius: 20,
                border: `1px solid ${C.border}`,
                background: "linear-gradient(135deg, rgba(22,22,22,0.95) 0%, rgba(13,13,13,0.6) 100%)",
                opacity: op,
                transform: `translateX(${(1 - op) * 40}px)`,
              }}
            >
              <div style={{ fontSize: 22, fontWeight: 800, color: C.accent, marginBottom: 8 }}>{step.t}</div>
              <div style={{ fontSize: 21, color: C.muted, lineHeight: 1.45 }}>{step.d}</div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          flex: 0.9,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <JourneyMockup frame={frame} fps={fps} />
      </div>
    </AbsoluteFill>
  );
}

function JourneyMockup({ frame, fps }: { frame: number; fps: number }) {
  const zoom = spring({ frame: Math.max(0, frame - 50), fps, config: { damping: 14 } });
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 520,
        borderRadius: 40,
        overflow: "hidden",
        border: `1px solid ${C.border}`,
        boxShadow: "0 50px 120px rgba(0,0,0,0.5)",
        opacity: interpolate(frame, [40, 90], [0, 1], { extrapolateRight: "clamp" }),
        transform: `scale(${0.94 + zoom * 0.06})`,
      }}
    >
      <Img
        src={staticFile("media/hero-dashboard-mockup.png")}
        style={{ width: "100%", height: "auto", display: "block" }}
      />
    </div>
  );
}

function OutroScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ frame, fps, config: { damping: 12 } });
  const fade = interpolate(frame, [D.outro - 50, D.outro - 5], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: `linear-gradient(180deg, ${C.bg} 0%, ${C.surface} 100%)`,
        opacity: fade,
      }}
    >
      <div
        style={{
          transform: `scale(${0.9 + scale * 0.1})`,
          textAlign: "center",
          padding: 48,
        }}
      >
        <p style={{ margin: "0 0 16px", fontSize: 26, color: C.muted, fontWeight: 600 }}>Découvrir Inkflow</p>
        <div
          style={{
            display: "inline-block",
            padding: "26px 52px",
            borderRadius: 20,
            background: `linear-gradient(135deg, ${C.accent} 0%, #a88b4a 100%)`,
            color: "#0d0d0d",
            fontSize: 42,
            fontWeight: 900,
            letterSpacing: "-0.02em",
            boxShadow: "0 20px 60px rgba(201,169,110,0.35)",
          }}
        >
          ink-flow.me
        </div>
        <p style={{ marginTop: 36, fontSize: 22, color: C.muted, maxWidth: 720, lineHeight: 1.5 }}>
          Exporte cette vidéo en MP4 puis importe-la dans Framer — ou remplace les visuels dans{" "}
          <code style={{ color: C.accent }}>public/media/</code>.
        </p>
      </div>
    </AbsoluteFill>
  );
}
