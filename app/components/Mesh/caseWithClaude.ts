import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { mousePos } from '../lib/MousePos';
import { Img } from './Img';
import { Mesh } from './mesh';
import { Text } from './Text';
export class CaseClaude extends Mesh {
	protected controls!: OrbitControls;
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

	// 多次元レイヤーシステム
	private dimensionalLayers: THREE.Mesh[] = [];
	private hologramProjector!: THREE.Mesh;
	private portalEffect!: THREE.Mesh;
	private energyCore!: THREE.Mesh;
	private dataStreams: THREE.Line[] = [];

	protected initGeometry(): void {
		// メインボックス（フレーム部分のみ）
		const geometry = new THREE.BoxGeometry(4, 2, 2);
		const faces = geometry.index!.array;
		const newFaces = [];

		for (let i = 0; i < faces.length; i += 3) {
			const triangleIndex = Math.floor(i / 3);
			if (triangleIndex !== 8 && triangleIndex !== 9) {
				newFaces.push(faces[i], faces[i + 1], faces[i + 2]);
			}
		}
		geometry.setIndex(newFaces);
		this.geometry = geometry;

		// 追加要素の初期化
		this.createDimensionalLayers();
		this.createHologramProjector();
		this.createPortalEffect();
		this.createEnergyCore();
		this.createDataStreams();
	}

	private createDimensionalLayers(): void {
		// 複数の透明な次元レイヤー
		if (!this.dimensionalLayers) {
			this.dimensionalLayers = [];
		}

		for (let i = 0; i < 5; i++) {
			const layerGeometry = new THREE.PlaneGeometry(3.8, 1.8);
			const z = -0.8 + i * 0.4;
			layerGeometry.translate(0, 0, z);

			const layerMaterial = new THREE.ShaderMaterial({
				uniforms: {
					u_time: { value: 0 },
					u_layer: { value: i },
					u_mouse: { value: new THREE.Vector2() },
				},
				vertexShader: `
          uniform float u_time;
          uniform float u_layer;
          varying vec2 vUv;
          varying float vLayer;
          
          void main() {
            vUv = uv;
            vLayer = u_layer;
            
            vec3 pos = position;
            // 層ごとに異なる波動
            float wave = sin(uv.x * 10.0 + u_time + u_layer) * 0.02;
            wave += cos(uv.y * 8.0 - u_time * 0.8) * 0.02;
            pos.z += wave;
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `,
				fragmentShader: `
          uniform float u_time;
          uniform float u_layer;
          uniform vec2 u_mouse;
          varying vec2 vUv;
          varying float vLayer;
          
          // 六角形グリッド
          float hexDist(vec2 p) {
            p = abs(p);
            float c = dot(p, normalize(vec2(1, 1.73)));
            c = max(c, p.x);
            return c;
          }
          
          vec2 hexGrid(vec2 uv, float size) {
            vec2 r = vec2(1, 1.73);
            vec2 h = r * 0.5;
            vec2 a = mod(uv, r) - h;
            vec2 b = mod(uv - h, r) - h;
            return dot(a, a) < dot(b, b) ? a : b;
          }
          
          void main() {
            vec2 uv = vUv * 2.0 - 1.0;
            
            // 六角形グリッドパターン
            vec2 hex = hexGrid(uv * 20.0, 1.0);
            float hexPattern = 1.0 - step(0.3, hexDist(hex));
            
            // データフロー効果
            float flow = fract(vUv.y * 10.0 - u_time * 0.5 * (vLayer + 1.0));
            flow = smoothstep(0.0, 0.1, flow) * smoothstep(1.0, 0.9, flow);
            
            // ホログラフィック干渉パターン
            float interference = sin(length(uv - u_mouse) * 30.0 - u_time * 2.0);
            interference = interference * 0.5 + 0.5;
            
            // 層ごとの色
            vec3 layerColor = vec3(
              0.2 + vLayer * 0.1,
              0.5 + sin(vLayer * 1.57) * 0.3,
              0.8 - vLayer * 0.1
            );
            
            vec3 color = layerColor * hexPattern;
            color += vec3(flow) * 0.3;
            color *= interference;
            
            float alpha = 0.1 + hexPattern * 0.2 + flow * 0.1;
            alpha *= (1.0 - abs(uv.x) * 0.3) * (1.0 - abs(uv.y) * 0.3);
            
            gl_FragColor = vec4(color, alpha);
          }
        `,
				transparent: true,
				side: THREE.DoubleSide,
				depthWrite: false,
				blending: THREE.AdditiveBlending,
			});

			const layer = new THREE.Mesh(layerGeometry, layerMaterial);
			this.dimensionalLayers.push(layer);
		}
	}

	private createHologramProjector(): void {
		// ホログラム投影装置
		const projectorGeometry = new THREE.ConeGeometry(0.5, 1, 4);
		projectorGeometry.rotateZ(Math.PI);
		projectorGeometry.translate(0, 1.2, 0);

		const projectorMaterial = new THREE.ShaderMaterial({
			uniforms: {
				u_time: { value: 0 },
				u_active: { value: 1 },
			},
			vertexShader: `
        uniform float u_time;
        varying vec3 vPosition;
        
        void main() {
          vPosition = position;
          vec3 pos = position;
          
          // パルス効果
          float pulse = sin(u_time * 3.0) * 0.05;
          pos.xyz *= 1.0 + pulse;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
			fragmentShader: `
        uniform float u_time;
        uniform float u_active;
        varying vec3 vPosition;
        
        void main() {
          // レーザー光のような効果
          vec3 color = vec3(0.0, 1.0, 0.8);
          float intensity = 1.0 - length(vPosition.xz) * 2.0;
          intensity = max(0.0, intensity);
          
          // スキャンライン
          float scan = sin(vPosition.y * 50.0 + u_time * 10.0) * 0.5 + 0.5;
          
          color *= intensity * u_active;
          color += vec3(scan) * 0.2;
          
          gl_FragColor = vec4(color, 0.6);
        }
      `,
			transparent: true,
			blending: THREE.AdditiveBlending,
		});

		this.hologramProjector = new THREE.Mesh(projectorGeometry, projectorMaterial);
	}

	private createPortalEffect(): void {
		// ポータル効果（前面）
		const portalGeometry = new THREE.PlaneGeometry(3.6, 1.6, 64, 64);
		portalGeometry.translate(0, 0, 0.99);

		const portalMaterial = new THREE.ShaderMaterial({
			uniforms: {
				u_time: { value: 0 },
				u_mouse: { value: new THREE.Vector2() },
				u_resolution: {
					value: new THREE.Vector2(window.innerWidth, window.innerHeight),
				},
			},
			vertexShader: `
        uniform float u_time;
        uniform vec2 u_mouse;
        varying vec2 vUv;
        varying vec3 vPosition;
        
        void main() {
          vUv = uv;
          vPosition = position;
          
          vec3 pos = position;
          
          // 空間の歪み
          vec2 center = vec2(0.5) - uv;
          float dist = length(center);
          float ripple = sin(dist * 20.0 - u_time * 3.0) * 0.02;
          pos.z += ripple * (1.0 - dist);
          
          // マウス影響による歪み
          vec2 mouseEffect = (u_mouse - 0.5) * 2.0;
          float mouseDist = length(uv - 0.5 - mouseEffect * 0.2);
          pos.z += exp(-mouseDist * 5.0) * 0.1;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
			fragmentShader: `
        uniform float u_time;
        uniform vec2 u_mouse;
        uniform vec2 u_resolution;
        varying vec2 vUv;
        varying vec3 vPosition;
        
        // フラクタルノイズ
        float noise(vec2 p) {
          return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        }
        
        float fbm(vec2 p) {
          float value = 0.0;
          float amplitude = 0.5;
          for (int i = 0; i < 4; i++) {
            value += amplitude * noise(p);
            p *= 2.0;
            amplitude *= 0.5;
          }
          return value;
        }
        
        void main() {
          vec2 uv = vUv;
          vec2 center = uv - 0.5;
          float dist = length(center);
          
          // ポータルの渦
          float angle = atan(center.y, center.x);
          float spiral = sin(angle * 5.0 + dist * 10.0 - u_time * 2.0);
          
          // エネルギーフィールド
          vec3 portalColor = vec3(0.0);
          
          // 内側の明るいコア
          float core = exp(-dist * 5.0);
          portalColor += vec3(1.0, 0.5, 0.8) * core;
          
          // 渦巻きパターン
          float swirl = fbm(vec2(angle * 3.0, dist * 10.0 - u_time));
          portalColor += vec3(0.0, 0.5, 1.0) * swirl * (1.0 - dist);
          
          // エッジのエネルギー
          float edge = 1.0 - smoothstep(0.4, 0.5, dist);
          float edgeGlow = sin(angle * 10.0 + u_time * 5.0) * 0.5 + 0.5;
          portalColor += vec3(0.0, 1.0, 1.0) * edge * edgeGlow * 0.5;
          
          // 深度効果
          float depth = 1.0 - dist;
          portalColor *= depth;
          
          // パーティクル効果
          float particles = noise(uv * 50.0 + vec2(u_time * 0.5));
          particles = step(0.98, particles);
          portalColor += vec3(particles);
          
          float alpha = edge * 0.8 + core * 0.3;
          
          gl_FragColor = vec4(portalColor, alpha);
        }
      `,
			transparent: true,
			side: THREE.DoubleSide,
			depthWrite: false,
			blending: THREE.AdditiveBlending,
		});

		this.portalEffect = new THREE.Mesh(portalGeometry, portalMaterial);
	}

	private createEnergyCore(): void {
		// エネルギーコア（中心部）
		const coreGeometry = new THREE.OctahedronGeometry(0.3, 2);

		const coreMaterial = new THREE.ShaderMaterial({
			uniforms: {
				u_time: { value: 0 },
			},
			vertexShader: `
        uniform float u_time;
        varying vec3 vPosition;
        varying vec3 vNormal;
        
        void main() {
          vPosition = position;
          vNormal = normal;
          
          vec3 pos = position;
          
          // 呼吸するような動き
          float breath = sin(u_time * 2.0) * 0.1 + 1.0;
          pos *= breath;
          
          // 回転
          float angle = u_time * 0.5;
          mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
          pos.xy = rot * pos.xy;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
			fragmentShader: `
        uniform float u_time;
        varying vec3 vPosition;
        varying vec3 vNormal;
        
        void main() {
          // プラズマ効果
          vec3 plasma = vec3(
            sin(vPosition.x * 10.0 + u_time),
            sin(vPosition.y * 10.0 + u_time * 1.3),
            sin(vPosition.z * 10.0 + u_time * 0.7)
          ) * 0.5 + 0.5;
          
          // エネルギーパルス
          float pulse = sin(u_time * 4.0) * 0.5 + 0.5;
          
          vec3 color = plasma * pulse + vec3(0.5, 0.0, 1.0) * (1.0 - pulse);
          
          // 内部グロー
          float glow = dot(vNormal, normalize(vPosition));
          color += vec3(1.0, 0.5, 0.0) * glow * 0.5;
          
          gl_FragColor = vec4(color, 0.8);
        }
      `,
			transparent: true,
			blending: THREE.AdditiveBlending,
		});

		this.energyCore = new THREE.Mesh(coreGeometry, coreMaterial);
	}

	private createDataStreams(): void {
		// データストリームのビジュアライゼーション
		if (!this.dataStreams) {
			this.dataStreams = [];
		}

		for (let i = 0; i < 8; i++) {
			const curve = new THREE.CatmullRomCurve3([
				new THREE.Vector3(-2, (Math.random() - 0.5) * 2, -1),
				new THREE.Vector3(-1, (Math.random() - 0.5) * 2, Math.random() - 0.5),
				new THREE.Vector3(0, (Math.random() - 0.5) * 2, Math.random() - 0.5),
				new THREE.Vector3(1, (Math.random() - 0.5) * 2, Math.random() - 0.5),
				new THREE.Vector3(2, (Math.random() - 0.5) * 2, -1),
			]);

			const points = curve.getPoints(50);
			const streamGeometry = new THREE.BufferGeometry().setFromPoints(points);

			const streamMaterial = new THREE.LineBasicMaterial({
				color: new THREE.Color().setHSL(i / 8, 1, 0.5),
				transparent: true,
				opacity: 0.3,
				blending: THREE.AdditiveBlending,
			});

			const stream = new THREE.Line(streamGeometry, streamMaterial);
			this.dataStreams.push(stream);
		}
	}

	protected initMaterial(): void {
		// メインフレームのマテリアル
		this.material = new THREE.ShaderMaterial({
			uniforms: {
				u_time: { value: 0.0 },
				u_mouse: { value: new THREE.Vector2(0, 0) },
			},
			vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec3 vViewDirection;
        uniform float u_time;
        
        void main() {
          vUv = uv;
          
          vec3 pos = position;
          
          // エネルギーによる振動
          float vibration = sin(position.x * 10.0 + u_time * 3.0) * 0.003;
          vibration += cos(position.y * 15.0 - u_time * 2.0) * 0.003;
          pos += normal * vibration;
          
          vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
          vPosition = worldPosition.xyz;
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
        uniform float u_time;
        uniform vec2 u_mouse;
        
        void main() {
          // メタリックな基本色
          vec3 baseColor = vec3(0.1, 0.1, 0.15);
          
          // 高度なFresnel効果
          float fresnel = pow(1.0 - dot(vNormal, vViewDirection), 2.0);
          vec3 fresnelColor = mix(
            vec3(0.0, 0.5, 1.0),  // エッジカラー1
            vec3(1.0, 0.0, 0.5),  // エッジカラー2
            sin(u_time * 0.5) * 0.5 + 0.5
          );
          
          // ナノテクパターン
          vec2 nano = fract(vUv * 100.0);
          float nanoPattern = step(0.98, max(nano.x, nano.y));
          
          // 最終色
          vec3 color = baseColor;
          color += fresnelColor * fresnel * 0.5;
          color += vec3(nanoPattern) * 0.1;
          
          // エネルギーグロー
          float glow = sin(vPosition.x * 20.0 + u_time * 2.0) * 0.5 + 0.5;
          color += vec3(0.0, glow * 0.2, glow * 0.3);
          
          gl_FragColor = vec4(color, 0.95);
        }
      `,
			side: THREE.DoubleSide,
			transparent: true,
		});
	}

	protected initMesh(): void {
		this.mesh = new THREE.Mesh(this.geometry, this.material);

		// 全ての要素を追加
		this.dimensionalLayers.forEach(layer => {
			this.mesh.add(layer);
		});

		this.mesh.add(this.hologramProjector);
		this.mesh.add(this.portalEffect);
		this.mesh.add(this.energyCore);

		this.dataStreams.forEach(stream => {
			this.mesh.add(stream);
		});
	}

	public animate(): void {
		const time = this.material.uniforms.u_time.value;
		this.material.uniforms.u_time.value += 0.02;
		this.material.uniforms.u_mouse.value.set(mousePos?.x || 0, mousePos?.y || 0);

		// 各レイヤーのアニメーション
		this.dimensionalLayers.forEach((layer, i) => {
			if (layer.material instanceof THREE.ShaderMaterial) {
				layer.material.uniforms.u_time.value = time;
				layer.material.uniforms.u_mouse.value.set(
					mousePos?.x || 0,
					mousePos?.y || 0
				);

				// レイヤーごとの微細な動き
				layer.position.z = -0.8 + i * 0.4 + Math.sin(time * 0.5 + i) * 0.02;
			}
		});

		// ホログラムプロジェクターの更新
		if (
			this.hologramProjector &&
			this.hologramProjector.material instanceof THREE.ShaderMaterial
		) {
			this.hologramProjector.material.uniforms.u_time.value = time;
			this.hologramProjector.rotation.y += 0.01;
		}

		// ポータル効果の更新
		if (
			this.portalEffect &&
			this.portalEffect.material instanceof THREE.ShaderMaterial
		) {
			this.portalEffect.material.uniforms.u_time.value = time;
			this.portalEffect.material.uniforms.u_mouse.value.set(
				mousePos?.x || 0,
				mousePos?.y || 0
			);
		}

		// エネルギーコアの更新
		if (
			this.energyCore &&
			this.energyCore.material instanceof THREE.ShaderMaterial
		) {
			this.energyCore.material.uniforms.u_time.value = time;
			this.energyCore.position.y = Math.sin(time * 2) * 0.1;
		}

		// データストリームのアニメーション
		this.dataStreams.forEach((stream, i) => {
			if (stream.material instanceof THREE.LineBasicMaterial) {
				stream.material.opacity = 0.1 + Math.sin(time * 2 + i) * 0.2;
			}
			stream.position.z = Math.sin(time * 0.5 + i * 0.5) * 0.2;
		});
	}
}
