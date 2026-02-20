# AGENTS.md — Sunnie's Classroom Adventures

Educational iPad HTML5 game: pop balloons by drawing Greek letters. Built with
Phaser 3.80.1, ONNX Runtime Web 1.20.1, and a PyTorch/ONNX CNN for handwriting
recognition. **No build tooling, no npm, no bundler, no TypeScript.**

---

## Project Structure

```
index.html                  # Entry point; loads all scripts in dependency order
css/style.css               # All CSS (single file)
js/
  game.js                   # GameConfig constants + Phaser bootstrap (load LAST)
  drawing/DrawingCanvas.js  # Canvas input (mouse/touch/Apple Pencil) + CNN call
  entities/
    Balloon.js              # Balloon sprite with letter label
    StarCluster.js          # 1–5 balloons carrying a star, floats upward
  recognition/
    greekCNN.js             # ONNX Runtime Web inference wrapper
    pdollar.js              # $P gesture recognizer (fallback)
    templates.js            # Stroke templates for 12 Greek letters
  scenes/
    BootScene.js            # Procedural texture generation, launches GameScene
    GameScene.js            # Core gameplay: HUD, spawning, scoring, drawing
    GameOverScene.js        # Final score + Play Again
  systems/
    LifeSystem.js           # Token-bucket lives system
    Spawner.js              # Increasing-difficulty cluster spawner
train_model.py              # PyTorch CNN training on Greek handwriting dataset
export_onnx.py              # Export trained model to ONNX format
```

---

## Build / Serve / Test Commands

### Running the game

There is **no build step**. Serve `index.html` from any static HTTP server
(required because ONNX Runtime Web uses `fetch` for the `.onnx` model file):

```bash
# Python (simplest)
python3 -m http.server 8080

# Node (if npx is available)
npx serve .

# Then open: http://localhost:8080
```

### Running tests

**There is no test framework.** There are no unit, integration, or e2e tests.
Manual browser testing is the only verification method. When adding tests,
prefer a zero-config framework like [QUnit](https://qunitjs.com/) that can be
loaded from CDN with no build step.

### Python ML tooling

```bash
# Create / activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies (PyTorch, ONNX, etc.)
pip install torch torchvision onnx onnxruntime

# Train the CNN (requires greekDataset/ to exist — gitignored)
python train_model.py

# Export trained .pth model to ONNX (outputs to model/)
python export_onnx.py
```

Generated model files (`model/greek_cnn.onnx`, `model/class_names.json`) are
gitignored. Place them under `model/` before serving the game.

---

## Code Style Guidelines

### Language & Runtime

- **Vanilla ES6+ JavaScript** — no TypeScript, no JSX, no transpilation.
- **No modules** (`import`/`export` are not used). Every file runs in the global
  browser scope. Dependencies are loaded via `<script>` tags in `index.html` in
  strict dependency order (utilities before consumers; `game.js` last).
- **No third-party runtime dependencies** beyond what CDN scripts expose as
  globals: `Phaser` and `ort` (ONNX Runtime).

### Global Exports

Each file defines one class (or one named export object) and attaches it to
`window`:

```js
class StarCluster { ... }
window.StarCluster = StarCluster;
```

When adding a new module: define the class, assign it to `window`, and add the
`<script>` tag to `index.html` before any file that consumes it.

### Naming Conventions

| Construct | Convention | Example |
|---|---|---|
| Classes | `PascalCase` | `StarCluster`, `LifeSystem` |
| Files (classes) | `PascalCase.js` | `DrawingCanvas.js` |
| Files (utilities) | `camelCase.js` | `greekCNN.js`, `pdollar.js` |
| Public methods | `camelCase` | `popLetter()`, `takeDamage()` |
| Private methods | `_camelCase` | `_resizeCanvas()`, `_onPointerDown()` |
| Event callbacks | `onEventName` | `onRecognized`, `onLifeChanged` |
| Config constants | `SCREAMING_SNAKE_CASE` | `MAX_MISSES`, `INITIAL_FLOAT_SPEED` |
| Local variables | `camelCase` | `floatSpeed`, `clusterList` |

### Formatting

- **Indentation:** 4 spaces (no tabs).
- **Braces:** Opening brace on same line (`K&R` style).
- **Semicolons:** Required at end of statements.
- **Quotes:** Single quotes for JS strings; double quotes in HTML attributes.
- **Line length:** Aim for ≤ 100 characters; break long chained calls at `.`.
- **Blank lines:** One blank line between methods; two between top-level
  declarations.
- **Trailing commas:** Used in multi-line object/array literals.

### Comments & Documentation

Use JSDoc on constructors and all public methods:

```js
/**
 * Pop all balloons in this cluster matching the given letter.
 * @param {string} letter - Single uppercase Greek letter (e.g. 'Α').
 * @returns {number} Number of balloons popped.
 */
popLetter(letter) { ... }
```

Use section-header comments to separate logical blocks within large files:

```js
// ===== HUD Setup =====
// ===== Life System =====
```

Use inline comments sparingly; prefer self-documenting names. Comment *why*,
not *what*.

### Console Logging

All `console.*` calls must be prefixed with the module name in brackets:

```js
console.log('[GreekCNN] Model loaded successfully');
console.warn('[Spawner] Speed cap reached');
console.error('[DrawingCanvas] Recognition failed:', err);
```

### Error Handling

Use `try/catch` for all async operations (especially model loading and
inference). Log errors with the module prefix and degrade gracefully — never
crash the whole game over a recognition failure:

```js
try {
    this.session = await ort.InferenceSession.create('model/greek_cnn.onnx');
    this.ready = true;
} catch (err) {
    console.error('[GreekCNN] Failed to load model:', err);
    this.ready = false;  // fall back to $P gesture recognizer
}
```

Use guard clauses with early `return` for invalid state instead of deep nesting:

```js
if (!this.recognizer.ready) { this._flashFeedback('Model loading...', '#fbbf24'); return; }
if (this.popped) return;
```

### Phaser Patterns

- All scenes extend `Phaser.Scene` with `super({ key: 'SceneName' })`.
- Scene lifecycle order: `init(data)` → `preload()` → `create()` → `update(time, delta)`.
- Prefer `this.tweens.add(...)` over manual animation in `update()`.
- Pass config to systems via a plain options object, not positional arguments:
  ```js
  new Spawner(this, { initialInterval: 3000, minInterval: 800, ... });
  ```
- Use `Phaser.Math.Between` / `Phaser.Math.FloatBetween` for all RNG.

### Event / Callback Pattern

Systems communicate via assigned callback properties (not EventEmitter):

```js
// Producer sets the hook as null initially:
this.onLifeChanged = null;

// Consumer assigns the handler:
lifeSystem.onLifeChanged = (tokens, max) => this._updateLifeDisplay(tokens, max);

// Producer fires it:
if (this.onLifeChanged) this.onLifeChanged(this.tokens, this.max);
```

### Game Parameters

All tunable values live in the `GameConfig` object in `js/game.js`. **Never
hardcode magic numbers** in scene or system files; reference `GameConfig.*`
instead. Document each constant with an inline comment and unit.

---

## Adding a New Feature — Checklist

1. Create `js/<category>/MyFeature.js` with a single class + `window.MyFeature`.
2. Add a `<script src="js/<category>/MyFeature.js"></script>` tag in
   `index.html` **before** any file that uses it (and before `game.js`).
3. Use the `_privateMethod` naming convention for internal helpers.
4. Attach any event hooks as `onXxx = null` properties.
5. Add tunable values to `GameConfig` in `game.js`, not inline.
6. Log with `[ClassName]` prefix; handle errors with `try/catch` + graceful
   fallback.
