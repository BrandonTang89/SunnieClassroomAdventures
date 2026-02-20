/**
 * Balloon — A balloon sprite with a Greek letter displayed on it.
 * Part of a StarCluster. Can be popped when the correct letter is drawn.
 */

class Balloon {
    // Color palette for balloons
    static COLORS = [
        0xff6b6b, // coral red
        0x4ecdc4, // teal
        0xffe66d, // sunny yellow
        0xa78bfa, // purple
        0x6ee7b7, // mint green
        0xf472b6, // pink
        0x60a5fa, // blue
        0xfbbf24, // amber
        0xf87171, // light red
        0x34d399, // emerald
    ];

    constructor(scene, x, y, letter) {
        this.scene = scene;
        this.letter = letter;
        this.popped = false;

        const digit = parseInt(letter, 10);
        const color = isNaN(digit) ? Balloon.COLORS[0] : Balloon.COLORS[digit % Balloon.COLORS.length];

        // Create balloon container
        this.container = scene.add.container(x, y);

        // Balloon body (ellipse)
        this.body = scene.add.ellipse(0, 0, 50, 62, color, 0.9);
        this.body.setStrokeStyle(2, Phaser.Display.Color.IntegerToColor(color).brighten(30).color);

        // Shine highlight
        this.shine = scene.add.ellipse(-10, -15, 12, 18, 0xffffff, 0.35);

        // Balloon knot (small triangle at bottom)
        this.knot = scene.add.triangle(0, 34, -5, 0, 5, 0, 0, 8, color, 1.0);

        // Greek letter text
        this.text = scene.add.text(0, -2, letter, {
            fontFamily: 'Outfit, serif',
            fontSize: '24px',
            fontStyle: 'bold',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2,
        }).setOrigin(0.5);

        this.container.add([this.body, this.shine, this.knot, this.text]);

        // Gentle sway animation
        const swayDuration = Phaser.Math.Between(1500, 2500);
        const swayAmount = Phaser.Math.Between(3, 8);
        scene.tweens.add({
            targets: this.container,
            x: { value: x + swayAmount, duration: swayDuration, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' },
            rotation: { value: Phaser.Math.DegToRad(Phaser.Math.Between(-5, 5)), duration: swayDuration * 1.3, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }
        });
    }

    pop() {
        if (this.popped) return;
        this.popped = true;

        // Pop particle effect
        const color = this.body.fillColor;
        const particles = this.scene.add.particles(this.container.x, this.container.y, 'particle', {
            speed: { min: 50, max: 150 },
            scale: { start: 0.8, end: 0 },
            lifespan: 500,
            quantity: 12,
            tint: color,
            emitting: false,
        });
        particles.explode();

        // Pop animation
        this.scene.tweens.add({
            targets: this.container,
            scaleX: 1.4,
            scaleY: 1.4,
            alpha: 0,
            duration: 200,
            ease: 'Back.easeIn',
            onComplete: () => {
                this.container.destroy();
                particles.destroy();
            }
        });
    }

    setPosition(x, y) {
        // Just update the base Y; the sway tween handles X offset
        this.container.y = y;
    }

    getPosition() {
        return { x: this.container.x, y: this.container.y };
    }

    destroy() {
        if (this.container && this.container.scene) {
            this.container.destroy();
        }
    }
}

window.Balloon = Balloon;
