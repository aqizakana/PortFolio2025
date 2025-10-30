import * as THREE from 'three';
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry';
import { mousePos } from '../lib/MousePos';
import { Img } from './img';
import { Mesh } from './mesh';
import { Text } from './text';

export class AdaptiveCrystalCase extends Mesh {
	protected mouse = mousePos;
	private innerStructures: THREE.Mesh[] = [];
	private particleSystem!: THREE.Points;
	private morphTargets: THREE.BufferAttribute[] = [];
	private currentMorphTarget = 0;
	private morphTransition = 0;
	private energyField!: THREE.Mesh;
	private fractureLines: THREE.LineSegments[] = [];

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

	protected initGeometry(): void {
		// 基本形状：不規則な多面体（ボロノイ分割風）
		this.createAdaptiveGeometry();

		// 内部構造の生成
		this.createInnerStructures();

		// パーティクルシステム
		this.createParticleSystem();

		// エネルギーフィールド
		this.createEnergyField();

		// 亀裂ライン
		this.createFractureLines();
	}

	private createAdaptiveGeometry(): void {
		// ベース形状：歪んだ結晶
		const points = [];
		const numPoints = 12;

		for (let i = 0; i < numPoints; i++) {
			const theta = (i / numPoints) * Math.PI * 2;
			const phi = Math.acos(1 - (2 * (i + 0.5)) / numPoints);
			const radius = 2 + Math.random() * 0.5;

			points.push(
				new THREE.Vector3(
					radius * Math.sin(phi) * Math.cos(theta),
					radius * Math.cos(phi),
					radius * Math.sin(phi) * Math.sin(theta)
				)
			);
		}

		// Convex Hull アルゴリズム的な接続（簡略版）
		const geometry = new ConvexGeometry(points);

		// モーフターゲット配列を初期化
		this.morphTargets = [];

		// モーフターゲット用の異なる形状を生成
		this.generateMorphTargets(geometry);

		this.geometry = geometry;
	}

	private generateMorphTargets(baseGeometry: THREE.BufferGeometry): void {
		const positions = baseGeometry.attributes.position;

		// 形状1: 鋭角的な結晶
		const sharpPositions = new Float32Array(positions.array.length);
		for (let i = 0; i < positions.count; i++) {
			const i3 = i * 3;
			const vec = new THREE.Vector3(
				positions.array[i3],
				positions.array[i3 + 1],
				positions.array[i3 + 2]
			);
			vec.normalize().multiplyScalar(2 + Math.random() * 1.5);
			sharpPositions[i3] = vec.x;
			sharpPositions[i3 + 1] = vec.y;
			sharpPositions[i3 + 2] = vec.z;
		}

		// 形状2: 球体的な結晶
		const spherePositions = new Float32Array(positions.array.length);
		for (let i = 0; i < positions.count; i++) {
			const i3 = i * 3;
			const vec = new THREE.Vector3(
				positions.array[i3],
				positions.array[i3 + 1],
				positions.array[i3 + 2]
			);
			vec.normalize().multiplyScalar(2.5);
			spherePositions[i3] = vec.x;
			spherePositions[i3 + 1] = vec.y;
			spherePositions[i3 + 2] = vec.z;
		}

		this.morphTargets.push(
			new THREE.BufferAttribute(sharpPositions, 3),
			new THREE.BufferAttribute(spherePositions, 3)
		);
	}

	private createInnerStructures(): void {
		// 内部構造配列を初期化
		this.innerStructures = [];

		// 内部の幾何学的構造（神経網のような）
		const innerGeometry = new THREE.IcosahedronGeometry(1, 0);

		for (let i = 0; i < 3; i++) {
			const scale = 0.3 + i * 0.3;
			const innerMaterial = new THREE.ShaderMaterial({
				glslVersion: THREE.GLSL3,
				uniforms: {
					u_time: { value: 0 },
					u_scale: { value: scale },
					u_index: { value: i },
				},
				vertexShader: `
          uniform float u_time;
          uniform float u_scale;
          out vec3 vPosition;
          out vec3 vNormal;
          
          void main() {
            vPosition = position;
            vNormal = normal;
            
            vec3 pos = position * u_scale;
            
            // 呼吸するような動き
            float breath = sin(u_time * 2.0 + float(gl_VertexID) * 0.1) * 0.1;
            pos *= 1.0 + breath;
            
            // 回転
            float angle = u_time * 0.5 + u_scale;
            mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
            pos.xz = rot * pos.xz;
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `,
				fragmentShader: `
          uniform float u_time;
          uniform float u_scale;
          uniform float u_index;
          in vec3 vPosition;
          in vec3 vNormal;

					out vec4 fragColor;

          void main() {
            vec3 color = vec3(0.0);
            
            // 層ごとに異なる色
            if(u_index == 0.0) {
              color = vec3(1.0, 0.2, 0.5); // マゼンタ
            } else if(u_index == 1.0) {
              color = vec3(0.2, 1.0, 0.5); // シアン
            } else {
              color = vec3(0.5, 0.2, 1.0); // パープル
            }
            
            // エネルギーパルス
            float pulse = sin(u_time * 3.0 - length(vPosition) * 5.0) * 0.5 + 0.5;
            color *= 0.5 + pulse * 0.5;
            
            fragColor = vec4(color, 0.6);
          }
        `,
				transparent: true,
				blending: THREE.AdditiveBlending,
				side: THREE.DoubleSide,
			});

			const innerMesh = new THREE.Mesh(innerGeometry, innerMaterial);
			this.innerStructures.push(innerMesh);
		}
	}

	private createParticleSystem(): void {
		const particleCount = 500;
		const positions = new Float32Array(particleCount * 3);
		const velocities = new Float32Array(particleCount * 3);
		const lifetimes = new Float32Array(particleCount);

		for (let i = 0; i < particleCount; i++) {
			const i3 = i * 3;
			// 初期位置（結晶内部）
			const theta = Math.random() * Math.PI * 2;
			const phi = Math.acos(1 - 2 * Math.random());
			const radius = Math.random() * 2;

			positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
			positions[i3 + 1] = radius * Math.cos(phi);
			positions[i3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

			// 速度
			velocities[i3] = (Math.random() - 0.5) * 0.02;
			velocities[i3 + 1] = (Math.random() - 0.5) * 0.02;
			velocities[i3 + 2] = (Math.random() - 0.5) * 0.02;

			lifetimes[i] = Math.random();
		}

		const particleGeometry = new THREE.BufferGeometry();
		particleGeometry.setAttribute(
			'position',
			new THREE.BufferAttribute(positions, 3)
		);
		particleGeometry.setAttribute(
			'velocity',
			new THREE.BufferAttribute(velocities, 3)
		);
		particleGeometry.setAttribute(
			'lifetime',
			new THREE.BufferAttribute(lifetimes, 1)
		);

		const particleMaterial = new THREE.ShaderMaterial({
			glslVersion: THREE.GLSL3,
			uniforms: {
				u_time: { value: 0 },
				u_mouse: { value: new THREE.Vector2(0, 0) },
			},
			vertexShader: `
        attribute vec3 velocity;
        attribute float lifetime;
        uniform float u_time;
        out float vLifetime;
        out float vDistance;

        void main() {
          vLifetime = lifetime;
          
          vec3 pos = position;
          
          // ライフタイムに基づく動き
          float life = mod(lifetime + u_time * 0.1, 1.0);
          pos += velocity * life * 20.0;
          
          // 中心からの距離
          vDistance = length(pos);
          
          // 外側に到達したら中心に戻す
          if(vDistance > 2.5) {
            pos *= 0.1;
          }
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = (1.0 / -mvPosition.z) * 5.0 * (1.0 - life);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
			fragmentShader: `
        uniform float u_time;
        in float vLifetime;
        in float vDistance;

				out vec4 fragColor;
        void main() {
          // 円形のパーティクル
          vec2 center = gl_PointCoord - 0.5;
          if(length(center) > 0.5) discard;
          
          // ライフタイムに基づく色
          float life = mod(vLifetime + u_time * 0.1, 1.0);
          vec3 color = mix(
            vec3(0.0, 1.0, 1.0),
            vec3(1.0, 0.0, 1.0),
            life
          );
          
          float alpha = 1.0 - life;
          alpha *= 1.0 - length(center) * 2.0;
          
          fragColor = vec4(color, alpha * 0.6);
        }
      `,
			transparent: true,
			blending: THREE.AdditiveBlending,
			depthWrite: false,
		});

		this.particleSystem = new THREE.Points(particleGeometry, particleMaterial);
	}

	private createEnergyField(): void {
		const fieldGeometry = new THREE.SphereGeometry(3, 32, 32);
		const fieldMaterial = new THREE.ShaderMaterial({
			glslVersion: THREE.GLSL3,
			uniforms: {
				u_time: { value: 0 },
				u_mouse: { value: new THREE.Vector2(0, 0) },
				u_intensity: { value: 0 },
			},
			vertexShader: `
        out vec3 vPosition;
        out vec3 vNormal;
        uniform float u_time;
        uniform float u_intensity;
        
        void main() {
          vPosition = position;
          vNormal = normal;
          
          vec3 pos = position;
          
          // 波動効果
          float wave = sin(position.x * 2.0 + u_time) * 
                      sin(position.y * 2.0 + u_time) * 
                      sin(position.z * 2.0 + u_time);
          pos += normal * wave * 0.1 * u_intensity;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
			fragmentShader: `
        in vec3 vPosition;
        in vec3 vNormal;
        uniform float u_time;
        uniform vec2 u_mouse;
        uniform float u_intensity;

				out vec4 fragColor;

        void main() {
          // フィールドの可視化
          float fresnel = pow(1.0 - abs(dot(vNormal, normalize(vPosition))), 3.0);
          
          // 波紋効果
          float ripple = sin(length(vPosition.xy) * 5.0 - u_time * 2.0) * 0.5 + 0.5;
          
          vec3 color = mix(
            vec3(0.0, 0.5, 1.0),
            vec3(1.0, 0.0, 0.5),
            ripple
          );
          
          float alpha = fresnel * 0.3 * u_intensity;
          
          fragColor = vec4(color, alpha);
        }
      `,
			transparent: true,
			blending: THREE.AdditiveBlending,
			side: THREE.BackSide,
			depthWrite: false,
		});

		this.energyField = new THREE.Mesh(fieldGeometry, fieldMaterial);
	}

	private createFractureLines(): void {
		// 亀裂ライン配列を初期化
		this.fractureLines = [];

		// 亀裂のようなライン効果
		for (let i = 0; i < 5; i++) {
			const points = [];
			const startPoint = new THREE.Vector3(
				(Math.random() - 0.5) * 4,
				(Math.random() - 0.5) * 4,
				(Math.random() - 0.5) * 4
			);
			points.push(startPoint);

			let currentPoint = startPoint.clone();
			for (let j = 0; j < 10; j++) {
				const nextPoint = currentPoint
					.clone()
					.add(
						new THREE.Vector3(
							(Math.random() - 0.5) * 0.5,
							(Math.random() - 0.5) * 0.5,
							(Math.random() - 0.5) * 0.5
						)
					);
				points.push(nextPoint);
				currentPoint = nextPoint;
			}

			const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
			const lineMaterial = new THREE.LineBasicMaterial({
				color: 0x00ffff,
				transparent: true,
				opacity: 0.3,
				blending: THREE.AdditiveBlending,
			});

			const line = new THREE.LineSegments(lineGeometry, lineMaterial);
			this.fractureLines.push(line);
		}
	}

	protected initMaterial(): void {
		this.material = new THREE.ShaderMaterial({
			glslVersion: THREE.GLSL3,
			uniforms: {
				u_time: { value: 0 },
				u_mouse: { value: new THREE.Vector2(0, 0) },
				u_morphProgress: { value: 0 },
				u_targetPositions: { value: null },
				u_audioReactivity: { value: 0 },
				u_environmentMap: { value: null },
			},
			vertexShader: `
        uniform float u_time;
        uniform float u_morphProgress;
        uniform float u_audioReactivity;
        
        attribute vec3 targetPosition;

        out vec3 vPosition;
        out vec3 vNormal;
        out vec3 vViewDirection;
        out vec2 vUv;
        out float vDistortion;

        // ノイズ関数
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
        
        float snoise(vec3 v) {
          const vec2 C = vec2(1.0/6.0, 1.0/3.0);
          const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
          
          vec3 i = floor(v + dot(v, C.yyy));
          vec3 x0 = v - i + dot(i, C.xxx);
          
          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min(g.xyz, l.zxy);
          vec3 i2 = max(g.xyz, l.zxy);
          
          vec3 x1 = x0 - i1 + C.xxx;
          vec3 x2 = x0 - i2 + C.yyy;
          vec3 x3 = x0 - D.yyy;
          
          i = mod289(i);
          vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
            
          vec3 ns = 0.142857142857 * D.wyz - D.xzx;
          
          vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_);
          
          vec4 x = x_ *ns.x + ns.yyyy;
          vec4 y = y_ *ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);
          
          vec4 b0 = vec4(x.xy, y.xy);
          vec4 b1 = vec4(x.zw, y.zw);
          
          vec4 s0 = floor(b0)*2.0 + 1.0;
          vec4 s1 = floor(b1)*2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));
          
          vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
          vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
          
          vec3 p0 = vec3(a0.xy, h.x);
          vec3 p1 = vec3(a0.zw, h.y);
          vec3 p2 = vec3(a1.xy, h.z);
          vec3 p3 = vec3(a1.zw, h.w);
          
          vec4 norm = 1.79284291400159 - 0.85373472095314 * vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3));
          p0 *= norm.x;
          p1 *= norm.y;
          p2 *= norm.z;
          p3 *= norm.w;
          
          vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
          m = m * m;
          return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
        }
        
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          
          // モーフィング（簡略版 - 実際はtargetPositionアトリビュートを使用）
          vec3 morphedPosition = position;
          
          // 有機的な歪み
          float noiseScale = 2.0;
          float noiseAmplitude = 0.15 + u_audioReactivity * 0.1;
          vec3 noiseInput = position * noiseScale + vec3(u_time * 0.2);
          float noise = snoise(noiseInput);
          vDistortion = noise;
          
          morphedPosition += normal * noise * noiseAmplitude;
          
          // 呼吸効果
          float breathing = sin(u_time * 1.5) * 0.05;
          morphedPosition += normal * breathing;
          
          vec4 worldPosition = modelMatrix * vec4(morphedPosition, 1.0);
          vPosition = worldPosition.xyz;
          vViewDirection = normalize(cameraPosition - worldPosition.xyz);
          
          gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
      `,
			fragmentShader: `
        in vec3 vPosition;
        in vec3 vNormal;
        in vec3 vViewDirection;
        in vec2 vUv;
        in float vDistortion;

        uniform float u_time;
        uniform vec2 u_mouse;
        uniform float u_audioReactivity;
			
				out vec4 fragColor;
        // 複雑なパターン生成
        float hexagon(vec2 p, float r) {
          const vec3 k = vec3(-0.866025404, 0.5, 0.577350269);
          p = abs(p);
          p -= 2.0 * min(dot(k.xy, p), 0.0) * k.xy;
          p -= vec2(clamp(p.x, -k.z * r, k.z * r), r);
          return length(p) * sign(p.y);
        }
        
        vec3 hsv2rgb(vec3 c) {
          vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
          vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
          return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
        }
        
        void main() {
          // 複雑なFresnel効果
          float fresnel = pow(1.0 - dot(vNormal, vViewDirection), 1.5);
          float innerFresnel = pow(dot(vNormal, vViewDirection), 2.0);
          
          // 虹色の分散
          vec3 refractedR = refract(-vViewDirection, vNormal, 0.65);
          vec3 refractedG = refract(-vViewDirection, vNormal, 0.67);
          vec3 refractedB = refract(-vViewDirection, vNormal, 0.69);
          
          // 基本色（HSV色空間で動的に変化）
          float hue = u_time * 0.05 + vDistortion * 0.3;
          vec3 baseColor = hsv2rgb(vec3(hue, 0.7, 0.8));
          
          // 内部構造の可視化
          float internalStructure = sin(vPosition.x * 10.0) * 
                                   sin(vPosition.y * 10.0) * 
                                   sin(vPosition.z * 10.0);
          internalStructure = smoothstep(0.0, 0.1, abs(internalStructure));
          
          // 六角形パターン
          vec2 hexUV = vPosition.xy * 3.0;
          float hex = 1.0 - smoothstep(0.0, 0.02, abs(hexagon(hexUV, 0.5)));
          
          // データストリーム効果
          float dataStream = step(0.98, fract(vPosition.y * 20.0 - u_time * 2.0));
          
          // 色の合成
          vec3 color = baseColor;
          
          // Fresnel rim light（虹色）
          vec3 rimColor = vec3(
            sin(u_time + vPosition.x * 5.0) * 0.5 + 0.5,
            sin(u_time + vPosition.y * 5.0 + 2.094) * 0.5 + 0.5,
            sin(u_time + vPosition.z * 5.0 + 4.189) * 0.5 + 0.5
          );
          color += fresnel * rimColor * 2.0;
          
          // 内部グロー
          vec3 innerGlow = vec3(0.0, 1.0, 1.0) * innerFresnel * 0.3;
          color += innerGlow;
          
          // 構造パターンの適用
          color *= (1.0 - internalStructure * 0.3);
          color += hex * vec3(0.0, 0.5, 1.0) * 0.5;
          
          // データストリーム
          color += dataStream * vec3(1.0, 1.0, 0.0);
          
          // マウスインタラクション（エネルギー波）
          vec2 mouseWorld = u_mouse * 4.0 - 2.0;
          float mouseDist = length(vPosition.xy - mouseWorld);
          float mouseWave = sin(mouseDist * 10.0 - u_time * 5.0) * exp(-mouseDist * 0.5);
          color += vec3(1.0, 0.3, 0.5) * mouseWave * 0.3;
          
          // オーディオ反応
          color *= 1.0 + u_audioReactivity * 0.5;
          
          // グリッチ効果
          float glitch = step(0.99, fract(sin(dot(vPosition.xy, vec2(12.9898, 78.233))) * 43758.5453 + u_time));
          color = mix(color, vec3(1.0) - color, glitch);
          
          // 透明度の計算（複雑な層構造）
          float alpha = 0.2 + fresnel * 0.4 + innerFresnel * 0.2;
          alpha += hex * 0.1;
          alpha = clamp(alpha, 0.0, 0.9);
          
          fragColor = vec4(color, alpha);
        }
      `,
			transparent: true,
			side: THREE.DoubleSide,
			depthWrite: false,
			blending: THREE.NormalBlending,
		});
	}

	protected initMesh(): void {
		this.mesh = new THREE.Mesh(this.geometry, this.material);

		// Add all child meshes to the main mesh
		this.innerStructures.forEach(innerMesh => {
			this.mesh.add(innerMesh);
		});

		if (this.particleSystem) {
			this.mesh.add(this.particleSystem);
		}

		if (this.energyField) {
			this.mesh.add(this.energyField);
		}

		this.fractureLines.forEach(line => {
			this.mesh.add(line);
		});
	}

	public animate(cameraPos?: THREE.Vector3): void {
		const time = this.material.uniforms.u_time.value;

		// メインマテリアルの更新
		this.material.uniforms.u_time.value += 0.01;
		this.material.uniforms.u_mouse.value.copy(mousePos);
		this.material.uniforms.u_audioReactivity.value =
			Math.sin(time * 0.5) * 0.5 + 0.5;

		// モーフィング制御
		this.morphTransition += 0.005;
		if (this.morphTransition > 1) {
			this.morphTransition = 0;
			this.currentMorphTarget =
				(this.currentMorphTarget + 1) % this.morphTargets.length;
		}
		this.material.uniforms.u_morphProgress.value = this.morphTransition;

		// 内部構造のアニメーション
		this.innerStructures.forEach((structure, index) => {
			if (structure.material instanceof THREE.ShaderMaterial) {
				structure.material.uniforms.u_time.value = time;
				structure.rotation.x += 0.01 * (index + 1);
				structure.rotation.y += 0.015 * (index + 1);
			}
		});

		// パーティクルシステムの更新
		if (
			this.particleSystem &&
			this.particleSystem.material instanceof THREE.ShaderMaterial
		) {
			this.particleSystem.material.uniforms.u_time.value = time;
			this.particleSystem.material.uniforms.u_mouse.value.copy(mousePos);
			this.particleSystem.rotation.y += 0.002;
		}

		// エネルギーフィールドの更新
		if (
			this.energyField &&
			this.energyField.material instanceof THREE.ShaderMaterial
		) {
			this.energyField.material.uniforms.u_time.value = time;
			this.energyField.material.uniforms.u_mouse.value.copy(mousePos);

			// マウス距離に基づく強度
			const mouseDistance = Math.sqrt(
				mousePos.x * mousePos.x + mousePos.y * mousePos.y
			);
			const intensity = Math.max(0, 1 - mouseDistance);
			this.energyField.material.uniforms.u_intensity.value = intensity;

			// パルス効果
			this.energyField.scale.setScalar(1 + Math.sin(time * 2) * 0.05);
		}

		// 亀裂ラインのアニメーション
		this.fractureLines.forEach((line, index) => {
			if (line.material instanceof THREE.LineBasicMaterial) {
				line.material.opacity = 0.1 + Math.sin(time * 3 + index) * 0.2;
			}
			line.rotation.z += 0.001 * (index + 1);
		});

		// カメラ距離に応じた詳細度の調整
		if (cameraPos) {
			const distance = cameraPos.distanceTo(this.mesh.position);
			const lodLevel = Math.min(1, distance / 10);

			// 遠い場合は内部構造を非表示
			this.innerStructures.forEach(structure => {
				structure.visible = lodLevel < 0.5;
			});
			this.particleSystem.visible = lodLevel < 0.7;
		}
	}
}
