/**
 * Performance monitoring and optimization utilities for Three.js
 */

export interface PerformanceStats {
	fps: number;
	frameTime: number;
	avgFrameTime: number;
}

/**
 * FPS monitor class for tracking frame rate
 */
export class FPSMonitor {
	private frames = 0;
	private lastTime = 0;
	private currentFPS = 0;
	private frameTimes: number[] = [];
	private maxSamples = 60;

	constructor(maxSamples = 60) {
		this.maxSamples = maxSamples;
	}

	/**
	 * Updates FPS calculation - call this in your animation loop
	 */
	update(): PerformanceStats {
		// eslint-disable-next-line no-undef
		const now = performance.now();
		const frameTime = now - this.lastTime;

		this.frames++;
		this.frameTimes.push(frameTime);

		if (this.frameTimes.length > this.maxSamples) {
			this.frameTimes.shift();
		}

		// Calculate FPS every second
		if (now >= this.lastTime + 1000) {
			this.currentFPS = Math.round((this.frames * 1000) / (now - this.lastTime));
			this.frames = 0;
			this.lastTime = now;
		}

		const avgFrameTime =
			this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;

		return {
			fps: this.currentFPS,
			frameTime,
			avgFrameTime,
		};
	}

	/**
	 * Gets current FPS
	 */
	getFPS(): number {
		return this.currentFPS;
	}

	/**
	 * Resets the monitor
	 */
	reset(): void {
		this.frames = 0;
		// eslint-disable-next-line no-undef
		this.lastTime = performance.now();
		this.currentFPS = 0;
		this.frameTimes = [];
	}
}

/**
 * Adaptive quality controller that adjusts rendering quality based on performance
 */
export class AdaptiveQuality {
	private monitor: FPSMonitor;
	private targetFPS: number;
	private currentQuality: 'low' | 'medium' | 'high';
	private checkInterval = 2000; // Check every 2 seconds
	private lastCheck = 0;

	constructor(
		targetFPS = 60,
		initialQuality: 'low' | 'medium' | 'high' = 'high'
	) {
		this.monitor = new FPSMonitor();
		this.targetFPS = targetFPS;
		this.currentQuality = initialQuality;
	}

	/**
	 * Updates performance monitoring and returns quality recommendation
	 */
	update(): { quality: 'low' | 'medium' | 'high'; stats: PerformanceStats } {
		const stats = this.monitor.update();
		// eslint-disable-next-line no-undef
		const now = performance.now();

		// Only check quality every interval to avoid flickering
		if (now - this.lastCheck > this.checkInterval) {
			this.lastCheck = now;

			const { fps } = stats;
			const threshold = this.targetFPS * 0.8; // 80% of target

			if (fps < threshold && this.currentQuality !== 'low') {
				// Downgrade quality
				if (this.currentQuality === 'high') {
					this.currentQuality = 'medium';
				} else {
					this.currentQuality = 'low';
				}
			} else if (fps >= this.targetFPS && this.currentQuality !== 'high') {
				// Upgrade quality
				if (this.currentQuality === 'low') {
					this.currentQuality = 'medium';
				} else {
					this.currentQuality = 'high';
				}
			}
		}

		return {
			quality: this.currentQuality,
			stats,
		};
	}

	/**
	 * Gets current quality level
	 */
	getQuality(): 'low' | 'medium' | 'high' {
		return this.currentQuality;
	}

	/**
	 * Manually sets quality level
	 */
	setQuality(quality: 'low' | 'medium' | 'high'): void {
		this.currentQuality = quality;
	}
}
