/**
 * TitleScene — The intro screen for Sunnie's Classroom Adventures
 * Displays the school exterior background and an animated minibus sprite.
 */

class TitleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TitleScene' });
    }

    create() {
        // Hide the "Copy the Numbers" right-hand pane by adding title-mode
        document.getElementById('app').classList.add('title-mode');
        window.dispatchEvent(new Event('resize'));

        const w = this.scale.width;
        const h = this.scale.height;

        // Seamless Scrolling Background (Oxford Street)
        this.bg = this.add.tileSprite(w / 2, h / 2, w, h, 'oxford_street_bg');
        // Scale to fit screen height
        const textureHeight = this.textures.get('oxford_street_bg').getSourceImage().height;
        const scale = h / textureHeight;
        this.bg.tileScaleX = scale;
        this.bg.tileScaleY = scale;

        // Create the minibus animation
        if (!this.anims.exists('minibus_eat')) {
            this.anims.create({
                key: 'minibus_eat',
                frames: this.anims.generateFrameNumbers('sunnie_minibus', { start: 0, end: 3 }),
                frameRate: 4,
                repeat: -1
            });
        }

        // Add the animated minibus near the bottom center
        const minibus = this.add.sprite(w / 2, h - 250, 'sunnie_minibus');
        minibus.setScale(0.8);
        minibus.play('minibus_eat');

        // Main Title Text
        const titleText = this.add.text(w / 2, h / 4, "Sunnie's Classroom\nAdventures", {
            fontFamily: 'Outfit, sans-serif',
            fontSize: '72px',
            fontStyle: '800',
            color: '#fdfbf7',
            stroke: '#4a3b32',
            strokeThickness: 8,
            align: 'center',
            shadow: { offsetX: 4, offsetY: 4, color: '#000000', blur: 0, stroke: true, fill: true }
        }).setOrigin(0.5);

        // Subtitle Text
        const subTitle = this.add.text(w / 2, h / 4 + 110, "Digit Balloon Pop", {
            fontFamily: 'Outfit, sans-serif',
            fontSize: '32px',
            fontStyle: '700',
            color: '#ffc107',
            stroke: '#4a3b32',
            strokeThickness: 6,
        }).setOrigin(0.5);

        // Play Button Background
        const btnBox = this.add.rectangle(w / 2, h / 2 + 50, 240, 80, 0x66ccff).setInteractive({ useHandCursor: true });
        btnBox.setStrokeStyle(4, 0x4a3b32);

        // Play Button Text
        const btnText = this.add.text(w / 2, h / 2 + 50, "PLAY ✨", {
            fontFamily: 'Outfit, sans-serif',
            fontSize: '36px',
            fontStyle: '800',
            color: '#ffffff',
            stroke: '#4a3b32',
            strokeThickness: 4,
        }).setOrigin(0.5);

        // Button hover effects
        btnBox.on('pointerover', () => {
            btnBox.fillColor = 0xb38cfd; // Purple hop
            this.tweens.add({ targets: [btnBox, btnText], scaleX: 1.1, scaleY: 1.1, duration: 100 });
        });

        btnBox.on('pointerout', () => {
            btnBox.fillColor = 0x66ccff;
            this.tweens.add({ targets: [btnBox, btnText], scaleX: 1, scaleY: 1, duration: 100 });
        });

        // Start game on click
        btnBox.on('pointerdown', () => {
            this.scene.start('GameScene');
        });
    }

    update() {
        // Scroll the background to create the illusion of the bus moving forward
        if (this.bg) {
            this.bg.tilePositionX += 4;
        }
    }
}

window.TitleScene = TitleScene;
