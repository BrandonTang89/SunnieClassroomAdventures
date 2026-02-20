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

        // Dark overlay
        this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.7);

        // Game Over text
        const gameOverText = this.add.text(w / 2, h * 0.25, 'GAME OVER', {
            fontFamily: 'Outfit',
            fontSize: '52px',
            fontStyle: '800',
            color: '#ff6b6b',
            stroke: '#000',
            strokeThickness: 4,
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
            fontFamily: 'Outfit',
            fontSize: '22px',
            fontStyle: '600',
            color: '#a78bfa',
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
        const btnBg = this.add.rectangle(w / 2, h * 0.75, 200, 55, 0x6366f1, 1)
            .setStrokeStyle(2, 0xa78bfa)
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
            btnBg.setFillStyle(0x818cf8);
            btnBg.setScale(1.05);
            btnText.setScale(1.05);
        });

        btnBg.on('pointerout', () => {
            btnBg.setFillStyle(0x6366f1);
            btnBg.setScale(1);
            btnText.setScale(1);
        });

        btnBg.on('pointerdown', () => {
            this.scene.start('GameScene');
        });

        // Floating particles in background
        for (let i = 0; i < 20; i++) {
            const star = this.add.star(
                Phaser.Math.Between(20, w - 20),
                Phaser.Math.Between(20, h - 20),
                5, 3, 6, 0xffd700, 0.3
            );
            this.tweens.add({
                targets: star,
                y: star.y - Phaser.Math.Between(20, 60),
                alpha: 0,
                duration: Phaser.Math.Between(2000, 4000),
                repeat: -1,
                delay: Phaser.Math.Between(0, 3000),
            });
        }
    }
}

window.GameOverScene = GameOverScene;
