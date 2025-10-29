import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { mousePos } from '../lib/MousePos';
import { Img } from './Img';
import { Mesh } from './Mesh';
import { Text } from './Text';
export class newCase extends Mesh {
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

	//多次元レイヤーシステム
	// private hologram!: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;

	protected initGeometry(): void {
		const geometry = new THREE.BoxGeometry(4, 2, 2);
		const faces = geometry.index.array;
		const newFaces = [];

		for (let i = 0; i < faces.length; i += 3) {
			const triangleIndex = Math.floor(i / 3);
			if (triangleIndex !== 8 && triangleIndex !== 9) {
				newFaces.push(faces[i], faces[i + 1], faces[i + 2]);
			}
		}

		geometry.setIndex(newFaces);
		// this.createHologram();
		this.geometry = geometry;
	}

	protected initMaterial(): void {
		const material = new THREE.ShaderMaterial({
			uniforms: {
				u_time: { value: 0.0 },
				u_mouse: { value: new THREE.Vector2() },
			},
			vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec3 vViewDirection;
        void main() {
          vUv = uv;
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vPosition = worldPosition.xyz;
          vNormal = normalize(normalMatrix * normal);
          vViewDirection = normalize(cameraPosition - worldPosition.xyz);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
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
          vec3 color = vec3(1.0);

          float depth = gl_FragCoord.z;
          color = mix(color, vec3(vNormal * 0.5), depth * 0.1);

          vec3 grid = abs(fract(vPosition * 10.0 - vec3(u_time * 0.1)) - 0.5) / fwidth(vViewDirection * 10.0);
          float line = min(grid.x, grid.y);

          vec3 viewDir = normalize(vViewDirection);
          float fresnel = pow(1.0 - dot(viewDir, vNormal), 3.0);
          color = mix(color, grid, fresnel);

          gl_FragColor = vec4(color, 1.0);
        }
      `,
			side: THREE.DoubleSide,
			transparent: true,
		});
		this.material = material;
	}
	public animate() {
		this.material.uniforms.u_time.value += 0.05;
		this.material.uniforms.u_mouse.value.lerp(this.mouse, 0.1);
		//this.hologram.material.uniforms.u_time.value += 0.05;
		//this.hologram.material.uniforms.u_mouse.value.lerp(this.mouse, 0.1);
	}
	// private createHologram() {
	// 	const plane = new THREE.SphereGeometry(1, 32, 32);
	// 	const hologramMaterial = new THREE.ShaderMaterial({
	// 		glslVersion: THREE.GLSL3,
	// 		uniforms: {
	// 			u_time: { value: 0.0 },
	// 			u_mouse: { value: new THREE.Vector2() },
	// 		},
	// 		vertexShader: `
	//     out vec2 vUv;
	//     out vec3 vPosition;
	//     uniform float u_time;
	//     uniform vec2 u_mouse;
	//     out vec3 vNormal;
	//     out vec3 vViewDirection;

	//      float hexDist(vec3 p) {
	//         p = abs(p);
	//         float c = dot(p, normalize(vec3(1, 1.73, 1)));
	//         c = max(c, p.x);
	//         return c;
	//       }

	//       vec3 hexGrid(vec3 p, float size) {
	//         vec3 r = vec3(1, 1.73, 1);
	//         vec3 h = r * 0.5;
	//         vec3 a = mod(p, r) - h;
	//         vec3 b = mod(p - h, r) - h;
	//         return dot(a, a) < dot(b, b) ? a : b;
	//       }

	//     void main() {
	//       vUv = uv;
	//       vPosition = position;
	//       vec3 pos = position;
	//       vNormal = normal;

	//       // パルス効果
	//         float pulse = sin(u_time * 3.0) * 0.5;
	//         pos.z *= 1.0 + pulse;
	//         vec2 grid1 = fract(vUv * 100.0 + vec2(u_time * 0.1, u_time * 0.1));

	//         float breath = sin(u_time * 2.0 + float(gl_VertexID) * 0.1) * 0.1;
	//         pos.xz += grid1 * breath;
	//         vec3 hex = hexGrid(vNormal * 3.0, sin(u_time * 0.1));
	//         float grid = smoothstep(0.1, 0.11, hexDist(hex)) * 0.5 + 0.5;
	//         pos.y += grid * 0.1;

	//         vec2 center = vec2(0.5) - uv;
	//         float dist = length(center);
	//         float ripple = sin(dist * 20.0 - u_time * 3.0) * 0.02;
	//         pos.x += ripple * (1.0 - dist);

	//       // マウスインタラクション
	//         float mouseEffect = 0.2 / (length(vPosition.xy - (u_mouse * vec2(3.0, 1.5))) + 0.1);
	//         mouseEffect = smoothstep(0.0, 1.0, mouseEffect);
	//         pos += normal * mouseEffect;

	//         gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
	//       }
	//     `,
	// 		fragmentShader: `
	//       in vec2 vUv;
	//       in vec3 vPosition;
	//       in vec3 vNormal;
	//       in vec3 vViewDirection;

	//       out vec4 fragColor;
	//       uniform float u_time;
	//       uniform vec2 u_mouse;

	//       float hexDist(vec3 p) {
	//         p = abs(p);
	//         float c = dot(p, normalize(vec3(1, 1.73, 1)));
	//         c = max(c, p.x);
	//         return c;
	//       }

	//       vec3 hexGrid(vec3 p, float size) {
	//         vec3 r = vec3(1, 1.73, 1);
	//         vec3 h = r * 0.5;
	//         vec3 a = mod(p, r) - h;
	//         vec3 b = mod(p - h, r) - h;
	//         return dot(a, a) < dot(b, b) ? a : b;
	//       }
	//       void main() {
	//         vec3 color = vec3(vPosition * 0.5 + 0.5);
	//         float fresnel = pow(1.0 - abs(dot(vNormal, normalize(vPosition))), 3.0);

	//         float depth = gl_FragCoord.z;
	//         vec3 hex = hexGrid(vNormal * 3.0, sin(u_time * 0.1));
	//         float grid = smoothstep(0.1, 0.11, hexDist(hex)) * 0.5 + 0.5;

	//         float wave = sin(vPosition.x * 2.0 + u_time) *
	//           sin(vPosition.y * 2.0 + u_time) *
	//           sin(vPosition.z * 2.0 + u_time);
	//         float scan = cos(vUv.y * 10.0 - u_time * 5.0) * wave + 0.5;
	//         float alpha = smoothstep(0.0, 1.0, scan) * fresnel;

	//         vec2 mouseEffect = (u_mouse - 0.5) * 2.0;
	//         float mouseDist = length(vUv - 0.5 - mouseEffect);
	//         scan += exp(-mouseDist * 5.0);

	//         fragColor = vec4(color + scan , 1.0);
	//       }
	//     `,
	// 		side: THREE.DoubleSide,
	// 		transparent: true,
	// 	});
	// 	// this.hologram = new THREE.Mesh(plane, hologramMaterial);
	// }

	protected initMesh(): void {
		this.mesh = new THREE.Mesh(this.geometry, this.material);
		// this.mesh.add(this.hologram);
	}
}
