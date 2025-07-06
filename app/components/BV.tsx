'use client';

import * as THREE from 'three';
import './BV.css';
import { Noise } from './Mesh/Noise';
import { Sun } from './Mesh/Sun';
import { useEffect, useRef } from 'react';

const BV = () => {
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		// Get canvas by ID instead of ref
		if (!containerRef.current) return;

		const scene = new THREE.Scene();
		const renderer = new THREE.WebGLRenderer({
			antialias: true,
			alpha: true,
		});
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.setPixelRatio(window.devicePixelRatio);
		containerRef.current.appendChild(renderer.domElement);

		const camera = new THREE.PerspectiveCamera(
			100,
			window.innerWidth / window.innerHeight,
			0.1,
			1000
		);
		camera.position.z = 1;
		scene.add(camera);

		// Create noise background

		const geometry = new THREE.BoxGeometry(0.5, 1, 1); // サイズを縮小
		camera.position.z = 3; // カメラをもっと後ろに

		const material = new THREE.MeshBasicMaterial({ color: 0x6699ff });
		const mesh = new THREE.Mesh(geometry, material);
		mesh.position.z = 0;
		mesh.renderOrder = 1;
		scene.add(mesh);

		const noise = new Noise();
		const noiseMesh = noise.getMesh();
		noiseMesh.position.z = -10;
		scene.add(noiseMesh);

		const sun = new Sun();
		const sunMesh = sun.getMesh();
		sunMesh.position.y = 3;
		sunMesh.position.z = -1;
		scene.add(sunMesh);

		const animate = () => {
			requestAnimationFrame(animate);
			renderer.render(scene, camera);
			noise.animate();
			sun.animate();
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
		};
	}, []);

	return (
		<div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
			<div
				ref={containerRef}
				style={{
					position: 'absolute',
					top: 0,
					left: 0,
					width: '100%',
					height: '100%',
					zIndex: 2,
				}}
			/>
		</div>
	);
};

export default BV;
