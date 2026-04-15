import React from "react";
import { Composition } from "remotion";
import { InkflowDemo, INKFLOW_DEMO_TOTAL_FRAMES } from "./InkflowDemo";

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
    </>
  );
};
