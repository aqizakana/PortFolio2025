import * as THREE from 'three';
import { Mesh } from '../mesh';

export class Ground extends Mesh {
	constructor() {
		super();
	}

	protected initGeometry(): void {
		this.geometry = new THREE.PlaneGeometry(
			window.innerWidth,
			window.innerHeight,
			10
		);
		this.geometry.rotateZ(-Math.PI / 2); // Rotate to lie flat on XZ plane
	}

	protected initMaterial(): void {
		this.material = new THREE.ShaderMaterial({
			glslVersion: THREE.GLSL3,
			vertexShader: `
        out vec2 vUv;
        void main() {
          
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
			fragmentShader: `
        in vec2 vUv;
        out vec4 fragColor;

        float grid(vec2 uv) {
          vec2 grid = fract(uv * 10000.0);
          return smoothstep(0.02, 0.05, min(grid.x, grid.y)) *
                 smoothstep(0.02, 0.05, min(1.0 - grid.x, 1.0 - grid.y));
        }

        void main() {
          float g = grid(vUv);
          fragColor = vec4(vec3(vUv, 0.5) * g, 1.0);
        }
      `,
			side: THREE.DoubleSide,
			shadowSide: THREE.DoubleSide,
			transparent: true,
			depthWrite: false,
		});
	}

	protected initMesh(): void {
		super.initMesh();
		this.mesh.rotation.x = -Math.PI / 2;
		this.mesh.position.y = -1;

		this.mesh.receiveShadow = true; // ←追加（影を受け取る）
	}

	public animate(): void {
		// No animation for the ground
	}
	public override dispose(): void {
		super.dispose();
	}
}
