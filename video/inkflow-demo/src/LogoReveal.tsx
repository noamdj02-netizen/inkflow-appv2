import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { C, font } from "./theme";

export const LOGO_REVEAL_TOTAL_FRAMES = 132;
export const LOGO_REVEAL_WIDTH = 1080;
export const LOGO_REVEAL_HEIGHT = 1920;

export const LogoReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const intro = spring({
    frame: frame - 6,
    fps,
    config: { damping: 16, mass: 0.72, stiffness: 105 },
  });
  const exit = interpolate(frame, [112, LOGO_REVEAL_TOTAL_FRAMES], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const logoScale = interpolate(intro, [0, 1], [0.76, 1]);
  const logoOpacity = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const markLift = interpolate(frame, [58, 86], [0, -18], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const glow = interpolate(frame, [0, 38, 98, LOGO_REVEAL_TOTAL_FRAMES], [0, 1, 0.5, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const shimmerX = interpolate(frame, [18, 58], [-250, 250], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: C.bg,
        overflow: "hidden",
        ...font,
      }}
    >
      <SoftBackdrop glow={glow} />
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          opacity: exit,
          padding: "210px 96px 250px",
          transform: "translateY(-78px)",
        }}
      >
        <div
          style={{
            position: "relative",
            width: 292,
            height: 292,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `translateY(${markLift}px) scale(${logoScale})`,
            opacity: logoOpacity,
          }}
        >
          <div
            style={{
              position: "relative",
              width: 214,
              height: 214,
              borderRadius: 48,
              overflow: "hidden",
              boxShadow: `0 28px 95px rgba(0,0,0,0.58), 0 0 ${28 * glow}px rgba(232,227,220,0.16)`,
            }}
          >
            <Img
              src={staticFile("media/logo-inkflow.png")}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                display: "block",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: -40,
                background:
                  "linear-gradient(110deg, transparent 34%, rgba(255,255,255,0.42) 48%, transparent 62%)",
                transform: `translateX(${shimmerX}px) rotate(8deg)`,
                opacity: interpolate(frame, [18, 30, 58, 68], [0, 0.62, 0.62, 0], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
                mixBlendMode: "screen",
              }}
            />
          </div>
        </div>
        <Wordmark />
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

function Wordmark() {
  const frame = useCurrentFrame();
  const wordOpacity = interpolate(frame, [48, 72], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const wordY = interpolate(frame, [48, 72], [26, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const taglineOpacity = interpolate(frame, [72, 94], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ctaOpacity = interpolate(frame, [90, 112], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ marginTop: -4, textAlign: "center" }}>
      <div
        style={{
          color: C.text,
          fontSize: 84,
          fontWeight: 900,
          letterSpacing: "-0.065em",
          lineHeight: 1,
          opacity: wordOpacity,
          transform: `translateY(${wordY}px)`,
          textShadow: "0 16px 70px rgba(232,227,220,0.14)",
        }}
      >
        Inkflow
      </div>
      <div
        style={{
          margin: "22px auto 0",
          maxWidth: 560,
          color: "rgba(232,227,220,0.72)",
          fontSize: 28,
          fontWeight: 650,
          lineHeight: 1.35,
          letterSpacing: "-0.018em",
          opacity: taglineOpacity,
        }}
      >
        L’app qui garde ton studio tatouage organisé.
      </div>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 44,
          minHeight: 64,
          padding: "0 34px",
          borderRadius: 999,
          background: C.text,
          color: C.bg,
          fontSize: 25,
          fontWeight: 850,
          letterSpacing: "-0.02em",
          opacity: ctaOpacity,
          boxShadow: "0 22px 60px rgba(0,0,0,0.32)",
        }}
      >
        Découvrir Inkflow
      </div>
    </div>
  );
}

function SoftBackdrop({ glow }: { glow: number }) {
  const frame = useCurrentFrame();
  const grainOpacity = interpolate(frame, [0, 20, 112, LOGO_REVEAL_TOTAL_FRAMES], [0, 0.12, 0.12, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 38%, rgba(232,227,220,${0.11 * glow}) 0%, transparent 24%), radial-gradient(circle at 50% 74%, rgba(232,227,220,${0.045 * glow}) 0%, transparent 34%)`,
        }}
      />
      {[0, 1].map((index) => (
        <div
          key={index}
          style={{
            position: "absolute",
            width: 560 + index * 280,
            height: 560 + index * 280,
            borderRadius: "50%",
            left: index === 0 ? -180 : 610,
            top: index === 0 ? 190 : 980,
            background: `radial-gradient(circle, rgba(232,227,220,${0.035 - index * 0.012}) 0%, transparent 70%)`,
            transform: `translate(${Math.sin((frame + index * 44) * 0.018) * 34}px, ${Math.cos((frame + index * 52) * 0.016) * 28}px)`,
            filter: "blur(2px)",
          }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(112deg, transparent 0%, rgba(255,255,255,0.035) 48%, transparent 62%)",
          transform: `translateX(${interpolate(frame, [0, LOGO_REVEAL_TOTAL_FRAMES], [-LOGO_REVEAL_WIDTH, LOGO_REVEAL_WIDTH])}px)`,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(circle at 25% 20%, rgba(255,255,255,${grainOpacity}) 0 1px, transparent 1px)`,
          backgroundSize: "38px 38px",
          opacity: 0.18 + random("logo-grain") * 0.02,
          mixBlendMode: "screen",
        }}
      />
    </>
  );
}

function Vignette() {
  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        boxShadow: `inset 0 0 ${LOGO_REVEAL_HEIGHT * 0.11}px rgba(0,0,0,0.68)`,
      }}
    />
  );
}
