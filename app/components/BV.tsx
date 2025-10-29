'use client';

import { Building } from '@mesh/City/building';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import './BV.css';
import { Ground } from './Mesh/City/ground';
import { Display } from './Mesh/display';
import { Noise } from './Mesh/noise';
import { Sun } from './Mesh/sun';
import { List } from './lib/CDlist';

const BV = () => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const sceneRef = useRef<THREE.Scene | null>(null);
	const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
	const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
	const controlsRef = useRef<OrbitControls | null>(null);
	const displaysRef = useRef<Display[]>([]);

	useEffect(() => {
		// Get canvas by ID instead of ref
		if (!canvasRef.current) return;

		const scene = new THREE.Scene();
		sceneRef.current = scene;
		const renderer = new THREE.WebGLRenderer({
			canvas: canvasRef.current,
			antialias: true,
			alpha: true,
		});
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.setPixelRatio(window.devicePixelRatio);
		renderer.shadowMap.enabled = true;
		renderer.shadowMap.type = THREE.PCFSoftShadowMap; // ソフトな影
		rendererRef.current = renderer;

		const camera = new THREE.PerspectiveCamera(
			100,
			window.innerWidth / window.innerHeight,
			0.1,
			100
		);
		camera.position.z = 1;
		cameraRef.current = camera;
		scene.add(camera);

		const light = new THREE.DirectionalLight(0xffffff, 1);
		light.position.set(5, 10, 5);
		light.castShadow = true; // ←影を落とす
		light.shadow.mapSize.width = 2048;
		light.shadow.mapSize.height = 2048;
		scene.add(light);

		camera.position.z = 3; // カメラをもっと後ろに

		const building = new Building();
		building.getMesh().position.set(-5, 0, 0);
		scene.add(building.getMesh());
		const noise = new Noise();
		const noiseMesh = noise.getMesh();
		noiseMesh.position.z = -10;
		scene.add(noiseMesh);

		const sun = new Sun();
		const sunMesh = sun.getMesh();
		sunMesh.position.y = 3;
		sunMesh.position.z = -1;
		scene.add(sunMesh);

		const list = List;
		const group = new THREE.Group();
		const displays: Display[] = [];

		list.forEach((item, index) => {
			const display = new Display(item.imgSrc, item.title);
			group.add(display.getMesh());
			displays.push(display);

			// Position displays in a grid or line
			display.getMesh().position.x = index % 2 == 0 ? index * 5 : -index * 10; // Spread them out horizontally
			display.getMesh().position.z = -index * 3;
			display.getMesh().rotation.y =
				index % 2 == 0 ? -Math.sin(index) * 2 : Math.sin(index) * 2; // Alternate rotation direction
		});

		displaysRef.current = displays;
		scene.add(group);

		const ground = new Ground();
		scene.add(ground.getMesh());

		const controls = new OrbitControls(camera, renderer.domElement);
		controlsRef.current = controls;
		controls.enableDamping = true;
		controls.dampingFactor = 0.05;
		controls.enableZoom = true;
		controls.enableRotate = true;
		controls.enablePan = true;

		const animate = () => {
			requestAnimationFrame(animate);
			controls.update();
			ground.animate();
			noise.animate();
			sun.animate();
			building.animate();
			displaysRef.current.forEach(display => {
				display.animate(camera.position);
			});
			renderer.render(scene, camera);
		};
		animate();

		const onResize = () => {
			camera.aspect = window.innerWidth / window.innerHeight;
			camera.updateProjectionMatrix();
			renderer.setSize(window.innerWidth, window.innerHeight);
		};
		window.addEventListener('resize', onResize);

		return () => {
			renderer.dispose();
			noise.dispose();
			window.removeEventListener('resize', onResize);
			controlsRef.current?.dispose();
			// Dispose all displays
			displaysRef.current.forEach(display => {
				display.dispose();
			});
			displaysRef.current = [];
		};
	}, []);

	return <canvas ref={canvasRef} className="bv" />;
};

export default BV;
