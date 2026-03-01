'use client';
import { useEffect } from 'react';
import { Scene, PerspectiveCamera, PlaneGeometry, Mesh } from 'three/webgpu';
import { useWebGPU } from '@/hooks/useWebGPU';
import { createAnimatedMaterial } from '@/shaders/materials/animatedMaterial';
import './HeaderBV.css';

export const HeaderBV = () => {
	const { canvasRef, renderer, isReady, error } = useWebGPU({
		width: 50,
		height: typeof window !== 'undefined' ? window.innerHeight : 800,
	});

	useEffect(() => {
		if (!isReady || !renderer) return;

		// Scene setup
		const scene = new Scene();

		// Camera setup for vertical strip
		const camera = new PerspectiveCamera(75, 50 / window.innerHeight, 0.1, 100);
		camera.position.set(0, 0, 50);
		camera.lookAt(0, 0, 0);

		// Geometry
		const geometry = new PlaneGeometry(100, 100, 64, 64);

		// Material with animations
		const material = createAnimatedMaterial();

		// Mesh
		const mesh = new Mesh(geometry, material);
		scene.add(mesh);

		// Mark canvas as loaded for CSS animation
		if (canvasRef.current) {
			canvasRef.current.classList.add('loaded');
		}

		// Animation loop
		let frameId: number;
		const animate = () => {
			renderer.render(scene, camera);
			frameId = requestAnimationFrame(animate);
		};
		animate();

		// Resize handler
		const handleResize = () => {
			camera.aspect = 50 / window.innerHeight;
			camera.updateProjectionMatrix();
			renderer.setSize(50, window.innerHeight);
		};
		window.addEventListener('resize', handleResize);

		// Cleanup
		return () => {
			cancelAnimationFrame(frameId);
			window.removeEventListener('resize', handleResize);
			geometry.dispose();
			material.dispose();
		};
	}, [isReady, renderer, canvasRef]);

	// Handle WebGPU error gracefully
	if (error) {
		return null;
	}

	return <canvas ref={canvasRef} className="header-bv" aria-hidden="true" />;
};

export default HeaderBV;
