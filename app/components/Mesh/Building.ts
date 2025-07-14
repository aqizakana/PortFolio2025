import * as THREE from 'three';
import { Mesh } from './Mesh';

export class Building extends Mesh {
	private velocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
	private acceleration: THREE.Vector3 = new THREE.Vector3(0, -0.001, 0); // gravity
	private groundLevel: number = -10;
	private airDensity: number = 1.225; // kg/m³ at sea level
	private dragCoefficient: number = 0.047; // sphere drag coefficient
	private crossSectionalArea: number = 0.25; // m² (0.5m width × 0.5m depth)
	private mass: number = 0.001; // kg
	private startHeight: number = 10.0;

	protected initGeometry(): void {
		this.geometry = new THREE.BoxGeometry(0.5, 3, 0.5);
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
				uniform float u_time;
        out vec2 vUv;
        out vec3 vPosition;

        void main() {
          vUv = uv;
					vec3 newPos = position;
          vPosition = newPos;
					//newPos.y -= sin(u_time * 0.01) * 10.0;

          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
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
					// if(channel == 1){
					f = f * f * (3.0 - 2.0 * f);
					// }
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

				//モーフィング
				float sphereSDF(vec3 p, vec3 cent, float rad) {
						return length(p - cent) - rad;
				}

				float smin(float a, float b, float k) {
						float h = clamp(0.5 + 0.5 * (b - a) / k, 0.4, 1.0);
						return mix(b, a, h) - k * h * (1.0 - h); 
				}

				float sceneSDF(vec3 p) {
						float smallS[3];
						float bigS[3];
						for (int i = 0; i < 3; i++) {
								smallS[i] = sphereSDF(p, vec3(float(i - 1), 0.5, 0.5), 0.1);
								bigS[i] = sphereSDF(p, vec3(float(i - 1), 0.0, 0.0), 0.4);
						}
						float cap = smin(smallS[0], bigS[0], 0.1);
						float cup = smin(smallS[1], bigS[1], 0.3);
						float minus = smin(smallS[2], bigS[2], 0.5);
						return min(min(cap, cup), minus);
				}

				vec3 gradSDF(vec3 p) {
						float d = 0.0001;
						return normalize(vec3(
								sceneSDF(pnoise21(p.xy) + vec3(d, 0.0, 0.0)) - sceneSDF(pnoise21(p.xy) - vec3(d, 0.0, 0.0)),
								sceneSDF(pnoise21(p.xy) + vec3(0.0, d, 0.0)) - sceneSDF(pnoise21(p.xy) - vec3(0.0, d, 0.0)),
								sceneSDF(pnoise21(p.xy) + vec3(0.0, 0.0, d)) - sceneSDF(pnoise21(p.xy) - vec3(0.0, 0.0, d))
						));
				}
        void main() {
					fragColor = vec4(gradSDF(vPosition), 1.0);
        }
      `,
			transparent: true,
			depthWrite: false,
		});
	}

	public animate(): void {
		this.material.uniforms.u_time.value += 1.0;
		this.applyGravity();
	}

	private applyGravity(): void {
		// Calculate air resistance force
		const airResistance = this.calculateAirResistance();

		// Apply air resistance as acceleration (F = ma, so a = F/m)
		const resistanceAcceleration = airResistance.clone().divideScalar(this.mass);

		// Apply gravity and air resistance
		this.velocity.add(this.acceleration);
		this.velocity.add(resistanceAcceleration);

		// Update position
		this.mesh.position.add(this.velocity);

		// Ground collision detection
		if (this.mesh.position.y <= this.groundLevel) {
			this.mesh.position.y = Math.random() * 5 + this.startHeight;
			this.mesh.position.x = (Math.random() - 0.5) * 20;

			this.velocity.y = 0;

			//this.velocity.y = -this.velocity.y * this.bounceDecrease;

			// Stop bouncing when velocity is very small
			if (Math.abs(this.velocity.y) < 0.01) {
				this.velocity.y = 0;
			}
		}
	}

	private calculateAirResistance(): THREE.Vector3 {
		// Air resistance formula: F = 0.5 * ρ * Cd * A * v²
		const velocityMagnitude = this.velocity.length();

		if (velocityMagnitude === 0) {
			return new THREE.Vector3(0, 0, 0);
		}

		// Calculate drag force magnitude
		const dragForceMagnitude =
			0.5 *
			this.airDensity *
			this.dragCoefficient *
			this.crossSectionalArea *
			velocityMagnitude *
			velocityMagnitude;

		// Direction opposite to velocity
		const dragDirection = this.velocity.clone().normalize().multiplyScalar(-1);

		// Apply drag force in opposite direction of velocity
		return dragDirection.multiplyScalar(dragForceMagnitude);
	}

	public randomPos(): THREE.Vector3 {
		const pos = new THREE.Vector3(
			(Math.random() - 0.5) * 20,
			Math.random() * 5 + this.startHeight,
			0
		);
		return pos;
	}
	public randomRot(): THREE.Vector3 {
		const rad = new THREE.Vector3(
			(Math.random() - 0.5) * 10,
			(Math.random() - 0.5) * 10,
			0
		);
		return rad;
	}
}
