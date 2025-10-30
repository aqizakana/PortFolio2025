import * as THREE from 'three';

export abstract class Mesh {
	protected material: THREE.ShaderMaterial;
	protected mesh: THREE.Mesh;
	protected geometry: THREE.BufferGeometry;
	protected animationId: number | null = null;

	constructor() {
		this.initGeometry();
		this.initMaterial();
		this.initMesh();
	}

	protected abstract initGeometry(): void;
	protected abstract initMaterial(): void;

	protected initMesh(): void {
		this.mesh = new THREE.Mesh(this.geometry, this.material);
	}

	public start(): void {
		this.animate();
	}

	protected stop(): void {
		if (this.animationId !== null) {
			cancelAnimationFrame(this.animationId);
			this.animationId = null;
		}
	}

	public abstract animate(): void;

	public dispose(): void {
		this.stop();
		if (this.geometry) this.geometry.dispose();
		if (this.material) this.material.dispose();
	}

	public getMaterial(): THREE.ShaderMaterial {
		return this.material;
	}

	public getMesh(): THREE.Mesh {
		return this.mesh;
	}

	public updateUniforms(uniforms: Record<string, THREE.IUniform>): void {
		Object.keys(uniforms).forEach(key => {
			if (this.material.uniforms[key]) {
				this.material.uniforms[key].value = uniforms[key].value;
			}
		});
	}
}
