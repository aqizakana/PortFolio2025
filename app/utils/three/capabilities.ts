/**
 * Utilities for detecting Three.js and WebGPU capabilities
 */

/**
 * Detects if WebGPU is available in the current browser
 */
export const detectWebGPU = async (): Promise<boolean> => {
	if (typeof window === 'undefined') return false;

	// eslint-disable-next-line no-undef
	if (typeof navigator === 'undefined' || !navigator.gpu) return false;

	try {
		// eslint-disable-next-line no-undef
		const adapter = await navigator.gpu.requestAdapter();
		return !!adapter;
	} catch {
		return false;
	}
};

/**
 * Gets the optimal pixel ratio for the current device
 * @param maxRatio Maximum pixel ratio to use (default: 2)
 */
export const getOptimalPixelRatio = (maxRatio = 2): number => {
	if (typeof window === 'undefined') return 1;
	return Math.min(window.devicePixelRatio, maxRatio);
};

/**
 * Checks if the device is mobile
 */
export const isMobileDevice = (): boolean => {
	if (typeof window === 'undefined' || typeof navigator === 'undefined') {
		return false;
	}
	// eslint-disable-next-line no-undef
	const userAgent = navigator.userAgent;
	return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
		userAgent
	);
};

/**
 * Gets recommended quality settings based on device capabilities
 */
export const getRecommendedQuality = (): {
	pixelRatio: number;
	antialias: boolean;
	shadows: boolean;
} => {
	const isMobile = isMobileDevice();
	const pixelRatio = getOptimalPixelRatio(isMobile ? 1.5 : 2);

	return {
		pixelRatio,
		antialias: !isMobile,
		shadows: !isMobile,
	};
};
