/**
 * BootScene — Generates procedural textures (no external assets needed), then starts the game.
 */

class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        this.load.image('classroom_bg', 'img/classroom_bg.png');
        this.load.image('title_bg', 'img/title_bg.png');
        // 3-frame horizontal spritesheet (640×210 per frame) generated from sunnie_minibus.png
        this.load.spritesheet('sunnie_minibus', 'img/sunnie_minibus_sheet.png', {
            frameWidth: 640,
            frameHeight: 210,
        });

        for (let i = 1; i <= 5; i++) {
            this.load.image(`sunnie_${i}`, `img/sunnie_pose_${i}.png`);
        }
    }

    create() {
        // Generate a small white circle texture for particles
        const gfx = this.add.graphics();
        gfx.fillStyle(0xffffff, 1);
        gfx.fillCircle(8, 8, 8);
        gfx.generateTexture('particle', 16, 16);
        gfx.destroy();

        // Start the next scene after a brief delay for CDN fonts to load.
        // On index.html the next scene is TitleScene; on game.html it is GameScene.
        const nextScene = this.scene.manager.keys.hasOwnProperty('TitleScene')
            ? 'TitleScene'
            : 'GameScene';

        this.time.delayedCall(200, () => {
            this.scene.start(nextScene);
        });
    }
}

window.BootScene = BootScene;
