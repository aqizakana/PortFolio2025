import * as THREE from 'three';
import { Mesh } from './Mesh';

export class Sun extends Mesh {
	protected initGeometry(): void {
		this.geometry = new THREE.SphereGeometry(1, 32, 32);
	}

	protected initMaterial(): void {
		this.material = new THREE.ShaderMaterial({
			glslVersion: THREE.GLSL3,
			uniforms: {
				u_resolution: {
					value: new THREE.Vector2(window.innerWidth, window.innerHeight),
				},
				u_time: { value: 0.0 },
			},
			vertexShader: `
        out vec2 vUv;
        out vec3 vPosition;

        void main() {
          vUv = uv;
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
			fragmentShader: `
        in vec2 vUv;
        in vec3 vPosition;

        out vec4 fragColor;
        void main() {
          float graduation = mix(0.3, 1.0, vUv.x);
          fragColor = vec4(vec3(graduation, 0.0, vUv.y), 1.0);
        }
      `,
			transparent: true,
			depthWrite: false,
		});
	}

	public animate(): void {
		this.material.uniforms.u_time.value += 1.0;
	}
}
