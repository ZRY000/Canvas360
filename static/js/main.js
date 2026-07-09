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
    float fbm(vec2 p){ float v=0.0,a=0.5; for(int i=0;i<4;i++){ v+=a*noise(p); p*=2.0; a*=0.5; } return v; }
    float gridLine(float v,float w){ return smoothstep(1.0-w,1.0,abs(sin(v*3.14159265))); }
    void main(){
      vec2 uv = gl_FragCoord.xy / uResolution;
      float aspect = uResolution.x / uResolution.y;
      vec2 st = (uv-0.5)*vec2(aspect,1.0);
      float t = uTime*0.4;
      vec2 mouse = (uMouse-0.5)*vec2(aspect,1.0);
      st += mouse*0.12;
      float n = fbm(st*1.6 + vec2(t*0.06,-t*0.04));
      st += vec2(n*0.06, n*0.04);
      float r = length(st);
      float angle = atan(st.y, st.x);
      float lat = gridLine(st.y*8.0 + n*1.0 - t*0.28, 0.038);
      float lon = gridLine(angle*6.5 + r*4.8 - t*0.38 + n*0.6, 0.032);
      float equator = gridLine(st.y*2.0 - t*0.15, 0.022);
      float seam = gridLine(st.x*11.0 + t*0.22, 0.018);
      float grid = max(lat, lon);
      grid = max(grid, equator*0.55);
      grid = max(grid, seam*0.45);
      grid *= 1.0 - smoothstep(0.58,1.08,r);
      float bands = sin(st.x*5.0 + st.y*1.5 + t*0.45 + n*1.8);
      bands = smoothstep(0.52,0.92,bands)*0.12;
      bands *= 1.0 - smoothstep(0.42,0.98,r);
      float pattern = clamp(grid + bands, 0.0, 1.0);
      vec3 baseTop = vec3(0.93,0.94,0.99);
      vec3 baseMid = vec3(0.97,0.98,1.0);
      vec3 baseBot = vec3(0.96,0.96,1.0);
      vec3 base = mix(mix(baseTop,baseMid,smoothstep(0.0,0.55,uv.y)), baseBot, smoothstep(0.55,1.0,uv.y));
      vec3 brandA = vec3(0.427,0.369,0.988);  // #6d5efc purple
      vec3 brandB = vec3(0.133,0.722,0.812);  // #22b8cf cyan
      vec3 accent = mix(brandA, brandB, 0.5 + 0.5*sin(t*0.25 + r*1.8 + angle));
      vec3 color = mix(base, accent, pattern*0.30);
      float glow = exp(-r*r*2.0)*0.05;
      color += brandB*glow;
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
  ];
  // side: -1 left / +1 right ; ny: vertical fraction of half-height ; scale
  const configs = [
    { side: -1, ny: 0.44, z: -0.4, scale: 0.62 },
    { side: 1, ny: 0.12, z: 0.0, scale: 0.78 },
    { side: -1, ny: -0.52, z: 0.1, scale: 0.5 },
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
  dom.addEventListener('mousemove', (e) => {
    const r = dom.getBoundingClientRect();
    mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    mouse.y = -((e.clientY - r.top) / r.height) * 2 + 1;
  });
  dom.addEventListener('click', () => {
    if (hovered) openLightbox(bubbleImgs[hovered.userData.imgIndex]);
  });

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
      dom.style.cursor = 'pointer';
      hovered = hit;
    } else { dom.style.cursor = 'default'; hovered = null; }
    spheres.forEach(s => {
      const u = s.userData;
      const side = configs[u.imgIndex].side;
      if (!u.hovering) {
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

function initHero() {
  try { initRippleCanvas(); } catch (e) { console.warn('ripple canvas failed:', e); }
  try { initBubbles(); } catch (e) { console.warn('bubbles failed:', e); }
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHero);
} else {
  initHero();
}
