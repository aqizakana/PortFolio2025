import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { type CDItem } from '../lib/CDlist';
import { Mesh } from './Mesh';

export class CD extends Mesh {
	protected item: CDItem;

	constructor(item: CDItem) {
		super();
		this.item = item;
		this.initGeometry();
		this.initMaterial();
		this.initMesh();
		// Re-initialize material with the correct item data
	}
	protected controls!: OrbitControls;

	protected initGeometry(): void {
		const geometry = new THREE.BoxGeometry(1, 1, 0.1);
		this.geometry = geometry;
	}

	protected initMaterial(): void {
		const textureLoader = new THREE.TextureLoader();

		// this.item はオブジェクトなので .imgSrc を使う
		const imgSrc = this.item?.imgSrc;

		const texture = textureLoader.load(imgSrc);

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
          vec2 centeredUv = vUv - 0.5;
          vec2 scaledUv = centeredUv * 1.0 + 0.5;

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
