import { Vector2 } from 'three';

const mousePos = new Vector2(0, 0);
const targetMouse = new Vector2(0, 0);

if (typeof document !== 'undefined') {
	document.addEventListener('mousemove', event => {
		targetMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
		targetMouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
	});

	// Smooth easing animation loop
	function updateMousePosition() {
		const easeOutFactor = 0.09;
		mousePos.x += (targetMouse.x - mousePos.x) * easeOutFactor;
		mousePos.y += (targetMouse.y - mousePos.y) * easeOutFactor;
		requestAnimationFrame(updateMousePosition);
	}
	updateMousePosition();
}

export { mousePos };
