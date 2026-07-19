/**
 * بوتيك عهود — Lumen engine
 * Three.js lamp + soft dark veil
 *
 * Content stays native DOM (full resolution, original colors).
 * WebGL only draws the pendant + a dark veil with a clear hole —
 * so light “reveals” content without recoloring or downsampling it.
 *
 * Modes (localStorage ohood-scene):
 *   lamp   — dark stage + wide soft spotlight (default)
 *   bright — full site lit, no veil (مضيء)
 */

import * as THREE from "three";

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const SCENE_KEY = "ohood-scene";
const VEIL_DARK = 0.9;
const RADIUS_BASE = 0.64;
const RADIUS_SCALE = 0.00008;
const SOFT_EDGE = 0.58;

/* ---------- Unity-style SmoothDamp (frame-rate independent) ---------- */
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

function readSceneMode() {
  const saved = localStorage.getItem(SCENE_KEY);
  return saved === "bright" ? "bright" : "lamp";
}

function ready(fn) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fn, { once: true });
  } else {
    fn();
  }
}

function updateSceneToggleUi(mode) {
  const btn = document.getElementById("sceneToggle");
  if (!btn) return;
  const lang = localStorage.getItem("ohood-lang") || "ar";
  const isBright = mode === "bright";
  btn.dataset.mode = mode;
  btn.setAttribute("aria-pressed", isBright ? "true" : "false");
  btn.setAttribute(
    "aria-label",
    isBright
      ? lang === "ar"
        ? "التبديل إلى وضع المصباح القاتم"
        : "Switch to lamp spotlight mode"
      : lang === "ar"
        ? "التبديل إلى الموقع المضيء بالكامل"
        : "Switch to full bright site"
  );
  const label = btn.querySelector("[data-scene-label]");
  if (label) {
    label.textContent = isBright
      ? lang === "ar"
        ? "قاتم"
        : "Lamp"
      : lang === "ar"
        ? "مضيء"
        : "Bright";
  }
  btn.title =
    lang === "ar"
      ? isBright
        ? "وضع المصباح القاتم"
        : "الموقع مضيء بالكامل"
      : isBright
        ? "Lamp spotlight mode"
        : "Full bright site";
}

function applySceneClasses(mode) {
  const isBright = mode === "bright";
  document.body.classList.toggle("light-scene", !isBright);
  document.body.classList.toggle("scene-bright", isBright);
  updateSceneToggleUi(mode);
}

/* Reduced motion: no WebGL — still allow bright/dark theme toggle */
ready(() => {
  let mode = readSceneMode();
  applySceneClasses(mode);

  window.ohoodLumenGetMode = () => mode;
  window.ohoodLumenSetMode = (next) => {
    mode = next === "bright" ? "bright" : "lamp";
    localStorage.setItem(SCENE_KEY, mode);
    applySceneClasses(mode);
    window.dispatchEvent(new CustomEvent("ohood-scene-change", { detail: { mode } }));
  };
  window.ohoodLumenUpdateLabels = () => updateSceneToggleUi(mode);

  const sceneBtn = document.getElementById("sceneToggle");
  if (sceneBtn) {
    sceneBtn.addEventListener("click", () => {
      window.ohoodLumenSetMode(mode === "bright" ? "lamp" : "bright");
    });
  }

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

  /* ----- soft dark veil: wider, silkier clear hole ----- */
  const startDark = mode === "bright" ? 0 : VEIL_DARK;
  const veilUniforms = {
    uLight: { value: new THREE.Vector2(0.5, 0.58) },
    uRadius: { value: RADIUS_BASE },
    uSoft: { value: SOFT_EDGE },
    uAspect: { value: W / Math.max(H, 1) },
    uDark: { value: startDark },
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

      // Hermite smoothstep — silkier falloff than built-in smoothstep
      float smootherstep(float edge0, float edge1, float x) {
        float t = clamp((x - edge0) / max(edge1 - edge0, 1e-5), 0.0, 1.0);
        return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
      }

      void main() {
        vec2 p = vUv - uLight;
        p.x *= uAspect;
        p.y *= 1.05; // wide, nearly round pool under the shade
        float d = length(p);

        float soft = clamp(uSoft, 0.2, 0.85);
        float outer = uRadius;
        float mid = uRadius * (1.0 - soft * 0.55);
        float inner = uRadius * (1.0 - soft);

        // layered open mask: bright core + long soft penumbra
        float core = 1.0 - smootherstep(inner, mid, d);
        float penumbra = 1.0 - smootherstep(mid, outer, d);
        float halo = 1.0 - smootherstep(outer * 0.92, outer * 1.22, d);
        float open = clamp(core * 0.55 + penumbra * 0.35 + halo * 0.22, 0.0, 1.0);

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

  /* ----- 3D pendant ----- */
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

  // warm halo on fixture
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

  /* ----- motion: silkier follow ----- */
  const state = {
    tx: 0,
    ty: H * 0.3,
    x: 0,
    y: H * 0.3,
    vx: { v: 0 },
    vy: { v: 0 },
    tilt: 0,
    vTilt: { v: 0 },
    py: 0,
  };

  // higher smoothTime = silkier, less snappy
  const SMOOTH_X = 0.22;
  const SMOOTH_Y = 0.28;
  const SMOOTH_TILT = 0.2;
  const MAX_SPEED = 4200;
  const lampYBase = () => H * 0.3;

  // animated scene blend (veil + lamp visibility)
  let darkCurrent = startDark;
  let darkTarget = startDark;
  let lampVis = mode === "bright" ? 0 : 1;
  let lampVisTarget = lampVis;

  window.addEventListener("ohood-scene-change", (e) => {
    const m = e.detail?.mode === "bright" ? "bright" : "lamp";
    mode = m;
    darkTarget = m === "bright" ? 0 : VEIL_DARK;
    lampVisTarget = m === "bright" ? 0 : 1;
  });

  function clientToWorld(clientX, clientY) {
    return { x: clientX - W / 2, y: H / 2 - clientY };
  }

  function setTarget(clientX, clientY) {
    if (mode === "bright") return;
    const p = clientToWorld(clientX, clientY);
    state.tx = p.x;
    const bob = (0.5 - clientY / H) * H * 0.045;
    state.ty = lampYBase() + bob;
    state.py = p.y;
  }

  window.addEventListener(
    "pointermove",
    (e) => {
      if (e.pointerType === "touch") return;
      setTarget(e.clientX, e.clientY);
    },
    { passive: true }
  );
  window.addEventListener(
    "touchmove",
    (e) => {
      const t = e.touches[0];
      if (t) setTarget(t.clientX, t.clientY);
    },
    { passive: true }
  );
  window.addEventListener(
    "pointerdown",
    (e) => {
      if (e.pointerType === "touch") setTarget(e.clientX, e.clientY);
    },
    { passive: true }
  );

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
  const darkVel = { v: 0 };
  const lampVel = { v: 0 };

  function frame(now) {
    const dt = Math.min(0.05, (now - prev) / 1000);
    prev = now;

    darkCurrent = smoothDamp(darkCurrent, darkTarget, darkVel, 0.45, 4, dt);
    lampVis = smoothDamp(lampVis, lampVisTarget, lampVel, 0.4, 4, dt);
    veilUniforms.uDark.value = darkCurrent;
    lamp.visible = lampVis > 0.02;
    lamp.scale.setScalar(0.55 + lampVis * 0.45);
    lamp.traverse((obj) => {
      if (obj.isSprite && obj.material) {
        obj.material.opacity = 0.7 * lampVis;
      }
    });
    lampKey.intensity = 3.5 * lampVis;
    lampFill.intensity = 1.4 * lampVis;

    // skip heavy follow work when fully bright
    if (mode !== "bright" || darkCurrent > 0.02 || lampVis > 0.02) {
      state.x = smoothDamp(state.x, state.tx, state.vx, SMOOTH_X, MAX_SPEED, dt);
      state.y = smoothDamp(state.y, state.ty, state.vy, SMOOTH_Y, MAX_SPEED * 0.55, dt);

      const targetTilt = THREE.MathUtils.clamp(-state.vx.v * 0.00035, -0.32, 0.32);
      state.tilt = smoothDamp(state.tilt, targetTilt, state.vTilt, SMOOTH_TILT, 6, dt);

      const topY = H / 2;
      const cordLen = Math.max(28, topY - state.y + 10);
      cord.scale.y = cordLen;
      cord.position.y = cordLen / 2 + 8;

      lamp.position.set(state.x, state.y, 180);
      lamp.rotation.z = state.tilt;
      lamp.rotation.x = 0.1;

      lampKey.position.set(state.x, state.y - 18, 240);
      lampFill.position.set(state.x, state.y - 48, 160);

      const poolWorldY = THREE.MathUtils.clamp(
        state.py * 0.28 + (state.y - 100) * 0.48,
        -H * 0.4,
        H * 0.38
      );
      const u = (state.x + W / 2) / W;
      const v = (poolWorldY + H / 2) / H;
      veilUniforms.uLight.value.set(
        THREE.MathUtils.clamp(u, 0.03, 0.97),
        THREE.MathUtils.clamp(v, 0.05, 0.95)
      );
      veilUniforms.uRadius.value = RADIUS_BASE + Math.min(W, H) * RADIUS_SCALE;
      veilUniforms.uSoft.value = SOFT_EDGE;
      veilUniforms.uAspect.value = W / Math.max(H, 1);
    }

    // hide canvas when fully faded in bright mode (saves overdraw)
    if (mode === "bright" && darkCurrent < 0.01 && lampVis < 0.02) {
      canvasEl.style.opacity = "0";
    } else if (document.body.classList.contains("lumen-ready")) {
      canvasEl.style.opacity = "";
    }

    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  window.ohoodLumenRecapture = () => {};
});
