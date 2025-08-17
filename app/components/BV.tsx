'use client';

import * as THREE from 'three';
import './BV.css';
import { Noise } from './Mesh/Noise';
import { Sun } from './Mesh/Sun';
import { Fall } from './Mesh/fall';
import { Road } from './Mesh/Road';
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
		camera.position.z = 100;
		scene.add(camera);

		const light = new THREE.DirectionalLight(0xffffff, 1.0);
		scene.add(light);

		const amb = new THREE.AmbientLight(0xffffff);
		scene.add(amb);

		// Create noise background

		const geometry = new THREE.BoxGeometry(0.1, 0.5, 0.5); // サイズを縮小
		camera.position.z = 5; // カメラをもっと後ろに

		const material = new THREE.MeshPhongMaterial({ color: 0x6699ff });
		const mesh = new THREE.Mesh(geometry, material);
		mesh.position.z = 0;
		mesh.renderOrder = 1;
		scene.add(mesh);

		const noise = new Noise();
		const noiseMesh = noise.getMesh();
		noiseMesh.position.z = -100;
		scene.add(noiseMesh);

		const sun = new Sun();
		const sunMesh = sun.getMesh();
		sunMesh.position.y = 3;
		sunMesh.position.z = -1;
		scene.add(sunMesh);
		light.position.copy(sunMesh.position);

		const falls = [];
		for (let i = 0; i < 3; i++) {
			const fall = new Fall();
			falls.push(fall);
		}

		falls.forEach(fall => {
			const fallMesh = fall.getMesh();
			const fallPos = fall.randomPos();
			const fallRad = fall.randomRot();
			fallMesh.position.set(fallPos.x, fallPos.y, fallPos.z);
			fallMesh.rotation.set(fallRad.x, fallRad.y, fallRad.z);
			scene.add(fallMesh);
		});

		const road = new Road();
		const roadMesh = road.getMesh();
		const roadRad = road.rotation();
		roadMesh.rotation.set(roadRad.x, roadRad.y, roadRad.z);
		roadMesh.position.y = -2;
		scene.add(roadMesh);

		const animate = () => {
			requestAnimationFrame(animate);
			renderer.render(scene, camera);
			noise.animate();
			sun.animate();
			falls.forEach(fall => fall.animate());
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
			sun.dispose();
			falls.forEach(fall => fall.dispose && fall.dispose());
			window.removeEventListener('resize', onResize);
		};
	}, []);

	return <div ref={containerRef} className="bv" />;
};

export default BV;
