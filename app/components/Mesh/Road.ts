import * as THREE from 'three';
import { Mesh } from './Mesh';

export class Road extends Mesh {
	protected initGeometry(): void {
		this.geometry = new THREE.PlaneGeometry(3, 100, 10);
	}
	protected initMaterial(): void {
		this.material = new THREE.ShaderMaterial({
			glslVersion: THREE.GLSL3,
			vertexShader: `
        out vec2 vUv;
        out vec3 vPos;
        void main() { 
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          vPos = position;
          
        }
      `,
			fragmentShader: `
        in vec3 vPos;
        out vec4 fragColor;
        void main() {
					vec3 refineX = clamp(vPos, vec3(0.5), vec3(1.0));
          fragColor = vec4(vec3(refineX), 1.0);
        }
      `,
			side: THREE.DoubleSide,
		});
	}
	public animate(): void {}

	public rotation(): THREE.Vector3 {
		return new THREE.Vector3(-30, 0, 0);
	}
}
