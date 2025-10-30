import * as THREE from 'three';
import { Img } from './Img';
import { Mesh } from './mesh';
import { Text } from './Text';
import { Window } from './Window';
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
          vec2 st = vUv;
            vec3 color = vec3(0.5, 0.1, vViewDirection.z);

          fragColor = vec4(color, 1.0);
        }
      `,
			uniforms: {
				u_resolution: {
					value: new THREE.Vector2(window.innerWidth, window.innerHeight),
				},
				u_time: { value: 0.0 },
			},
			side: THREE.DoubleSide,
			transparent: true,
		});
	}

	public animate(): void {}

	public dispose(): void {
		this.img.dispose();
		this.text.dispose();
		this.window.dispose();
	}
}
