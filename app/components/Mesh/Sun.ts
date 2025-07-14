import * as THREE from 'three';
import { Mesh } from './Mesh';

export class Sun extends Mesh {
	protected initGeometry(): void {
		this.geometry = new THREE.SphereGeometry(1, 32, 32);
	}

	protected initMaterial(): void {
		this.material = new THREE.ShaderMaterial({
			glslVersion: THREE.GLSL3,
			uniforms: {
				u_resolution: {
					value: new THREE.Vector2(window.innerWidth, window.innerHeight),
				},
				u_time: { value: 0.0 },
			},
			vertexShader: `
					out vec3 vNormal;
					out vec3 vViewPosition;
					out vec2 vUv;
					out vec3 vWorldNormal;
					out vec3 vWorldPosition;
					
					uniform float u_time;
					
					void main() {
						vUv = uv;
						vNormal = normalize(normalMatrix * normal);
						vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
						
						// 頂点の変位（波のアニメーション）
						vec3 pos = position;
						
						vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
						vViewPosition = -mvPosition.xyz;
						vWorldPosition = (modelMatrix * vec4(pos, 1.0)).xyz;
						
						gl_Position = projectionMatrix * mvPosition;
					}
				`,
			fragmentShader: `
				in vec3 vNormal;
				in vec3 vViewPosition;
				in vec2 vUv;
				in vec3 vWorldNormal;
				in vec3 vWorldPosition;
				
				uniform float u_time;
				
				out vec4 fragColor;
				// フレネル効果の計算
				float fresnel(vec3 normal, vec3 viewDir, float ior) {
					float f0 = pow((1.0 - ior) / (1.0 + ior), 2.0);
					return f0 + (1.0 - f0) * pow(1.0 - dot(normal, viewDir), 5.0);
				}
				
				void main() {
					vec3 viewDir = normalize(vViewPosition);
					vec3 normal = normalize(vNormal);
					vec3 worldNormal = normalize(vWorldNormal);
					
					float dotProduct = abs(dot(normal, -viewDir));
					float roughness = 1.0 - smoothstep(0.01, 0.1, dotProduct);
					
					float emissiveFactor = smoothstep(0.48, 0.49, max(vUv.x, vUv.y));
					vec3 emissiveColor = vec3(0.667, 0.8, 1.0) * 2.0 * emissiveFactor;
					
					// ガラスのような透明効果の実装
					float ior = 1.345;
					vec3 worldViewDir = normalize(cameraPosition - vWorldPosition);
					float fresnelFactor = fresnel(worldNormal, worldViewDir, ior);
					
					// 波のアニメーションの色への影響
					float waveColor = sin(vWorldPosition.y * 10.0 + u_time * 0.01) * 10.0;
					vec3 baseColor = vec3(0.5, 0.0, 0.0);

					float displacement = sin(worldNormal.y * 10.0 + u_time * 0.1) * 10.0;
					
					// 最終的な色の計算
					vec3 transmissionColor = vec3(0.9, 0.95, 1.0); // ガラスの透過色
					vec3 finalColor = mix(transmissionColor, baseColor, fresnelFactor * 0.7);
					finalColor += displacement;
					
					
					// 透明度の設定
					float alpha = fresnelFactor * 0.5 + emissiveFactor * 0.5;
					
					fragColor = vec4(finalColor, alpha);
				}
			`,
			side: THREE.DoubleSide,
			transparent: true,
			blending: THREE.NormalBlending,
			depthWrite: false,
		});
	}

	public animate(): void {
		this.material.uniforms.u_time.value += 1.0;
	}
}
