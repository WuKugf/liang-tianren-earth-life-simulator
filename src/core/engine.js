// 渲染引擎：渲染器、相机、天空穹顶、太阳/环境光、雾、星空
import * as THREE from 'three';

const SKY_VERT = /* glsl */ `
  varying vec3 vWorldDirection;
  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldDirection = worldPosition.xyz - cameraPosition;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SKY_FRAG = /* glsl */ `
  uniform vec3 topColor;
  uniform vec3 bottomColor;
  uniform vec3 glowColor;
  uniform vec3 sunDirection;
  uniform float glowStrength;
  varying vec3 vWorldDirection;
  void main() {
    vec3 dir = normalize(vWorldDirection);
    float h = clamp(dir.y, 0.0, 1.0);
    vec3 col = mix(bottomColor, topColor, pow(h, 0.62));
    float sunDot = max(dot(dir, normalize(sunDirection)), 0.0);
    col += glowColor * pow(sunDot, 38.0) * glowStrength * 0.85;
    col += glowColor * pow(sunDot, 7.0) * glowStrength * 0.16;
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export function createEngine(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0xd9eeff, 0.006);

  const camera = new THREE.PerspectiveCamera(
    56,
    window.innerWidth / window.innerHeight,
    0.1,
    900
  );
  camera.position.set(0, 4, 10);

  // 太阳光（带阴影）
  const sun = new THREE.DirectionalLight(0xfff2d5, 1.2);
  sun.position.set(30, 55, 20);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 170;
  sun.shadow.camera.left = -42;
  sun.shadow.camera.right = 42;
  sun.shadow.camera.top = 42;
  sun.shadow.camera.bottom = -42;
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.03;
  sun.shadow.radius = 2.5;
  scene.add(sun);
  scene.add(sun.target);

  // 环境光 + 半球光（天空反弹）
  const ambient = new THREE.AmbientLight(0xe8f2ff, 0.8);
  scene.add(ambient);

  const hemi = new THREE.HemisphereLight(0xbfe3ff, 0x6b7f52, 0.5);
  scene.add(hemi);

  // 天空穹顶（程序化渐变）
  const skyUniforms = {
    topColor: { value: new THREE.Color(0x63b7f0) },
    bottomColor: { value: new THREE.Color(0xd8f0ff) },
    glowColor: { value: new THREE.Color(0xfff2d5) },
    sunDirection: { value: new THREE.Vector3(0.4, 0.7, 0.3) },
    glowStrength: { value: 1 },
  };

  const skyDome = new THREE.Mesh(
    new THREE.SphereGeometry(420, 32, 20),
    new THREE.ShaderMaterial({
      uniforms: skyUniforms,
      vertexShader: SKY_VERT,
      fragmentShader: SKY_FRAG,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    })
  );
  skyDome.renderOrder = -1;
  scene.add(skyDome);

  // 星空
  const starCount = 320;
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i += 1) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 0.92 + 0.02);
    const r = 395;
    starPositions[i * 3] = Math.sin(phi) * Math.cos(theta) * r;
    starPositions[i * 3 + 1] = Math.cos(phi) * r;
    starPositions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * r;
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const starMaterial = new THREE.PointsMaterial({
    color: 0xdfeaff,
    size: 1.7,
    sizeAttenuation: false,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    fog: false,
  });
  const stars = new THREE.Points(starGeometry, starMaterial);
  stars.renderOrder = -1;
  scene.add(stars);

  function applyTime(state, focus) {
    scene.fog.color.copy(state.fogColor);
    scene.fog.density = state.fogDensity;

    ambient.color.copy(state.ambientColor);
    ambient.intensity = state.ambientIntensity;

    hemi.color.copy(state.skyColor);
    hemi.groundColor.copy(state.hemiGroundColor);
    hemi.intensity = 0.16 + state.ambientIntensity * 0.42;

    sun.color.copy(state.sunColor);
    sun.intensity = state.sunIntensity;

    const dir = state.sunDirection;
    const fx = focus ? focus.x : 0;
    const fz = focus ? focus.z : 0;
    const fy = focus ? focus.y : 0;
    sun.position.set(fx + dir.x * 70, fy + Math.max(dir.y, 0.05) * 90, fz + dir.z * 70);
    sun.target.position.set(fx, fy + 0.5, fz);
    sun.target.updateMatrixWorld();

    skyUniforms.topColor.value.copy(state.skyColor);
    skyUniforms.bottomColor.value.copy(state.skyBottomColor);
    skyUniforms.glowColor.value.copy(state.sunGlowColor);
    skyUniforms.sunDirection.value.copy(dir);
    skyUniforms.glowStrength.value = state.glowStrength;

    starMaterial.opacity = state.starAlpha;
    stars.visible = state.starAlpha > 0.02;

    renderer.toneMappingExposure = state.exposure;
  }

  function render() {
    skyDome.position.copy(camera.position);
    stars.position.copy(camera.position);
    renderer.render(scene, camera);
  }

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(w, h);
  }

  window.addEventListener('resize', resize);

  return {
    renderer,
    scene,
    camera,
    sun,
    ambient,
    hemi,
    applyTime,
    render,
    resize,
  };
}
