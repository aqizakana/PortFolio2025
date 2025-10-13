import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Mesh } from './Mesh';

export class Text extends Mesh {
	protected controls!: OrbitControls;
	protected text?: string;

	constructor(text?: string) {
		super();
		this.text = text;
		this.initGeometry();
		this.initMaterial();
		this.initMesh();
	}

	protected initGeometry(): void {
		const geometry = new THREE.PlaneGeometry(2, 1);
		this.geometry = geometry;
	}

	protected initMaterial(): void {
		// Create canvas texture with text
		let texture: THREE.Texture;

		if (typeof document !== 'undefined') {
			const canvas = document.createElement('canvas');
			canvas.width = 512;
			canvas.height = 256;
			const ctx = canvas.getContext('2d');

			if (ctx) {
				// Fill background with white
				ctx.fillStyle = 'white';
				ctx.fillRect(0, 0, canvas.width, canvas.height);
				ctx.fillStyle = 'black';
				ctx.font = 'bold 24px Hiragino Kaku Gothic ProN';
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
				ctx.fillText(
					this.text || 'Default Text',
					canvas.width / 2,
					canvas.height / 2
				);
			}

			texture = new THREE.CanvasTexture(canvas);
		} else {
			// Fallback for non-browser environments
			texture = new THREE.Texture();
		}

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
					vec4 textureColor = texture2D(u_texture, vUv);
					gl_FragColor = textureColor;
			}
			`,
			transparent: true,
			shadowSide: THREE.DoubleSide,
		});
	}

	animate(): void {
		return;
	}
}
