// Nav shadow on scroll
const nav = document.querySelector('.nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 12);
});

// Reveal on scroll
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// Lightbox
const lb = document.getElementById('lb');
const lbImg = document.getElementById('lb-img');
function openLightbox(src) {
  lbImg.src = src;
  lb.classList.add('open');
  document.body.style.overflow = 'hidden';
}
document.querySelectorAll('.figure img, .pair img, .zoom').forEach(img => {
  img.addEventListener('click', () => openLightbox(img.dataset.full || img.src));
});
function closeLb() { lb.classList.remove('open'); document.body.style.overflow = ''; }
lb.addEventListener('click', closeLb);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLb(); });

// Tabs (panel-based, e.g. Applications)
document.querySelectorAll('.tabs:not([data-gallery])').forEach(group => {
  const tabs = group.querySelectorAll('.tab');
  const panels = group.parentElement.querySelectorAll('.panel');
  tabs.forEach((tab, i) => tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    panels.forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    panels[i].classList.add('active');
  }));
});

// Dataset gallery: tab switching + carousel
const GAL_ORDER = ['style_transfer', 'inpainting', 'outpainting', 'editing'];
document.querySelectorAll('.tabs[data-gallery]').forEach(group => {
  const tabs = group.querySelectorAll('.tab');
  tabs.forEach((tab, i) => tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    GAL_ORDER.forEach((t, j) => {
      const g = document.getElementById('gal-' + t);
      if (g) g.style.display = (i === j) ? '' : 'none';
    });
  }));
});

function galNav(task, dir) {
  const gal = document.getElementById('gal-' + task);
  if (!gal) return;
  const tracks = gal.querySelectorAll('.track');
  let cur = 0;
  tracks.forEach((t, i) => { if (t.classList.contains('active')) cur = i; });
  tracks[cur].classList.remove('active');
  const next = (cur + dir + tracks.length) % tracks.length;
  tracks[next].classList.add('active');
}


// Copy bibtex
function copyBib(btn) {
  const txt = document.getElementById('bib').innerText;
  navigator.clipboard.writeText(txt).then(() => {
    const o = btn.innerText; btn.innerText = 'Copied!';
    setTimeout(() => btn.innerText = o, 1600);
  });
}

/* ============================================================
   Hero background: WebGL panorama-grid ripple
   ============================================================ */
function initRippleCanvas() {
  const canvas = document.getElementById('ripple-canvas');
  if (!canvas) return;
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) return;

  function resize() {
    canvas.width = canvas.clientWidth * Math.min(window.devicePixelRatio, 2);
    canvas.height = canvas.clientHeight * Math.min(window.devicePixelRatio, 2);
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  resize();
  window.addEventListener('resize', resize);

  const vertSrc = `attribute vec2 position; void main(){ gl_Position = vec4(position,0.0,1.0); }`;
  const fragSrc = `
    precision highp float;
    uniform float uTime; uniform vec2 uResolution; uniform vec2 uMouse;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
    float noise(vec2 p){ vec2 i=floor(p); vec2 f=fract(p); f=f*f*(3.0-2.0*f);
      float a=hash(i), b=hash(i+vec2(1.0,0.0)), c=hash(i+vec2(0.0,1.0)), d=hash(i+vec2(1.0,1.0));
      return mix(mix(a,b,f.x),mix(c,d,f.x),f.y); }
    float fbm(vec2 p){ float v=0.0,a=0.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.0; a*=0.5; } return v; }
    void main(){
      vec2 uv = gl_FragCoord.xy / uResolution;
      float aspect = uResolution.x / uResolution.y;
      vec2 st = (uv-0.5)*vec2(aspect,1.0);
      float t = uTime*0.15;
      vec2 mouse = (uMouse-0.5)*vec2(aspect,1.0);

      // domain-warped flowing noise (aurora / silk ribbons)
      vec2 p = st*1.5 + mouse*0.15;
      vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, -t*0.8)));
      vec2 r2 = vec2(fbm(p + 4.0*q + vec2(1.7, 9.2) + t*0.3),
                     fbm(p + 4.0*q + vec2(8.3, 2.8) - t*0.25));
      float f = fbm(p + 4.0*r2);

      // soft light base
      vec3 base = mix(vec3(0.95,0.96,1.0), vec3(0.93,0.95,0.99), uv.y);

      vec3 purple = vec3(0.427,0.369,0.988); // #6d5efc
      vec3 cyan   = vec3(0.133,0.722,0.812); // #22b8cf
      vec3 coral  = vec3(1.0,0.478,0.349);   // #ff7a59

      vec3 flow = mix(purple, cyan, clamp(f*1.4, 0.0, 1.0));
      flow = mix(flow, coral, clamp(length(r2)*0.6, 0.0, 1.0));

      // ribbon intensity from the warped field
      float ribbon = smoothstep(0.15, 0.95, f + 0.25*length(q));
      float intensity = ribbon * (0.28 + 0.12*sin(t*2.0 + f*6.0));

      vec3 color = mix(base, flow, clamp(intensity, 0.0, 0.42));

      // subtle vignette to keep center airy for the text
      float vig = 1.0 - smoothstep(0.35, 1.15, length(st));
      color = mix(color, base, (1.0-vig)*0.35);

      gl_FragColor = vec4(color, 1.0);
    }`;

  function sh(type, src){ const s=gl.createShader(type); gl.shaderSource(s,src); gl.compileShader(s); return s; }
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, vertSrc));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fragSrc));
  gl.linkProgram(prog); gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  const posLoc = gl.getAttribLocation(prog, 'position');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
  const uTime = gl.getUniformLocation(prog, 'uTime');
  const uRes = gl.getUniformLocation(prog, 'uResolution');
  const uMouse = gl.getUniformLocation(prog, 'uMouse');
  let mx = 0.5, my = 0.5;
  document.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mx = (e.clientX - rect.left) / rect.width;
    my = 1.0 - (e.clientY - rect.top) / rect.height;
  });
  function render(t){
    gl.uniform1f(uTime, t*0.001);
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform2f(uMouse, mx, my);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}
// PLACEHOLDER-BUBBLES

/* ============================================================
   Hero foreground: floating iridescent panorama bubbles
   ============================================================ */
function initBubbles() {
  const container = document.getElementById('bubble-container');
  if (!container || typeof THREE === 'undefined') return;

  const bubbleImgs = [
    'static/images/bubbles/bubble1.jpg',
    'static/images/bubbles/bubble2.jpg',
    'static/images/bubbles/bubble3.jpg',
    'static/images/bubbles/bubble4.jpg',
    'static/images/bubbles/bubble5.jpg',
    'static/images/bubbles/bubble6.jpg',
  ];
  // side: -1 left / +1 right ; ny: vertical fraction of half-height ; scale
  const configs = [
    { side: -1, ny: 0.58, z: -0.4, scale: 0.5 },
    { side: 1, ny: 0.5, z: 0.0, scale: 0.6 },
    { side: -1, ny: 0.0, z: 0.1, scale: 0.62 },
    { side: 1, ny: -0.05, z: -0.3, scale: 0.5 },
    { side: -1, ny: -0.6, z: -0.1, scale: 0.52 },
    { side: 1, ny: -0.62, z: 0.15, scale: 0.56 },
  ];

  const W = container.clientWidth, H = container.clientHeight || 600;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
  camera.position.set(0, 0, 8);
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  // frustum dimensions at z=0 (camera at z=8)
  function frustum() {
    const halfH = Math.tan((camera.fov * Math.PI / 180) / 2) * camera.position.z;
    return { halfH, halfW: halfH * camera.aspect };
  }
  // place bubbles inside the side gutter (between viewport edge and the
  // centered content column), and hide them when the gutter is too narrow.
  const CONTENT_W = 1180; // matches .wrap max-width
  function layout() {
    const vw = container.clientWidth;
    const gutterPx = (vw - CONTENT_W) / 2;      // px available beside text
    const enough = gutterPx > 120;
    container.style.display = enough ? '' : 'none';
    if (!enough) return;
    const { halfH, halfW } = frustum();
    const pxToWorld = (halfW * 2) / vw;
    // center of the gutter, in world units from screen center
    const gutterCenter = halfW - (gutterPx / 2) * pxToWorld;
    spheres.forEach((g, i) => {
      const cfg = configs[i];
      g.userData.baseX = cfg.side * gutterCenter;
      g.userData.baseY = cfg.ny * halfH;
      g.position.set(g.userData.baseX, g.userData.baseY, cfg.z);
    });
  }

  function bubbleMaterial(tex) {
    return new THREE.ShaderMaterial({
      uniforms: { uMap: { value: tex }, uTime: { value: 0 }, uHover: { value: 0 } },
      vertexShader: `
        varying vec3 vNormal; varying vec3 vViewDir; varying vec2 vUv; varying vec3 vObjNormal;
        void main(){
          vUv = uv; vNormal = normalize(normalMatrix*normal); vObjNormal = normalize(normal);
          vec4 mv = modelViewMatrix*vec4(position,1.0); vViewDir = -mv.xyz;
          gl_Position = projectionMatrix*mv;
        }`,
      fragmentShader: `
        uniform sampler2D uMap; uniform float uTime; uniform float uHover;
        varying vec3 vNormal; varying vec3 vViewDir; varying vec2 vUv; varying vec3 vObjNormal;
        #define PI 3.14159265359
        vec3 thinFilm(float c, float t){ float d=t*c; return vec3(
          0.5+0.5*cos(d*14.0+0.0), 0.5+0.5*cos(d*14.0+2.1), 0.5+0.5*cos(d*14.0+4.2)); }
        void main(){
          vec3 viewDir = normalize(vViewDir);
          vec3 normal = normalize(vNormal);
          float NdotV = max(dot(viewDir,normal),0.0);
          float fresnel = pow(1.0-NdotV, 3.2);
          vec3 dir = normalize(vObjNormal);
          float u = atan(dir.x, dir.z)/(2.0*PI)+0.5;
          float v = asin(clamp(dir.y,-1.0,1.0))/PI+0.5;
          vec3 panoColor = texture2D(uMap, vec2(u,v)).rgb;
          float thickness = 1.2 + sin(vUv.y*5.0+uTime*0.4)*0.3 + sin(vUv.x*7.0-uTime*0.25)*0.2;
          vec3 irid = thinFilm(NdotV, thickness);
          vec3 edge = mix(vec3(0.92,0.95,1.0), irid, 0.55);
          vec3 color = mix(panoColor, edge, fresnel*0.35);
          color += irid * (0.10 + uHover*0.10) * fresnel;
          gl_FragColor = vec4(color, 1.0);
        }`,
      side: THREE.FrontSide,
    });
  }

  const loader = new THREE.TextureLoader();
  const spheres = [];
  bubbleImgs.forEach((src, i) => {
    const tex = loader.load(src);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    const cfg = configs[i];
    const geo = new THREE.SphereGeometry(cfg.scale, 64, 64);
    const mat = bubbleMaterial(tex);
    const mesh = new THREE.Mesh(geo, mat);
    const group = new THREE.Group();
    group.add(mesh);
    group.userData = {
      baseX: 0, baseY: 0,
      phase: Math.random() * Math.PI * 2,
      speed: 0.3 + Math.random() * 0.25,
      amp: 0.10 + Math.random() * 0.06,
      hovering: false, imgIndex: i, mat, mesh,
    };
    scene.add(group);
    spheres.push(group);
  });
  layout();

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2(10, 10);
  let hovered = null;
  const dom = renderer.domElement;

  // --- drag state ---
  let dragged = null;       // group being dragged
  let dragMoved = 0;        // accumulated pointer movement (to tell click from drag)
  let downPos = null;
  const dragPlane = new THREE.Plane();
  const planeNormal = new THREE.Vector3(0, 0, 1);
  const dragPoint = new THREE.Vector3();
  const dragOffset = new THREE.Vector3();

  function pointer(e) {
    const r = dom.getBoundingClientRect();
    const cx = (e.touches ? e.touches[0].clientX : e.clientX);
    const cy = (e.touches ? e.touches[0].clientY : e.clientY);
    return {
      x: ((cx - r.left) / r.width) * 2 - 1,
      y: -((cy - r.top) / r.height) * 2 + 1,
      sx: cx, sy: cy,
    };
  }

  dom.addEventListener('mousemove', (e) => {
    const p = pointer(e);
    mouse.x = p.x; mouse.y = p.y;
    if (dragged) {
      dragMoved += Math.abs(e.movementX || 0) + Math.abs(e.movementY || 0);
      raycaster.setFromCamera(mouse, camera);
      if (raycaster.ray.intersectPlane(dragPlane, dragPoint)) {
        dragged.position.copy(dragPoint.add(dragOffset));
      }
    }
  });

  function startDrag(p) {
    mouse.x = p.x; mouse.y = p.y;
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(spheres.map(s => s.children[0]));
    if (hits.length === 0) return;
    dragged = hits[0].object.parent;
    dragMoved = 0;
    downPos = { x: p.sx, y: p.sy };
    // build a drag plane facing the camera at the bubble's depth
    planeNormal.copy(camera.getWorldDirection(new THREE.Vector3())).negate();
    dragPlane.setFromNormalAndCoplanarPoint(planeNormal, dragged.position);
    raycaster.ray.intersectPlane(dragPlane, dragPoint);
    dragOffset.copy(dragged.position).sub(dragPoint);
    dom.style.cursor = 'grabbing';
  }

  function endDrag(p) {
    if (!dragged) return;
    const moved = downPos && p ? Math.hypot(p.sx - downPos.x, p.sy - downPos.y) : dragMoved;
    const idx = dragged.userData.imgIndex;
    // settle new base position so the float animation continues from here
    dragged.userData.baseX = dragged.position.x;
    dragged.userData.baseY = dragged.position.y;
    dragged.userData.phase = 0;
    dragged = null;
    dom.style.cursor = 'grab';
    // treat as a click if the pointer barely moved
    if (moved < 6) openPano360(bubbleImgs[idx]);
  }

  dom.addEventListener('mousedown', (e) => { e.preventDefault(); startDrag(pointer(e)); });
  window.addEventListener('mouseup', (e) => endDrag(e.touches ? null : { sx: e.clientX, sy: e.clientY }));
  dom.addEventListener('touchstart', (e) => { startDrag(pointer(e)); }, { passive: true });
  dom.addEventListener('touchmove', (e) => {
    if (!dragged) return;
    const p = pointer(e);
    mouse.x = p.x; mouse.y = p.y;
    dragMoved += 10;
    raycaster.setFromCamera(mouse, camera);
    if (raycaster.ray.intersectPlane(dragPlane, dragPoint)) dragged.position.copy(dragPoint.add(dragOffset));
  }, { passive: true });
  dom.addEventListener('touchend', () => endDrag(null));

  let hidden = false;
  window.addEventListener('scroll', () => {
    const heroH = document.querySelector('.hero').offsetHeight;
    hidden = window.scrollY > heroH;
  });

  function animate(t) {
    requestAnimationFrame(animate);
    if (hidden) return;
    const time = t * 0.001;
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(spheres.map(s => s.children[0]));
    spheres.forEach(s => { s.userData.hovering = false; s.userData.mat.uniforms.uHover.value *= 0.9; });
    if (hits.length > 0) {
      const hit = hits[0].object.parent;
      hit.userData.hovering = true;
      hit.userData.mat.uniforms.uHover.value = 1;
      if (!dragged) dom.style.cursor = 'grab';
      hovered = hit;
    } else { if (!dragged) dom.style.cursor = 'default'; hovered = null; }
    spheres.forEach(s => {
      const u = s.userData;
      const side = configs[u.imgIndex].side;
      // frozen while being dragged
      if (!u.hovering && s !== dragged) {
        s.position.y = u.baseY + Math.sin(time * u.speed + u.phase) * u.amp;
        // horizontal drift only pushes outward (away from centered text)
        const drift = (0.5 + 0.5 * Math.sin(time * u.speed * 0.7 + u.phase)) * u.amp * 0.5;
        s.position.x = u.baseX + side * drift;
      }
      s.rotation.y += 0.0016;
      u.mat.uniforms.uTime.value = time;
    });
    renderer.render(scene, camera);
  }
  requestAnimationFrame(animate);

  window.addEventListener('resize', () => {
    const rw = container.clientWidth, rh = container.clientHeight || 600;
    camera.aspect = rw / rh;
    camera.updateProjectionMatrix();
    renderer.setSize(rw, rh);
    layout();
  });
}

/* ============================================================
   360° panorama viewer (drag-to-look perspective view)
   ============================================================ */
const pano360 = {
  scene: null, camera: null, renderer: null, mesh: null,
  lon: 0, lat: 0, isDragging: false, px: 0, py: 0, plon: 0, plat: 0,
  raf: null, holder: null,
};

function openPano360(src) {
  const viewer = document.getElementById('pano-viewer');
  const holder = document.getElementById('pano-canvas-holder');
  const hint = document.getElementById('pano-hint');
  if (!viewer || typeof THREE === 'undefined') { openLightbox(src); return; }

  viewer.classList.add('open');
  document.body.style.overflow = 'hidden';

  const w = holder.clientWidth, h = holder.clientHeight;

  if (!pano360.renderer) {
    pano360.holder = holder;
    pano360.scene = new THREE.Scene();
    pano360.camera = new THREE.PerspectiveCamera(72, w / h, 0.1, 100);
    pano360.renderer = new THREE.WebGLRenderer({ antialias: true });
    pano360.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    holder.appendChild(pano360.renderer.domElement);

    // inside-out sphere: equirectangular panorama mapped to the interior
    const geo = new THREE.SphereGeometry(50, 64, 40);
    geo.scale(-1, 1, 1);
    pano360.mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial());
    pano360.scene.add(pano360.mesh);

    bindPanoControls(pano360.renderer.domElement);
  }

  pano360.renderer.setSize(w, h);
  pano360.camera.aspect = w / h;
  pano360.camera.updateProjectionMatrix();

  // reset view direction
  pano360.lon = 0; pano360.lat = 0;

  const loader = new THREE.TextureLoader();
  loader.load(src, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    if (pano360.mesh.material.map) pano360.mesh.material.map.dispose();
    pano360.mesh.material.map = tex;
    pano360.mesh.material.needsUpdate = true;
  });

  if (!pano360.raf) animatePano();

  hint.classList.remove('hidden');
  clearTimeout(pano360._hintTimer);
  pano360._hintTimer = setTimeout(() => hint.classList.add('hidden'), 3200);
}

function closePano360() {
  const viewer = document.getElementById('pano-viewer');
  viewer.classList.remove('open');
  document.body.style.overflow = '';
  if (pano360.raf) { cancelAnimationFrame(pano360.raf); pano360.raf = null; }
}

function bindPanoControls(dom) {
  const start = (x, y) => { pano360.isDragging = true; pano360.px = x; pano360.py = y; pano360.plon = pano360.lon; pano360.plat = pano360.lat; };
  const move = (x, y) => {
    if (!pano360.isDragging) return;
    pano360.lon = (pano360.px - x) * 0.12 + pano360.plon;
    pano360.lat = (y - pano360.py) * 0.12 + pano360.plat;
    pano360.lat = Math.max(-85, Math.min(85, pano360.lat));
    document.getElementById('pano-hint').classList.add('hidden');
  };
  const end = () => { pano360.isDragging = false; };

  dom.addEventListener('mousedown', (e) => start(e.clientX, e.clientY));
  window.addEventListener('mousemove', (e) => move(e.clientX, e.clientY));
  window.addEventListener('mouseup', end);
  dom.addEventListener('touchstart', (e) => { const t = e.touches[0]; start(t.clientX, t.clientY); }, { passive: true });
  dom.addEventListener('touchmove', (e) => { const t = e.touches[0]; move(t.clientX, t.clientY); }, { passive: true });
  dom.addEventListener('touchend', end);
  // wheel to zoom (adjust FOV)
  dom.addEventListener('wheel', (e) => {
    e.preventDefault();
    pano360.camera.fov = Math.max(35, Math.min(95, pano360.camera.fov + e.deltaY * 0.03));
    pano360.camera.updateProjectionMatrix();
  }, { passive: false });
}

function animatePano() {
  pano360.raf = requestAnimationFrame(animatePano);
  // gentle auto-rotation until the user grabs it
  if (!pano360.isDragging) pano360.lon += 0.03;
  const phi = THREE.MathUtils.degToRad(90 - pano360.lat);
  const theta = THREE.MathUtils.degToRad(pano360.lon);
  const target = new THREE.Vector3(
    Math.sin(phi) * Math.cos(theta),
    Math.cos(phi),
    Math.sin(phi) * Math.sin(theta)
  );
  pano360.camera.lookAt(target);
  pano360.renderer.render(pano360.scene, pano360.camera);
}

window.addEventListener('resize', () => {
  if (!pano360.renderer || !document.getElementById('pano-viewer').classList.contains('open')) return;
  const w = pano360.holder.clientWidth, h = pano360.holder.clientHeight;
  pano360.renderer.setSize(w, h);
  pano360.camera.aspect = w / h;
  pano360.camera.updateProjectionMatrix();
});

(function bindPanoViewerUI() {
  const closeBtn = document.getElementById('pano-close');
  const viewer = document.getElementById('pano-viewer');
  if (closeBtn) closeBtn.addEventListener('click', closePano360);
  // click on the dimmed backdrop (outside the viewer box) closes
  if (viewer) viewer.addEventListener('click', (e) => { if (e.target === viewer) closePano360(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && viewer && viewer.classList.contains('open')) closePano360();
  });
})();

function initHero() {
  try { initRippleCanvas(); } catch (e) { console.warn('ripple canvas failed:', e); }
  try { initBubbles(); } catch (e) { console.warn('bubbles failed:', e); }
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHero);
} else {
  initHero();
}
