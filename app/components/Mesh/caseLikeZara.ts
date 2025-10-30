import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { mousePos } from '../lib/MousePos';
import { Mesh } from './Mesh';

export class ZaraCase extends Mesh {
	protected controls!: OrbitControls;
	protected mouse = mousePos;

	// 量子状態管理
	private quantumState = {
		superposition: 0.5, // 重ね合わせの度合い
		collapsed: false, // 観測による収束状態
		entanglement: 0, // もつれの強度
		tunneling: 0, // トンネル確率
		coherence: 1.0, // コヒーレンス
		phase: 0, // 量子位相
	};

	// 量子粒子システム
	private quantumParticles!: THREE.Points;
	private waveFunction!: THREE.Mesh;

	protected initGeometry(): void {
		const geometry = new THREE.BoxGeometry(4, 2, 2);
		const faces = geometry.index!.array;
		const newFaces = [];

		// Front face removal (unchanged)
		for (let i = 0; i < faces.length; i += 3) {
			const triangleIndex = Math.floor(i / 3);
			if (triangleIndex !== 8 && triangleIndex !== 9) {
				newFaces.push(faces[i], faces[i + 1], faces[i + 2]);
			}
		}
		geometry.setIndex(newFaces);

		this.geometry = geometry;

		// 量子粒子システムの初期化
		this.initQuantumParticles();

		// 波動関数の可視化
		this.initWaveFunction();
	}

	private initQuantumParticles(): void {
		const particleCount = 1000;
		const positions = new Float32Array(particleCount * 3);
		const states = new Float32Array(particleCount); // 量子状態
		const phases = new Float32Array(particleCount); // 位相

		for (let i = 0; i < particleCount; i++) {
			// ボックス内にランダム配置
			positions[i * 3] = (Math.random() - 0.5) * 3.5;
			positions[i * 3 + 1] = (Math.random() - 0.5) * 1.5;
			positions[i * 3 + 2] = (Math.random() - 0.5) * 1.5;

			// 初期量子状態（0: 基底状態, 1: 励起状態）
			states[i] = Math.random();

			// 初期位相
			phases[i] = Math.random() * Math.PI * 2;
		}

		const particleGeometry = new THREE.BufferGeometry();
		particleGeometry.setAttribute(
			'position',
			new THREE.BufferAttribute(positions, 3)
		);
		particleGeometry.setAttribute(
			'quantumState',
			new THREE.BufferAttribute(states, 1)
		);
		particleGeometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));

		const particleMaterial = new THREE.ShaderMaterial({
			uniforms: {
				u_time: { value: 0 },
				u_superposition: { value: 0.5 },
				u_collapsed: { value: 0.0 },
				u_coherence: { value: 1.0 },
			},
			vertexShader: `
        attribute float quantumState;
        attribute float phase;
        uniform float u_time;
        uniform float u_superposition;
        uniform float u_collapsed;
        uniform float u_coherence;
        
        varying float vState;
        varying float vPhase;
        varying vec3 vColor;
        
        void main() {
          vState = quantumState;
          vPhase = phase + u_time;
          
          // 量子的な位置の不確定性
          vec3 pos = position;
          
          // 重ね合わせ状態での振動
          float uncertainty = sin(vPhase) * 0.1 * u_superposition * u_coherence;
          pos += vec3(
            sin(vPhase * 2.0) * uncertainty,
            cos(vPhase * 3.0) * uncertainty,
            sin(vPhase * 4.0) * uncertainty
          );
          
          // 観測による収束
          if (u_collapsed > 0.5) {
            // 波動関数の収束をシミュレート
            float collapseRadius = 0.5;
            vec3 collapseCenter = vec3(0.0);
            vec3 toCenter = collapseCenter - pos;
            float dist = length(toCenter);
            
            if (quantumState > 0.5) {
              // 励起状態は外側へ
              pos += normalize(pos) * u_collapsed * 0.5;
            } else {
              // 基底状態は中心へ
              pos = mix(pos, collapseCenter, u_collapsed * 0.3);
            }
          }
          
          // 量子トンネリング効果
          float tunnel = step(0.98, fract(sin(dot(pos.xy, vec2(12.9898, 78.233))) * 43758.5453));
          if (tunnel > 0.5) {
            pos = -pos; // 反対側へトンネル
          }
          
          // 色の計算（量子状態による）
          vColor = mix(
            vec3(0.0, 0.5, 1.0),  // 基底状態: 青
            vec3(1.0, 0.0, 0.5),  // 励起状態: マゼンタ
            quantumState
          );
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = (2.0 / -mvPosition.z) * (0.5 + quantumState * 0.5);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
			fragmentShader: `
        varying float vState;
        varying float vPhase;
        varying vec3 vColor;
        uniform float u_coherence;
        
        void main() {
          // 円形パーティクル
          vec2 center = gl_PointCoord - 0.5;
          float dist = length(center);
          if (dist > 0.5) discard;
          
          // 干渉パターン
          float interference = sin(vPhase * 10.0) * 0.5 + 0.5;
          
          vec3 color = vColor * interference;
          float alpha = (1.0 - dist * 2.0) * u_coherence;
          
          gl_FragColor = vec4(color, alpha);
        }
      `,
			transparent: true,
			blending: THREE.AdditiveBlending,
			depthWrite: false,
		});

		this.quantumParticles = new THREE.Points(particleGeometry, particleMaterial);
	}

	private initWaveFunction(): void {
		// 波動関数の3D可視化
		const waveGeometry = new THREE.BoxGeometry(4.5, 2.5, 2.5, 32, 16, 16);
		const waveMaterial = new THREE.ShaderMaterial({
			uniforms: {
				u_time: { value: 0 },
				u_superposition: { value: 0.5 },
				u_entanglement: { value: 0 },
				u_mouse: { value: new THREE.Vector2(0, 0) },
			},
			vertexShader: `
        uniform float u_time;
        uniform float u_superposition;
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying float vWave;
        
        // 3D波動関数
        float waveFunction(vec3 p, float t) {
          float psi1 = sin(p.x * 3.0 + t) * cos(p.y * 3.0 - t) * sin(p.z * 3.0);
          float psi2 = cos(p.x * 2.0 - t) * sin(p.y * 2.0 + t) * cos(p.z * 2.0);
          return mix(psi1, psi2, u_superposition);
        }
        
        void main() {
          vPosition = position;
          vNormal = normal;
          
          // 波動関数による変形
          float wave = waveFunction(position, u_time);
          vWave = wave;
          
          vec3 pos = position + normal * wave * 0.1;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
			fragmentShader: `
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying float vWave;
        uniform float u_time;
        uniform float u_entanglement;
        uniform vec2 u_mouse;
        
        void main() {
          // 波動関数の確率密度
          float probability = abs(vWave);
          
          // 量子もつれの可視化
          vec3 entangledColor = vec3(
            sin(vPosition.x * 10.0 + u_time),
            sin(vPosition.y * 10.0 + u_time * 1.1),
            sin(vPosition.z * 10.0 + u_time * 0.9)
          ) * u_entanglement;
          
          vec3 color = vec3(probability * 0.5, probability * 0.8, probability);
          color += entangledColor * 0.3;
          
          float alpha = 0.1 + probability * 0.2;
          gl_FragColor = vec4(color, alpha);
        }
      `,
			transparent: true,
			side: THREE.DoubleSide,
			depthWrite: false,
		});

		this.waveFunction = new THREE.Mesh(waveGeometry, waveMaterial);
	}

	protected initMaterial(): void {
		this.material = new THREE.ShaderMaterial({
			uniforms: {
				u_time: { value: 0.0 },
				u_mouse: { value: new THREE.Vector2(0, 0) },
				u_superposition: { value: 0.5 },
				u_collapsed: { value: 0.0 },
				u_entanglement: { value: 0.0 },
				u_tunneling: { value: 0.0 },
				u_coherence: { value: 1.0 },
				u_phase: { value: 0.0 },
			},
			vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec3 vViewDirection;
        uniform float u_time;
        uniform float u_superposition;
        uniform float u_phase;
        
        void main() {
          vUv = uv;
          
          // 量子的な振動
          vec3 quantumPos = position;
          float quantumOscillation = sin(u_phase + position.x * 5.0) * 
                                    cos(u_phase + position.y * 5.0) * 
                                    sin(u_phase + position.z * 5.0);
          quantumPos += normal * quantumOscillation * 0.02 * u_superposition;
          
          vec4 worldPosition = modelMatrix * vec4(quantumPos, 1.0);
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
        uniform float u_superposition;
        uniform float u_collapsed;
        uniform float u_entanglement;
        uniform float u_tunneling;
        uniform float u_coherence;
        uniform float u_phase;
        
        // 量子的な干渉パターン
        float quantumInterference(vec3 p) {
          float wave1 = sin(p.x * 10.0 + u_phase) * cos(p.y * 10.0);
          float wave2 = cos(p.x * 8.0 - u_phase) * sin(p.y * 8.0);
          return (wave1 + wave2) * 0.5 * u_coherence;
        }
        
        // 確率雲の密度
        float probabilityCloud(vec3 p) {
          float r = length(p);
          float theta = atan(p.y, p.x);
          float phi = acos(p.z / r);
          
          // 球面調和関数（簡略版）
          float Y00 = 0.282095; // s軌道
          float Y10 = 0.488603 * cos(theta); // p軌道
          float Y20 = 0.315392 * (3.0 * cos(theta) * cos(theta) - 1.0); // d軌道
          
          return mix(Y00, mix(Y10, Y20, u_superposition), u_collapsed);
        }
        
        void main() {
          float depth = gl_FragCoord.z;
          
          // 量子的Fresnel効果
          float fresnel = pow(1.0 - dot(vNormal, vViewDirection), 2.0);
          fresnel *= u_coherence;
          
          // 基底色（量子状態による）
          vec3 groundState = vec3(0.1, 0.3, 0.5);
          vec3 excitedState = vec3(0.8, 0.2, 0.5);
          vec3 baseColor = mix(groundState, excitedState, u_superposition);
          
          // 干渉パターン
          float interference = quantumInterference(vPosition);
          vec3 interferenceColor = vec3(
            0.5 + interference * 0.5,
            0.5 + interference * 0.3,
            0.5 - interference * 0.5
          );
          
          // 量子もつれの効果（非局所的相関）
          vec2 entangledPos = vPosition.xy - u_mouse * 2.0;
          float entanglementEffect = exp(-length(entangledPos) * 0.5) * u_entanglement;
          vec3 entanglementColor = vec3(1.0, 0.0, 1.0) * entanglementEffect;
          
          // トンネル効果の可視化
          float tunnelProbability = exp(-abs(vPosition.z) * 2.0) * u_tunneling;
          vec3 tunnelColor = vec3(0.0, 1.0, 0.0) * tunnelProbability;
          
          // 確率密度の可視化
          float probability = probabilityCloud(vPosition);
          
          // 最終色の合成
          vec3 color = baseColor;
          color = mix(color, interferenceColor, 0.3);
          color += entanglementColor * 0.3;
          color += tunnelColor * 0.2;
          color *= (0.7 + probability * 0.3);
          color += fresnel * vec3(0.5, 0.8, 1.0) * 0.5;
          
          // デコヒーレンスの効果（ノイズ）
          float decoherence = 1.0 - u_coherence;
          float noise = fract(sin(dot(vPosition.xy, vec2(12.9898, 78.233))) * 43758.5453);
          color = mix(color, vec3(noise), decoherence * 0.2);
          
          // 観測による変化
          if (u_collapsed > 0.5) {
            color = mix(color, vec3(1.0), 0.3);
          }
          
          float alpha = 0.8 + fresnel * 0.2;
          gl_FragColor = vec4(color, alpha);
        }
      `,
			side: THREE.DoubleSide,
			transparent: true,
		});
	}

	protected initMesh(): void {
		this.mesh = new THREE.Mesh(this.geometry, this.material);

		// 量子要素を追加
		if (this.quantumParticles) {
			this.mesh.add(this.quantumParticles);
		}
		if (this.waveFunction) {
			this.mesh.add(this.waveFunction);
		}
	}

	public animate(): void {
		const time = this.material.uniforms.u_time.value;
		this.material.uniforms.u_time.value += 0.01;
		this.material.uniforms.u_mouse.value.set(mousePos?.x || 0, mousePos?.y || 0);

		// 量子状態の更新
		this.updateQuantumState();

		// 量子位相の進行
		this.quantumState.phase += 0.05;
		this.material.uniforms.u_phase.value = this.quantumState.phase;

		// 各量子パラメータの更新
		this.material.uniforms.u_superposition.value =
			this.quantumState.superposition;
		this.material.uniforms.u_collapsed.value = this.quantumState.collapsed
			? 1.0
			: 0.0;
		this.material.uniforms.u_entanglement.value = this.quantumState.entanglement;
		this.material.uniforms.u_tunneling.value = this.quantumState.tunneling;
		this.material.uniforms.u_coherence.value = this.quantumState.coherence;

		// 量子パーティクルの更新
		if (
			this.quantumParticles &&
			this.quantumParticles.material instanceof THREE.ShaderMaterial
		) {
			this.quantumParticles.material.uniforms.u_time.value = time;
			this.quantumParticles.material.uniforms.u_superposition.value =
				this.quantumState.superposition;
			this.quantumParticles.material.uniforms.u_collapsed.value = this.quantumState
				.collapsed
				? 1.0
				: 0.0;
			this.quantumParticles.material.uniforms.u_coherence.value =
				this.quantumState.coherence;
		}

		// 波動関数の更新
		if (
			this.waveFunction &&
			this.waveFunction.material instanceof THREE.ShaderMaterial
		) {
			this.waveFunction.material.uniforms.u_time.value = time;
			this.waveFunction.material.uniforms.u_superposition.value =
				this.quantumState.superposition;
			this.waveFunction.material.uniforms.u_entanglement.value =
				this.quantumState.entanglement;
			this.waveFunction.material.uniforms.u_mouse.value.set(
				mousePos?.x || 0,
				mousePos?.y || 0
			);
		}
	}

	private updateQuantumState(): void {
		// マウス距離による観測効果
		const mouseDistance = Math.sqrt(
			(mousePos?.x || 0) ** 2 + (mousePos?.y || 0) ** 2
		);
		const observationStrength = Math.max(0, 1 - mouseDistance);

		// 観測による波動関数の収束
		if (observationStrength > 0.8 && !this.quantumState.collapsed) {
			this.quantumState.collapsed = true;
			this.quantumState.superposition = Math.random() > 0.5 ? 1 : 0;
		} else if (observationStrength < 0.2 && this.quantumState.collapsed) {
			// 観測が弱まると重ね合わせ状態に戻る
			this.quantumState.collapsed = false;
			this.quantumState.superposition = 0.5;
		}

		// 重ね合わせの振動
		if (!this.quantumState.collapsed) {
			this.quantumState.superposition =
				0.5 + Math.sin(this.quantumState.phase * 0.5) * 0.3;
		}

		// 量子もつれの強度（マウス位置依存）
		this.quantumState.entanglement = observationStrength * 0.7;

		// トンネル確率の変動
		this.quantumState.tunneling =
			(Math.sin(this.quantumState.phase * 0.3) * 0.5 + 0.5) * 0.3;

		// デコヒーレンス（時間経過で減少）
		this.quantumState.coherence = Math.max(
			0.3,
			this.quantumState.coherence - 0.001
		);

		// 時々コヒーレンスを回復
		if (Math.random() < 0.01) {
			this.quantumState.coherence = 1.0;
		}
	}

	public getMesh() {
		return this.mesh;
	}

	// 量子測定メソッド
	public measure(): number {
		// 波動関数を収束させて測定値を返す
		this.quantumState.collapsed = true;
		const measurement = Math.random() > this.quantumState.superposition ? 1 : 0;
		this.quantumState.superposition = measurement;
		return measurement;
	}

	// 量子もつれを生成
	public entangleWith(other: ZaraCase): void {
		this.quantumState.entanglement = 1.0;
		other.quantumState.entanglement = 1.0;
		// 実際のもつれロジックはここに実装
	}
}
