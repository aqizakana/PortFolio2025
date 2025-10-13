'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { List } from './lib/CDlist';
import { AdaptiveCrystalCase } from './Mesh/AdaptiveCrystalCase';
import { ZaraCase } from './Mesh/caseLikeZara';
import { CaseClaude } from './Mesh/CaseWithClaude';
import { Display } from './Mesh/display';
import { Display2 } from './Mesh/display2';
import { newCase } from './Mesh/newCase';
import { newCase2 } from './Mesh/newCase2';
import { PyramidCase } from './Mesh/PyramidWireCase';
import './Test.css';

const DisplayTest = () => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const sceneRef = useRef<THREE.Scene | null>(null);
	const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
	const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
	const controlsRef = useRef<OrbitControls | null>(null);
	const displaysRef = useRef<Display[]>([]);

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
		camera.position.z = 3;
		cameraRef.current = camera;
		const light = new THREE.AmbientLight(0xffffff, 0.5);
		scene.add(light);

		// Controls setup
		const controls = new OrbitControls(camera, renderer.domElement);

		const list = List;
		const group = new THREE.Group();
		const displays: Display[] = [];

		list.forEach((item, index) => {
			const display = new Display(item.imgSrc, item.title);
			group.add(display.getMesh());
			displays.push(display);

			// Position displays in a grid or line
			display.getMesh().position.x = index * 5; // Spread them out horizontally
		});

		const pyramid = new PyramidCase();
		pyramid.getMesh().position.set(2, 0, 2);
		//scene.add(pyramid.getMesh());

		displaysRef.current = displays;
		scene.add(group);

		const adaptiveCrystal = new AdaptiveCrystalCase();
		adaptiveCrystal.getMesh().position.set(-5, 0, 0);
		//scene.add(adaptiveCrystal.getMesh());

		const display2 = new Display2();
		display2.getMesh().position.set(0, 2.2, 0);
		//scene.add(display2.getMesh());

		const claudeCase = new CaseClaude();
		claudeCase.getMesh().position.set(0, -2, 0);
		//scene.add(claudeCase.getMesh());

		const case2 = new newCase();
		case2.getMesh().position.set(0, 0, 0);
		//scene.add(case2.getMesh());

		const zara = new ZaraCase();
		zara.getMesh().position.set(0, 0, 0);
		//scene.add(zara.getMesh());

		const newcase2 = new newCase2();
		newcase2.getMesh().position.set(0, 0, 0);
		scene.add(newcase2.getMesh());

		const animate = () => {
			requestAnimationFrame(animate);
			controls.update();

			// Animate all displays
			displaysRef.current.forEach(display => {
				display.animate(camera.position);
			});

			pyramid.animate(camera.position);
			adaptiveCrystal.animate(camera.position);
			claudeCase.animate();
			case2.animate();

			display2.animate(camera.position);
			//zara.animate(camera.position);
			newcase2.animate();
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
