/**
 * DrawingCanvas — Manages the HTML5 Canvas drawing surface for Greek letter input.
 * Supports mouse, touch, and stylus (Apple Pencil).
 * Collects stroke points for $P recognizer and dispatches recognition events.
 */

class DrawingCanvas {
    constructor(canvasId, submitBtnId, clearBtnId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.submitBtn = document.getElementById(submitBtnId);
        this.clearBtn = document.getElementById(clearBtnId);

        this.points = [];        // Array of PDollarPoint
        this.strokeId = 0;
        this.isDrawing = false;
        this.lastX = 0;
        this.lastY = 0;

        this.recognizer = new PDollarRecognizer();
        initGreekTemplates(this.recognizer);

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
        this.ctx.strokeStyle = '#a78bfa';
        this.ctx.lineWidth = 4;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.shadowColor = '#8b5cf6';
        this.ctx.shadowBlur = 8;
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
        this.clearBtn.addEventListener('click', () => this.clear());

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
        this.points.push(new PDollarPoint(pos.x, pos.y, this.strokeId));
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
        this.points.push(new PDollarPoint(pos.x, pos.y, this.strokeId));
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
            if (this.points[i].ID === this.points[i - 1].ID) {
                this.ctx.beginPath();
                this.ctx.moveTo(this.points[i - 1].X, this.points[i - 1].Y);
                this.ctx.lineTo(this.points[i].X, this.points[i].Y);
                this.ctx.stroke();
            }
        }
    }

    _submit() {
        console.log('[DrawingCanvas] Submit clicked, points:', this.points.length);
        if (this.points.length < 5) {
            this._flashFeedback('Draw a letter first!', '#f87171');
            return;
        }

        const result = this.recognizer.Recognize(this.points);
        console.log('[DrawingCanvas] Recognition result:', result.Name, 'Score:', result.Score);

        if (this.onRecognized) {
            this.onRecognized(result);
        }

        this._flashFeedback(`Recognized: ${result.Name}`, result.Score > 0 ? '#34d399' : '#f87171');
        this.clear();
    }

    _flashFeedback(text, color) {
        const header = document.querySelector('.drawing-title');
        const original = header.textContent;
        header.textContent = text;
        header.style.background = 'none';
        header.style.webkitBackgroundClip = 'unset';
        header.style.webkitTextFillColor = color;
        header.style.backgroundClip = 'unset';

        setTimeout(() => {
            header.textContent = 'Draw the Letter';
            header.style.background = 'linear-gradient(135deg, #a78bfa, #818cf8, #60a5fa)';
            header.style.webkitBackgroundClip = 'text';
            header.style.webkitTextFillColor = 'transparent';
            header.style.backgroundClip = 'text';
        }, 1200);
    }

    clear() {
        this.points = [];
        this.strokeId = 0;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

window.DrawingCanvas = DrawingCanvas;
