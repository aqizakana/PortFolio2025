import * as THREE from 'three';
import { Mesh } from './Mesh';

export class Window extends Mesh {
	protected fragmentShader: string;
	constructor(importFragmentShader?: string) {
		super();
		this.fragmentShader = importFragmentShader || '';
	}

	protected initGeometry(): void {
		this.geometry = new THREE.PlaneGeometry(4, 2);
	}

	protected initMaterial(): void {
		this.material = new THREE.ShaderMaterial({
			glslVersion: THREE.GLSL3,
			uniforms: {
				u_time: { value: 0.0 },
				u_cameraPos: { value: new THREE.Vector3() },
				u_meshWorldPos: { value: new THREE.Vector3() }, // Meshのワールド座標
			},
			vertexShader: `
        uniform float u_time;
        uniform vec3 u_meshWorldPos;
        out vec2 vUv;
        out vec3 vWorldPosition;
        
        void main() {
          vUv = uv;
          // ワールド座標を計算
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          
          gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
      `,
			fragmentShader:
				this.fragmentShader ||
				`
        in vec2 vUv;
        in vec3 vWorldPosition;
        uniform float u_time;
        uniform vec3 u_cameraPos;
        uniform vec3 u_meshWorldPos;
        out vec4 fragColor;
        
        void main() {
          // カメラとメッシュのワールド座標間の距離
          float cameraDistance = length(u_cameraPos - vWorldPosition);
          
          // 距離に基づく透明度制御
          float opacity = smoothstep(.0, 10.0, cameraDistance);
          opacity = clamp(opacity, 0.0, 0.8);
          
          fragColor = vec4(0.8, 0.9, 1.0, opacity);
        }
      `,
			transparent: true,
		});
	}

	animate(cameraPos?: THREE.Vector3): void {
		this.material.uniforms.u_time.value += 0.1;
		if (cameraPos) {
			this.material.uniforms.u_cameraPos.value.copy(cameraPos);
		}

		// このMeshのワールド座標を更新
		this.mesh.getWorldPosition(this.material.uniforms.u_meshWorldPos.value);
	}
}
