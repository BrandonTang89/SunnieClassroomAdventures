/**
 * DrawingCanvas — Manages the HTML5 Canvas drawing surface for Greek letter input.
 * Supports mouse, touch, and stylus (Apple Pencil).
 * Uses GreekCNN (ONNX Runtime Web) for recognition.
 */

class DrawingCanvas {
    constructor(canvasId, submitBtnId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.submitBtn = document.getElementById(submitBtnId);

        this.points = [];        // For redraw only
        this.strokeId = 0;
        this.isDrawing = false;
        this.lastX = 0;
        this.lastY = 0;

        // CNN recognizer (loaded asynchronously)
        this.recognizer = new DigitCNN();
        this.recognizer.init();

        this.onRecognized = null; // callback: (result) => {}

        this._resizeCanvas();
        this._setupEvents();
    }

    _resizeCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this._applyStyle();
    }

    _applyStyle() {
        this.ctx.strokeStyle = '#f8f9fa'; // Chalk white
        this.ctx.lineWidth = 10;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
        this.ctx.shadowBlur = 4;
    }

    _setupEvents() {
        // Pointer events (unified mouse/touch/stylus)
        this.canvas.addEventListener('pointerdown', (e) => this._onPointerDown(e));
        this.canvas.addEventListener('pointermove', (e) => this._onPointerMove(e));
        this.canvas.addEventListener('pointerup', (e) => this._onPointerUp(e));
        this.canvas.addEventListener('pointerleave', (e) => this._onPointerUp(e));

        // Prevent context menu on long press
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        // Buttons
        this.submitBtn.addEventListener('click', () => this._submit());

        // Resize
        window.addEventListener('resize', () => {
            this._resizeCanvas();
            this._redraw();
        });
    }

    _getPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    _onPointerDown(e) {
        e.preventDefault();
        this.canvas.setPointerCapture(e.pointerId);
        this.isDrawing = true;
        const pos = this._getPos(e);
        this.lastX = pos.x;
        this.lastY = pos.y;
        this.points.push({ x: pos.x, y: pos.y, id: this.strokeId });
        this.canvas.classList.add('drawing');
    }

    _onPointerMove(e) {
        if (!this.isDrawing) return;
        e.preventDefault();
        const pos = this._getPos(e);

        // Draw line segment
        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(pos.x, pos.y);
        this.ctx.stroke();

        this.lastX = pos.x;
        this.lastY = pos.y;
        this.points.push({ x: pos.x, y: pos.y, id: this.strokeId });
    }

    _onPointerUp(e) {
        if (!this.isDrawing) return;
        this.isDrawing = false;
        this.strokeId++;
        this.canvas.classList.remove('drawing');
    }

    _redraw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this._applyStyle();

        if (this.points.length < 2) return;

        for (let i = 1; i < this.points.length; i++) {
            if (this.points[i].id === this.points[i - 1].id) {
                this.ctx.beginPath();
                this.ctx.moveTo(this.points[i - 1].x, this.points[i - 1].y);
                this.ctx.lineTo(this.points[i].x, this.points[i].y);
                this.ctx.stroke();
            }
        }
    }

    async _submit() {
        if (this.points.length < 5) {
            this._flashFeedback('Draw a letter first!', '#f87171');
            return;
        }

        if (!this.recognizer.ready) {
            this._flashFeedback('Model loading...', '#fbbf24');
            return;
        }

        // Run CNN inference on the canvas
        const result = await this.recognizer.recognize(this.canvas);
        console.log('[DrawingCanvas] Recognition result:', result.symbol,
            'Confidence:', (result.confidence * 100).toFixed(1) + '%');

        if (this.onRecognized) {
            this.onRecognized(result);
        }

        const confPct = (result.confidence * 100).toFixed(0);
        this._flashFeedback(
            `${result.symbol} (${confPct}%)`,
            result.confidence > 0.3 ? '#34d399' : '#f87171'
        );
        this.clear();
    }

    _flashFeedback(text, color) {
        const header = document.querySelector('.drawing-title');
        header.textContent = text;
        header.style.color = color;

        setTimeout(() => {
            header.textContent = 'Copy the Numbers!';
            header.style.color = '#4a3b32';
        }, 1200);
    }

    clear() {
        this.points = [];
        this.strokeId = 0;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

window.DrawingCanvas = DrawingCanvas;
