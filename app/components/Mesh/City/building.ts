import { Mesh } from '@components/Mesh/mesh';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export class Building extends Mesh {
	constructor() {
		super();
	}

	protected initGeometry(): void {
		// ======== Box部分 ========
		const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
		const faces = boxGeometry.index!.array;
		const newFaces = [];

		for (let i = 0; i < faces.length; i += 3) {
			const triangleIndex = Math.floor(i / 3);
			if (triangleIndex !== 8 && triangleIndex !== 9) {
				newFaces.push(faces[i], faces[i + 1], faces[i + 2]);
			}
		}
		boxGeometry.setIndex(newFaces);
		boxGeometry.translate(0, -0.5, 0);

		// ======== Cone部分 ========
		const coneGeometry = new THREE.ConeGeometry(1, 2, 50);
		coneGeometry.translate(0.75, 0, 0);
		coneGeometry.computeVertexNormals();

		// ======== Merge ========
		this.geometry = mergeGeometries([boxGeometry, coneGeometry]);
	}

	protected initMaterial(): void {
		this.material = new THREE.ShaderMaterial({
			glslVersion: THREE.GLSL3,
			uniforms: {
				u_time: { value: 0.0 },
			},
			vertexShader: `
      out vec3 vPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
			fragmentShader: `
      in vec3 vPosition;
      uniform float u_time;

			out vec4 fragColor;
      void main() {
        // Z方向の閾値（これを調整すると透明になる位置を動かせる）
        float cutoff = sin(u_time * 0.5) * 0.5;

        // (1) 完全にカットする場合

        // (2) フェードさせたい場合は以下のように alpha に反映
        float alpha = smoothstep(cutoff - 0.2, cutoff + 0.2, vPosition.z);

        // ベースカラー
        vec3 color = mix(vec3(0.2, 0.2, 0.8), vec3(0.8, 0.4, 0.4), vPosition.y + 0.5);

        fragColor = vec4(color, 1.0);
      }
    `,
			side: THREE.DoubleSide,
			shadowSide: THREE.DoubleSide,
			transparent: true,
		});
	}

	protected initMesh(): void {
		super.initMesh();
		this.mesh.castShadow = true;
		this.mesh.receiveShadow = true;
	}

	public animate(): void {}

	public override dispose(): void {
		super.dispose();
	}
}
