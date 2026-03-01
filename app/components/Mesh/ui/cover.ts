import * as THREE from 'three';
import { mousePos } from '../lib/MousePos';
import { Mesh } from './mesh';
export class Cover extends Mesh {
	protected mouse = mousePos;
	constructor() {
		super();
		this.initGeometry();
		this.initMaterial();
		this.initMesh();
	}

	protected initGeometry(): void {
		const geometry = new THREE.BoxGeometry(4.2, 2.5, 2.2);
		const newFaces = [];

		const faces = geometry.index!.array;
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
			glslVersion: THREE.GLSL3,
			uniforms: {
				u_time: { value: 0.0 },
				u_mouse: { value: new THREE.Vector2() },
			},
			vertexShader: `
        out vec2 vUv;
        out vec3 vPosition;
        out vec3 vNormal;
        out vec3 vViewDirection;
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
        in vec2 vUv;
        in vec3 vPosition;
        in vec3 vNormal;
        in vec3 vViewDirection;
        uniform float u_time;
        uniform vec2 u_mouse;

        out vec4 fragColor;
        void main() {
          // Color based on position and depth
          float depth = gl_FragCoord.z;
          vec3 color = vec3(0.5, 0.8, 0.8) * (1.0 - depth);

          // Fresnel-like effect based on viewing angle
          // フレネル効果は、光が異なる屈折率を持つ二つの媒質の境界面に入射する際に起こる反射と屈折の現象。
          float fresnelPower = 10.0; // 調整可能なパラメータ
          float fresnelBias = 0.1;  // 最小反射率
          float fresnelScale = 1.0; // スケール
          float facing = dot(vNormal, vViewDirection);
          float NdotV = max(0.0, facing);
          float fresnel = fresnelBias + fresnelScale * pow(1.0 - NdotV, fresnelPower);
          color += fresnel * vec3(1.0, 1.0, 1.0) * 0.5;

          float mouseDist = length(vPosition.xy - (u_mouse * vec2(2.0, 2.0)));
          float mouseLight = 0.3 / (mouseDist + 0.1);
          mouseLight = smoothstep(0.0, 1.0, mouseLight);
          mouseLight = mouseLight * mouseLight * (3.0 - 2.0 * mouseLight); // smoothstep easing
          //color += vec3(mouseLight) * 0.5;

          // Dynamic grid pattern based on UV and time
          vec2 grid;
          if (abs(facing) < 0.5) {
          grid = fract(vUv * 10.0 - vec2(u_time * 0.1, u_time * 0.1));}
          else {
          grid = abs(fract(vUv * 10.0 + vec2(u_time * 0.1, u_time * 0.1)));
          }
          float gridPattern = smoothstep(0.02, 0.05, grid.x) *
          smoothstep(0.02, 0.05, 1.0 - grid.x);
          color *= gridPattern;
          
          // Add some subtle animation
          // color += cos(vPosition.y * 5.0 + u_time) * 0.1;
          fragColor = vec4(color, 1.0);
        }
      `,
			side: THREE.DoubleSide,
			transparent: true,
		});
	}

	public animate(): void {
		this.material.uniforms.u_time.value += 0.05;
		// valueがTHREE.Vector2型なのでlerpが使える
		this.material.uniforms.u_mouse.value = mousePos;
		return;
	}
}
