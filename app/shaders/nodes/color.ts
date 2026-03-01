import {
	Fn,
	sin,
	time,
	positionLocal,
	vec3,
	color,
	mix,
	length,
	log2,
} from 'three/tsl';

export interface ColorConfig {
	baseColor: [number, number, number];
	accentColor?: [number, number, number];
	frequency?: number;
	speed?: number;
}

/**
 * Creates a rotating color effect
 */
export const createRotatingColor = (
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	rotateZFn: any,
	config: ColorConfig
) => {
	const { baseColor, frequency = 0.5, speed = 0.05 } = config;

	return Fn(() => {
		const angle = log2(length(positionLocal)).negate().add(time.mul(speed));
		const rotatedPos = rotateZFn(positionLocal, angle);

		const base = vec3(...baseColor);
		const dynamicColor = vec3(
			base.x.add(sin(rotatedPos.x.mul(frequency)).mul(0.3)),
			base.y.add(sin(rotatedPos.y.mul(frequency)).mul(0.3)),
			base.z.add(sin(rotatedPos.z.mul(frequency)).mul(0.2))
		);

		return color(dynamicColor);
	});
};

/**
 * Creates a gradient color effect
 */
export const createGradientColor = (config: ColorConfig) => {
	const {
		baseColor,
		accentColor = [1, 1, 1],
		frequency = 2.0,
		speed = 0.5,
	} = config;

	return Fn(() => {
		const base = vec3(...baseColor);
		const accent = vec3(...accentColor);
		const factor = sin(positionLocal.y.mul(frequency).add(time.mul(speed)))
			.mul(0.5)
			.add(0.5);

		return color(mix(base, accent, factor));
	});
};

/**
 * Creates a pulsing color effect
 */
export const createPulsingColor = (config: ColorConfig) => {
	const { baseColor, speed = 1.0 } = config;

	return Fn(() => {
		const pulse = sin(time.mul(speed)).mul(0.3).add(0.7);
		const base = vec3(...baseColor);
		return color(base.mul(pulse));
	});
};
