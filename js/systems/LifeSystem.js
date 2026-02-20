/**
 * LifeSystem — Token-bucket life system.
 * Players have a bucket of tokens; each missed star drains one.
 * Tokens refill over time. If the bucket empties, it's game over.
 */

class LifeSystem {
    /**
     * @param {number} maxTokens - Max tokens in the bucket (e.g. 5)
     * @param {number} refillWindowMs - Time window for full refill (e.g. 30000ms)
     */
    constructor(maxTokens = 5, refillWindowMs = 30000) {
        this.maxTokens = maxTokens;
        this.tokens = maxTokens;
        this.refillWindowMs = refillWindowMs;
        this.refillIntervalMs = refillWindowMs / maxTokens;
        this.timeSinceLastRefill = 0;
        this.isGameOver = false;

        this.onLifeChanged = null;  // callback(tokens, maxTokens)
        this.onGameOver = null;     // callback()
    }

    /**
     * Called each frame to handle token refill.
     * @param {number} deltaMs - Time elapsed since last update in ms
     */
    update(deltaMs) {
        if (this.isGameOver) return;

        this.timeSinceLastRefill += deltaMs;

        if (this.timeSinceLastRefill >= this.refillIntervalMs && this.tokens < this.maxTokens) {
            this.tokens = Math.min(this.maxTokens, this.tokens + 1);
            this.timeSinceLastRefill = 0;
            if (this.onLifeChanged) this.onLifeChanged(this.tokens, this.maxTokens);
        }
    }

    /**
     * Drain a token when a star is lost.
     */
    drain() {
        if (this.isGameOver) return;

        this.tokens--;
        if (this.onLifeChanged) this.onLifeChanged(this.tokens, this.maxTokens);

        if (this.tokens <= 0) {
            this.isGameOver = true;
            if (this.onGameOver) this.onGameOver();
        }
    }

    reset() {
        this.tokens = this.maxTokens;
        this.timeSinceLastRefill = 0;
        this.isGameOver = false;
        if (this.onLifeChanged) this.onLifeChanged(this.tokens, this.maxTokens);
    }
}

window.LifeSystem = LifeSystem;
