import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { RESOLUTION_SCALE } from './WorldConfig';

export interface WorldRendererSetup {
  renderer: THREE.WebGLRenderer;
  composer: EffectComposer;
}

export function createWorldRenderer(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
): WorldRendererSetup {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  });
  const renderWidth = Math.floor(width * RESOLUTION_SCALE);
  const renderHeight = Math.floor(height * RESOLUTION_SCALE);
  renderer.setSize(renderWidth, renderHeight, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  const composer = new EffectComposer(renderer);
  composer.setSize(renderWidth, renderHeight);
  composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  composer.addPass(new RenderPass(scene, camera));

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(renderWidth, renderHeight),
    0.35,
    0.6,
    0.85,
  );
  composer.addPass(bloomPass);

  const fxaaPass = new ShaderPass(FXAAShader);
  fxaaPass.uniforms['resolution'].value.set(1 / renderWidth, 1 / renderHeight);
  composer.addPass(fxaaPass);

  const colorGradeShader = {
    uniforms: {
      tDiffuse: { value: null },
      uTint: { value: new THREE.Vector3(0.85, 0.95, 1.1) },
      uVignetteIntensity: { value: 0.3 },
    },
    vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform vec3 uTint;
      uniform float uVignetteIntensity;
      varying vec2 vUv;
      void main() {
        vec4 color = texture2D(tDiffuse, vUv);
        color.rgb *= uTint;
        float dist = distance(vUv, vec2(0.5));
        color.rgb *= 1.0 - dist * uVignetteIntensity;
        gl_FragColor = color;
      }
    `,
  };
  composer.addPass(new ShaderPass(colorGradeShader));

  return { renderer, composer };
}

export function resizeWorldRenderer(
  renderer: THREE.WebGLRenderer,
  composer: EffectComposer,
  camera: THREE.PerspectiveCamera,
  width: number,
  height: number,
) {
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  const rw = Math.floor(width * RESOLUTION_SCALE);
  const rh = Math.floor(height * RESOLUTION_SCALE);
  renderer.setSize(rw, rh, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  composer.setSize(rw, rh);
  composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}
