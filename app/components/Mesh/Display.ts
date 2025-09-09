import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Mesh } from './Mesh';

export class Display extends Mesh {
	protected controls!: OrbitControls;
	protected initGeometry(): void {
		const geometry = new THREE.BoxGeometry(4, 2, 2);

		// Remove the front face (indices 4-5 in the faces array)
		const faces = geometry.index!.array;
		const newFaces = [];

		// BoxGeometry has 12 triangles (6 faces * 2 triangles each)
		// Front face triangles are at indices 8-13 (triangles 4-5)
		for (let i = 0; i < faces.length; i += 3) {
			const triangleIndex = Math.floor(i / 3);
			if (triangleIndex !== 8 && triangleIndex !== 9) {
				newFaces.push(faces[i], faces[i + 1], faces[i + 2]);
			}
		}

		geometry.setIndex(newFaces);
		this.geometry = geometry;
	}

	protected initMaterial(): void {
		this.material = new THREE.ShaderMaterial({
			uniforms: {
				u_time: { value: 0.0 },
			},
			vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec3 vViewDirection;
        void main() {
          vUv = uv;
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vPosition = worldPosition.xyz;
          vNormal = normalize(normalMatrix * normal);
          vViewDirection = normalize(cameraPosition - worldPosition.xyz);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
			fragmentShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec3 vViewDirection;
        uniform float u_time;
        
        void main() {
          // Create depth-based perspective gradient
          float depth = gl_FragCoord.z;
          
          // Fresnel-like effect based on viewing angle
          float fresnel = 1.0 - abs(dot(vNormal, vViewDirection));
          fresnel = pow(fresnel, 2.0);
          
          // Dynamic grid pattern based on UV and time
          vec2 grid = fract(vUv * 10.0 + u_time * 0.1);
          float gridPattern = smoothstep(0.02, 0.05, min(grid.x, grid.y)) * 
          smoothstep(0.02, 0.05, min(1.0 - grid.x, 1.0 - grid.y));
          
          // Color based on position and depth
          vec3 color = vec3(0.2, 0.3, 0.8) * (1.0 - depth);
          color += fresnel * vec3(0.4, 0.6, 1.0);
          color *= gridPattern * 0.5 + 0.5;
          
          // Add some subtle animation
          color += sin(vPosition.x * 5.0 + u_time) * 0.1;
          
          gl_FragColor = vec4(color, 0.8);
        }
      `,
			side: THREE.DoubleSide,
			transparent: true,
		});
	}
	public animate(): void {
		this.material.uniforms.u_time.value += 0.05;
	}
}
