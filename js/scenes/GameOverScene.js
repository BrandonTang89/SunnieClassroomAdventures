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
            speedY: { min: 500, max: 900 },
            speedX: { min: -50, max: 50 },
            scale: { start: 0.1, end: 0.3 },
            alpha: { start: 0.4, end: 0.0 },
            lifespan: 1500,
            quantity: 3,
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

        // Play Again button
        const btnBg = this.add.rectangle(w / 2, h * 0.75, 260, 65, 0x8b5a2b, 1) // Brown
            .setStrokeStyle(4, 0x4a3b32)
            .setInteractive({ useHandCursor: true })
            .setAlpha(0);

        const btnText = this.add.text(w / 2, h * 0.75, 'Play Again ✨', {
            fontFamily: 'Outfit',
            fontSize: '22px',
            fontStyle: '700',
            color: '#ffffff',
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: [btnBg, btnText],
            alpha: 1,
            duration: 400,
            delay: 1000,
            ease: 'Power2'
        });

        btnBg.on('pointerover', () => {
            btnBg.setFillStyle(0xa56e3a); // Lighter brown on hover
            btnBg.setScale(1.05);
            btnText.setScale(1.05);
        });

        btnBg.on('pointerout', () => {
            btnBg.setFillStyle(0x8b5a2b);
            btnBg.setScale(1);
            btnText.setScale(1);
        });

        btnBg.on('pointerdown', () => {
            this.scene.start('GameScene');
        });
    }
}

window.GameOverScene = GameOverScene;
