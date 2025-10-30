// ガラスマテリアルクラス
import * as THREE from 'three';

export class GlassMaterial extends THREE.ShaderMaterial {
	constructor(
		options: {
			envMap?: THREE.Texture;
			refractionRatio?: number;
			reflectivity?: number;
			glassColor?: THREE.Color | number | string;
			opacity?: number;
			fresnelPower?: number;
		} = {}
	) {
		const vertexShader = `
      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;
      varying vec3 vViewDirection;

      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        vWorldNormal = normalize(normalMatrix * normal);
        vViewDirection = normalize(cameraPosition - worldPosition.xyz);
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

		const fragmentShader = `
      uniform samplerCube envMap;
      uniform float refractionRatio;
      uniform float reflectivity;
      uniform vec3 glassColor;
      uniform float opacity;
      uniform float fresnelPower;
      uniform float time;

      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;
      varying vec3 vViewDirection;

      // より正確なフレネル計算
      float fresnel(vec3 viewDirection, vec3 normal, float n1, float n2) {
        float cosI = dot(viewDirection, normal);
        float n = n1 / n2;
        float sinT2 = n * n * (1.0 - cosI * cosI);
        
        if (sinT2 > 1.0) return 0.7; // 全反射
        
        float cosT = sqrt(1.0 - sinT2);
        float rs = (n1 * cosI - n2 * cosT) / (n1 * cosI + n2 * cosT);
        float rp = (n1 * cosT - n2 * cosI) / (n1 * cosT + n2 * cosI);
        
        return 0.5 * (rs * rs + rp * rp);
      }

      // 色分散効果
      vec3 dispersion(vec3 refractDir, vec3 normal, float eta) {
        vec3 refractR = refract(-vViewDirection, normal, eta - 0.01);
        vec3 refractG = refract(-vViewDirection, normal, eta);
        vec3 refractB = refract(-vViewDirection, normal, eta + 0.01);
        
        float r = textureCube(envMap, refractR).r;
        float g = textureCube(envMap, refractG).g;
        float b = textureCube(envMap, refractB).b;
        
        return vec3(r, g, b);
      }

      // ノイズ関数（コースティクス用）
      float noise(vec3 p) {
        return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
      }

      void main() {
        vec3 normal = normalize(vWorldNormal);
        
        // より高品質なフレネル効果
        float fresnelEffect = fresnel(vViewDirection, normal, 1.0, 1.52);
        
        // 反射
        vec3 reflectVec = reflect(-vViewDirection, normal);
        vec4 reflectColor = textureCube(envMap, reflectVec);
        
        // 色分散屈折
        vec3 dispersionColor = dispersion(vViewDirection, normal, refractionRatio);
        
        // コースティクス効果
        float caustics = noise(vWorldPosition * 8.0 + time * 0.5);
        caustics = pow(caustics, 4.0) * 0.3;
        
        // エッジの輝き
        float rimLight = 1.0 - dot(normal, vViewDirection);
        rimLight = pow(rimLight, 2.0) * 0.5;
        
        // 内部散乱シミュレーション
        float thickness = 1.0 - abs(dot(normal, vViewDirection));
        vec3 subsurface = glassColor * thickness * 0.2;
        
        // 最終色の合成
        vec3 finalColor = mix(dispersionColor, reflectColor.rgb, fresnelEffect * reflectivity);
        finalColor += caustics;
        finalColor += rimLight * vec3(1.0, 1.0, 1.2);
        finalColor += subsurface;
        
        // ガラスの色調を適用（より自然に）
        finalColor = mix(finalColor, glassColor, 0.5);
        
        gl_FragColor = vec4(finalColor, opacity);
      }
    `;

		super({
			vertexShader,
			fragmentShader,
			uniforms: {
				envMap: { value: options.envMap || null },
				refractionRatio: { value: options.refractionRatio || 0.98 },
				reflectivity: { value: options.reflectivity || 0.9 },
				glassColor: { value: new THREE.Color(options.glassColor || 0xffffff) },
				opacity: { value: options.opacity || 0.8 },
				fresnelPower: { value: options.fresnelPower || 3.0 },
				time: { value: 0.0 },
			},
			transparent: true,
			side: THREE.DoubleSide,
		});
	}
}
