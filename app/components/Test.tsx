'use client';
import * as THREE from 'three';
import './Test.css';
import { Display } from './Mesh/Display';
import { Img } from './Mesh/Img';
import { Text } from './Mesh/Text';
import { useEffect, useRef } from 'react';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const DisplayTest = () => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const sceneRef = useRef<THREE.Scene | null>(null);
	const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
	const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
	const controlsRef = useRef<OrbitControls | null>(null);
	const displayRef = useRef<Display | null>(null);

	useEffect(() => {
		if (!canvasRef.current) return;

		// Scene setup
		const scene = new THREE.Scene();
		sceneRef.current = scene;

		const renderer = new THREE.WebGLRenderer({
			canvas: canvasRef.current,
			antialias: true,
			alpha: true,
		});
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.setPixelRatio(window.devicePixelRatio);
		rendererRef.current = renderer;

		// Camera setup
		const camera = new THREE.PerspectiveCamera(
			100,
			window.innerWidth / window.innerHeight,
			0.1,
			1000
		);
		camera.position.z = 3;
		cameraRef.current = camera;

		// Controls setup
		const controls = new OrbitControls(camera, renderer.domElement);

		// Display setup
		const display = new Display();
		scene.add(display.getMesh());
		displayRef.current = display;

		const img = new Img();
		img.getMesh().position.set(-1, 0, 0);
		img.getMesh().lookAt(camera.position);
		scene.add(img.getMesh());

		const text = new Text();
		text.getMesh().position.set(1, 0, 0);
		text.getMesh().lookAt(camera.position);
		scene.add(text.getMesh());

		// Animation loop
		const animate = () => {
			requestAnimationFrame(animate);
			controls.update();
			display.animate();
			img.animate();
			text.animate();
			renderer.render(scene, camera);
		};
		animate();

		// Resize handler
		const onResize = () => {
			if (camera && renderer) {
				camera.aspect = window.innerWidth / window.innerHeight;
				camera.updateProjectionMatrix();
				renderer.setSize(window.innerWidth, window.innerHeight);
			}
		};
		window.addEventListener('resize', onResize);

		// Cleanup
		return () => {
			window.removeEventListener('resize', onResize);

			if (controlsRef.current) {
				controlsRef.current.dispose();
			}

			if (rendererRef.current) {
				rendererRef.current.dispose();
			}

			if (displayRef.current) {
				displayRef.current.dispose();
			}

			// No need to remove renderer.domElement since we use the canvas directly
		};
	}, []);

	return <canvas ref={canvasRef} className="test" />;
};
export default DisplayTest;
