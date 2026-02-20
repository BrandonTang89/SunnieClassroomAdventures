/**
 * GameScene — Main gameplay scene.
 * Manages clusters, HUD, scoring, life system, and drawing integration.
 */

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        // ===== Layout Transition =====
        // Remove title-mode so #drawing-area is no longer display:none in CSS.
        // Also force the inline style immediately — this guarantees visibility
        // even if CSS reflow hasn't completed yet, and ensures DrawingCanvas
        // can read non-zero dimensions from getBoundingClientRect().
        document.getElementById('app').classList.remove('title-mode');
        document.getElementById('drawing-area').style.display = 'flex';

        // ===== Synchronous State (needed by update() on first tick) =====
        this.clusters = [];
        this.score = 0;
        this.successfulPops = 0;

        this.lifeSystem = new LifeSystem(
            GameConfig.MAX_MISSES,
            GameConfig.REFILL_WINDOW_MS
        );
        this.lifeSystem.onLifeChanged = (tokens, max) => this._updateLifeDisplay(tokens, max);
        this.lifeSystem.onGameOver = () => this._gameOver();

        this.spawner = new Spawner(this, {
            initialInterval: GameConfig.INITIAL_SPAWN_INTERVAL,
            minInterval: GameConfig.MIN_SPAWN_INTERVAL,
            intervalDecay: GameConfig.SPAWN_INTERVAL_DECAY,
            initialSpeed: GameConfig.INITIAL_FLOAT_SPEED,
            maxSpeed: GameConfig.MAX_FLOAT_SPEED,
            speedIncrease: GameConfig.SPEED_INCREASE,
        });

        // ===== Deferred Visual Setup =====
        // requestAnimationFrame fires after the browser has recalculated
        // layout, so the game-container is already at its 65% width.
        // Resizing Phaser here avoids the canvas being sized to the old
        // full-width title-mode container and overflowing the drawing area.
        requestAnimationFrame(() => {
            const container = document.getElementById('game-container');
            this.sys.game.scale.resize(container.clientWidth, container.clientHeight);

            this._createBackgroundStars();
            this._createHUD();

            // DrawingCanvas reads getBoundingClientRect() in its constructor.
            // Deferring until here guarantees #drawing-area has non-zero size.
            this.drawingCanvas = new DrawingCanvas('draw-canvas', 'submit-btn');
            this.drawingCanvas.onRecognized = (result) => this._onLetterRecognized(result);

            this.spawner.start();
        });
    }

    _createBackgroundStars() {
        const w = this.scale.width;
        const h = this.scale.height;

        // Render background classroom image
        const bg = this.add.image(w / 2, h / 2, 'classroom_bg');
        // Cover the whole screen
        const scaleX = w / bg.width;
        const scaleY = h / bg.height;
        bg.setScale(Math.max(scaleX, scaleY));
        bg.setDepth(-10); // Far back

        // Render Sunnie character on the BOTTOM LEFT
        this.sunnie = this.add.image(w * 0.15, h - 150, 'sunnie_1');
        this.sunnie.setScale(0.7); // Scale appropriately
        this.sunnie.setDepth(-5); // In front of background, behind balloons (which default to 0-1)

        // Fun idle bobbing animation for Sunnie
        this.tweens.add({
            targets: this.sunnie,
            y: this.sunnie.y - 15,
            duration: 900,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Ambient interactive stars overlay
        const gfx = this.add.graphics();

        for (let i = 0; i < 60; i++) {
            const x = Phaser.Math.Between(0, w);
            const y = Phaser.Math.Between(0, h);
            const size = Phaser.Math.FloatBetween(0.5, 2);
            const alpha = Phaser.Math.FloatBetween(0.2, 0.7);
            gfx.fillStyle(0xffffff, alpha);
            gfx.fillCircle(x, y, size);
        }

        // Twinkling effect with a few animated stars
        for (let i = 0; i < 8; i++) {
            const star = this.add.circle(
                Phaser.Math.Between(0, w),
                Phaser.Math.Between(0, h),
                Phaser.Math.FloatBetween(1, 2.5),
                0xffffff, 0.6
            );
            this.tweens.add({
                targets: star,
                alpha: { from: 0.2, to: 0.8 },
                duration: Phaser.Math.Between(1000, 3000),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
                delay: Phaser.Math.Between(0, 2000)
            });
        }
    }

    _createHUD() {
        // Score display
        this.scoreText = this.add.text(20, 15, 'Score: 0', {
            fontFamily: 'Outfit',
            fontSize: '24px',
            fontStyle: '700',
            color: '#ffd700',
            stroke: '#000',
            strokeThickness: 3,
        }).setDepth(100);

        // Life display (hearts)
        this.lifeIcons = [];
        const startX = 20;
        const startY = 52;
        for (let i = 0; i < GameConfig.MAX_MISSES; i++) {
            const heart = this.add.text(startX + i * 30, startY, '💛', {
                fontSize: '22px',
            }).setDepth(100);
            this.lifeIcons.push(heart);
        }
    }

    _updateLifeDisplay(tokens, max) {
        for (let i = 0; i < this.lifeIcons.length; i++) {
            this.lifeIcons[i].setText(i < tokens ? '💛' : '🖤');
            if (i >= tokens) {
                // Shake animation on lost life
                this.tweens.add({
                    targets: this.lifeIcons[i],
                    x: this.lifeIcons[i].x + 3,
                    duration: 50,
                    yoyo: true,
                    repeat: 3,
                });
            }
        }
    }

    _onLetterRecognized(result) {
        const letter = result.Name;
        const confidence = result.Score || result.confidence || 0;
        console.log('[GameScene] Letter recognized:', letter, 'Confidence:', (confidence * 100).toFixed(1) + '%');
        if (letter === 'No match' || letter === '?') return;

        // Confidence threshold — ignore low-confidence predictions
        if (confidence < 0.3) {
            console.log('[GameScene] Confidence too low, ignoring');
            return;
        }

        // Log available letters on screen
        const available = this.clusters
            .filter(c => !c.destroyed)
            .flatMap(c => c.balloons.filter(b => !b.popped).map(b => b.letter));
        console.log('[GameScene] Available letters on screen:', available.join(', '));

        let totalPopped = 0;

        // Pop matching balloons across ALL clusters
        for (const cluster of this.clusters) {
            if (!cluster.destroyed) {
                totalPopped += cluster.popLetter(letter);
            }
        }

        if (totalPopped > 0) {
            this.successfulPops++;
            this._updateSunniePose();

            // Flash effect on the score
            this.tweens.add({
                targets: this.scoreText,
                scaleX: 1.3,
                scaleY: 1.3,
                duration: 150,
                yoyo: true,
                ease: 'Back.easeOut'
            });
        }
    }

    _updateSunniePose() {
        // Change pose every 5 successful draws
        // Max pose index is 5, loop back if needed
        const poseIndex = Math.floor(this.successfulPops / 5) % 5 + 1;
        this.sunnie.setTexture(`sunnie_${poseIndex}`);

        // Add a fun little pop animation when she changes poses
        if (this.successfulPops % 5 === 0) {
            this.tweens.add({
                targets: this.sunnie,
                scaleX: 0.85,
                scaleY: 0.85,
                duration: 150,
                yoyo: true,
                ease: 'Back.easeOut'
            });
        }
    }

    _gameOver() {
        this.spawner.stop();

        // Destroy remaining clusters
        for (const cluster of this.clusters) {
            cluster.destroy();
        }
        this.clusters = [];

        // Transition
        this.time.delayedCall(500, () => {
            this.scene.start('GameOverScene', { score: this.score });
        });
    }

    update(time, delta) {
        const deltaMs = delta;
        const deltaSec = delta / 1000;

        // Update life system
        this.lifeSystem.update(deltaMs);

        // Update spawner
        this.spawner.update(deltaMs);

        // Update clusters
        const toRemove = [];
        for (let i = 0; i < this.clusters.length; i++) {
            const cluster = this.clusters[i];
            const result = cluster.update(deltaSec);

            if (result === 'scored') {
                this.score += cluster.getScore();
                this.scoreText.setText(`Score: ${this.score}`);
                toRemove.push(i);
            } else if (result === 'escaped') {
                this.lifeSystem.drain();
                toRemove.push(i);
            } else if (cluster.destroyed) {
                toRemove.push(i);
            }
        }

        // Clean up destroyed clusters
        for (let i = toRemove.length - 1; i >= 0; i--) {
            this.clusters.splice(toRemove[i], 1);
        }
    }
}

window.GameScene = GameScene;
