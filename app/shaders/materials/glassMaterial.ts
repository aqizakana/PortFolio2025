import { MeshPhysicalNodeMaterial } from 'three/webgpu';
import {
	float,
	smoothstep,
	abs,
	dot,
	normalView,
	positionView,
	color,
	Fn,
	uv,
	max,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

export interface GlassMaterialConfig {
	ior?: number;
	thickness?: number;
	emissiveColor?: number;
	emissiveIntensity?: number;
}

/**
 * Creates a glass-like material with transmission and emissive edge
 */
export const createGlassMaterial = (config: GlassMaterialConfig = {}) => {
	const {
		ior = 1.345,
		thickness = 1,
		emissiveColor = 0xaaccff,
		emissiveIntensity = 2,
	} = config;

	const material = new MeshPhysicalNodeMaterial({
		side: THREE.DoubleSide,
		transparent: true,
	});

	// Glass properties
	material.metalnessNode = float(0);
	material.roughnessNode = smoothstep(
		abs(dot(normalView, positionView.normalize().negate())),
		0.01,
		0.2
	).oneMinus();
	material.transmissionNode = float(1);
	material.ior = ior;
	material.thicknessNode = float(thickness);

	// Emissive edge glow
	material.emissiveNode = Fn(() => {
		const uvVar = uv().toVar();
		const absUV = uvVar.sub(0.4).abs().toVar();
		const maxUV = max(absUV.x, absUV.y);
		const edgeFactor = smoothstep(0.48, 0.49, maxUV);
		const col = color(emissiveColor).mul(emissiveIntensity);
		return col.mul(edgeFactor);
	})();

	return material;
};
