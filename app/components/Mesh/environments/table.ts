import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { mousePos } from '../lib/MousePos';
import { Mesh } from './mesh';

export class Table extends Mesh {
	protected controls!: OrbitControls;
	protected mouse = mousePos;
	protected initGeometry(): void {
		const geometry = new THREE.BoxGeometry(2, 0.1, 1);
		this.geometry = geometry;
	}

	protected initMaterial(): void {
		this.material = new THREE.ShaderMaterial({
			uniforms: {
				u_time: { value: 0.0 },
				u_mouse: { value: new THREE.Vector2(0, 0) },
			},
			vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec3 vViewDirection;
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

        varying vec2 vUv;
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec3 vViewDirection;
        uniform float u_time;
        uniform vec2 u_mouse;
        void main() {

          vec3 baseColor = vec3(0.8, 0.7, 0.6);
          vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
          float diff = max(dot(vNormal, lightDir), 0.0);
          vec3 diffuse = diff * baseColor;
          
          vec3 viewDir = normalize(vViewDirection);
          vec3 reflectDir = reflect(-lightDir, vNormal);
          float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
          vec3 specular = spec * vec3(1.0);
          vec3 color = diffuse + specular;
          gl_FragColor = vec4(vec3(1.0,0.0, 0.0), 1.0);
        }
      `,
			side: THREE.DoubleSide,
		});
	}
	public animate(): void {
		this.material.uniforms.u_time.value += 0.05;
	}
}
