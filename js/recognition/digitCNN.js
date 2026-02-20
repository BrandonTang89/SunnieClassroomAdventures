/**
 * GreekCNN — Browser-side Greek letter recognition using ONNX Runtime Web.
 * Loads a trained CNN model and performs inference on canvas drawings.
 */

class DigitCNN {
    constructor() {
        this.session = null;
        this.classNames = null;
        this.ready = false;
        this.IMG_SIZE = 28;
    }

    /**
     * Load the ONNX model and class names mapping.
     * Call this once during game initialization.
     */
    async init() {
        try {
            console.log('[GreekCNN] Loading model...');

            // Load class names
            const classResp = await fetch('model/class_names.json');
            this.classNames = await classResp.json();
            console.log('[GreekCNN] Class names loaded:', Object.values(this.classNames).map(c => c.symbol).join(' '));

            // Load ONNX model
            this.session = await ort.InferenceSession.create('model/digit_cnn.onnx');
            console.log('[GreekCNN] Model loaded successfully');

            this.ready = true;
        } catch (err) {
            console.error('[GreekCNN] Failed to load model:', err);
            this.ready = false;
        }
    }

    /**
     * Recognize a Greek letter from the drawing canvas.
     * @param {HTMLCanvasElement} canvas — The drawing canvas element
     * @returns {Promise<{name: string, symbol: string, confidence: number}>}
     */
    async recognize(canvas) {
        if (!this.ready) {
            console.warn('[GreekCNN] Model not ready');
            return { name: 'No match', symbol: '?', confidence: 0 };
        }

        const t0 = performance.now();

        // Preprocess: extract drawing, resize to 64x64 grayscale, normalize
        const inputTensor = this._preprocessCanvas(canvas);

        // Run inference
        const feeds = { input: inputTensor };
        const results = await this.session.run(feeds);
        const outputData = results.output.data;

        // Softmax to get probabilities
        const probs = this._softmax(Array.from(outputData));

        // Find best match
        let bestIdx = 0;
        let bestProb = probs[0];
        for (let i = 1; i < probs.length; i++) {
            if (probs[i] > bestProb) {
                bestProb = probs[i];
                bestIdx = i;
            }
        }

        const classInfo = this.classNames[String(bestIdx)];
        const elapsed = performance.now() - t0;

        // Log top 3 for debugging
        const sorted = probs.map((p, i) => ({ i, p })).sort((a, b) => b.p - a.p);
        const top3 = sorted.slice(0, 3).map(x =>
            `${this.classNames[String(x.i)].symbol}(${(x.p * 100).toFixed(1)}%)`
        ).join(', ');
        console.log(`[GreekCNN] Top 3: ${top3} | ${elapsed.toFixed(0)}ms`);

        return {
            name: classInfo ? classInfo.name : 'Unknown',
            symbol: classInfo ? classInfo.symbol : '?',
            confidence: bestProb,
            Name: classInfo ? classInfo.symbol : '?',  // Backwards compat with game
            Score: bestProb,
        };
    }

    /**
     * Preprocess canvas into a 1x1x64x64 float tensor.
     * Steps: crop to bounding box, resize to 64x64, grayscale, invert, normalize.
     */
    _preprocessCanvas(canvas) {
        // Create an offscreen canvas for preprocessing
        const offscreen = document.createElement('canvas');
        offscreen.width = this.IMG_SIZE;
        offscreen.height = this.IMG_SIZE;
        const ctx = offscreen.getContext('2d');

        // Get the bounding box of the drawing
        const bbox = this._getBoundingBox(canvas);

        if (!bbox) {
            // Empty canvas — return black image
            const data = new Float32Array(1 * 1 * this.IMG_SIZE * this.IMG_SIZE);
            return new ort.Tensor('float32', data, [1, 1, this.IMG_SIZE, this.IMG_SIZE]);
        }

        // Add padding to bounding box (10% on each side)
        const padding = Math.max(bbox.width, bbox.height) * 0.15;
        const bx = Math.max(0, bbox.x - padding);
        const by = Math.max(0, bbox.y - padding);
        const bw = Math.min(canvas.width / (window.devicePixelRatio || 1) - bx, bbox.width + padding * 2);
        const bh = Math.min(canvas.height / (window.devicePixelRatio || 1) - by, bbox.height + padding * 2);

        // Make it square (centered)
        const side = Math.max(bw, bh);
        const cx = bx + bw / 2 - side / 2;
        const cy = by + bh / 2 - side / 2;

        // Fill with black (since we'll invert: dataset images have dark strokes on light bg,
        // and after inversion in training they become light on dark)
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, this.IMG_SIZE, this.IMG_SIZE);

        // Draw the cropped region scaled to 64x64
        ctx.drawImage(canvas, cx * (window.devicePixelRatio || 1), cy * (window.devicePixelRatio || 1),
            side * (window.devicePixelRatio || 1), side * (window.devicePixelRatio || 1),
            0, 0, this.IMG_SIZE, this.IMG_SIZE);

        // Get pixel data
        const imageData = ctx.getImageData(0, 0, this.IMG_SIZE, this.IMG_SIZE);
        const pixels = imageData.data; // RGBA

        // Convert to grayscale float array, invert, and normalize to match training
        const tensor = new Float32Array(this.IMG_SIZE * this.IMG_SIZE);
        for (let i = 0; i < this.IMG_SIZE * this.IMG_SIZE; i++) {
            const r = pixels[i * 4];
            const g = pixels[i * 4 + 1];
            const b = pixels[i * 4 + 2];
            const gray = (r + g + b) / 3 / 255.0;  // [0,1]

            // The drawing canvas has colored strokes on dark background.
            // Training data was inverted (white-on-black).
            // So we just need the brightness as-is (strokes are bright = high values)
            // Then normalize: (x - 0.5) / 0.5 = 2x - 1
            tensor[i] = (gray - 0.5) / 0.5;
        }

        return new ort.Tensor('float32', tensor, [1, 1, this.IMG_SIZE, this.IMG_SIZE]);
    }

    /**
     * Get the bounding box of non-transparent pixels on the canvas.
     */
    _getBoundingBox(canvas) {
        const dpr = window.devicePixelRatio || 1;
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;
        const imageData = ctx.getImageData(0, 0, w, h);
        const data = imageData.data;

        let minX = w, minY = h, maxX = 0, maxY = 0;
        let found = false;

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const alpha = data[(y * w + x) * 4 + 3];
                if (alpha > 20) {  // Non-transparent pixel
                    if (x < minX) minX = x;
                    if (y < minY) minY = y;
                    if (x > maxX) maxX = x;
                    if (y > maxY) maxY = y;
                    found = true;
                }
            }
        }

        if (!found) return null;

        return {
            x: minX / dpr,
            y: minY / dpr,
            width: (maxX - minX) / dpr,
            height: (maxY - minY) / dpr,
        };
    }

    /**
     * Softmax function.
     */
    _softmax(logits) {
        const maxLogit = Math.max(...logits);
        const exps = logits.map(x => Math.exp(x - maxLogit));
        const sum = exps.reduce((a, b) => a + b, 0);
        return exps.map(x => x / sum);
    }
}

window.DigitCNN = DigitCNN;
