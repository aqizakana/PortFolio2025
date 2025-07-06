import * as THREE from 'three';
import { Mesh } from './Mesh';

export class Noise extends Mesh {
	protected initGeometry(): void {
		this.geometry = new THREE.PlaneGeometry(
			window.innerWidth,
			window.innerHeight,
			32
		);
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
          float u = 0.92387953 * (ind < 4u ? p.x : p.y);  //0.92387953 = cos(pi/8)
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

        float sdf(vec2 p, vec2 cent, float rad) {
          return length(p - cent) - rad;
        }

        void main() {
          vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
          float b = abs(mod(u_time,2.0) - 1.0);
          float g = 7.0 * sin(u_time * 0.01) *cos(u_time * 0.01);
          float a = atan(0.0) / PI + 0.5;
          fragColor = vec4(vec3(warp21(p * 100.0, g)), 1.0);
        }
      `,
			transparent: true,
			depthWrite: false,
		});
	}

	public animate(): void {
		this.material.uniforms.u_time.value += 0.1;
	}
}
