/**
 * Centralized Three.js configuration
 */

import { QualityLevel } from '@/utils/three/performance';
import { getRecommendedQuality } from '@/utils/three/capabilities';

export interface RendererConfig {
	pixelRatio: number;
	antialias: boolean;
	alpha: boolean;
	powerPreference?: 'high-performance' | 'low-power' | 'default';
}

export interface SceneConfig {
	backgroundColor?: number;
	fogEnabled?: boolean;
	fogColor?: number;
	fogNear?: number;
	fogFar?: number;
}

export interface CameraConfig {
	fov: number;
	near: number;
	far: number;
}

/**
 * Default renderer configurations by quality level
 */
export const RENDERER_CONFIGS: Record<QualityLevel, RendererConfig> = {
	[QualityLevel.LOW]: {
		pixelRatio: 1,
		antialias: false,
		alpha: true,
		powerPreference: 'low-power',
	},
	[QualityLevel.MEDIUM]: {
		pixelRatio: 1.5,
		antialias: true,
		alpha: true,
		powerPreference: 'default',
	},
	[QualityLevel.HIGH]: {
		pixelRatio: 2,
		antialias: true,
		alpha: true,
		powerPreference: 'high-performance',
	},
};

/**
 * Default camera configuration
 */
export const DEFAULT_CAMERA_CONFIG: CameraConfig = {
	fov: 75,
	near: 0.1,
	far: 1000,
};

/**
 * Default scene configuration
 */
export const DEFAULT_SCENE_CONFIG: SceneConfig = {
	backgroundColor: 0x000000,
	fogEnabled: false,
};

/**
 * Gets renderer config based on quality level
 */
export const getRendererConfig = (quality?: QualityLevel): RendererConfig => {
	if (!quality) {
		const recommended = getRecommendedQuality();
		return {
			pixelRatio: recommended.pixelRatio,
			antialias: recommended.antialias,
			alpha: true,
			powerPreference: 'default',
		};
	}

	return RENDERER_CONFIGS[quality];
};

/**
 * Animation configuration
 */
export const ANIMATION_CONFIG = {
	targetFPS: 60,
	adaptiveQuality: true,
} as const;
