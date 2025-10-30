'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { List } from './lib/CDlist';
import { AdaptiveCrystalCase } from './mesh/AdaptiveCrystalCase';
import { ZaraCase } from './mesh/caseLikeZara';
import { CaseClaude } from './mesh/caseWithClaude';
import { Display } from './mesh/display';
import { Display2 } from './mesh/display2';
import { newCase } from './mesh/newCase';
import { newCase2 } from './mesh/newCase2';
import { NormalDisplay } from './mesh/normal';
import { PyramidCase } from './mesh/pyramidWireCase';
import './Test.css';

const DisplayTest = () => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const sceneRef = useRef<THREE.Scene | null>(null);
	const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
	const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
	const controlsRef = useRef<OrbitControls | null>(null);
	const displaysRef = useRef<
		(
			| Display
			| Display2
			| newCase
			| newCase2
			| PyramidCase
			| CaseClaude
			| ZaraCase
			| AdaptiveCrystalCase
			| NormalDisplay
		)[]
	>([]);

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
		renderer.setClearColor(0x000000, 1.0); // Set clear color to black with 0 alpha
		rendererRef.current = renderer;

		// Camera setup
		const camera = new THREE.PerspectiveCamera(
			100,
			window.innerWidth / window.innerHeight,
			0.1,
			1000
		);
		camera.position.z = 5; // Position camera looking front (along z-axis)
		camera.position.x = 0;
		camera.position.y = 0;

		camera.lookAt(new THREE.Vector3(0, 0, 0)); // Look at center of scene
		cameraRef.current = camera;
		const light = new THREE.AmbientLight(0xffffff, 0.5);
		scene.add(light);

		// Controls setup
		const controls = new OrbitControls(camera, renderer.domElement);

		const list = List;
		const group = new THREE.Group();
		const displays: (
			| Display
			| Display2
			| newCase
			| newCase2
			| PyramidCase
			| CaseClaude
			| ZaraCase
			| AdaptiveCrystalCase
			| NormalDisplay
		)[] = [];

		const displaysVariation = (items: typeof List) => {
			const displayClasses = [
				NormalDisplay,
				Display,
				Display2,
				newCase,
				newCase2,
				PyramidCase,
				CaseClaude,
				ZaraCase,
				AdaptiveCrystalCase,
			];
			const variations: (
				| Display
				| Display2
				| newCase
				| newCase2
				| PyramidCase
				| CaseClaude
				| ZaraCase
				| AdaptiveCrystalCase
				| NormalDisplay
			)[] = [];

			// displayClassesのすべての要素を使用するようにループ
			displayClasses.forEach((DisplayClass, i) => {
				// itemsを循環的に使用（items数が少ない場合は繰り返し使用）
				const item = items[i % items.length];
				variations.push(new DisplayClass(item.imgSrc, item.title));
			});

			return variations;
		};

		const variations = displaysVariation(list);

		variations.forEach((display, index) => {
			group.add(display.getMesh());
			displays.push(display);

			// Position displays in a grid or line
			display.getMesh().position.x = index * 7; // Spread them out horizontally
		});

		displaysRef.current = displays;
		scene.add(group);

		const animate = () => {
			requestAnimationFrame(animate);
			controls.update();

			displaysRef.current.forEach(display => {
				display.animate(camera.position);
			});
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

			// Dispose all displays
			displaysRef.current.forEach(display => {
				display.dispose();
			});
			displaysRef.current = [];

			// No need to remove renderer.domElement since we use the canvas directly
		};
	}, []);

	return <canvas ref={canvasRef} className="test" />;
};
export default DisplayTest;
