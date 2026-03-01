import { MeshBasicNodeMaterial } from 'three/webgpu';
import {
	Fn,
	sin,
	cos,
	float,
	vec3,
	positionLocal,
	time,
	length,
	log2,
} from 'three/tsl';
import * as THREE from 'three/webgpu';
import { createHorizontalWave } from '../nodes/wave';

/**
 * Creates the Z-axis rotation function for color effects
 */
const createRotateZFunction = () => {
	return Fn(([v_immutable, angle_immutable]) => {
		const angle = float(angle_immutable).toVar();
		const v = vec3(v_immutable).toVar();
		const cosAngle = float(cos(angle)).toVar();
		const sinAngle = float(sin(angle)).toVar();

		return vec3(
			v.x.mul(cosAngle).sub(v.y.mul(sinAngle)),
			v.x.mul(sinAngle).add(v.y.mul(cosAngle)),
			v.z
		);
	}).setLayout({
		name: 'rotateZ',
		type: 'vec3',
		inputs: [
			{ name: 'v', type: 'vec3' },
			{ name: 'angle', type: 'float' },
		],
	});
};

/**
 * Creates an animated material with wave and color effects for HeaderBV
 */
export const createAnimatedMaterial = () => {
	const material = new MeshBasicNodeMaterial({
		transparent: true,
		depthWrite: false,
		side: THREE.DoubleSide,
	});

	// Wave displacement
	material.positionNode = createHorizontalWave(4.0, 0.08, 2.0)();

	// Rotation function for color
	const rotateZ = createRotateZFunction();
	const angle = log2(length(positionLocal)).negate().add(time.mul(0.05));
	const rotatedPos = rotateZ(positionLocal, angle);

	// Dynamic color
	const baseColor = vec3(0.5, 0.7, 1.0);
	const dynamicColor = vec3(
		baseColor.x.add(sin(rotatedPos.x.mul(0.5)).mul(0.3)),
		baseColor.y.add(sin(rotatedPos.y.mul(0.5)).mul(0.3)),
		baseColor.z.add(sin(rotatedPos.z.mul(0.5)).mul(0.2))
	);

	material.colorNode = dynamicColor;

	// Animated opacity
	material.opacityNode = sin(rotatedPos.y.mul(0.001).add(time))
		.mul(0.3)
		.add(0.7);

	return material;
};
