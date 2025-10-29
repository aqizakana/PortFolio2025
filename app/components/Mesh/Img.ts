import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Mesh } from './mesh';

export class Img extends Mesh {
	protected controls!: OrbitControls;
	protected imgSrc: string;
	protected isLoaded: boolean = false;

	constructor(imgSrc: string) {
		super();
		this.imgSrc = imgSrc;
		this.initGeometry();
		this.initMaterial();
		this.initMesh();
	}

	protected initGeometry(): void {
		const geometry = new THREE.PlaneGeometry(1, 1, 2);
		this.geometry = geometry;
	}

	protected initMaterial(): void {
		// Create initial transparent material
		this.material = new THREE.ShaderMaterial({
			glslVersion: THREE.GLSL3,
			uniforms: {
				u_texture: { value: new THREE.Texture() },
				u_opacity: { value: 0.0 },
			},
			vertexShader: `
					out vec2 vUv;
					void main() {
							vUv = uv;
							gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
					}
			`,
			fragmentShader: `
				in vec2 vUv;
				uniform sampler2D u_texture;
				uniform float u_opacity;

				out vec4 fragColor;
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
						fragColor = vec4(textureColor.rgb, textureColor.a * u_opacity);
				}
			`,
			transparent: true,
		});

		// Load texture asynchronously
		this.loadTexture();
	}

	protected async loadTexture(): Promise<void> {
		try {
			const textureLoader = new THREE.TextureLoader();
			const texture = await textureLoader.loadAsync(this.imgSrc);

			// Update material with loaded texture
			this.material.uniforms.u_texture.value = texture;
			this.material.uniforms.u_opacity.value = 1.0;
			this.isLoaded = true;
		} catch {
			return;
		}
	}

	animate(): void {
		return;
	}
}
