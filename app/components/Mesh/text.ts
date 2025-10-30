import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { Mesh } from './mesh';

export class Text extends Mesh {
	protected controls!: OrbitControls;
	protected text?: string;
	private isLoaded: boolean = false;

	constructor(text: string) {
		super();
		this.text = text;
		// 一時的なジオメトリを作成
		this.initMaterial();
		this.initMesh();
		// 非同期でテキストジオメトリを読み込む
		this.loadTextGeometry();
	}

	private async loadTextGeometry(): Promise<void> {
		const fontLoader = new FontLoader();
		const font = await fontLoader.loadAsync('/optimer_bold.typeface.json');

		const textGeometry = new TextGeometry(this.text, {
			font: font,
			size: 0.3,
			depth: 0.05,
			curveSegments: 2,
			bevelEnabled: false,
		});
		textGeometry.center();

		// ジオメトリを更新
		if (this.mesh) {
			// 古いジオメトリを破棄
			this.mesh.geometry.dispose();
			// 新しいジオメトリを設定
			this.mesh.geometry = textGeometry;
			this.geometry = textGeometry;
			this.isLoaded = true;
		}
	}

	protected initGeometry(): void {
		// このメソッドは使用しない（loadTextGeometryで処理）
	}

	protected initMaterial(): void {
		// デバッグ用に明るい色のマテリアルを使用
		this.material = new THREE.ShaderMaterial({
			uniforms: {
				u_color: { value: new THREE.Color(0xffffff) },
			},
			vertexShader: `
				varying vec3 vNormal;
				void main() {
					vNormal = normal;
					gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
				}
			`,
			fragmentShader: `
				uniform vec3 u_color;
				varying vec3 vNormal;
				void main() {
					// ライティング効果を追加
					vec3 light = vec3(1.0, 1.0, 1.0);
					light = normalize(light);
					float dProd = max(0.0, dot(vNormal, light));
					vec3 color = u_color * (0.7 + 0.3 * dProd);
					gl_FragColor = vec4(color, 1.0);
				}
			`,
			side: THREE.DoubleSide,
		});

		// または、シンプルなBasicMaterialを使用
		/*
		this.material = new THREE.MeshBasicMaterial({
			color: 0x00ff00,
			side: THREE.DoubleSide
		});
		*/
	}

	animate(): void {}
}
