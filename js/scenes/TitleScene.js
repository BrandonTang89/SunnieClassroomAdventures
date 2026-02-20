/**
 * TitleScene — The intro screen for Sunnie's Classroom Adventures.
 *
 * Visual layout:
 *  • title_bg.png tiles horizontally and scrolls left, giving the illusion
 *    of the bus driving along an Oxford-style street.
 *  • The minibus sprite uses a 3-frame eating animation and slides across
 *    the screen from right to left in a looping tween that keeps it on
 *    the road portion of the background.
 *  • Title text, subtitle, and a PLAY button sit above the action.
 */

class TitleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TitleScene' });
    }

    // ===== Lifecycle =====

    create() {
        const w = this.scale.width;
        const h = this.scale.height;

        this._buildBackground(w, h);
        this._buildMinibus(w, h);
        this._buildUI(w, h);
    }

    update() {
        // Scroll the tiled background left to match the bus-driving illusion.
        // Speed is intentionally slow so the buildings feel distant.
        if (this.bg) {
            this.bg.tilePositionX += 0.2;
        }
    }

    // ===== Private helpers =====

    /**
     * Create and configure the tiling street background.
     * Scales the tile so the image fills the full screen height.
     * @param {number} w - Canvas width in pixels.
     * @param {number} h - Canvas height in pixels.
     */
    _buildBackground(w, h) {
        this.bg = this.add.tileSprite(w / 2, h / 2, w, h, 'title_bg');

        const textureH = this.textures.get('title_bg').getSourceImage().height;
        const scale = h / textureH;
        this.bg.tileScaleX = scale;
        this.bg.tileScaleY = scale;
    }

    /**
     * Add the animated minibus and start its drive-across tween loop.
     *
     * The bus enters from the right edge and exits to the left, then
     * instantly resets off-screen right to repeat.  The Y position is
     * tuned to sit on the road stripe at the bottom of title_bg.
     *
     * @param {number} w - Canvas width in pixels.
     * @param {number} h - Canvas height in pixels.
     */
    _buildMinibus(w, h) {
        // Road sits in roughly the bottom 20 % of the background.
        // With the bg scaled to fill h, the road centre is near h * 0.88.
        const busY = h * 0.88;

        // Scale so the bus occupies a natural road-width proportion.
        // The spritesheet frame is 640 px wide; target ~40 % screen width.
        const busScale = (w * 0.40) / 640;

        // Create animation once (scene may be restarted)
        if (!this.anims.exists('minibus_eat')) {
            this.anims.create({
                key: 'minibus_eat',
                frames: this.anims.generateFrameNumbers('sunnie_minibus', { start: 0, end: 2 }),
                frameRate: 2,
                repeat: -1,
            });
        }

        // Start off-screen to the right
        const startX = w + 400;
        this.minibus = this.add.sprite(startX, busY, 'sunnie_minibus');
        this.minibus.setScale(busScale);
        this.minibus.play('minibus_eat');

        this._driveMinibus(w);
    }

    /**
     * Launch the looping drive tween for the minibus.
     * Duration is tuned to give a comfortable cross-screen speed.
     * @param {number} w - Canvas width in pixels.
     */
    _driveMinibus(w) {
        const duration = 18000; // ms to cross the full screen

        this.tweens.add({
            targets: this.minibus,
            x: -400,
            duration,
            ease: 'Linear',
            onComplete: () => {
                // Reset off-screen right and repeat
                this.minibus.x = w + 400;
                this._driveMinibus(w);
            },
        });
    }

    /**
     * Build the title text, subtitle, and PLAY button.
     * @param {number} w - Canvas width in pixels.
     * @param {number} h - Canvas height in pixels.
     */
    _buildUI(w, h) {
        // ---- Title ----
        this.add.text(w / 2, h * 0.18, "Sunnie's Classroom\nAdventures", {
            fontFamily: 'Outfit, sans-serif',
            fontSize: '64px',
            fontStyle: '800',
            color: '#fdfbf7',
            stroke: '#4a3b32',
            strokeThickness: 8,
            align: 'center',
            shadow: { offsetX: 4, offsetY: 4, color: '#000000', blur: 0, stroke: true, fill: true },
        }).setOrigin(0.5);

        // ---- PLAY button ----
        const btnX = w / 2;
        const btnY = h * 0.52;

        const btnBox = this.add.rectangle(btnX, btnY, 240, 80, 0x66ccff)
            .setInteractive({ useHandCursor: true })
            .setStrokeStyle(4, 0x4a3b32);

        const btnText = this.add.text(btnX, btnY, 'PLAY', {
            fontFamily: 'Outfit, sans-serif',
            fontSize: '36px',
            fontStyle: '800',
            color: '#ffffff',
            stroke: '#4a3b32',
            strokeThickness: 4,
        }).setOrigin(0.5);

        btnBox.on('pointerover', () => {
            btnBox.fillColor = 0xb38cfd;
            this.tweens.add({ targets: [btnBox, btnText], scaleX: 1.08, scaleY: 1.08, duration: 100 });
        });

        btnBox.on('pointerout', () => {
            btnBox.fillColor = 0x66ccff;
            this.tweens.add({ targets: [btnBox, btnText], scaleX: 1, scaleY: 1, duration: 100 });
        });

        btnBox.on('pointerdown', () => {
            window.location.href = 'game.html';
        });
    }
}

window.TitleScene = TitleScene;
