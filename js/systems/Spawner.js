/**
 * Spawner — Manages spawning StarClusters at increasing difficulty.
 */

class Spawner {
    constructor(scene, config = {}) {
        this.scene = scene;

        // Configurable parameters
        this.initialInterval = config.initialInterval || 3000;   // ms between spawns at start
        this.minInterval = config.minInterval || 800;            // fastest spawn rate
        this.intervalDecay = config.intervalDecay || 3;          // ms to reduce interval per second
        this.initialSpeed = config.initialSpeed || 30;           // pixels/sec upward at start
        this.maxSpeed = config.maxSpeed || 90;                   // max speed
        this.speedIncrease = config.speedIncrease || 0.5;        // speed increase per second
        this.difficulty = config.difficulty || 'normal';         // easy, normal, hard

        // Available Digits
        this.letters = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

        this.elapsedMs = 0;
        this.timeSinceSpawn = 0;
        this.active = false;
    }

    start() {
        this.active = true;
        this.elapsedMs = 0;
        this.timeSinceSpawn = 0;
    }

    stop() {
        this.active = false;
    }

    update(deltaMs) {
        if (!this.active) return;

        this.elapsedMs += deltaMs;
        this.timeSinceSpawn += deltaMs;

        const currentInterval = this.getCurrentInterval();

        if (this.timeSinceSpawn >= currentInterval) {
            this.timeSinceSpawn = 0;
            this.spawnCluster();
        }
    }

    getCurrentInterval() {
        const elapsedSec = this.elapsedMs / 1000;
        return Math.max(this.minInterval, this.initialInterval - elapsedSec * this.intervalDecay);
    }

    getCurrentSpeed() {
        const elapsedSec = this.elapsedMs / 1000;
        return Math.min(this.maxSpeed, this.initialSpeed + elapsedSec * this.speedIncrease);
    }

    /**
     * Returns the number of balloons for a new cluster based on difficulty.
     */
    getBalloonCount() {
        const elapsedSec = this.elapsedMs / 1000;

        let maxPossibleBalloons = 5; // default normal
        let rampUpRate = 30;         // seconds to add 1 max balloon
        let minBalloons = 1;

        if (this.difficulty === 'easy') {
            maxPossibleBalloons = 3;
            rampUpRate = 45; // slower ramp up
        } else if (this.difficulty === 'hard') {
            maxPossibleBalloons = 7;
            rampUpRate = 20; // faster ramp up
            minBalloons = 2; // Starts with at least 2
        } else if (this.difficulty === 'insane') {
            maxPossibleBalloons = 9;
            rampUpRate = 10; // extremely fast ramp up
            minBalloons = 3; // Starts with at least 3
        }

        // Start with mostly 1-2 balloons, ramp up over time
        const maxBalloons = Math.min(maxPossibleBalloons, minBalloons + Math.floor((elapsedSec) / rampUpRate));
        return Phaser.Math.Between(minBalloons, maxBalloons);
    }

    /**
     * Pick random letters for balloons. Can repeat or be unique.
     */
    pickLetters(count) {
        const result = [];
        for (let i = 0; i < count; i++) {
            const letter = this.letters[Phaser.Math.Between(0, this.letters.length - 1)];
            result.push(letter);
        }
        return result;
    }

    spawnCluster() {
        const gameWidth = this.scene.scale.width;
        const gameHeight = this.scene.scale.height;

        const balloonCount = this.getBalloonCount();
        const letters = this.pickLetters(balloonCount);
        const speed = this.getCurrentSpeed();

        // Random X, starting from the bottom
        const margin = 80;
        const x = Phaser.Math.Between(margin, gameWidth - margin);
        const y = gameHeight + 50;

        const cluster = new StarCluster(this.scene, x, y, letters, speed);
        this.scene.clusters.push(cluster);
    }
}

window.Spawner = Spawner;
