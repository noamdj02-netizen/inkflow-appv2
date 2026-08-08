import React from "react";
import { Composition } from "remotion";
import { InkflowDemo, INKFLOW_DEMO_TOTAL_FRAMES } from "./InkflowDemo";
import {
  LogoReveal,
  LOGO_REVEAL_HEIGHT,
  LOGO_REVEAL_TOTAL_FRAMES,
  LOGO_REVEAL_WIDTH,
} from "./LogoReveal";

/** Point d’entrée Remotion — composition exportable en MP4 pour Framer. */
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="InkflowDemo"
        component={InkflowDemo}
        durationInFrames={INKFLOW_DEMO_TOTAL_FRAMES}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="LogoReveal"
        component={LogoReveal}
        durationInFrames={LOGO_REVEAL_TOTAL_FRAMES}
        fps={30}
        width={LOGO_REVEAL_WIDTH}
        height={LOGO_REVEAL_HEIGHT}
      />
    </>
  );
};
