'use client';
import { gsap } from 'gsap';
import { useEffect, useRef, type MouseEvent } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import './Test.css';
import { List } from './lib/CDlist';
import { Shelf } from './mesh/Shelf';
import { Case } from './mesh/case';
const CDTest = () => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const sceneRef = useRef<THREE.Scene | null>(null);
	const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
	const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
	const controlsRef = useRef<OrbitControls | null>(null);
	const displayRef = useRef<Case | null>(null);
	const shelfRef = useRef<Shelf | null>(null);
	const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
	const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
	const selectedCDRef = useRef<THREE.Mesh | null>(null);

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

		// Shelf setup
		const shelfs = new Shelf(List);
		shelfRef.current = shelfs;

		shelfs.getCDsMesh().forEach((element, i) => {
			scene.add(element);
			element.position.x = (i - (shelfs.getCDsMesh().length - 1) / 2) * 1.2; // Adjust spacing as needed
			element.position.y = 0;
			element.position.z = 0;
			element.rotation.y = 80;
			// Store original position and rotation for later use
			element.userData.originalPosition = element.position.clone();
			element.userData.originalRotation = element.rotation.clone();
		});

		// GSAP-powered click handler function
		const onMouseClick = (event: Event) => {
			const mouseEvent = event as unknown as MouseEvent;
			if (!canvasRef.current || !cameraRef.current || !sceneRef.current) return;

			// Calculate mouse position in normalized device coordinates
			const rect = canvasRef.current.getBoundingClientRect();
			mouseRef.current.x = ((mouseEvent.clientX - rect.left) / rect.width) * 2 - 1;
			mouseRef.current.y =
				-((mouseEvent.clientY - rect.top) / rect.height) * 2 + 1;

			// Update raycaster
			raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

			// Check for intersections with CD meshes
			const intersects = raycasterRef.current.intersectObjects(
				shelfs.getCDsMesh()
			);

			if (intersects.length > 0) {
				const clickedMesh = intersects[0].object as THREE.Mesh;

				// If there's already a selected CD and it's different from the clicked one
				if (selectedCDRef.current && selectedCDRef.current !== clickedMesh) {
					returnCDToOriginalPosition(selectedCDRef.current);
				}

				// If clicking on a different CD, animate it to camera
				if (selectedCDRef.current !== clickedMesh) {
					animateCDToCameraWithGSAP(clickedMesh, cameraRef.current);
				} else {
					// If clicking on the same CD, return it to original position
					returnCDToOriginalPosition(clickedMesh);
					selectedCDRef.current = null;
				}
			} else {
				// Clicked on empty space - return current CD to original position
				if (selectedCDRef.current) {
					returnCDToOriginalPosition(selectedCDRef.current);
					selectedCDRef.current = null;
				}
			}
		};

		// Function to return CD to original position
		const returnCDToOriginalPosition = (mesh: THREE.Mesh) => {
			const originalPosition = mesh.userData.originalPosition;
			const originalRotation = mesh.userData.originalRotation;

			const tl = gsap.timeline();

			// Animate back to original position
			tl.to(mesh.position, {
				x: originalPosition.x,
				y: originalPosition.y,
				z: originalPosition.z,
				duration: 0.8,
				ease: 'power2.inOut',
			});

			// Animate back to original rotation
			tl.to(
				mesh.rotation,
				{
					y: originalRotation.y,
					duration: 0.8,
					ease: 'power2.inOut',
				},
				0
			);
		};

		// GSAP animation function
		const animateCDToCameraWithGSAP = (
			mesh: THREE.Mesh,
			camera: THREE.PerspectiveCamera
		) => {
			// Calculate position in front of camera
			const cameraDirection = new THREE.Vector3();
			camera.getWorldDirection(cameraDirection);
			const targetPosition = camera.position
				.clone()
				.add(cameraDirection.multiplyScalar(-2));

			// Create GSAP timeline for smooth animation
			const tl = gsap.timeline();

			// Animate position
			tl.to(mesh.position, {
				x: targetPosition.x,
				y: targetPosition.y,
				z: targetPosition.z - 2.5,
				duration: 1.2,
				ease: 'power2.out',
			});

			// Animate rotation to look at camera (simultaneously)
			const lookAtMatrix = new THREE.Matrix4().lookAt(
				mesh.position,
				camera.position,
				new THREE.Vector3(0, 1, 0)
			);
			const targetQuaternion = new THREE.Quaternion().setFromRotationMatrix(
				lookAtMatrix
			);

			tl.to(
				mesh.quaternion,
				{
					x: targetQuaternion.x,
					y: targetQuaternion.y,
					z: targetQuaternion.z,
					w: targetQuaternion.w,
					duration: 1.2,
					ease: 'power2.out',
				},
				0
			); // Start at the same time as position animation

			// Update selected CD reference
			selectedCDRef.current = mesh;
		};

		// Add click event listener
		canvasRef.current.addEventListener('click', onMouseClick);

		// Animation loop
		const animate = () => {
			requestAnimationFrame(animate);
			controls.update();
			shelfs.getCDs().forEach(cd => cd.animate());
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
			if (canvasRef.current) {
				canvasRef.current.removeEventListener('click', onMouseClick);
			}

			if (controlsRef.current) {
				controlsRef.current.dispose();
			}

			if (rendererRef.current) {
				rendererRef.current.dispose();
			}

			if (displayRef.current) {
				displayRef.current.dispose();
			}

			if (shelfRef.current) {
				shelfRef.current.getCDs().forEach(cd => cd.dispose());
			}
		};
	}, []);

	return <canvas ref={canvasRef} className="test" />;
};
export default CDTest;
