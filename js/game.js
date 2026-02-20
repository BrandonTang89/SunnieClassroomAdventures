/**
 * Game Configuration & Entry Point
 * Sunnie's Classroom Adventures — Greek Letter Balloon Pop
 */

// ===== Game Parameters (tunable) =====
const GameConfig = {
    // Life / Token Bucket
    MAX_MISSES: 5,              // Max tokens in the bucket
    REFILL_WINDOW_MS: 30000,    // Time window for full refill (30 seconds)

    // Spawner
    INITIAL_SPAWN_INTERVAL: 3000, // ms between spawns at start
    MIN_SPAWN_INTERVAL: 800,      // fastest spawn rate
    SPAWN_INTERVAL_DECAY: 3,      // ms to reduce per second of elapsed time

    // Float speed
    INITIAL_FLOAT_SPEED: 30,      // pixels/sec at start
    MAX_FLOAT_SPEED: 90,          // max float speed
    SPEED_INCREASE: 0.5,          // speed increase per second

    // Scoring
    POINTS_PER_BALLOON: 10,       // base points per balloon popped via star
};

window.GameConfig = GameConfig;

// ===== Phaser Configuration =====
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('game-container');

    const config = {
        type: Phaser.AUTO,
        parent: 'game-container',
        width: container.clientWidth,
        height: container.clientHeight,
        backgroundColor: '#0d1b2a',
        scale: {
            mode: Phaser.Scale.RESIZE,
            autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        scene: [BootScene, TitleScene, GameScene, GameOverScene],
    };

    const game = new Phaser.Game(config);

    // Handle resize
    window.addEventListener('resize', () => {
        game.scale.resize(container.clientWidth, container.clientHeight);
    });
});
