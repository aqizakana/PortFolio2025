import { useEffect, useRef, useState, type RefObject } from 'react';
import type { WebGPURenderer } from 'three/webgpu';

export interface WebGPUConfig {
	width: number;
	height: number;
	pixelRatio?: number;
	antialias?: boolean;
	alpha?: boolean;
}

export interface UseWebGPUReturn {
	canvasRef: RefObject<HTMLCanvasElement>;
	renderer: WebGPURenderer | null;
	isReady: boolean;
	error: Error | null;
}

export const useWebGPU = (config: WebGPUConfig): UseWebGPUReturn => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const rendererRef = useRef<WebGPURenderer | null>(null);
	const [isReady, setIsReady] = useState(false);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		let isMounted = true;

		const init = async () => {
			if (!canvasRef.current) return;

			try {
				// Dynamic import to avoid SSR issues
				const { WebGPURenderer } = await import('three/webgpu');

				const renderer = new WebGPURenderer({
					canvas: canvasRef.current,
					antialias: config.antialias ?? true,
					alpha: config.alpha ?? true,
				});

				renderer.setPixelRatio(
					config.pixelRatio ?? Math.min(window.devicePixelRatio, 2)
				);
				renderer.setSize(config.width, config.height);

				await renderer.init();

				if (!isMounted) {
					renderer.dispose();
					return;
				}

				rendererRef.current = renderer;
				setIsReady(true);
			} catch (err) {
				const error = err instanceof Error ? err : new Error(String(err));
				setError(error);

				// Log only in development
				if (
					typeof window !== 'undefined' &&
					window.location.hostname === 'localhost'
				) {
					// eslint-disable-next-line no-console
					console.warn('WebGPU initialization failed:', error);
				}
			}
		};

		init();

		return () => {
			isMounted = false;
			if (rendererRef.current) {
				rendererRef.current.dispose();
				rendererRef.current = null;
			}
		};
	}, [
		config.width,
		config.height,
		config.pixelRatio,
		config.antialias,
		config.alpha,
	]);

	return {
		canvasRef,
		renderer: rendererRef.current,
		isReady,
		error,
	};
};
