import BlockerService from './BlockerService';

/**
 * FocusTimerService
 *
 * Handles FOCUS_TIME goals — counts elapsed seconds and
 * syncs with the native blocker until the target is hit.
 */
class FocusTimerService {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private elapsedSeconds: number = 0;
  private targetSeconds: number = 0;
  private onTick?: (elapsed: number, remaining: number) => void;
  private onComplete?: () => void;

  start(
    targetSeconds: number,
    onTick: (elapsed: number, remaining: number) => void,
    onComplete: () => void,
  ) {
    this.elapsedSeconds = 0;
    this.targetSeconds = targetSeconds;
    this.onTick = onTick;
    this.onComplete = onComplete;

    this.intervalId = setInterval(() => this.tick(), 1000);
  }

  pause() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  resume() {
    if (!this.intervalId) {
      this.intervalId = setInterval(() => this.tick(), 1000);
    }
  }

  stop() {
    this.pause();
    this.elapsedSeconds = 0;
  }

  getElapsed(): number {
    return this.elapsedSeconds;
  }

  private async tick() {
    this.elapsedSeconds += 1;
    const remaining = Math.max(0, this.targetSeconds - this.elapsedSeconds);
    this.onTick?.(this.elapsedSeconds, remaining);

    // Sync with native layer every 5 seconds (don't spam the bridge)
    if (this.elapsedSeconds % 5 === 0 || this.elapsedSeconds >= this.targetSeconds) {
      const result = await BlockerService.updateProgress(this.elapsedSeconds);
      if (result === 'COMPLETED') {
        this.stop();
        this.onComplete?.();
      }
    }
  }
}

export default new FocusTimerService();
