import * as THREE from 'three';
import {
  WORLD_BOUNDS,
  MIN_Y,
  MAX_Y,
  PLAYER_HEIGHT,
  PLAYER_SPEED,
  PLAYER_ACCEL_DAMP,
  PLAYER_DECEL_DAMP,
  SWIM_VERTICAL_SPEED,
  PLAYER_COLLISION_RADIUS,
} from './WorldConfig';
import { resolveCollision, type CollisionBox } from '../utils/worldObjects';

export function updatePlayerMovement(
  camera: THREE.PerspectiveCamera,
  controls: { isLocked: boolean; moveRight: (d: number) => void; moveForward: (d: number) => void } | null,
  velocity: THREE.Vector3,
  keys: Record<string, boolean>,
  joystick: { active: boolean; dx: number; dy: number },
  mobileSwimY: number,
  isMobile: boolean,
  collisionBoxes: ReadonlyArray<CollisionBox>,
  delta: number,
) {
  if (!controls) return;

  const direction = new THREE.Vector3();
  const forward = (keys['w'] || keys['arrowup'] ? 1 : 0) - (keys['s'] || keys['arrowdown'] ? 1 : 0);
  const strafe = (keys['d'] || keys['arrowright'] ? 1 : 0) - (keys['a'] || keys['arrowleft'] ? 1 : 0);
  const swimUp = keys[' '] || mobileSwimY === 1 ? 1 : 0;
  const swimDown = keys['shift'] || mobileSwimY === -1 ? 1 : 0;

  if (isMobile && joystick.active) {
    direction.z = -Math.max(-1, Math.min(1, joystick.dy / 60));
    direction.x = Math.max(-1, Math.min(1, joystick.dx / 60));
  } else {
    direction.z = -forward;
    direction.x = strafe;
  }

  direction.normalize();

  const hasMoveInput = direction.lengthSq() > 0.0001;
  const moveDamp = hasMoveInput ? PLAYER_ACCEL_DAMP : PLAYER_DECEL_DAMP;
  velocity.x = THREE.MathUtils.damp(velocity.x, direction.x * PLAYER_SPEED, moveDamp, delta);
  velocity.z = THREE.MathUtils.damp(velocity.z, direction.z * PLAYER_SPEED, moveDamp, delta);
  velocity.y = THREE.MathUtils.damp(velocity.y, (swimUp - swimDown) * SWIM_VERTICAL_SPEED, moveDamp, delta);

  controls.moveRight(velocity.x * delta);
  controls.moveForward(-velocity.z * delta);
  camera.position.y += velocity.y * delta;

  camera.position.x = Math.max(-WORLD_BOUNDS, Math.min(WORLD_BOUNDS, camera.position.x));
  camera.position.z = Math.max(-WORLD_BOUNDS - 10, Math.min(WORLD_BOUNDS, camera.position.z));
  camera.position.y = Math.max(MIN_Y + PLAYER_HEIGHT, Math.min(MAX_Y, camera.position.y));

  const resolved = resolveCollision(
    camera.position.x,
    camera.position.z,
    PLAYER_COLLISION_RADIUS,
    collisionBoxes,
  );
  camera.position.x = resolved.x;
  camera.position.z = resolved.z;
}
