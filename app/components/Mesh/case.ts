import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { mousePos } from '../lib/MousePos';
import { Mesh } from './Mesh';

export class Case extends Mesh {
	protected controls!: OrbitControls;
	protected mouse = mousePos;
	protected initGeometry(): void {
		const geometry = new THREE.BoxGeometry(4, 2, 2);

		const window = new THREE.PlaneGeometry(10, 2);
		window.translate(0, 0, 1);

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
				u_mouse: { value: this.mouse },
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
        uniform vec2 u_mouse;
        void main() {
          // Color based on position and depth
          float depth = gl_FragCoord.z;
          vec3 color = vec3(0.5, 0.8, 0.8) * (1.0 - depth);

          // Fresnel-like effect based on viewing angle
          // フレネル効果は、光が異なる屈折率を持つ二つの媒質の境界面に入射する際に起こる反射と屈折の現象。
          float fresnelPower = 10.0; // 調整可能なパラメータ
          float fresnelBias = 0.1;  // 最小反射率
          float fresnelScale = 1.0; // スケール
          float NdotV = max(0.0, dot(vNormal, vViewDirection));
          float fresnel = fresnelBias + fresnelScale * pow(1.0 - NdotV, fresnelPower);
          color += fresnel * vec3(1.0, 1.0, 1.0) * 0.5;

          // Dynamic grid pattern based on UV and time
          vec2 grid = fract(vUv * 10.0 + vec2(u_time * 0.1, u_time * 0.1));
          float gridPattern = smoothstep(0.02, 0.05, min(grid.x, grid.y)) * 
          smoothstep(0.02, 0.05, min(1.0 - grid.x, 1.0 - grid.y));
          color *= gridPattern;

          float mouseDist = length(vPosition.xy - (u_mouse * vec2(2.0, 2.0)));
          float mouseLight = 0.3 / (mouseDist + 0.1);
          mouseLight = smoothstep(0.0, 1.0, mouseLight);
          mouseLight = mouseLight * mouseLight * (3.0 - 2.0 * mouseLight); // smoothstep easing
          //color += vec3(mouseLight) * 0.5;
          
          // Add some subtle animation
          color += sin(vPosition.x * 5.0 + u_time) * 0.1;
          color += cos(vPosition.y * 5.0 + u_time) * 0.1;
          gl_FragColor = vec4(color, 1.0);
        }
      `,
			side: THREE.DoubleSide,
			transparent: true,
		});
	}
	public animate(): void {
		this.material.uniforms.u_time.value += 0.05;
		this.material.uniforms.u_mouse.value = mousePos;
		return;
	}
}
