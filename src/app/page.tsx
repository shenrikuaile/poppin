"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type PageState = "loading" | "transitioning" | "intro" | "leaving" | "next";

type StageLayout = {
  viewportWidth: number;
  viewportHeight: number;
  scale: number;
  offsetX: number;
  offsetY: number;
};

const DESIGN_WIDTH = 1920;
const DESIGN_HEIGHT = 1080;
const FRAME_INTERVAL = 150;
const FRAMES_PER_TURN = 10;
const TWO_PI = Math.PI * 2;

const PAGE_LOGO = {
  left: 33.85,
  top: 674,
  size: 369.6,
} as const;

const LOADER_BLOCKS = [
  { left: 50, top: 5.56, width: 13.89, height: 8.33 },
  { left: 30.56, top: 16.67, width: 8.33, height: 8.33 },
  { left: 16.67, top: 38.89, width: 6.94, height: 8.33 },
  { left: 13.89, top: 61.11, width: 4.17, height: 8.33 },
  { left: 16.67, top: 77.78, width: 8.33, height: 8.33 },
  { left: 30.56, top: 86.11, width: 13.89, height: 8.33 },
  { left: 50, top: 77.78, width: 18.06, height: 8.33 },
  { left: 72.22, top: 38.89, width: 19.44, height: 8.33 },
  { left: 66.67, top: 61.11, width: 19.44, height: 8.33 },
  { left: 66.67, top: 16.67, width: 16.67, height: 8.33 },
] as const;

function calculateStageLayout(
  viewportWidth: number,
  viewportHeight: number,
): StageLayout {
  const scale = Math.min(
    viewportWidth / DESIGN_WIDTH,
    viewportHeight / DESIGN_HEIGHT,
  );

  return {
    viewportWidth,
    viewportHeight,
    scale,
    offsetX: (viewportWidth - DESIGN_WIDTH * scale) / 2,
    offsetY: (viewportHeight - DESIGN_HEIGHT * scale) / 2,
  };
}

function useDesignStage() {
  const [layout, setLayout] = useState<StageLayout>(() =>
    calculateStageLayout(DESIGN_WIDTH, DESIGN_HEIGHT),
  );

  useEffect(() => {
    const updateLayout = () => {
      setLayout(calculateStageLayout(window.innerWidth, window.innerHeight));
    };

    updateLayout();
    window.addEventListener("resize", updateLayout);
    return () => window.removeEventListener("resize", updateLayout);
  }, []);

  return layout;
}

export default function HomePage() {
  const [progress, setProgress] = useState(0);
  const [pageState, setPageState] = useState<PageState>("loading");
  const layout = useDesignStage();

  useEffect(() => {
    let current = 0;
    let transitionTimeout: number | undefined;

    const progressTimer = window.setInterval(() => {
      const increment = Math.random() * 2.8 + 0.4;
      current = Math.min(current + increment, 100);
      setProgress(Math.floor(current));

      if (current >= 100) {
        window.clearInterval(progressTimer);
        transitionTimeout = window.setTimeout(
          () => setPageState("transitioning"),
          400,
        );
      }
    }, 60);

    return () => {
      window.clearInterval(progressTimer);
      if (transitionTimeout !== undefined) {
        window.clearTimeout(transitionTimeout);
      }
    };
  }, []);

  useEffect(() => {
    if (pageState !== "transitioning") return;
    const introTimeout = window.setTimeout(() => setPageState("intro"), 900);
    return () => window.clearTimeout(introTimeout);
  }, [pageState]);

  useEffect(() => {
    if (pageState !== "leaving") return;
    const nextTimeout = window.setTimeout(() => setPageState("next"), 750);
    return () => window.clearTimeout(nextTimeout);
  }, [pageState]);

  const introClass =
    pageState === "transitioning"
      ? "is-entering"
      : pageState === "intro"
        ? "is-visible"
        : pageState === "leaving"
          ? "is-leaving"
          : "";

  const loadingLogoSize = Math.min(
    Math.max(layout.viewportWidth * 0.12, 110),
    200,
  );
  const logoAtCenter = pageState === "loading";
  const sharedLogoStyle = logoAtCenter
    ? {
        left: (layout.viewportWidth - loadingLogoSize) / 2,
        top: (layout.viewportHeight - loadingLogoSize) / 2,
        width: loadingLogoSize,
      }
    : {
        left: layout.offsetX + PAGE_LOGO.left * layout.scale,
        top: layout.offsetY + PAGE_LOGO.top * layout.scale,
        width: PAGE_LOGO.size * layout.scale,
      };

  const sharedLogoClass =
    pageState === "loading"
      ? "is-loading"
      : pageState === "transitioning"
        ? "is-transitioning"
        : "is-hidden";

  return (
    <main className="experience-root" aria-busy={pageState === "loading"}>
      <section
        className={`loading-stage ${pageState === "loading" ? "is-visible" : ""}`}
        aria-hidden={pageState !== "loading"}
      >
        <div className="progress-rail" aria-hidden="true">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="loading-copy left-safe bottom-safe">
          Loading...
        </div>

        <div
          className="loading-copy loading-percent right-safe bottom-safe"
          aria-live="polite"
          aria-atomic="true"
        >
          {progress}
        </div>
      </section>

      <section
        className={`intro-page ${introClass}`}
        aria-hidden={pageState === "loading" || pageState === "next"}
      >
        <div
          className="design-stage"
          style={{
            transform: `translate(${layout.offsetX}px, ${layout.offsetY}px) scale(${layout.scale})`,
          }}
        >
          <Image
            className="page-artwork"
            src="/page-1.svg"
            alt="Poppin introduction"
            width={DESIGN_WIDTH}
            height={DESIGN_HEIGHT}
            priority
            unoptimized
          />

          <div
            className={`page-logo-mask ${pageState === "intro" || pageState === "leaving" || pageState === "next" ? "is-revealed" : ""}`}
            aria-hidden="true"
          />

          <button
            type="button"
            className="arrow-hit-area"
            aria-label="进入下一页面"
            disabled={pageState !== "intro"}
            onClick={() => setPageState("leaving")}
          >
            <Image
              className="arrow-artwork"
              src="/arrow.svg"
              alt=""
              width={617}
              height={635}
              unoptimized
            />
          </button>
        </div>
      </section>

      <div
        className={`shared-logo ${sharedLogoClass}`}
        style={sharedLogoStyle}
        role={pageState === "loading" ? "status" : undefined}
        aria-label={pageState === "loading" ? "Loading" : "Poppin"}
      >
        <AnimatedMark animated={pageState === "loading"} />
      </div>

      <section
        className={`next-page ${pageState === "leaving" || pageState === "next" ? "is-visible" : ""}`}
        aria-hidden={pageState !== "next"}
        aria-label="Next page"
      />
    </main>
  );
}

function AnimatedMark({ animated }: { animated: boolean }) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (!animated) return;
    const animationTimer = window.setInterval(() => {
      setFrame((currentFrame) => (currentFrame + 1) % FRAMES_PER_TURN);
    }, FRAME_INTERVAL);
    return () => window.clearInterval(animationTimer);
  }, [animated]);

  const sweepAngle = (frame / FRAMES_PER_TURN) * TWO_PI - Math.PI * 0.45;

  return (
    <div className="mark-canvas">
      {LOADER_BLOCKS.map((block, index) => {
        const centerX = block.left + block.width / 2;
        const centerY = block.top + block.height / 2;
        const blockAngle = Math.atan2(centerY - 50, centerX - 50);
        const angularDistance = (sweepAngle - blockAngle + TWO_PI) % TWO_PI;
        const angularWeight = animated
          ? Math.exp(-Math.pow(angularDistance / (Math.PI * 0.42), 2))
          : 1;
        const opacity = animated ? 0.1 + angularWeight * 0.9 : 1;
        const scale = animated ? 0.9 + angularWeight * 0.1 : 1;
        const glowBlur = animated ? 1 + angularWeight * 11 : 0;
        const glowOpacity = animated ? angularWeight * 0.82 : 0;

        return (
          <span
            key={index}
            className="mark-block"
            suppressHydrationWarning
            style={{
              left: `${block.left}%`,
              top: `${block.top}%`,
              width: `${block.width}%`,
              height: `${block.height}%`,
              opacity,
              transform: `scale(${scale})`,
              filter: `drop-shadow(0 0 ${glowBlur}px rgba(255, 255, 255, ${glowOpacity}))`,
            }}
            aria-hidden="true"
          />
        );
      })}
    </div>
  );
}
