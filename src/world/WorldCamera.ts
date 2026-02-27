import * as THREE from 'three';
import {
  STREAM_CAMERA_MIN_DISTANCE,
  STREAM_CAMERA_MAX_DISTANCE,
  STREAM_CAMERA_NEAR_FOV,
  STREAM_CAMERA_FAR_FOV,
  STREAM_CAMERA_NEAR_Y,
  STREAM_CAMERA_FAR_Y,
  STREAM_CAMERA_NEAR_Z_SCALE,
  STREAM_CAMERA_FAR_Z_SCALE,
  STREAM_CAMERA_POSITION_DAMP,
  STREAM_CAMERA_LOOK_DAMP,
} from './WorldConfig';

export function smoothCameraPosition(
  camera: THREE.PerspectiveCamera,
  target: THREE.Vector3,
  delta: number,
  damp: number = STREAM_CAMERA_POSITION_DAMP,
) {
  camera.position.x = THREE.MathUtils.damp(camera.position.x, target.x, damp, delta);
  camera.position.y = THREE.MathUtils.damp(camera.position.y, target.y, damp, delta);
  camera.position.z = THREE.MathUtils.damp(camera.position.z, target.z, damp, delta);
}

export function smoothLookAt(
  camera: THREE.PerspectiveCamera,
  lookRef: THREE.Vector3,
  target: THREE.Vector3,
  delta: number,
  damp: number = STREAM_CAMERA_LOOK_DAMP,
) {
  lookRef.x = THREE.MathUtils.damp(lookRef.x, target.x, damp, delta);
  lookRef.y = THREE.MathUtils.damp(lookRef.y, target.y, damp, delta);
  lookRef.z = THREE.MathUtils.damp(lookRef.z, target.z, damp, delta);
  camera.lookAt(lookRef.x, lookRef.y, lookRef.z);
}

export function updateStreamFollowCamera(
  camera: THREE.PerspectiveCamera,
  lookRef: THREE.Vector3,
  focusPosition: THREE.Vector3,
  distance: number,
  delta: number,
) {
  const zoomT = THREE.MathUtils.clamp(
    (distance - STREAM_CAMERA_MIN_DISTANCE) /
      Math.max(0.001, STREAM_CAMERA_MAX_DISTANCE - STREAM_CAMERA_MIN_DISTANCE),
    0,
    1,
  );
  const yOffset = THREE.MathUtils.lerp(STREAM_CAMERA_NEAR_Y, STREAM_CAMERA_FAR_Y, zoomT);
  const zScale = THREE.MathUtils.lerp(STREAM_CAMERA_NEAR_Z_SCALE, STREAM_CAMERA_FAR_Z_SCALE, zoomT);
  const zOffset = distance * zScale;
  const desired = focusPosition.clone().add(new THREE.Vector3(0, yOffset, zOffset));

  smoothCameraPosition(camera, desired, delta);
  smoothLookAt(camera, lookRef, focusPosition.clone().add(new THREE.Vector3(0, 0.72, 0)), delta);

  const targetFov = THREE.MathUtils.lerp(STREAM_CAMERA_NEAR_FOV, STREAM_CAMERA_FAR_FOV, zoomT);
  const fov = THREE.MathUtils.lerp(camera.fov, targetFov, 0.12);
  if (Math.abs(fov - camera.fov) > 0.01) {
    camera.fov = fov;
    camera.updateProjectionMatrix();
  }
}
