import * as THREE from 'three';
import { Mesh } from './Mesh';

export class Noise extends Mesh {
	protected initGeometry(): void {
		this.geometry = new THREE.PlaneGeometry(window.innerWidth, 200, 32);
	}

	protected initMaterial(): void {
		this.material = new THREE.ShaderMaterial({
			glslVersion: THREE.GLSL3,
			uniforms: {
				u_resolution: {
					value: new THREE.Vector2(window.innerWidth, window.innerHeight),
				},
				u_time: { value: 0.0 },
				u_gradientCenter: { value: new THREE.Vector2(0.0, 0.0) }, // グラデーションの中心
				u_gradientRadius: { value: 1.0 }, // グラデーションの半径
				u_gradientSoftness: { value: 2.0 }, // グラデーションの柔らかさ
			},
			vertexShader: `
        out vec2 vUv;
        out vec3 vPosition;

        void main() {
          vUv = uv;
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
			fragmentShader: `
        precision highp float;
        precision highp int;

        uvec3 k = uvec3(0x456789abu, 0x6789ab45u, 0x89ab4567u);
        uvec3 u = uvec3(1, 2, 3); 
        const uint UINT_MAX = 0xffffffffu;

        uniform vec2 u_resolution;
        uniform float u_time;
        uniform vec2 u_gradientCenter;
        uniform float u_gradientRadius;
        uniform float u_gradientSoftness;
        
        int channel = 1;
        in vec2 vUv;
        in vec3 vPosition;
        out vec4 fragColor;

        #define PI 3.141592653589793

        uvec2 uhash22(uvec2 n) {
          n ^= (n.yx << u.xy);
          n ^= (n.yx >> u.xy);
          n *= k.xy;
          n ^= (n.yx << u.xy);
          return n * k.xy;
        }

        float hash21(vec2 p) {
          uvec2 n = floatBitsToUint(p);
          return float(uhash22(n).x) / float(UINT_MAX);
        }

        float vnoise21(vec2 p){
          vec2 n = floor(p);
          float[4] v;
          for(int j=0; j < 2; j++){
              for(int i=0; i<2; i++){
                  v[i + 2 * j] = hash21(n + vec2(i,j));
              }
          }
          vec2 f = fract(p);
          if(channel == 1){
              f = f * f * (3.0 - 2.0 * f);
          }
          return mix(mix(v[0], v[1], f[0]), mix(v[2], v[3], f[0]), f[1]);
        }
        
        float gtable2(vec2 lattice, vec2 p){
          uvec2 n = floatBitsToUint(lattice);
          uint ind = uhash22(n).x >> 29;
          float u = 0.92387953 * (ind < 4u ? p.x : p.y);
          float v = 0.38268343 * (ind < 4u ? p.y : p.x);
          return ((ind & 1u) == 0u ? u : -u) + ((ind & 2u) == 0u? v : -v);
        }

        float pnoise21(vec2 p){
          vec2 n = floor(p);
          vec2 f = fract(p);
          float[4] v;
          for (int j = 0; j < 2; j ++){
              for (int i = 0; i < 2; i++){
                  v[i+2*j] = gtable2(n + vec2(i, j), f - vec2(i, j));
              }
          }
          f = f * f * f * (10.0 - 15.0 * f + 6.0 * f * f);
          return 0.5 * mix(mix(v[0], v[1], f[0]), mix(v[2], v[3], f[0]), f[1]) + 0.5;
        }

        float base21 (vec2 p){
          return channel == 0 ? vnoise21(p) - 0.5 : pnoise21(p) - 0.5;
        }

        float fbm21(vec2 p, float g){
          float val = 0.0;
          float amp = 1.0;
          float freq = 1.0;
          for(int i = 0; i < 4; i++){
            val += amp * base21(freq * p);
            amp *=g;
            freq  *= 2.01;
          }
          return 0.5 * val + 0.5;
        }

        float secondBase21 (vec2 p){
          return channel == 0 ? fbm21(p,0.5): pnoise21(p);
        }

        float warp21(vec2 p, float g){
          float val = 0.0;
          for (int i = 0; i < 4; i++){
            val = secondBase21( p + g * vec2(cos(2.0 * PI * val),sin(2.0 * PI * val)));
          }
          return val;
        }

        // 円形グラデーション
        float circularGradient(vec2 p, vec2 center, float radius, float softness) {
          float dist = length(p - center);
          return 1.0 - smoothstep(radius - softness, radius + softness, dist);
        }

        // 楕円形グラデーション
        float ellipticalGradient(vec2 p, vec2 center, vec2 radii, float softness) {
          vec2 d = (p - center) / radii;
          float dist = length(d);
          return 1.0 - smoothstep(1.0 - softness, 1.0 + softness, dist);
        }

        // 矩形グラデーション
        float rectangularGradient(vec2 p, vec2 center, vec2 size, float softness) {
          vec2 d = abs(p - center) - size;
          float dist = length(max(d, vec2(0.0))) + min(max(d.x, d.y), 0.0);
          return 1.0 - smoothstep(0.0, softness, dist);
        }

        void main() {
          vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
          float b = abs(mod(u_time,2.0) - 1.0);
          float g = 7.0 * sin(u_time * 0.01) * cos(u_time * 0.01);
          
          // ノイズの計算
          float noise = warp21(p * 10.0, g);
          float noiseValue = fbm21(p * 20.0 + vec2(u_time * 0.01, u_time * 0.01), 0.8);
          // グラデーションの計算（3つのタイプから選択可能）
          // 1. 円形グラデーション
          //float gradient = circularGradient(p, u_gradientCenter, u_gradientRadius, u_gradientSoftness);
          
          // 2. 楕円形グラデーション（コメントアウト）
          float gradient = ellipticalGradient(vec2(p.x, p.y - 0.5), u_gradientCenter, vec2(u_gradientRadius, u_gradientRadius * 0.7), u_gradientSoftness);
          
          // 3. 矩形グラデーション（コメントアウト）
          // float gradient = rectangularGradient(p, u_gradientCenter, vec2(u_gradientRadius), u_gradientSoftness * 0.5);

          // ノイズとグラデーションの合成
          // 方法1: 乗算
          //vec3 color = vec3(noise * gradient);
          
          // 方法2: 加算（コメントアウト）
          // vec3 color = vec3(noise + gradient * 0.5);
          
          // 方法3: グラデーションで色を変える（コメントアウト）
          vec3 color = mix(vec3(0.0, 0.1, noiseValue * 0.4), vec3(noiseValue * 0.9, noiseValue * 0.4, 0.0), vUv.y);
          
          fragColor = vec4(color, 1.0);
        }
      `,
			transparent: true,
			depthWrite: false,
		});
	}

	public animate(): void {
		this.material.uniforms.u_time.value += 0.1;

		// グラデーションの中心を動かす例（オプション）
		// const time = this.material.uniforms.u_time.value;
		// this.material.uniforms.u_gradientCenter.value.set(
		//   Math.sin(time * 0.01) * 0.5,
		//   Math.cos(time * 0.01) * 0.5
		// );
	}

	// グラデーションのパラメータを動的に変更するメソッド
	public setGradientCenter(x: number, y: number): void {
		this.material.uniforms.u_gradientCenter.value.set(x, y);
	}

	public setGradientRadius(radius: number): void {
		this.material.uniforms.u_gradientRadius.value = radius;
	}

	public setGradientSoftness(softness: number): void {
		this.material.uniforms.u_gradientSoftness.value = softness;
	}
}
