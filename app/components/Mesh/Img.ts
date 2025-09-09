import * as THREE from 'three';
import { Mesh } from './Mesh';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export class Img extends Mesh {
	protected controls!: OrbitControls;

	protected initGeometry(): void {
		const geometry = new THREE.PlaneGeometry(1, 1, 2);
		this.geometry = geometry;
	}

	protected initMaterial(): void {
		const textureLoader = new THREE.TextureLoader();
		const texture = textureLoader.load('/example.png');

		this.material = new THREE.ShaderMaterial({
			uniforms: {
				u_texture: { value: texture },
			},
			vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
			fragmentShader: `
                varying vec2 vUv;
                uniform sampler2D u_texture;
                void main() {
                    // Center the UV coordinates
                    vec2 centeredUv = vUv - 0.5;
                    
                    // Scale to maintain aspect ratio and crop overflow
                    vec2 scaledUv = centeredUv * 1.0 + 0.5;
                    
                    // Discard pixels outside the [0,1] range to crop overflow
                    if (scaledUv.x < 0.0 || scaledUv.x > 1.0 || scaledUv.y < 0.0 || scaledUv.y > 1.0) {
                        discard;
                    }
                    
                    vec4 textureColor = texture2D(u_texture, scaledUv);
                    gl_FragColor = textureColor;
                }
            `,
		});
	}

	animate(): void {
		return;
	}
}
