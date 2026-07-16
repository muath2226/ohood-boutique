/**
 * بوتيك عهود — Lumen engine
 * Three.js lamp + soft dark veil
 *
 * Content stays native DOM (full resolution, original colors).
 * WebGL only draws the pendant + a dark veil with a clear hole —
 * so light “reveals” content without recoloring or downsampling it.
 */

import * as THREE from "three";

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Unity-style SmoothDamp ---------- */
function smoothDamp(current, target, velRef, smoothTime, maxSpeed, dt) {
  smoothTime = Math.max(0.0001, smoothTime);
  const omega = 2 / smoothTime;
  const x = omega * dt;
  const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  let change = current - target;
  const originalTo = target;
  const maxChange = maxSpeed * smoothTime;
  change = Math.max(-maxChange, Math.min(maxChange, change));
  target = current - change;
  const temp = (velRef.v + omega * change) * dt;
  velRef.v = (velRef.v - omega * temp) * exp;
  let output = target + (change + temp) * exp;
  if (originalTo - current > 0 === output > originalTo) {
    output = originalTo;
    velRef.v = (output - originalTo) / dt;
  }
  return output;
}

function ready(fn) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fn, { once: true });
  } else {
    fn();
  }
}

ready(() => {
  if (reduced) return;

  const canvasEl = document.getElementById("lumen-gl");
  if (!canvasEl) {
    console.warn("[lumen] missing #lumen-gl");
    return;
  }

  /* ----- renderer (transparent so sharp DOM shows through the hole) ----- */
  const renderer = new THREE.WebGLRenderer({
    canvas: canvasEl,
    antialias: true,
    alpha: true,
    premultipliedAlpha: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  const scene = new THREE.Scene();

  let W = window.innerWidth;
  let H = window.innerHeight;

  const camera = new THREE.OrthographicCamera(-W / 2, W / 2, H / 2, -H / 2, 0.1, 8000);
  camera.position.set(0, 0, 1200);
  camera.lookAt(0, 0, 0);

  // lamp-only lighting (never hits the DOM)
  scene.add(new THREE.AmbientLight(0x2a241c, 0.45));
  const lampKey = new THREE.PointLight(0xffe4b8, 3.5, 1100, 1.25);
  scene.add(lampKey);
  const lampFill = new THREE.PointLight(0xffd090, 1.4, 700, 1.6);
  scene.add(lampFill);

  /* ----- soft dark veil: clear hole = full-res original DOM ----- */
  const veilUniforms = {
    uLight: { value: new THREE.Vector2(0.5, 0.62) },
    uRadius: { value: 0.46 },
    uSoft: { value: 0.34 },
    uAspect: { value: W / Math.max(H, 1) },
    uDark: { value: 0.93 },
  };

  const veilMat = new THREE.ShaderMaterial({
    uniforms: veilUniforms,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    toneMapped: false,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      varying vec2 vUv;
      uniform vec2 uLight;
      uniform float uRadius;
      uniform float uSoft;
      uniform float uAspect;
      uniform float uDark;

      void main() {
        vec2 p = vUv - uLight;
        p.x *= uAspect;
        p.y *= 1.12; // slightly taller pool under the shade
        float d = length(p);

        float inner = uRadius * (1.0 - uSoft);
        float outer = uRadius;
        // 1 = fully open (see DOM), 0 = veiled
        float open = 1.0 - smoothstep(inner, outer, d);

        float alpha = (1.0 - open) * uDark;
        // neutral dark — does not tint the DOM underneath
        gl_FragColor = vec4(0.025, 0.02, 0.016, alpha);
      }
    `,
  });

  const veilMesh = new THREE.Mesh(new THREE.PlaneGeometry(W, H), veilMat);
  veilMesh.position.z = 0;
  veilMesh.renderOrder = 0;
  scene.add(veilMesh);

  /* ----- 3D pendant (the “previous better lamp”) ----- */
  const lamp = new THREE.Group();
  lamp.renderOrder = 2;
  scene.add(lamp);

  const cordMat = new THREE.MeshStandardMaterial({
    color: 0x8a7355,
    roughness: 0.65,
    metalness: 0.2,
  });
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 1, 10), cordMat);
  lamp.add(cord);

  const canopy = new THREE.Mesh(
    new THREE.CylinderGeometry(7, 8.5, 10, 24),
    new THREE.MeshStandardMaterial({ color: 0x6b5340, roughness: 0.48, metalness: 0.45 })
  );
  canopy.position.y = 8;
  lamp.add(canopy);

  const shadeOuter = new THREE.Mesh(
    new THREE.CylinderGeometry(20, 54, 40, 48, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0x14110e,
      roughness: 0.8,
      metalness: 0.08,
      side: THREE.FrontSide,
    })
  );
  shadeOuter.position.y = -14;
  lamp.add(shadeOuter);

  const shadeInner = new THREE.Mesh(
    new THREE.CylinderGeometry(19, 52, 38, 48, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0xffe8c0,
      emissive: 0xffc878,
      emissiveIntensity: 1.85,
      roughness: 0.5,
      side: THREE.BackSide,
    })
  );
  shadeInner.position.y = -14;
  lamp.add(shadeInner);

  const rimRing = new THREE.Mesh(
    new THREE.TorusGeometry(53, 1.7, 10, 48),
    new THREE.MeshStandardMaterial({
      color: 0xd4b483,
      emissive: 0x9a7040,
      emissiveIntensity: 0.55,
      metalness: 0.8,
      roughness: 0.28,
    })
  );
  rimRing.rotation.x = Math.PI / 2;
  rimRing.position.y = -33;
  lamp.add(rimRing);

  const bulbMesh = new THREE.Mesh(
    new THREE.SphereGeometry(9, 28, 18),
    new THREE.MeshStandardMaterial({
      color: 0xfff8ec,
      emissive: 0xffe0a8,
      emissiveIntensity: 3.0,
      roughness: 0.18,
    })
  );
  bulbMesh.position.y = -18;
  lamp.add(bulbMesh);

  // warm halo — tight on the fixture so it doesn’t wash page content
  const glowCanvas = document.createElement("canvas");
  glowCanvas.width = 128;
  glowCanvas.height = 128;
  {
    const g = glowCanvas.getContext("2d");
    const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, "rgba(255,244,210,1)");
    grd.addColorStop(0.28, "rgba(255,214,150,0.45)");
    grd.addColorStop(0.6, "rgba(255,190,100,0.12)");
    grd.addColorStop(1, "rgba(255,180,80,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, 128, 128);
  }
  const glowSprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(glowCanvas),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 0.7,
    })
  );
  glowSprite.scale.set(120, 120, 1);
  glowSprite.position.set(0, -30, 16);
  lamp.add(glowSprite);

  /* ----- motion (auto drift only — no mouse/touch follow) ----- */
  const state = {
    tx: 0,
    ty: H * 0.3,
    x: 0,
    y: H * 0.3,
    vx: { v: 0 },
    vy: { v: 0 },
    tilt: 0,
    vTilt: { v: 0 },
    t0: performance.now(),
    py: 0,
  };

  const SMOOTH_X = 0.14;
  const SMOOTH_Y = 0.18;
  const SMOOTH_TILT = 0.12;
  const MAX_SPEED = 6500;
  const lampYBase = () => H * 0.3;

  function idleDrift(now) {
    const t = (now - state.t0) / 1000;
    state.tx = Math.sin(t * 0.48) * W * 0.28;
    state.ty = lampYBase() + Math.sin(t * 0.33 + 1.1) * H * 0.022;
    state.py = Math.sin(t * 0.27) * H * 0.12;
  }

  function onResize() {
    W = window.innerWidth;
    H = window.innerHeight;
    renderer.setSize(W, H, false);
    camera.left = -W / 2;
    camera.right = W / 2;
    camera.top = H / 2;
    camera.bottom = -H / 2;
    camera.updateProjectionMatrix();

    veilMesh.geometry.dispose();
    veilMesh.geometry = new THREE.PlaneGeometry(W, H);
    veilUniforms.uAspect.value = W / Math.max(H, 1);
    state.ty = lampYBase();
  }
  window.addEventListener("resize", onResize);
  renderer.setSize(W, H, false);

  // native DOM stays sharp — no html-in-canvas downscale
  document.body.classList.add("lumen-webgl", "lumen-dom-live");
  requestAnimationFrame(() => document.body.classList.add("lumen-ready"));

  /* ----- animation ----- */
  let prev = performance.now();

  function frame(now) {
    const dt = Math.min(0.05, (now - prev) / 1000);
    prev = now;

    idleDrift(now);

    state.x = smoothDamp(state.x, state.tx, state.vx, SMOOTH_X, MAX_SPEED, dt);
    state.y = smoothDamp(state.y, state.ty, state.vy, SMOOTH_Y, MAX_SPEED * 0.55, dt);

    const targetTilt = THREE.MathUtils.clamp(-state.vx.v * 0.00045, -0.38, 0.38);
    state.tilt = smoothDamp(state.tilt, targetTilt, state.vTilt, SMOOTH_TILT, 8, dt);

    const topY = H / 2;
    const cordLen = Math.max(28, topY - state.y + 10);
    cord.scale.y = cordLen;
    cord.position.y = cordLen / 2 + 8;

    lamp.position.set(state.x, state.y, 180);
    lamp.rotation.z = state.tilt;
    lamp.rotation.x = 0.1;

    lampKey.position.set(state.x, state.y - 18, 240);
    lampFill.position.set(state.x, state.y - 48, 160);

    // clear hole sits under the shade opening
    const poolWorldY = THREE.MathUtils.clamp(
      state.py * 0.3 + (state.y - 90) * 0.5,
      -H * 0.42,
      H * 0.35
    );
    const u = (state.x + W / 2) / W;
    const v = (poolWorldY + H / 2) / H;
    veilUniforms.uLight.value.set(
      THREE.MathUtils.clamp(u, 0.04, 0.96),
      THREE.MathUtils.clamp(v, 0.06, 0.94)
    );
    veilUniforms.uRadius.value = 0.42 + Math.min(W, H) * 0.00006;
    veilUniforms.uAspect.value = W / Math.max(H, 1);

    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // no capture needed — keep hook as no-op for app.js compatibility
  window.ohoodLumenRecapture = () => {};
});
