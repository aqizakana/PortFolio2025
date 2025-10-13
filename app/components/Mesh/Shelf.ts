import * as THREE from 'three';
import { type CDItem } from '../lib/CDlist';
import { CD } from './cd';

export class Shelf {
	protected cds: CD[] = [];
	protected cdsMesh: THREE.Mesh[] = [];
	constructor(List: CDItem[]) {
		this.cds = List.map(item => {
			return new CD(item);
		});
		this.cdsMesh = this.cds.map(cd => cd.getMesh());
	}

	public getCDs(): CD[] {
		return this.cds;
	}

	public getCDsMesh(): THREE.Mesh[] {
		return this.cdsMesh;
	}
}
