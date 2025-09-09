import * as THREE from 'three';
import { Mesh } from './Mesh';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export class Text extends Mesh {
	protected controls!: OrbitControls;

	protected initGeometry(): void {
		const geometry = new THREE.PlaneGeometry(2, 2);
		this.geometry = geometry;
	}

	protected initMaterial(): void {
		// Create canvas texture with text
		const canvas = document.createElement('canvas');
		canvas.width = 512;
		canvas.height = 256;
		const ctx = canvas.getContext('2d');

		if (ctx) {
			ctx.fillStyle = 'rgba(255, 255, 255, 0)';
			//ctx.fillRect(0, 0, canvas.width, canvas.height);
			ctx.fillStyle = '#ffffff';
			ctx.font = 'bold 24px Hiragino Kaku Gothic ProN';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText(
				'ポートフォリオのショーウィンドウテストテスト',
				canvas.width / 2,
				canvas.height / 2
			);
		}

		const texture = new THREE.CanvasTexture(canvas);

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
		});
	}

	animate(): void {
		return;
	}
}
