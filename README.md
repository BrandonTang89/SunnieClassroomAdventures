# Sunnie's Classroom Adventures

An educational HTML5 game where you practice writing digits (0–9) by drawing them on a chalkboard canvas to pop floating balloons. Built with **Phaser 3** and powered by a **CNN digit recogniser** running entirely in the browser via **ONNX Runtime Web**.

> 🎮 **[Play it live on GitHub Pages](https://brandontang89.github.io/SunnieClassroomAdventures/)**

---

## Table of Contents

- [What It Is](#what-it-is)
- [How to Play](#how-to-play)
- [Architecture & How It Works](#architecture--how-it-works)
  - [Project Structure](#project-structure)
  - [Game Engine (Phaser 3)](#game-engine-phaser-3)
  - [Digit Recognition Pipeline](#digit-recognition-pipeline)
  - [Drawing Canvas](#drawing-canvas)
  - [Game Systems](#game-systems)
  - [Art & Assets](#art--assets)
- [Running Locally](#running-locally)
- [Model Training](#model-training)
- [Deployment](#deployment)

---

## What It Is

**Sunnie's Classroom Adventures** is a browser-based educational game designed primarily for iPad (but works on any device with a pointer/touch input). A character called **Sunnie** rides a minibus to school, and once the game starts, star clusters carried by colourful balloons float up from the bottom of the screen. Each balloon is labelled with a digit (0–9). The player draws the matching digit on a chalkboard-styled canvas, and a neural network recognises their handwriting in real time to pop the correct balloons.

### Key Features

- **Handwriting recognition** — A CNN trained on MNIST classifies drawn digits directly in the browser, no server round-trips.
- **Progressive difficulty** — Balloons spawn faster and in larger clusters over time. Four difficulty levels: Easy, Normal, Hard, and Insane.
- **Touch & stylus support** — Optimised for Apple Pencil / iPad, with double-tap and pinch-to-zoom prevention.
- **Animated title screen** — A parallax-scrolling Oxford-style street with Sunnie's minibus driving across.
- **Game over scene** — Rain particle effects, a bobbing Sunnie with an umbrella, and an animated score counter.

---

## How to Play

1. **Title Screen** — Choose a difficulty (tap the arrows to cycle through Easy / Normal / Hard / Insane), then press **Play**.
2. **Gameplay** — Star clusters float upward, each held aloft by 1–9 balloons labelled with digits.
   - **Draw** the digit shown on a balloon in the chalkboard area on the right.
   - **Tap Submit** — the CNN recognises your drawing and pops all matching balloons on screen.
   - When all balloons on a cluster are popped, the star falls and you earn points.
   - If a cluster escapes off the top, you lose a life token (shown as hearts in the HUD).
3. **Game Over** — When all life tokens are drained, the game ends and your final score is displayed.

> **Tip:** More balloons on a cluster means it rises faster, so pop them quickly!

---

## Architecture & How It Works

### Project Structure

```
SunnieClassroomAdventures/
├── index.html              # Title screen entry point
├── game.html               # Main game page (canvas + drawing area)
├── css/
│   └── style.css           # All styling (layout, chalkboard, buttons)
├── js/
│   ├── game.js             # Phaser config & game parameters
│   ├── scenes/
│   │   ├── BootScene.js    # Asset preloading
│   │   ├── TitleScene.js   # Animated title screen
│   │   ├── GameScene.js    # Core gameplay loop
│   │   └── GameOverScene.js# End screen with score
│   ├── entities/
│   │   ├── Balloon.js      # Individual balloon with letter & pop animation
│   │   └── StarCluster.js  # Star + balloons group, floats upward
│   ├── systems/
│   │   ├── LifeSystem.js   # Token-bucket lives with auto-refill
│   │   └── Spawner.js      # Progressive cluster spawning
│   ├── drawing/
│   │   └── DrawingCanvas.js# Pointer/touch/stylus drawing surface
│   └── recognition/
│       └── digitCNN.js     # ONNX Runtime Web inference wrapper
├── model/
│   ├── digit_cnn.onnx      # Trained CNN model (ONNX format)
│   ├── digit_cnn.pt        # PyTorch checkpoint
│   └── class_names.json    # Label mapping (0–9)
├── img/                    # Sprites, backgrounds, favicon
├── get_mnist_model.py      # Model training script (PyTorch + MNIST)
├── export_onnx.py          # Standalone ONNX export utility
└── .github/workflows/
    └── pages.yml           # GitHub Pages deployment workflow
```

---

### Game Engine (Phaser 3)

The game uses [Phaser 3](https://phaser.io/) loaded from CDN. The Phaser configuration lives in `js/game.js`, which detects whether the page is the title screen (`index.html`) or the game page (`game.html`) by checking for the `#drawing-area` DOM element, and loads the appropriate scene list.

| Scene | Purpose |
|---|---|
| **BootScene** | Preloads all image assets (backgrounds, sprite sheets, Sunnie poses). |
| **TitleScene** | Displays a horizontally-scrolling tiled street background with an animated three-frame minibus sprite, title text, difficulty selector, and a Play button that navigates to `game.html`. |
| **GameScene** | Runs the main loop: spawns `StarCluster` entities, updates the HUD (score + life hearts), handles recognised digits from the drawing canvas, and updates Sunnie's reactive pose. |
| **GameOverScene** | Shows the final score with a counting animation, a darkened classroom background, rain particles, Sunnie with an umbrella, and a "Play Again" button. |

---

### Digit Recognition Pipeline

Handwriting recognition runs **entirely client-side** with no backend:

```
  User draws on canvas
        │
        ▼
  DrawingCanvas._submit()
        │
        ▼
  DigitCNN._preprocessCanvas()
   ┌─ Crop to bounding box of drawn pixels
   ├─ Add 15% padding, make square
   ├─ Resize to 28×28 grayscale
   └─ Normalize to [-1, 1]
        │
        ▼
  ONNX Runtime Web inference
   (model/digit_cnn.onnx)
        │
        ▼
  Softmax → top prediction
        │
        ▼
  GameScene._onLetterRecognized()
   → pops matching balloons
```

The CNN model is a **3-block convolutional network** (Conv → BatchNorm → ReLU → MaxPool) with a dropout-regularised linear classifier head. It is trained on **MNIST** with data augmentation (random affine transforms) to handle the messy handwriting of children.

---

### Drawing Canvas

`DrawingCanvas` (`js/drawing/DrawingCanvas.js`) manages a standard HTML5 `<canvas>` element styled as a green chalkboard with a wooden frame. It supports:

- **Pointer Events** — Unified handling for mouse, touch, and stylus (Apple Pencil).
- **Stroke recording** — Points are stored per-stroke for redraw on resize.
- **Debounce guard** — Prevents double-firing from simultaneous `touchend` + `click` events.
- **Visual feedback** — The header flashes the recognised digit and confidence percentage.

---

### Game Systems

#### Life System (`LifeSystem`)

A **token-bucket** design: the player starts with 5 life tokens. Each escaped star cluster drains one token. Tokens automatically refill over a 30-second window. If the bucket empties, it's game over.

#### Spawner (`Spawner`)

Controls cluster generation with two axes of difficulty that ramp over time:

| Parameter | Start | Cap | Rate of change |
|---|---|---|---|
| Spawn interval | 3 000 ms | 800 ms | −3 ms per second |
| Float speed | 30 px/s | 90 px/s | +0.5 px/s per second |

Balloon count per cluster also increases over time, scaled by difficulty:

| Difficulty | Max balloons | Ramp-up rate | Min balloons |
|---|---|---|---|
| Easy | 3 | 45 s per +1 | 1 |
| Normal | 5 | 30 s per +1 | 1 |
| Hard | 7 | 20 s per +1 | 2 |
| Insane | 9 | 10 s per +1 | 3 |

Clusters with more active (un-popped) balloons float **faster** using the formula:  
`speed × (1 + (activeBalloons − 1) × 0.5)`

---

### Art & Assets

- **Title background** — A hand-painted Oxford-style street that tiles horizontally and scrolls to create a driving effect.
- **Classroom background** — Used in the game scene and (darkened) in the game over scene.
- **Sunnie sprite sheet** — 5 reactive poses displayed based on the player's current score.
- **Sunnie umbrella** — A separate sprite used in the rainy game over scene.
- **Minibus sprite sheet** — 3-frame animation of Sunnie riding a minibus across the title screen.
- **Favicon** — A Sunnie-themed icon (`sunnie_favicon.png`).

---

## Running Locally

The game is a **static site** with no build step required. Serve the project directory with any HTTP server:

```bash
# Python
python -m http.server 8000

# Node.js (npx)
npx serve .
```

Then open `http://localhost:8000` in your browser.

---

## Model Training

The digit recognition model can be retrained from scratch using the included Python scripts. Dependencies are managed with [uv](https://docs.astral.sh/uv/):

```bash
# Install dependencies
uv sync

# Train on MNIST and export to ONNX
uv run python get_mnist_model.py
```

This will:
1. Download the MNIST dataset to `data/`.
2. Train a 3-layer CNN for 6 epochs with data augmentation.
3. Save the PyTorch checkpoint to `model/digit_cnn.pt`.
4. Export the ONNX model to `model/digit_cnn.onnx`.
5. Write the class label mapping to `model/class_names.json`.

---

## Deployment

The project auto-deploys to **GitHub Pages** on every push to `main`/`master` via the workflow at `.github/workflows/pages.yml`. The workflow strips development-only files (Python scripts, training data, virtualenv) before uploading the static site artifact.
