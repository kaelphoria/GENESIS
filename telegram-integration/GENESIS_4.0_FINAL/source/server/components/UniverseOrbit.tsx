'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { EVENT_HORIZON_WORLDS } from '@/lib/worlds';

type World = {
  id: string;
  title: string;
  description: string;
  slug?: string;
  _count?: { actions: number; memories: number };
};

type Props<W extends World> = {
  worlds: W[];
  onSelect: (world: W) => void;
};

type WorldSpec = {
  name: string;
  subtitle: string;
  light: string;
  mid: string;
  dark: string;
  radius: number;
  speed: number;
  kind: 'stone' | 'ice' | 'ocean' | 'fire' | 'gas';
  size: number;
  phase: number;
};

const SPECS: WorldSpec[] = [
  { name: 'ABUNDANCE', subtitle: 'Resources & possibility', light: '#f5d59a', mid: '#a97842', dark: '#3a2418', radius: 7.2, speed: .105, kind: 'stone', size: .82, phase: .1 },
  { name: 'KNOWLEDGE', subtitle: 'Learning & clarity', light: '#d4edff', mid: '#538db5', dark: '#132c47', radius: 9.2, speed: -.083, kind: 'ice', size: .72, phase: 1.2 },
  { name: 'CONNECTION', subtitle: 'People & belonging', light: '#e5c6ff', mid: '#9368b5', dark: '#302044', radius: 11.1, speed: .072, kind: 'stone', size: .8, phase: 2.3 },
  { name: 'PHYSICAL', subtitle: 'Body & vitality', light: '#c5f1d4', mid: '#4c9b78', dark: '#153c35', radius: 13.1, speed: -.062, kind: 'ocean', size: .91, phase: 3.2 },
  { name: 'POWER', subtitle: 'Agency & discipline', light: '#ffc0a1', mid: '#b95843', dark: '#431a1b', radius: 15.2, speed: .054, kind: 'fire', size: 1.02, phase: 4.1 },
  { name: 'CREATIVITY', subtitle: 'Expression & creation', light: '#e8f0fb', mid: '#8b9eb5', dark: '#354353', radius: 17.4, speed: -.047, kind: 'stone', size: .78, phase: 5.2 },
  { name: 'HARMONY', subtitle: 'Balance & inner order', light: '#b9f5ef', mid: '#459d9b', dark: '#17464e', radius: 19.6, speed: .041, kind: 'gas', size: 1.13, phase: 5.9 },
  { name: 'LOVE', subtitle: 'Intimacy & care', light: '#ffd0e3', mid: '#b66b91', dark: '#411e39', radius: 21.8, speed: -.036, kind: 'gas', size: .94, phase: 6.7 },
  { name: 'FREEDOM', subtitle: 'Choice & exploration', light: '#d0e7ff', mid: '#638caf', dark: '#1b304b', radius: 24, speed: .031, kind: 'ice', size: 1.08, phase: 7.4 },
];

function resolveWorld<W extends World>(worlds: W[], name: string): W | undefined {
  const entry = EVENT_HORIZON_WORLDS.find((item) => item.key === name);
  if (!entry) return undefined;
  for (const slug of entry.domains) {
    const found = worlds.find((world) => world.slug === slug);
    if (found) return found;
  }
  return undefined;
}

function makeGlowTexture(kind: 'radial' | 'beam' | 'ring', inner = '#ffffff'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  const size = kind === 'beam' ? 128 : 256;
  canvas.width = size;
  canvas.height = kind === 'beam' ? 512 : size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);
  if (kind === 'beam') {
    const horizontal = ctx.createLinearGradient(0, 0, size, 0);
    horizontal.addColorStop(0, 'rgba(255,200,110,0)');
    horizontal.addColorStop(.46, 'rgba(255,214,140,.55)');
    horizontal.addColorStop(.5, 'rgba(255,248,225,1)');
    horizontal.addColorStop(.54, 'rgba(255,214,140,.55)');
    horizontal.addColorStop(1, 'rgba(255,200,110,0)');
    ctx.fillStyle = horizontal;
    ctx.fillRect(0, 0, size, 512);
    const vertical = ctx.createLinearGradient(0, 0, 0, 512);
    vertical.addColorStop(0, 'rgba(0,0,0,0)');
    vertical.addColorStop(.38, 'rgba(0,0,0,1)');
    vertical.addColorStop(.62, 'rgba(0,0,0,1)');
    vertical.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalCompositeOperation = 'destination-in';
    ctx.fillStyle = vertical;
    ctx.fillRect(0, 0, size, 512);
  } else {
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    if (kind === 'ring') {
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(.6, 'rgba(0,0,0,0)');
      gradient.addColorStop(.74, inner);
      gradient.addColorStop(.84, 'rgba(255,190,100,.18)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
    } else {
      gradient.addColorStop(0, inner);
      gradient.addColorStop(.35, 'rgba(255,255,255,.35)');
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeDiskMaterial(inner: number, outer: number, color: string, opacity: number, speed: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 }, uInner: { value: inner }, uOuter: { value: outer }, uColor: { value: new THREE.Color(color) }, uOpacity: { value: opacity }, uSpeed: { value: speed } },
    vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform float uTime; uniform float uInner; uniform float uOuter; uniform float uOpacity; uniform float uSpeed; uniform vec3 uColor; varying vec2 vP;'
      + 'void main(){ float r = length(vP); float t = clamp((r - uInner) / (uOuter - uInner), 0.0, 1.0); float a = atan(vP.y, vP.x);'
      + 'float edge = smoothstep(0.0, 0.08, t) * (1.0 - smoothstep(0.5, 1.0, t));'
      + 'float streak = 0.68 + 0.32 * sin(a * 9.0 + uTime * uSpeed + t * 14.0) * sin(a * 3.0 - uTime * uSpeed * 0.6);'
      + 'float heat = pow(1.0 - t, 1.6); vec3 c = mix(uColor, vec3(1.0, 0.93, 0.78), heat * 0.7);'
      + 'gl_FragColor = vec4(c * (0.6 + heat * 1.4) * streak, edge * uOpacity * streak); }',
  });
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const ease = (value: number) => value < .5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;

function makeSurface(spec: WorldSpec, index: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const gradient = ctx.createLinearGradient(0, 0, 0, 512);
  gradient.addColorStop(0, spec.light);
  gradient.addColorStop(.52, spec.mid);
  gradient.addColorStop(1, spec.dark);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1024, 512);

  let seed = index * 7919 + 431;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  if (spec.kind === 'gas') {
    for (let i = 0; i < 115; i++) {
      ctx.globalAlpha = .06 + random() * .2;
      ctx.fillStyle = i % 2 ? spec.light : spec.dark;
      ctx.beginPath();
      ctx.ellipse(random() * 1024, random() * 512, 80 + random() * 220, 3 + random() * 18, random() * .12, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (spec.kind === 'ice') {
    for (let i = 0; i < 260; i++) {
      ctx.globalAlpha = .08 + random() * .2;
      ctx.strokeStyle = i % 2 ? spec.light : '#ffffff';
      ctx.lineWidth = .5 + random() * 3;
      const x = random() * 1024;
      const y = random() * 512;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (random() - .5) * 120, y + (random() - .5) * 80); ctx.stroke();
    }
  } else if (spec.kind === 'fire') {
    for (let i = 0; i < 60; i++) {
      ctx.globalAlpha = .5;
      ctx.strokeStyle = '#ffd08b';
      ctx.lineWidth = 1 + random() * 2;
      ctx.beginPath();
      let x = random() * 1024; let y = random() * 512;
      ctx.moveTo(x, y);
      for (let j = 0; j < 5; j++) { x += (random() - .5) * 65; y += (random() - .5) * 55; ctx.lineTo(x, y); }
      ctx.stroke();
    }
  } else {
    for (let i = 0; i < 340; i++) {
      ctx.globalAlpha = .04 + random() * .16;
      ctx.fillStyle = i % 3 ? spec.light : spec.dark;
      ctx.beginPath();
      ctx.ellipse(random() * 1024, random() * 512, 8 + random() * 90, 4 + random() * 34, random() * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function makeRim(color: string): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { glowColor: { value: new THREE.Color(color) } },
    vertexShader: 'varying vec3 n; varying vec3 v; void main(){ n=normalize(normalMatrix*normal); vec4 p=modelViewMatrix*vec4(position,1.0); v=-p.xyz; gl_Position=projectionMatrix*p; }',
    fragmentShader: 'uniform vec3 glowColor; varying vec3 n; varying vec3 v; void main(){ float f=pow(1.0-max(dot(normalize(n),normalize(v)),0.0),2.2); gl_FragColor=vec4(glowColor,f*.48); }',
  });
}

export default function UniverseOrbit<W extends World>({ worlds, onSelect }: Props<W>) {
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<{ select: (index: number) => void; reset: () => void } | null>(null);
  const worldsRef = useRef(worlds);
  const onSelectRef = useRef(onSelect);
  const [introDone, setIntroDone] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [activeLabel, setActiveLabel] = useState('');
  const [noWebgl, setNoWebgl] = useState(false);

  worldsRef.current = worlds;
  onSelectRef.current = onSelect;

  useEffect(() => {
    const element = host.current;
    if (!element) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    } catch {
      element.dataset.webglUnavailable = 'true';
      setNoWebgl(true);
      return;
    }

    let disposed = false;
    let frame = 0;
    const mobile = window.matchMedia('(max-width: 700px)').matches;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.65));
    renderer.setSize(element.clientWidth, element.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.22;
    renderer.domElement.setAttribute('aria-hidden', 'true');
    element.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#02050a');
    scene.fog = new THREE.FogExp2('#07101a', .009);
    const camera = new THREE.PerspectiveCamera(39, element.clientWidth / Math.max(1, element.clientHeight), .1, 500);
    camera.position.set(0, 8, 49);

    const system = new THREE.Group();
    scene.add(system);
    scene.add(new THREE.AmbientLight('#9aabc0', .72));
    const keyLight = new THREE.PointLight('#f5d8ad', 620, 125, 1.55);
    keyLight.position.set(-12, 18, 16);
    scene.add(keyLight);
    const fillLight = new THREE.PointLight('#83b8e8', 260, 150, 1.8);
    fillLight.position.set(22, -12, -18);
    scene.add(fillLight);

    // ENTITY: a singularity surrounded by a layered, luminous event horizon.
    const entity = new THREE.Group();
    system.add(entity);
    const voidSphere = new THREE.Mesh(new THREE.SphereGeometry(2.35, 72, 56), new THREE.MeshBasicMaterial({ color: '#000104' }));
    entity.add(voidSphere);
    const horizon = new THREE.Mesh(new THREE.TorusGeometry(2.95, .25, 24, 220), new THREE.MeshBasicMaterial({ color: '#d9b17c', transparent: true, opacity: .9, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    horizon.rotation.set(1.18, .12, -.2);
    entity.add(horizon);
    const innerHorizon = new THREE.Mesh(new THREE.TorusGeometry(2.55, .075, 16, 200), new THREE.MeshBasicMaterial({ color: '#a9d6f4', transparent: true, opacity: .88, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    innerHorizon.rotation.copy(horizon.rotation);
    entity.add(innerHorizon);
    const halo = new THREE.Mesh(new THREE.SphereGeometry(2.62, 56, 44), makeRim('#9bc9ed'));
    entity.add(halo);
    const corona = new THREE.Mesh(new THREE.TorusGeometry(3.65, .025, 8, 220), new THREE.MeshBasicMaterial({ color: '#8bbbe5', transparent: true, opacity: .42, blending: THREE.AdditiveBlending }));
    corona.rotation.copy(horizon.rotation);
    entity.add(corona);

    // Accretion disk: three shader layers, nearly edge-on, plus lensed back-image ring and vertical beam.
    const diskGroup = new THREE.Group();
    diskGroup.rotation.x = 1.36;
    diskGroup.rotation.z = -.14;
    const diskLayers = [
      makeDiskMaterial(2.7, 7.6, '#d9a557', .92, 1.1),
      makeDiskMaterial(3.6, 11.5, '#c88a3b', .42, -.7),
      makeDiskMaterial(2.5, 4.4, '#fff1c9', .8, 1.8),
    ];
    diskLayers.forEach((material, layer) => {
      const ringMesh = new THREE.Mesh(new THREE.RingGeometry(material.uniforms.uInner.value, material.uniforms.uOuter.value, 192, 1), material);
      ringMesh.position.z = layer * .02;
      diskGroup.add(ringMesh);
    });
    entity.add(diskGroup);

    const lensRing = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeGlowTexture('ring', 'rgba(255,226,170,.95)'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, opacity: .85 }));
    lensRing.scale.set(9.4, 9.4, 1);
    entity.add(lensRing);
    const beam = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeGlowTexture('beam'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, opacity: .95 }));
    beam.scale.set(2.4, 96, 1);
    scene.add(beam);
    const coreGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeGlowTexture('radial', 'rgba(255,214,140,.9)'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, opacity: .7 }));
    coreGlow.scale.set(16, 16, 1);
    scene.add(coreGlow);

    // Particles spiralling into the singularity (positions updated in the animation loop, no React state).
    const infallCount = mobile ? 110 : 280;
    const infallR = new Float32Array(infallCount);
    const infallA = new Float32Array(infallCount);
    const infallPos = new Float32Array(infallCount * 3);
    for (let i = 0; i < infallCount; i++) { infallR[i] = 3 + Math.random() * 9; infallA[i] = Math.random() * Math.PI * 2; }
    const infallGeometry = new THREE.BufferGeometry();
    infallGeometry.setAttribute('position', new THREE.BufferAttribute(infallPos, 3));
    diskGroup.add(new THREE.Points(infallGeometry, new THREE.PointsMaterial({ color: '#ffd9a0', size: .09, transparent: true, opacity: .85, blending: THREE.AdditiveBlending, depthWrite: false })));

    // Cold blue nebulae and a faint gold dust cloud, far behind the system.
    const nebulaTexture = makeGlowTexture('radial', 'rgba(255,255,255,.9)');
    [['#1f4f8a', -62, 18, -115, 120, .3], ['#2a3f7a', 72, -20, -125, 130, .26], ['#3a2a5a', 8, 42, -135, 110, .2], ['#12466b', -84, -30, -95, 100, .24], ['#6a4a22', 46, 8, -145, 120, .16]].forEach(([color, x, y, z, scale, opacity]) => {
      const cloud = new THREE.Sprite(new THREE.SpriteMaterial({ map: nebulaTexture, color: color as string, transparent: true, opacity: opacity as number, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
      cloud.position.set(x as number, y as number, z as number);
      cloud.scale.set(scale as number, (scale as number) * .72, 1);
      scene.add(cloud);
    });

    // Asteroid belt: one instanced mesh keeps draw calls and memory low.
    const asteroidCount = mobile ? 160 : 420;
    const asteroids = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: '#4a4640', roughness: 1, flatShading: true }), asteroidCount);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < asteroidCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 5.5 + Math.random() * 21;
      dummy.position.set(Math.cos(angle) * radius, (Math.random() - .5) * 1.6, Math.sin(angle) * radius * .56);
      dummy.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
      dummy.scale.setScalar(.04 + Math.random() * Math.random() * .22);
      dummy.updateMatrix();
      asteroids.setMatrixAt(i, dummy.matrix);
    }
    system.add(asteroids);

    const planets: THREE.Group[] = [];
    const clickable: THREE.Object3D[] = [];
    const sphere = new THREE.SphereGeometry(1, 56, 44);

    SPECS.forEach((spec, index) => {
      const orbitCurve = new THREE.EllipseCurve(0, 0, spec.radius, spec.radius * .56, 0, Math.PI * 2, false, 0);
      const orbitPoints = orbitCurve.getPoints(240).map(point => new THREE.Vector3(point.x, 0, point.y));
      const orbit = new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints(orbitPoints),
        new THREE.LineBasicMaterial({ color: index % 3 === 0 ? '#c9a878' : '#8da9c3', transparent: true, opacity: .16 + (index % 3) * .025 }),
      );
      orbit.rotation.y = (index - 4) * .035;
      orbit.rotation.x = (index % 2 ? .08 : -.055);
      system.add(orbit);

      const planet = new THREE.Group();
      planet.rotation.y = (index - 4) * .035;
      const material = new THREE.MeshStandardMaterial({ map: makeSurface(spec, index), roughness: .88, metalness: .025 });
      const body = new THREE.Mesh(sphere, material);
      body.scale.setScalar(spec.size);
      body.userData.worldIndex = index;
      planet.add(body);
      clickable.push(body);

      const atmosphere = new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({ color: spec.light, transparent: true, opacity: .075, side: THREE.BackSide, depthWrite: false }));
      atmosphere.scale.setScalar(spec.size * 1.12);
      planet.add(atmosphere);
      planet.add(new THREE.Mesh(new THREE.SphereGeometry(spec.size * 1.1, 36, 28), makeRim(spec.light)));

      if (index === 0 || index === 6 || index === 8) {
        const ring = new THREE.Mesh(new THREE.RingGeometry(spec.size * 1.35, spec.size * 1.85, 120), new THREE.MeshBasicMaterial({ color: spec.light, side: THREE.DoubleSide, transparent: true, opacity: .34, depthWrite: false }));
        ring.rotation.x = Math.PI / 2.25;
        ring.rotation.z = .22;
        planet.add(ring);
      }
      if (index === 3 || index === 7) {
        const moonOrbit = new THREE.Group();
        const moon = new THREE.Mesh(new THREE.SphereGeometry(spec.size * .14, 20, 16), new THREE.MeshStandardMaterial({ color: '#cbd7e2', roughness: .8 }));
        moon.position.x = spec.size * 1.8;
        moonOrbit.add(moon);
        planet.add(moonOrbit);
        planet.userData.moonOrbit = moonOrbit;
      }
      planet.userData.index = index;
      system.add(planet);
      planets.push(planet);
    });

    // Starfield with a subtle depth gradient and drifting foreground dust.
    const starCount = mobile ? 850 : 1750;
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const radius = 65 + Math.random() * 180;
      const angle = Math.random() * Math.PI * 2;
      const vertical = Math.random() * 2 - 1;
      starPositions.set([radius * Math.sqrt(1 - vertical * vertical) * Math.cos(angle), radius * vertical, radius * Math.sqrt(1 - vertical * vertical) * Math.sin(angle)], i * 3);
      const color = new THREE.Color(i % 19 === 0 ? '#e7c99d' : i % 5 === 0 ? '#a9cbea' : '#8798ad');
      starColors.set([color.r, color.g, color.b], i * 3);
    }
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    const stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({ size: .62, vertexColors: true, transparent: true, opacity: .82, sizeAttenuation: true }));
    scene.add(stars);

    const dustCount = mobile ? 90 : 220;
    const dustPositions = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) dustPositions.set([(Math.random() - .5) * 65, (Math.random() - .5) * 32, (Math.random() - .5) * 65], i * 3);
    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    const dust = new THREE.Points(dustGeometry, new THREE.PointsMaterial({ color: '#a9c6df', size: .1, transparent: true, opacity: .32 }));
    scene.add(dust);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let selectedIndex = -1;
    let hoverIndex = -1;
    let selectedAt = 0;
    let startAt = performance.now();
    let previousAt = startAt;
    let elapsed = 0;
    let yaw = 0;
    let targetYaw = 0;
    let pitch = 0;
    let targetPitch = 0;
    let pointerDown = false;
    let dragged = false;
    let downX = 0;
    let downY = 0;
    let lastX = 0;
    let lastY = 0;

    const selectWorld = (index: number) => {
      if (index < 0 || index >= planets.length || selectedIndex >= 0) return;
      selectedIndex = index;
      selectedAt = performance.now();
      const world = resolveWorld(worldsRef.current, SPECS[index].name);
      setActive(world?.id ?? `world-${index}`);
      setActiveLabel(world?.title ?? SPECS[index].name);
    };
    const reset = () => {
      selectedIndex = -1;
      startAt = performance.now();
      setActive(null);
      setIntroDone(false);
    };
    api.current = { select: selectWorld, reset };

    const onPointerDown = (event: PointerEvent) => {
      pointerDown = true;
      dragged = false;
      downX = lastX = event.clientX;
      downY = lastY = event.clientY;
      renderer.domElement.setPointerCapture(event.pointerId);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!pointerDown && event.pointerType === 'mouse' && selectedIndex < 0) {
        const bounds = renderer.domElement.getBoundingClientRect();
        pointer.set(((event.clientX - bounds.left) / bounds.width) * 2 - 1, -((event.clientY - bounds.top) / bounds.height) * 2 + 1);
        raycaster.setFromCamera(pointer, camera);
        const over = raycaster.intersectObjects(clickable, false)[0];
        hoverIndex = over ? Number(over.object.userData.worldIndex) : -1;
        renderer.domElement.style.cursor = over ? 'pointer' : 'grab';
      }
      if (!pointerDown || selectedIndex >= 0) return;
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      if (Math.hypot(event.clientX - downX, event.clientY - downY) > 6) dragged = true;
      targetYaw += dx * .003;
      targetPitch = clamp(targetPitch + dy * .0018, -.32, .32);
      lastX = event.clientX;
      lastY = event.clientY;
    };
    const onPointerUp = () => { pointerDown = false; };
    const onClick = (event: MouseEvent) => {
      if (dragged) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(clickable, false)[0];
      if (hit) selectWorld(Number(hit.object.userData.worldIndex));
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointercancel', onPointerUp);
    renderer.domElement.addEventListener('click', onClick);
    renderer.domElement.style.touchAction = 'pan-y';
    renderer.domElement.style.cursor = 'grab';

    const resizeObserver = new ResizeObserver(() => {
      if (!element.clientWidth || !element.clientHeight) return;
      camera.aspect = element.clientWidth / element.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(element.clientWidth, element.clientHeight);
    });
    resizeObserver.observe(element);

    const tick = (now: number) => {
      if (disposed) return;
      frame = requestAnimationFrame(tick);
      const delta = Math.min((now - previousAt) / 1000, .04);
      previousAt = now;
      elapsed += delta;

      planets.forEach((planet, index) => {
        const spec = SPECS[index];
        const angle = elapsed * spec.speed + spec.phase;
        planet.position.set(Math.cos(angle) * spec.radius, Math.sin(angle * .72 + index) * .34, Math.sin(angle) * spec.radius * .56);
        planet.rotation.y += delta * (.055 + index * .006);
        const planetBody = planet.children[0] as THREE.Mesh;
        planetBody.scale.setScalar(THREE.MathUtils.lerp(planetBody.scale.x, spec.size * (index === hoverIndex || index === selectedIndex ? 1.14 : 1), .12));
        const moonOrbit = planet.userData.moonOrbit as THREE.Group | undefined;
        if (moonOrbit) moonOrbit.rotation.y += delta * .28;
      });
      const flow = reducedMotion ? 0 : delta;
      diskLayers.forEach(material => { material.uniforms.uTime.value = elapsed; });
      const pulse = 1 + Math.sin(elapsed * 1.3) * .06;
      coreGlow.scale.setScalar(16 * pulse);
      (beam.material as THREE.SpriteMaterial).opacity = .88 + Math.sin(elapsed * .9) * .08;
      for (let i = 0; i < infallCount; i++) {
        infallR[i] -= flow * (.5 + 2.4 / infallR[i]);
        infallA[i] += flow * (2.2 / Math.max(infallR[i], 1));
        if (infallR[i] < 2.6) { infallR[i] = 8 + Math.random() * 6; infallA[i] = Math.random() * Math.PI * 2; }
        infallPos[i * 3] = Math.cos(infallA[i]) * infallR[i];
        infallPos[i * 3 + 1] = Math.sin(infallA[i]) * infallR[i];
        infallPos[i * 3 + 2] = Math.sin(i * 12.9898) * .12;
      }
      infallGeometry.attributes.position.needsUpdate = true;
      asteroids.rotation.y += flow * .006;
      horizon.rotation.z += delta * .026;
      innerHorizon.rotation.z -= delta * .034;
      corona.rotation.z += delta * .012;
      entity.rotation.y += delta * .018;
      stars.rotation.y += delta * .00035;
      dust.rotation.y -= delta * .006;

      if (selectedIndex < 0) {
        yaw += (targetYaw - yaw) * .045;
        pitch += (targetPitch - pitch) * .045;
        system.rotation.y = yaw;
        system.rotation.x = pitch;
        const progress = reducedMotion ? 1 : clamp((now - startAt) / 5200, 0, 1);
        const distance = reducedMotion ? 43 : 15 + 28 * ease(progress);
        const desired = new THREE.Vector3(Math.sin(yaw) * distance, 6 + pitch * 13, Math.cos(yaw) * distance);
        camera.position.lerp(desired, .028);
        camera.lookAt(0, 0, 0);
        if (progress >= 1) setIntroDone(true);
      } else {
        const target = new THREE.Vector3();
        planets[selectedIndex].getWorldPosition(target);
        const direction = new THREE.Vector3().subVectors(camera.position, target).normalize();
        camera.position.lerp(target.clone().add(direction.multiplyScalar(4.2)).add(new THREE.Vector3(0, .8, 0)), .035);
        camera.lookAt(target);
        if (now - selectedAt > 1550) {
          const world = resolveWorld(worldsRef.current, SPECS[selectedIndex].name);
          selectedIndex = -1;
          if (world) onSelectRef.current(world);
        }
      }
      renderer.render(scene, camera);
    };
    const onContextLost = (event: Event) => { event.preventDefault(); cancelAnimationFrame(frame); };
    const onContextRestored = () => { if (disposed) return; previousAt = performance.now(); frame = requestAnimationFrame(tick); };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);
    frame = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointercancel', onPointerUp);
      renderer.domElement.removeEventListener('click', onClick);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);
      scene.traverse(object => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points || object instanceof THREE.LineLoop) {
          object.geometry.dispose();
          const material = object.material;
          if (Array.isArray(material)) material.forEach(item => { const mapped = item as THREE.MeshStandardMaterial; mapped.map?.dispose(); item.dispose(); });
          else { const mapped = material as THREE.MeshStandardMaterial; mapped.map?.dispose(); material.dispose(); }
        }
      });
      scene.traverse(object => {
        if (object instanceof THREE.Sprite) { object.material.map?.dispose(); object.material.dispose(); }
      });
      asteroids.dispose();
      sphere.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      api.current = null;
    };
  }, []);

  return (
    <section className={`genesis-universe${introDone ? ' is-revealed' : ''}`} aria-label="GENESIS Universe">
      <div className="universe-canvas" ref={host} />
      {noWebgl && <div className="universe-fallback" aria-hidden="true" />}
      <div className="universe-atmosphere" />
      <div className="universe-topline"><span>GENESIS</span><span>PRIVATE</span></div>
      <div className="entity-caption"><span className="entity-pulse" /> <b>ENTITY</b><small>THE INTELLIGENCE AT THE CENTER</small></div>
      <div className="universe-heading"><span className="universe-kicker">A WORLD OF YOUR OWN</span><h2>THE LIVING<br /><em>UNIVERSE</em></h2><p>Девять измерений одной жизни. Исследуй свою систему.</p></div>
      <div className="universe-worlds" aria-label="Выбрать мир">
        {SPECS.map((spec, index) => { const world = resolveWorld(worlds, spec.name); return (
          <button key={spec.name} className={`universe-world world-${index + 1}`} onClick={() => api.current?.select(index)} disabled={!!active || !world}>
            <span className="world-number">{String(index + 1).padStart(2, '0')}</span>
            <span className="world-name">{spec.name}</span>
            <span className="world-subtitle">{spec.subtitle}</span>
            <span className="world-enter">EXPLORE ↗</span>
          </button>
        ); })}
      </div>
      <div className="universe-footer"><span><i /> EXPLORE <b>·</b> DISCOVER <b>·</b> EVOLVE</span><span>DRAG TO ROTATE <b>·</b> SELECT A WORLD</span></div>
      {active && <div className="universe-transition"><small>ESTABLISHING CONNECTION</small><strong>{activeLabel}</strong><span /></div>}
      {!introDone && !active && <button className="universe-skip" onClick={() => setIntroDone(true)}>SKIP INTRO ↗</button>}
      <button className="universe-reset" onClick={() => api.current?.reset()} aria-label="Повторить раскрытие Universe">↺</button>
      <style jsx>{`
        .genesis-universe{position:relative;isolation:isolate;overflow:hidden;width:100%;min-height:780px;height:min(900px,calc(100vh - 150px));margin:30px 0 0;background:#02050a;border:1px solid rgba(151,177,202,.2);color:#e8edf4;box-shadow:0 28px 90px rgba(0,0,0,.34)}
        .universe-canvas{position:absolute;inset:0;z-index:-2}.universe-canvas :global(canvas){display:block;width:100%;height:100%;outline:0}
        .universe-atmosphere{position:absolute;inset:0;z-index:-1;pointer-events:none;background:radial-gradient(ellipse at 50% 48%,transparent 0%,rgba(2,5,10,.04) 38%,rgba(2,5,10,.64) 100%),linear-gradient(180deg,rgba(2,5,10,.55),transparent 22%,transparent 72%,rgba(2,5,10,.7))}
        .universe-topline,.universe-footer{position:absolute;left:28px;right:28px;display:flex;justify-content:space-between;gap:14px;font:9px 'SFMono-Regular',Consolas,monospace;letter-spacing:.16em;color:rgba(204,220,235,.65)}.universe-topline{top:24px}.universe-topline i,.universe-topline b,.universe-footer b{color:#c9a878;font-style:normal}
        .entity-caption{position:absolute;top:22%;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:9px;white-space:nowrap;text-shadow:0 2px 14px #000}.entity-caption b{font:600 11px 'SFMono-Regular',Consolas,monospace;letter-spacing:.24em}.entity-caption small{font:8px 'SFMono-Regular',Consolas,monospace;letter-spacing:.13em;color:rgba(201,218,235,.62)}.entity-pulse,.universe-footer i{width:6px;height:6px;border-radius:50%;background:#b6d6ee;box-shadow:0 0 12px #9dc9ed}
        .universe-heading{position:absolute;top:31%;left:50%;transform:translateX(-50%);width:min(520px,80%);text-align:center;pointer-events:none;text-shadow:0 4px 24px #000}.universe-kicker{font:9px 'SFMono-Regular',Consolas,monospace;letter-spacing:.25em;color:#c7a878}.universe-heading h2{margin:14px 0 9px;font:400 clamp(38px,5.5vw,68px)/.91 'Avenir Next',Avenir,sans-serif;letter-spacing:.09em}.universe-heading h2 em{font-weight:300;color:#c9d8e7;font-style:normal;letter-spacing:.19em}.universe-heading p{font-size:12px;letter-spacing:.025em;color:rgba(224,232,241,.72)}
        .universe-worlds{position:absolute;inset:0;pointer-events:none}.universe-world{position:absolute;pointer-events:auto;display:grid;grid-template-columns:30px 1fr;gap:3px 8px;align-content:center;width:190px;min-height:92px;padding:12px 14px;text-align:left;background:linear-gradient(130deg,rgba(12,20,30,.82),rgba(8,13,21,.55));border:1px solid rgba(167,194,219,.2);backdrop-filter:blur(12px);transition:transform .25s,border-color .25s,background .25s;box-shadow:0 12px 34px rgba(0,0,0,.2)}
        .universe-world:hover:not(:disabled){transform:translateY(-4px);border-color:rgba(211,177,125,.7);background:rgba(17,27,39,.9)}.universe-world:disabled{opacity:.55}.world-number{grid-row:span 3;align-self:start;color:#c7a878;font:10px 'SFMono-Regular',Consolas,monospace}.world-name{font:600 11px 'SFMono-Regular',Consolas,monospace;letter-spacing:.15em}.world-subtitle{font-size:9px;line-height:1.4;color:rgba(201,216,230,.6)}.world-enter{font:8px 'SFMono-Regular',Consolas,monospace;letter-spacing:.14em;color:#c9a878;margin-top:4px}
        .world-1{left:4%;top:30%}.world-2{left:2%;top:49%}.world-3{left:5%;top:68%}.world-4{left:calc(50% - 95px);top:5%}.world-5{right:4%;top:30%}.world-6{right:2%;top:49%}.world-7{right:5%;top:68%}.world-8{left:calc(50% - 205px);bottom:5%}.world-9{left:calc(50% + 15px);bottom:5%}
        .universe-footer{bottom:22px;align-items:center}.universe-footer span:first-child{display:flex;align-items:center;gap:9px}.universe-footer i{display:inline-block;width:5px;height:5px;background:#8bbd9c;box-shadow:0 0 10px #8bbd9c}.universe-skip,.universe-reset{position:absolute;right:27px;bottom:60px;border:1px solid rgba(176,198,219,.28);background:rgba(6,12,20,.55);color:#d4e0eb;padding:9px 12px;font:8px 'SFMono-Regular',Consolas,monospace;letter-spacing:.14em}.universe-reset{right:auto;left:27px;width:34px;height:34px;padding:0;font-size:19px}.universe-transition{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:rgba(2,5,10,.55);backdrop-filter:blur(5px);pointer-events:none}.universe-transition small{font:9px 'SFMono-Regular',Consolas,monospace;letter-spacing:.24em;color:#c7a878}.universe-transition strong{font:400 clamp(26px,4vw,48px) 'Avenir Next',Avenir,sans-serif;letter-spacing:.16em}.universe-transition span{width:90px;height:1px;background:linear-gradient(90deg,transparent,#d1b17e,transparent)}
        @media(max-width:900px){.genesis-universe{height:850px;min-height:850px}.universe-world{width:165px}.world-1,.world-2,.world-3{left:12px}.world-5,.world-6,.world-7{right:12px}}
        @media(max-width:700px){.genesis-universe{height:900px;min-height:900px;margin-top:22px}.universe-topline,.universe-footer{left:13px;right:13px;font-size:7px;letter-spacing:.1em}.universe-topline{top:16px}.universe-footer{bottom:13px}.universe-footer span:last-child{max-width:45%;text-align:right;line-height:1.5}.entity-caption{top:18%;gap:6px}.entity-caption b{font-size:9px}.entity-caption small{font-size:6px}.universe-heading{top:26%;width:90%}.universe-heading h2{font-size:42px}.universe-heading p{font-size:10px}.universe-world{width:calc(50% - 20px);min-height:78px;padding:9px 8px;grid-template-columns:22px 1fr;gap:2px 5px;backdrop-filter:blur(8px)}.world-number{font-size:8px}.world-name{font-size:9px;letter-spacing:.09em}.world-subtitle{font-size:8px}.world-enter{font-size:7px;margin-top:2px}.world-1{left:8px;top:5%}.world-2{left:8px;top:43%}.world-3{left:8px;top:55%}.world-4{left:8px;top:67%}.world-5{right:8px;top:5%}.world-6{right:8px;top:43%}.world-7{right:8px;top:55%}.world-8{right:8px;top:67%}.world-9{left:calc(50% - 85px);bottom:9%;width:170px;min-height:70px}.universe-skip{right:12px;bottom:52px;font-size:7px}.universe-reset{left:12px;bottom:49px}.universe-transition strong{font-size:25px}}
        .universe-fallback{position:absolute;inset:0;z-index:-2;background:radial-gradient(ellipse 34% 3% at 50% 50%,rgba(255,226,170,.95),transparent 70%),radial-gradient(ellipse 4% 60% at 50% 50%,rgba(255,214,140,.5),transparent 70%),radial-gradient(circle at 50% 50%,#000 0,#000 5%,rgba(217,165,87,.35) 7%,transparent 22%),radial-gradient(ellipse at 30% 20%,rgba(31,79,138,.35),transparent 55%),#02050a}
        @media(max-width:700px){.universe-topline{top:max(18px,env(safe-area-inset-top))}.universe-footer{bottom:max(14px,env(safe-area-inset-bottom))}}
        @media(prefers-reduced-motion:reduce){.universe-world{transition:none}}
      `}</style>
    </section>
  );
}
