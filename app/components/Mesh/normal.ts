import * as THREE from 'three';
import { Img } from './img';
import { Mesh } from './mesh';
import { Text } from './text';
import { Window } from './window';
export class NormalDisplay extends Mesh {
	protected img: Img;
	protected text: Text;
	protected window: Window;

	constructor(imgPath?: string, text?: string) {
		super();
		this.img = new Img(imgPath);
		this.text = new Text(text);
		this.window = new Window();

		this.buildMesh();
		this.positionAdjust();
	}

	private buildMesh(): void {
		this.mesh.add(this.img.getMesh());
		this.mesh.add(this.text.getMesh());
		this.mesh.add(this.window.getMesh());
	}

	private positionAdjust(): void {
		this.img.getMesh().position.set(-1, 0, 0);
		this.text.getMesh().position.set(1, 0, 0);
		this.window.getMesh().position.set(0, 0, 1);
	}

	protected initGeometry(): void {
		const geometry = new THREE.BoxGeometry(4, 2, 2);
		const faces = geometry.index!.array;
		const newFaces = [];

		// BoxGeometry has 12 triangles (6 faces * 2 triangles each)
		// Front face triangles are at indices 8-13 (triangles 4-5)
		for (let i = 0; i < faces.length; i += 3) {
			const triangleIndex = Math.floor(i / 3);
			if (triangleIndex !== 8 && triangleIndex !== 9) {
				newFaces.push(faces[i], faces[i + 1], faces[i + 2]);
			}
		}

		geometry.setIndex(newFaces);

		this.geometry = geometry;
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
        out vec3 vNormal;
        out vec3 vViewDirection;

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
        precision highp float;
        precision highp int;

        uniform vec2 u_resolution;
        uniform float u_time;
        in vec2 vUv;
        in vec3 vPosition;
        in vec3 vNormal;
        in vec3 vViewDirection;

        out vec4 fragColor;

        void main() {

				// Fresnel-like effect based on viewing angle
          // フレネル効果は、光が異なる屈折率を持つ二つの媒質の境界面に入射する際に起こる反射と屈折の現象。
          float fresnelPower = 10.0; // 調整可能なパラメータ
          float fresnelBias = 0.01;  // 最小反射率
          float fresnelScale = 1.0; // スケール
          float NdotV = max(0.0, dot(vNormal, vViewDirection));
          float fresnel = fresnelBias + fresnelScale * pow(1.0 - NdotV, fresnelPower);
					
          vec2 st = vUv;
					float facing = dot(vNormal, vViewDirection);
					float coordColor = step(0.2, fract(st.x * u_resolution.x) * fract(st.y * u_resolution.y));
					vec3 color;
          if (facing > 0.2) {
            color = vec3( vViewDirection.x, vViewDirection.y, 0.8);
          } else {
            color = vec3(coordColor, vViewDirection.z, 0.8);
          }

          fragColor = vec4(color, 1.0);
        }
      `,
			side: THREE.DoubleSide,
			transparent: true,
		});
	}

	public animate(): void {
		this.material.uniforms.u_time.value += 0.05;
	}

	public dispose(): void {
		this.img.dispose();
		this.text.dispose();
		this.window.dispose();
	}
}
