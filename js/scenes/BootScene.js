/**
 * BootScene — Generates procedural textures (no external assets needed), then starts the game.
 */

class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    create() {
        // Generate a small white circle texture for particles
        const gfx = this.add.graphics();
        gfx.fillStyle(0xffffff, 1);
        gfx.fillCircle(8, 8, 8);
        gfx.generateTexture('particle', 16, 16);
        gfx.destroy();

        // Slight delay for CDN fonts to load
        this.time.delayedCall(200, () => {
            this.scene.start('GameScene');
        });
    }
}

window.BootScene = BootScene;
