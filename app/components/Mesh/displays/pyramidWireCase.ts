import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils';
import { mousePos } from '../lib/MousePos';
import { Img } from './img';
import { Mesh } from './mesh';
import { Text } from './text';

export class PyramidCase extends Mesh {
	protected mouse = mousePos;
	protected img: Img;
	protected text: Text;

	constructor(imgPath?: string, text?: string) {
		super();
		this.img = new Img(imgPath);
		this.text = new Text(text);
		this.buildMesh();
		this.positionAdjust();
	}

	private buildMesh(): void {
		this.mesh.add(this.img.getMesh());
		this.mesh.add(this.text.getMesh());
	}

	private positionAdjust(): void {
		this.img.getMesh().position.set(-1, 0, 0);
		this.text.getMesh().position.set(1, 0, 0);
	}

	private wireGeometry!: THREE.BufferGeometry;
	private wireMaterial!: THREE.ShaderMaterial;
	private wireMesh!: THREE.Mesh;

	protected initGeometry(): void {
		// 三角錐の作成（底面は正三角形）
		const radius = 2;
		const height = 3;
		const radialSegments = 30;
		const heightSegments = 3;

		// ConeGeometryを使用して三角錐を作成
		const geometry = new THREE.ConeGeometry(
			radius,
			height,
			radialSegments,
			heightSegments,
			true
		);

		this.geometry = geometry;

		// ワイヤーフレーム用のジオメトリを作成
		this.createWireGeometry();
	}

	private createWireGeometry(): void {
		// 螺旋状のワイヤーパスを生成
		const points = [];
		const numTurns = 8;
		const numPointsPerTurn = 10;
		const maxRadius = 2.2;
		const height = 3.2;

		for (let i = 0; i <= numTurns * numPointsPerTurn; i++) {
			const t = i / (numTurns * numPointsPerTurn);
			const angle = t * Math.PI * 2 * numTurns;
			const currentHeight = -height / 2 + t * height;

			// 高さに応じて半径を変化（三角錐の形状に合わせる）
			const radiusAtHeight =
				maxRadius * (1 - (currentHeight + height / 2) / height);

			const x = Math.cos(angle) * radiusAtHeight;
			const z = Math.sin(angle) * radiusAtHeight;
			const y = currentHeight;

			points.push(new THREE.Vector3(x, y, z));
		}

		// 追加の縦方向ワイヤー（エッジ）
		const edgePoints = [];
		const verticalCount = 10; // ← ここを好きな数に変える（例: 6本）

		for (let i = 0; i < verticalCount; i++) {
			const angle = (i / verticalCount) * Math.PI * 2;
			for (let j = 0; j <= 20; j++) {
				const t = j / 20;
				const currentHeight = -height / 2 + t * height;
				const radiusAtHeight = maxRadius * (1 - t);

				const x = Math.cos(angle) * radiusAtHeight;
				const z = Math.sin(angle) * radiusAtHeight;
				const y = currentHeight;

				edgePoints.push(new THREE.Vector3(x, y, z));
			}
		}

		// 螺旋と縦線を結合
		const curve = new THREE.CatmullRomCurve3(points);
		const tubeGeometry = new THREE.TubeGeometry(curve, 400, 0.02, 8, false);

		// エッジ用の追加ジオメトリ
		const edgeGeometries = [];
		for (let i = 0; i < verticalCount; i++) {
			const start = i * 21;
			const end = start + 21;
			const edgeCurve = new THREE.CatmullRomCurve3(edgePoints.slice(start, end));
			edgeGeometries.push(new THREE.TubeGeometry(edgeCurve, 20, 0.03, 8, false));
		}

		// ジオメトリをマージ
		const mergedGeometry = BufferGeometryUtils.mergeGeometries([
			tubeGeometry,
			...edgeGeometries,
		]);

		this.wireGeometry = mergedGeometry;
	}

	protected initMaterial(): void {
		// メインの三角錐用マテリアル
		this.material = new THREE.ShaderMaterial({
			uniforms: {
				u_time: { value: 0.0 },
				u_mouse: { value: this.mouse },
				u_cameraPos: { value: new THREE.Vector3() },
			},
			vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec3 vViewDirection;
        varying vec3 vWorldPosition;
        
        uniform float u_time;
        
        void main() {
          vUv = uv;
          
          // ノイズベースの変形
          vec3 pos = position;
          float noise = sin(position.y * 3.0 + u_time) * 0.1;
          pos += normal * noise;
          
          vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
          vWorldPosition = worldPosition.xyz;
          vPosition = position;
          vNormal = normalize(normalMatrix * normal);
          vViewDirection = normalize(cameraPosition - worldPosition.xyz);
          
          gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
      `,
			fragmentShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec3 vViewDirection;
        varying vec3 vWorldPosition;
        
        uniform float u_time;
        uniform vec2 u_mouse;
        uniform vec3 u_cameraPos;
        
        // ホログラフィック効果用のノイズ関数
        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }
        
        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          
          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));
          
          return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }
        
        void main() {

          // 基本色（サイバーパンク調）
          vec3 baseColor = vec3(0.1, 0.3, 0.4);
          vec3 accentColor = vec3(0.0, 0.8, 0.5);
          vec3 highlightColor = vec3(0.7, 0.3, 0.8);

          // 深度に基づく色変化
          float depth = length(u_cameraPos - vWorldPosition) / 1.0;
          depth = clamp(depth, 0.0, 1.0);
          
          vec3 color = mix(accentColor, baseColor, depth);
          
          // Fresnel効果（改良版）
          float NdotV = max(0.0, dot(vNormal, vViewDirection));
          float fresnel = pow(1.0 - NdotV, 2.0);
          // Fresnel rim light
          color += fresnel * highlightColor;
          
          // ホログラフィックな干渉パターン
          vec2 distortedUV = vUv + vec2(
            sin(vWorldPosition.y * 10.0 + u_time) * 0.2,
            cos(vWorldPosition.x * 10.0 + u_time) * 0.2
          );
          
          // 六角形グリッドパターン
          vec2 hexGrid = vWorldPosition.xy * 100.0;
          float hex = abs(cos(hexGrid.x * 3.14159) * sin(hexGrid.y * 3.14159) * tan((hexGrid.x - hexGrid.y) * 3.14159));
          hex = smoothstep(0.0, 0.1, hex);
          // グリッドパターンの適用
          color *= (hex * 0.5 + 0.5);
          
          // デジタルノイズ
          float digitalNoise = noise(vWorldPosition.xy * 100.0 + vec2(u_time * 2.0));
          digitalNoise = step(0.5, digitalNoise);
          color += vec3(digitalNoise) * highlightColor * 0.3;
                 
          // スキャンライン効果
          float scanline = sin(vWorldPosition.y * 50.0 + u_time * 2.0) * 0.5 + 0.5;
          color *= scanline;
          
          // マウスインタラクション（エネルギーフィールド効果）
          vec2 mouseWorld = u_mouse * 4.0 - 2.0;
          float mouseDist = length(vWorldPosition.xy - mouseWorld);
          float mouseEnergy = exp(-mouseDist * 0.5) * sin(mouseDist * 5.0 - u_time * 3.0);
          mouseEnergy = max(0.0, mouseEnergy);
          color += vec3(0.0, 0.5, 1.0) * mouseEnergy;
          
          // パルス効果
          float pulse = sin(u_time * 3.0 + vPosition.y * 2.0) * 0.5 + 0.5; 
          color += accentColor * pulse;

          // デジタルグリッチ
          color += vec3(digitalNoise) * highlightColor * 0.3;
          
          // 透明度の計算
          float alpha = 0.8 + fresnel * 0.1 + hex * 0.1;
          alpha = clamp(alpha, 0.0, 0.95);
          
          gl_FragColor = vec4(color, alpha);
        }
      `,
			side: THREE.DoubleSide,
			transparent: true,
			blending: THREE.AdditiveBlending,
			depthWrite: true,
		});

		// ワイヤー用マテリアル
		this.wireMaterial = new THREE.ShaderMaterial({
			uniforms: {
				u_time: { value: 0.0 },
				u_mouse: { value: new THREE.Vector2(0, 0) },
				u_energy: { value: 0.0 },
			},
			vertexShader: `
        varying vec3 vPosition;
        varying vec2 vUv;
        varying float vDistanceAlongCurve;
        
        uniform float u_time;
        uniform float u_energy;
        
        void main() {
          vUv = uv;
          vPosition = position;
          vDistanceAlongCurve = uv.x; // TubeGeometryのUV.xは曲線に沿った位置
          
          // エネルギーパルスによる変形
          vec3 pos = position;
          float pulse = sin(vDistanceAlongCurve * 20.0 - u_time * 3.0) * 0.001;
          pos += normal * pulse * u_energy;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
			fragmentShader: `
        varying vec3 vPosition;
        varying vec2 vUv;
        varying float vDistanceAlongCurve;
        
        uniform float u_time;
        uniform vec2 u_mouse;
        uniform float u_energy;
        
        void main() {
          // エネルギーフローのアニメーション
          float flow = fract(vDistanceAlongCurve * 5.0 - u_time * 0.5);
          flow = smoothstep(0.0, 0.1, flow) * smoothstep(1.0, 0.9, flow);
          
          // パルスエフェクト
          float pulse = sin(vDistanceAlongCurve * 30.0 - u_time * 10.0) * 0.5 + 0.5;
          
          // 基本色
          vec3 wireColor = vec3(0.0, 0.5, 0.5);
          vec3 pulseColor = vec3(0.6, 0.0, 0.8);
          
          vec3 color = mix(wireColor, pulseColor, pulse * 0.5);
          
          // エネルギーフロー
          color += vec3(1.0) * flow * 0.5;
          
          // 明度変調
          float brightness = 0.5 + flow * 0.5 + pulse * 0.3;
          brightness *= (0.8 + u_energy * 0.2);
          
          // マウス近接効果
          vec2 mouseWorld = u_mouse * 4.0 - 2.0;
          float mouseDist = length(vPosition.xy - mouseWorld);
          float mouseGlow = exp(-mouseDist * 0.3);
          brightness -= mouseGlow * 0.5;
          color *= brightness;
          
          // グロー効果のための透明度
          float alpha = 0.8 + flow * 0.2;
          
          gl_FragColor = vec4(color, alpha);
        }
      `,
			transparent: true,
			blending: THREE.AdditiveBlending,
			depthWrite: false,
			side: THREE.DoubleSide,
		});

		// ワイヤーメッシュを作成
		this.wireMesh = new THREE.Mesh(this.wireGeometry, this.wireMaterial);
	}

	protected initMesh(): void {
		this.mesh = new THREE.Mesh(this.geometry, this.material);
		// Add wire mesh to the main mesh as a child
		this.mesh.add(this.wireMesh);
	}

	public animate(cameraPos?: THREE.Vector3): void {
		// メインマテリアルのアニメーション
		this.material.uniforms.u_time.value += 0.02;
		this.material.uniforms.u_mouse.value = mousePos;
		if (cameraPos) {
			this.material.uniforms.u_cameraPos.value.copy(cameraPos);
		}

		// ワイヤーマテリアルのアニメーション
		if (this.wireMaterial) {
			this.wireMaterial.uniforms.u_time.value += 0.02;
			this.wireMaterial.uniforms.u_mouse.value = mousePos;

			// エネルギーレベルの変動
			const energyPulse =
				Math.sin(this.material.uniforms.u_time.value * 0.5) * 0.5 + 0.5;
			this.wireMaterial.uniforms.u_energy.value = energyPulse;
		}

		// メッシュ全体の回転（オプション）
		this.mesh.rotation.y += 0.003;
	}
}
