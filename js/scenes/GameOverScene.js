/**
 * GameOverScene — Shows final score and a "Play Again" button.
 */

class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data) {
        this.finalScore = data.score || 0;
    }

    create() {
        const w = this.scale.width;
        const h = this.scale.height;

        // Background
        const bg = this.add.image(w / 2, h / 2, 'classroom_bg');
        const scaleX = w / bg.width;
        const scaleY = h / bg.height;
        bg.setScale(Math.max(scaleX, scaleY));
        bg.setDepth(-10);

        // Dark overlay
        this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.7);

        // Rain particles
        this.rainParticles = this.add.particles(0, 0, 'particle', {
            x: { min: 0, max: w },
            y: -50,
            speedY: { min: 700, max: 1100 },
            speedX: { min: -50, max: 50 },
            scale: { start: 0.1, end: 0.3 },
            alpha: { start: 0.5, end: 0.0 },
            lifespan: 1500,
            quantity: 15,
            tint: [0xa78bfa, 0x66ccff, 0xffffff],
            blendMode: 'ADD'
        });

        // Sunnie Umbrella Sprite
        this.sunnie = this.add.image(w * 0.2, h - 250, 'sunnie_umbrella');
        this.sunnie.setScale(0.8);
        this.sunnie.setDepth(10);

        // Slow bobbing tween for Sunnie
        this.tweens.add({
            targets: this.sunnie,
            y: this.sunnie.y - 12,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Game Over text
        const gameOverText = this.add.text(w / 2, h * 0.25, 'GAME OVER', {
            fontFamily: 'Outfit, sans-serif',
            fontSize: '64px',
            fontStyle: '800',
            color: '#fdfbf7',
            stroke: '#4a3b32',
            strokeThickness: 8,
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: gameOverText,
            alpha: 1,
            scaleX: { from: 0.5, to: 1 },
            scaleY: { from: 0.5, to: 1 },
            duration: 600,
            ease: 'Back.easeOut'
        });

        // Score display
        const scoreLabel = this.add.text(w / 2, h * 0.45, 'Final Score', {
            fontFamily: 'Outfit, sans-serif',
            fontSize: '28px',
            fontStyle: '600',
            color: '#fdfbf7',
            stroke: '#4a3b32',
            strokeThickness: 4,
        }).setOrigin(0.5).setAlpha(0);

        const scoreValue = this.add.text(w / 2, h * 0.55, `${this.finalScore}`, {
            fontFamily: 'Outfit',
            fontSize: '64px',
            fontStyle: '800',
            color: '#ffd700',
            stroke: '#000',
            strokeThickness: 4,
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: [scoreLabel, scoreValue],
            alpha: 1,
            y: '-=10',
            duration: 500,
            delay: 400,
            ease: 'Power2'
        });

        // Counting animation for score
        this.time.delayedCall(500, () => {
            let displayScore = 0;
            const step = Math.max(1, Math.floor(this.finalScore / 30));
            const counter = this.time.addEvent({
                delay: 30,
                repeat: Math.min(30, this.finalScore),
                callback: () => {
                    displayScore = Math.min(this.finalScore, displayScore + step);
                    scoreValue.setText(`${displayScore}`);
                }
            });
        });

        // Play Again button — DOM overlay for reliable touch on iPad
        // Phaser's canvas touch input doesn't work reliably on iOS/iPad,
        // so we create a real HTML button positioned over the canvas.
        const container = document.getElementById('game-container');
        const canvas = container.querySelector('canvas');

        const domBtn = document.createElement('button');
        domBtn.id = 'play-again-btn';
        domBtn.textContent = 'Play Again ✨';
        domBtn.style.cssText = `
            position: absolute;
            z-index: 9999;
            padding: 18px 48px;
            font-family: 'Outfit', sans-serif;
            font-size: 22px;
            font-weight: 700;
            color: #ffffff;
            background: #8b5a2b;
            border: 4px solid #4a3b32;
            border-radius: 12px;
            cursor: pointer;
            opacity: 0;
            transition: opacity 0.4s ease, transform 0.15s ease, background 0.15s ease;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
        `;
        container.style.position = 'relative';
        container.appendChild(domBtn);

        // Position the button at 50% x, 75% y of the canvas
        const positionBtn = () => {
            const rect = canvas.getBoundingClientRect();
            const contRect = container.getBoundingClientRect();
            const btnRect = domBtn.getBoundingClientRect();
            domBtn.style.left = (rect.left - contRect.left + rect.width / 2 - btnRect.width / 2) + 'px';
            domBtn.style.top = (rect.top - contRect.top + rect.height * 0.75 - btnRect.height / 2) + 'px';
        };

        // Fade in after delay (matches original timing)
        this.time.delayedCall(1000, () => {
            domBtn.style.opacity = '1';
            positionBtn();
        });

        // Hover effects (desktop)
        domBtn.addEventListener('mouseenter', () => {
            domBtn.style.background = '#a56e3a';
            domBtn.style.transform = 'scale(1.05)';
        });
        domBtn.addEventListener('mouseleave', () => {
            domBtn.style.background = '#8b5a2b';
            domBtn.style.transform = 'scale(1)';
        });

        // Touch feedback (iPad/mobile)
        domBtn.addEventListener('touchstart', () => {
            domBtn.style.background = '#a56e3a';
            domBtn.style.transform = 'scale(1.05)';
        }, { passive: true });

        // Navigate on click/tap
        domBtn.addEventListener('click', () => {
            window.location.href = 'index.html';
        });

        // Reposition on resize
        this._resizeHandler = () => positionBtn();
        window.addEventListener('resize', this._resizeHandler);

        // Clean up DOM button when scene shuts down
        this.events.on('shutdown', () => {
            if (domBtn.parentNode) domBtn.parentNode.removeChild(domBtn);
            window.removeEventListener('resize', this._resizeHandler);
        });
    }
}

window.GameOverScene = GameOverScene;
