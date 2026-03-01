import { float, Fn, positionLocal, sin, time } from 'three/tsl';

export interface WaveConfig {
	frequency: number;
	amplitude: number;
	speed: number;
}

/**
 * Creates a single wave node
 */
export const createWaveNode = (config: WaveConfig) => {
	const { frequency, amplitude, speed } = config;

	return Fn(() => {
		const pos = positionLocal;
		const t = time.mul(speed);
		return sin(pos.y.mul(frequency).add(t)).mul(amplitude);
	});
};

/**
 * Creates a multi-layer wave by combining multiple waves
 */
export const createMultiWave = (layers: WaveConfig[]) => {
	return Fn(() => {
		const result = float(0).toVar();

		layers.forEach(({ frequency, amplitude, speed }) => {
			const pos = positionLocal;
			const t = time.mul(speed);
			const wave = sin(pos.y.mul(frequency).add(t)).mul(amplitude);
			result.addAssign(wave);
		});

		return result;
	});
};

/**
 * Creates a horizontal wave displacement
 */
export const createHorizontalWave = (
	frequency = 4.0,
	amplitude = 0.08,
	speed = 2.0
) => {
	return Fn(() => {
		const pos = positionLocal.toVar();
		const wave = sin(pos.y.mul(frequency).add(time.mul(speed))).mul(amplitude);
		pos.x.addAssign(wave);
		return pos;
	});
};

/**
 * Creates a circular wave pattern
 */
export const createCircularWave = (
	frequency = 2.0,
	amplitude = 0.1,
	speed = 1.0
) => {
	return Fn(() => {
		const pos = positionLocal;
		const dist = pos.x.mul(pos.x).add(pos.y.mul(pos.y)).sqrt();
		const t = time.mul(speed);
		return sin(dist.mul(frequency).add(t)).mul(amplitude);
	});
};
