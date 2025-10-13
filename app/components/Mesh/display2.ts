import * as THREE from 'three';
import { ZaraCase } from './caseLikeZara';
import { Img } from './img';
import { Table } from './Table';
import { Text } from './Text';
import { Window } from './Window';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils';

export class Display2 {
	private img: Img;
	private text: Text;
	private window: Window;
	private case: ZaraCase;
	private table: Table;

	protected controls!: OrbitControls;
	constructor(imgPath?: string, text?: string) {
		this.img = new Img(imgPath);
		this.text = new Text(text);
		this.window = new Window();
		this.case = new ZaraCase();
		this.table = new Table();
		this.buildMesh();
		this.positionAdjust();
	}

	protected mesh: THREE.Group = new THREE.Group();

	private buildMesh(): void {
		// Add all components to the group once during initialization
		this.mesh.add(this.img.getMesh());
		this.mesh.add(this.text.getMesh());
		this.mesh.add(this.window.getMesh());
		this.mesh.add(this.case.getMesh());
		this.mesh.add(this.table.getMesh());
	}

	public getMesh(): THREE.Group {
		return this.mesh;
	}

	private positionAdjust(): void {
		this.img.getMesh().position.set(-1, 0, 0);
		this.text.getMesh().position.set(1, 0, 0);
		this.window.getMesh().position.set(0, 0, 1);
		this.table.getMesh().position.set(0, -0.9, 0);
	}

	private updateMesh(): void {
		this.mesh.children.forEach(child => {
			if (child instanceof THREE.Mesh) {
				child.geometry = BufferGeometryUtils.mergeGeometries(
					[child.geometry],
					false
				);
			}
		});
	}

	// Method to animate the display
	public animate(cameraPos: THREE.Vector3): void {
		this.img.animate();
		this.text.animate();
		this.case.animate();
		this.window.animate(cameraPos);
		this.table.animate();
	}

	public dispose(): void {
		this.img.dispose();
		this.text.dispose();
		this.window.dispose();
		this.case.dispose();
		this.table.dispose();
	}
}
