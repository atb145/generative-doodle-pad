# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A single static web app, `generative-doodle-pad/` — a kaleidoscope-style particle drawing pad (canvas 2D, no framework, no build step, no dependencies).

## Running

Serve the directory and open it in a browser; there is no bundler or package manager involved.

```bash
python3 -m http.server 4173 --directory generative-doodle-pad
```

This matches the `doodle-pad` configuration in `.claude/launch.json` (port 4173). There are no lint, test, or build commands in this repo.

## Architecture

Three files, no modules:

- `index.html` — canvas element plus a settings panel (symmetry, brush size, trail length, rainbow toggle, mirror-lines toggle, clear/save buttons). All controls are referenced by DOM id from `app.js`.
- `app.js` — single IIFE containing all logic:
  - A `particles` array driven by a `requestAnimationFrame` loop (`tick`). Each pointer move calls `spawnBurst`, which pushes particles with velocity/life/decay/hue.
  - Symmetry rendering happens in `drawParticleAllSymmetries`: each particle is drawn `n` times (from the Symmetry slider) via `rotatePoint` around the canvas center, plus a mirrored copy across the vertical axis, producing the kaleidoscope effect.
  - The canvas is never fully cleared between frames — `tick` paints a low-alpha rect each frame (derived from the Trail slider) to fade previous strokes, which is what produces the trailing effect.
  - Mouse and touch input are unified through `pointerPos`/`onDown`/`onMove`/`onUp`.
  - "Save PNG" exports via `canvas.toDataURL`.
- `style.css` — fullscreen canvas plus a floating, collapsible glassmorphic control panel (`#panel`).

There is no state persistence, server-side logic, or external API — all state lives in `app.js` closures and resets on reload.
