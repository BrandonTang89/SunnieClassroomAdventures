/**
 * StarCluster — A star carried by 1-5 balloons, floating upward.
 * When all balloons are popped, the star falls and scores points.
 * If it exits the top of the screen, a life token is lost.
 */

class StarCluster {
    constructor(scene, x, y, letters, speed) {
        this.scene = scene;
        this.x = x;
        this.baseY = y;
        this.speed = speed;           // pixels per second (upward)
        this.letters = letters;       // array of Greek letters on balloons
        this.destroyed = false;
        this.scored = false;
        this.escaped = false;
        this.falling = false;
        this.fallSpeed = 0;

        // Create the star
        this.starGfx = scene.add.star(x, y, 5, 15, 30, 0xffd700);
        this.starGfx.setStrokeStyle(2, 0xffa500);

        // Star glow / pulse
        scene.tweens.add({
            targets: this.starGfx,
            scaleX: 1.15,
            scaleY: 1.15,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Create balloons above the star
        this.balloons = [];
        const totalWidth = letters.length * 55;
        const startX = x - totalWidth / 2 + 27;

        for (let i = 0; i < letters.length; i++) {
            const bx = startX + i * 55;
            const by = y - 70 - Phaser.Math.Between(0, 20);
            const balloon = new Balloon(scene, bx, by, letters[i]);
            this.balloons.push(balloon);
        }

        // Create string graphics (lines from star to balloons)
        this.strings = scene.add.graphics();
        this.strings.lineStyle(1.5, 0xcccccc, 0.5);
        this._drawStrings();
    }

    _drawStrings() {
        this.strings.clear();
        this.strings.lineStyle(1.5, 0xcccccc, 0.5);

        for (const balloon of this.balloons) {
            if (balloon.popped) continue;
            const bp = balloon.getPosition();
            this.strings.lineBetween(
                this.starGfx.x, this.starGfx.y - 15,
                bp.x, bp.y + 34
            );
        }
    }

    /**
     * Pop all balloons in this cluster that match the given letter.
     * @returns {number} Number of balloons popped
     */
    popLetter(letter) {
        let popped = 0;
        for (const balloon of this.balloons) {
            if (!balloon.popped && balloon.letter === letter) {
                balloon.pop();
                popped++;
            }
        }

        // Check if all balloons are now popped → star falls
        if (popped > 0 && this.balloons.every(b => b.popped)) {
            this._startFalling();
        }

        return popped;
    }

    _startFalling() {
        this.falling = true;
        this.fallSpeed = 0;

        // Score awarded when star hits the bottom or after animation
        this.scene.tweens.add({
            targets: this.starGfx,
            scaleX: 1.5,
            scaleY: 1.5,
            duration: 300,
            yoyo: true,
            ease: 'Back.easeOut'
        });
    }

    /**
     * @returns number of points to award (0 if not yet scored)
     */
    getScore() {
        // More balloons = more points
        return this.letters.length * 10;
    }

    hasLetter(letter) {
        return this.balloons.some(b => !b.popped && b.letter === letter);
    }

    /**
     * Update position each frame.
     * @param {number} deltaSec — time in seconds
     * @returns {string|null} 'scored' | 'escaped' | null
     */
    update(deltaSec) {
        if (this.destroyed) return null;

        if (this.falling) {
            // Star falls with gravity
            this.fallSpeed += 500 * deltaSec; // gravity
            this.starGfx.y += this.fallSpeed * deltaSec;
            this.strings.clear();

            const gameHeight = this.scene.scale.height;
            if (this.starGfx.y > gameHeight + 50) {
                this.scored = true;
                this.destroy();
                return 'scored';
            }
            return null;
        }

        // Float upward
        const moveAmount = this.speed * deltaSec;
        this.starGfx.y -= moveAmount;

        // Move all non-popped balloons upward too
        for (const balloon of this.balloons) {
            if (!balloon.popped) {
                balloon.setPosition(balloon.getPosition().x, balloon.getPosition().y - moveAmount);
            }
        }

        this._drawStrings();

        // Check if escaped off the top
        if (this.starGfx.y < -80) {
            this.escaped = true;
            this.destroy();
            return 'escaped';
        }

        return null;
    }

    destroy() {
        if (this.destroyed) return;
        this.destroyed = true;

        for (const balloon of this.balloons) {
            balloon.destroy();
        }
        if (this.strings) this.strings.destroy();
        if (this.starGfx) this.starGfx.destroy();
    }
}

window.StarCluster = StarCluster;
