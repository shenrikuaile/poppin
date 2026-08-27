"use client";

import { useEffect, useRef } from "react";

const CURSOR_HOTSPOT_X = 98.67;
const CURSOR_HOTSPOT_Y = 55;

const INTERACTIVE_SELECTOR = [
  "a[href]",
  "button:not(:disabled)",
  '[role="button"]',
  "summary",
  "select",
  'input[type="button"]',
  'input[type="submit"]',
  'input[type="reset"]',
].join(",");

const TEXT_INPUT_SELECTOR = [
  'input:not([type="button"]):not([type="submit"]):not([type="reset"])',
  "textarea",
  '[contenteditable="true"]',
].join(",");

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    let pointerX = 0;
    let pointerY = 0;
    let animationFrame: number | null = null;
    let hasMoved = false;
    let isInteractive = false;
    let isOverTextInput = false;

    const renderPosition = () => {
      cursor.style.transform = `translate3d(${pointerX - CURSOR_HOTSPOT_X}px, ${pointerY - CURSOR_HOTSPOT_Y}px, 0)`;
      animationFrame = null;
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;

      pointerX = event.clientX;
      pointerY = event.clientY;

      const target = event.target instanceof Element ? event.target : null;
      const nextInteractive = Boolean(target?.closest(INTERACTIVE_SELECTOR));
      const nextTextInput = Boolean(target?.closest(TEXT_INPUT_SELECTOR));

      if (nextInteractive !== isInteractive) {
        isInteractive = nextInteractive;
        cursor.classList.toggle("is-interactive", isInteractive);
      }

      if (nextTextInput !== isOverTextInput) {
        isOverTextInput = nextTextInput;
        cursor.classList.toggle("is-over-text-input", isOverTextInput);
      }

      if (!hasMoved) {
        hasMoved = true;
        cursor.classList.add("is-visible");
      }

      if (animationFrame === null) {
        animationFrame = window.requestAnimationFrame(renderPosition);
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (event.pointerType !== "touch") {
        cursor.classList.add("is-pressed");
      }
    };

    const handlePointerUp = () => {
      cursor.classList.remove("is-pressed");
    };

    const hideCursor = () => {
      cursor.classList.remove("is-visible", "is-pressed");
    };

    const showCursor = (event: PointerEvent) => {
      if (hasMoved && event.pointerType !== "touch") {
        cursor.classList.add("is-visible");
      }
    };

    document.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });
    document.addEventListener("pointerdown", handlePointerDown, {
      passive: true,
    });
    document.addEventListener("pointerup", handlePointerUp, { passive: true });
    document.addEventListener("pointercancel", handlePointerUp, {
      passive: true,
    });
    document.documentElement.addEventListener("pointerleave", hideCursor);
    document.documentElement.addEventListener("pointerenter", showCursor);
    window.addEventListener("blur", hideCursor);

    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("pointerup", handlePointerUp);
      document.removeEventListener("pointercancel", handlePointerUp);
      document.documentElement.removeEventListener("pointerleave", hideCursor);
      document.documentElement.removeEventListener("pointerenter", showCursor);
      window.removeEventListener("blur", hideCursor);

      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
      }
    };
  }, []);

  return (
    <div ref={cursorRef} className="custom-cursor" aria-hidden="true">
      {/* The original Illustrator canvas is retained so its exact hotspot can be used. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="custom-cursor-art"
        src="/cursor.svg"
        alt=""
        width="160"
        height="133.33"
        draggable={false}
      />
    </div>
  );
}
