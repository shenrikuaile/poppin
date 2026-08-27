import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the loading and SVG introduction experience", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Poppin<\/title>/i);
  assert.match(html, /Loading\.\.\./);
  assert.match(html, /role="status"/);
  assert.match(html, /page-1\.svg/);
  assert.match(html, /arrow\.svg/);
  assert.match(html, /cursor\.svg/);
  assert.match(html, /进入下一页面/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});

test("uses one uniformly scaled Illustrator stage and original SVG assets", async () => {
  const [page, css, cursor, layout, artwork, packageJson] = await Promise.all([
    readFile(new URL("../src/app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/globals.css", import.meta.url), "utf8"),
    readFile(
      new URL("../src/components/CustomCursor.tsx", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../src/app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../public/page-1.svg", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /^"use client";/);
  assert.match(page, /src="\/page-1\.svg"/);
  assert.match(page, /src="\/arrow\.svg"/);
  assert.match(page, /viewportWidth \/ DESIGN_WIDTH/);
  assert.match(page, /viewportHeight \/ DESIGN_HEIGHT/);
  assert.match(page, /transform: `translate\(/);
  assert.match(page, /setPageState\("transitioning"\)/);
  assert.match(page, /setPageState\("leaving"\)/);
  assert.match(page, /const FRAME_INTERVAL = 150/);
  assert.match(page, /Math\.atan2/);
  assert.match(page, /Math\.exp/);
  assert.match(css, /width: 1920px/);
  assert.match(css, /height: 1080px/);
  assert.match(css, /left: 1309px/);
  assert.match(css, /top: 142\.67px/);
  assert.match(css, /width: 430\.22px/);
  assert.match(css, /transform: rotate\(45deg\)/);
  assert.match(css, /cubic-bezier\(0\.76, 0, 0\.24, 1\)/);
  assert.doesNotMatch(css, /object-fit:\s*fill/i);
  assert.doesNotMatch(css, /animation: loader-spin|rotate\(360deg\)/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton|framer-motion/i);
  assert.match(layout, /<CustomCursor \/>/);
  assert.match(cursor, /src="\/cursor\.svg"/);
  assert.match(cursor, /CURSOR_HOTSPOT_X = 98\.67/);
  assert.match(cursor, /CURSOR_HOTSPOT_Y = 55/);
  assert.match(cursor, /requestAnimationFrame/);
  assert.doesNotMatch(cursor, /setState/);
  assert.match(css, /z-index: 99999/);
  assert.match(css, /pointer-events: none/);
  assert.match(css, /transform-origin: 98\.67px 55px/);
  assert.match(css, /pointer: coarse/);
  assert.match(artwork, /<g transform="translate\(0\.99 0\)">/);
  assert.match(artwork, /<g transform="translate\(24\.53 0\)">/);
});
