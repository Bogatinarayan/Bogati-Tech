import * as THREE from 'three';

/* ============================================================
   CONFIG - paste your free Web3Forms access key here
   Get one at https://web3forms.com (enter boy082913@gmail.com)
   ============================================================ */
const WEB3FORMS_ACCESS_KEY = 'YOUR_WEB3FORMS_ACCESS_KEY';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Icons ---------- */
const renderIcons = () => window.lucide && window.lucide.createIcons();
renderIcons();

/* ---------- Misc ---------- */
document.getElementById('year').textContent = new Date().getFullYear();
document.getElementById('access_key').value = WEB3FORMS_ACCESS_KEY;

/* ---------- Navbar ---------- */
const nav = document.getElementById('nav');
const progress = document.getElementById('scroll-progress');
const onScroll = () => {
  const y = window.scrollY;
  nav.classList.toggle('glass', y > 30);
  const h = document.documentElement.scrollHeight - innerHeight;
  progress.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
};
addEventListener('scroll', onScroll, { passive: true });
onScroll();

const menuBtn = document.getElementById('menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
menuBtn.addEventListener('click', () => {
  const open = mobileMenu.classList.toggle('hidden') === false;
  menuBtn.setAttribute('aria-expanded', String(open));
});
mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  mobileMenu.classList.add('hidden');
  menuBtn.setAttribute('aria-expanded', 'false');
}));

/* ---------- GSAP animations ---------- */
if (window.gsap && !reduceMotion) {
  gsap.registerPlugin(ScrollTrigger);

  gsap.from('.hero-in', { y: 40, opacity: 0, duration: 0.9, stagger: 0.12, ease: 'power3.out', delay: 0.2 });
  gsap.from('#hero-canvas', { opacity: 0, duration: 1.6 });

  gsap.utils.toArray('.reveal').forEach((el, i) => {
    gsap.from(el, {
      y: 50, opacity: 0, duration: 0.8, ease: 'power3.out', delay: (i % 3) * 0.08,
      scrollTrigger: { trigger: el, start: 'top 88%', once: true }
    });
  });

  document.querySelectorAll('.counter').forEach(el => {
    const obj = { v: 0 };
    ScrollTrigger.create({
      trigger: el, start: 'top 90%', once: true,
      onEnter: () => gsap.to(obj, { v: +el.dataset.to, duration: 2, ease: 'power2.out', onUpdate: () => { el.textContent = Math.round(obj.v); } })
    });
  });

  // Hero floating cards parallax on mouse
  const cards = document.querySelectorAll('[data-depth]');
  addEventListener('mousemove', e => {
    const x = (e.clientX / innerWidth - 0.5), y = (e.clientY / innerHeight - 0.5);
    cards.forEach(c => {
      const d = +c.dataset.depth;
      gsap.to(c, { x: -x * d, y: -y * d, duration: 0.8, ease: 'power2.out', overwrite: 'auto' });
    });
  });
} else {
  document.querySelectorAll('.counter').forEach(el => (el.textContent = el.dataset.to));
}

/* ---------- 3D tilt cards ---------- */
if (window.VanillaTilt && !reduceMotion && matchMedia('(hover: hover)').matches) {
  VanillaTilt.init(document.querySelectorAll('[data-tilt]'), { max: 14, speed: 500, glare: true, 'max-glare': 0.18, scale: 1.02 });
}

/* ---------- Active nav link ---------- */
const sections = ['home', 'about', 'services', 'process', 'pricing', 'work', 'faq', 'contact'];
const links = document.querySelectorAll('header nav a.nav-link');
const io = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (en.isIntersecting) {
      links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + en.target.id));
    }
  });
}, { rootMargin: '-45% 0px -50% 0px' });
sections.forEach(id => { const s = document.getElementById(id); if (s) io.observe(s); });

/* ---------- Pricing toggle ---------- */
const bm = document.getElementById('bill-monthly');
const ba = document.getElementById('bill-annual');
const on = 'bg-gradient-to-r from-brand-blue to-brand-sky text-white'.split(' ');
const setBilling = annual => {
  document.querySelectorAll('.price').forEach(p => { p.textContent = annual ? p.dataset.annual : p.dataset.monthly; });
  document.querySelectorAll('.cycle').forEach(c => { c.textContent = annual ? 'mo, billed yearly' : 'mo'; });
  [bm, ba].forEach(b => { b.classList.remove(...on); b.classList.add('text-slate-600'); });
  const active = annual ? ba : bm;
  active.classList.remove('text-slate-600'); active.classList.add(...on);
};
bm.addEventListener('click', () => setBilling(false));
ba.addEventListener('click', () => setBilling(true));

// Pre-select plan in the contact form
document.querySelectorAll('.plan-btn').forEach(b => b.addEventListener('click', () => {
  document.getElementById('service').value = b.dataset.plan;
}));

/* ---------- Web3Forms submission ---------- */
const form = document.getElementById('contact-form');
const statusEl = document.getElementById('form-status');
const btn = document.getElementById('submit-btn');
const label = document.getElementById('submit-label');

form.addEventListener('submit', async e => {
  e.preventDefault();
  statusEl.className = 'text-sm text-center min-h-[1.25rem]';

  if (!form.checkValidity()) { form.reportValidity(); return; }
  if (WEB3FORMS_ACCESS_KEY === 'YOUR_WEB3FORMS_ACCESS_KEY') {
    statusEl.textContent = 'Setup needed: add your Web3Forms access key in assets/js/main.js';
    statusEl.classList.add('text-amber-600');
    return;
  }

  btn.disabled = true; btn.classList.add('opacity-70');
  label.textContent = 'Sending...';
  try {
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: new FormData(form)
    });
    const data = await res.json();
    if (res.ok && data.success) {
      statusEl.textContent = 'Thank you! Your message was sent. We will contact you soon.';
      statusEl.classList.add('text-emerald-600');
      form.reset();
      document.getElementById('access_key').value = WEB3FORMS_ACCESS_KEY;
      if (window.gsap) gsap.fromTo(form, { scale: 0.98 }, { scale: 1, duration: 0.5, ease: 'back.out(3)' });
    } else {
      throw new Error(data.message || 'Submission failed');
    }
  } catch (err) {
    statusEl.textContent = 'Sorry, something went wrong. Please email boy082913@gmail.com or call +977 9762519563.';
    statusEl.classList.add('text-red-600');
  } finally {
    btn.disabled = false; btn.classList.remove('opacity-70');
    label.textContent = 'Send Message';
  }
});

/* ============================================================
   3D HERO SCENE (Three.js)
   Glowing core + orbit rings + circuit-style particle network
   in the logo colours
   ============================================================ */
(function heroScene() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); }
  catch { return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
  camera.position.set(0, 0, 9);

  const blue = 0x42a5f5, cyan = 0x29b6f6, purple = 0x9c27b0, deep = 0x1976d2;
  const group = new THREE.Group();
  scene.add(group);

  scene.add(new THREE.AmbientLight(0xffffff, 1.1));
  const l1 = new THREE.PointLight(0xffffff, 90, 40); l1.position.set(5, 4, 6); scene.add(l1);
  const l2 = new THREE.PointLight(purple, 40, 30); l2.position.set(-6, -3, 4); scene.add(l2);

  // Core: wireframe + solid icosahedron
  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.5, 1),
    new THREE.MeshStandardMaterial({ color: deep, metalness: 0.35, roughness: 0.35, flatShading: true, emissive: 0x0d3b8a, emissiveIntensity: 0.35 })
  );
  const wire = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.85, 1),
    new THREE.MeshBasicMaterial({ color: 0x1565c0, wireframe: true, transparent: true, opacity: 0.35 })
  );
  group.add(core, wire);

  // Orbit rings (like the logo's circle)
  const rings = [];
  [2.6, 3.2, 3.8].forEach((r, i) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(r, 0.014, 12, 160),
      new THREE.MeshBasicMaterial({ color: [blue, cyan, purple][i], transparent: true, opacity: 0.7 })
    );
    ring.rotation.x = Math.random() * Math.PI;
    ring.rotation.y = Math.random() * Math.PI;
    group.add(ring); rings.push(ring);

    const node = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), new THREE.MeshBasicMaterial({ color: 0x0b1b3a }));
    ring.add(node);
    ring.userData = { node, r, speed: 0.4 + i * 0.25, t: Math.random() * 6 };
  });

  // Small floating cubes (echo logo's cubes)
  const cubes = [];
  for (let i = 0; i < 14; i++) {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.22, 0.22),
      new THREE.MeshStandardMaterial({ color: i % 3 ? blue : purple, metalness: 0.6, roughness: 0.3, emissive: 0x112244 })
    );
    const a = Math.random() * Math.PI * 2, d = 4.5 + Math.random() * 4;
    m.position.set(Math.cos(a) * d, (Math.random() - 0.5) * 7, (Math.random() - 0.5) * 6 - 1);
    m.userData = { rx: Math.random() * 0.02, ry: Math.random() * 0.02, base: m.position.y, ph: Math.random() * 6 };
    scene.add(m); cubes.push(m);
  }

  // Particle network
  const N = 220;
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 22;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 12;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2;
  }
  const pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const points = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0x1565c0, size: 0.05, transparent: true, opacity: 0.55 }));
  scene.add(points);

  // Layout: sit the model on the right for desktop, behind text on mobile
  const layout = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    const desktop = w >= 1024;
    group.position.x = desktop ? 3.4 : 0;
    group.position.y = desktop ? 0 : 1.2;
    group.scale.setScalar(desktop ? 1 : 0.7);
  };
  layout();
  addEventListener('resize', layout);

  // Interaction
  const mouse = { x: 0, y: 0 };
  addEventListener('mousemove', e => { mouse.x = e.clientX / innerWidth - 0.5; mouse.y = e.clientY / innerHeight - 0.5; });
  let scrollY = 0;
  addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });

  let visible = true;
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(canvas);

  const clock = new THREE.Clock();
  const tick = () => {
    requestAnimationFrame(tick);
    if (!visible) return;
    const t = clock.getElapsedTime();
    const k = reduceMotion ? 0 : 1;

    core.rotation.x = t * 0.25 * k; core.rotation.y = t * 0.35 * k;
    wire.rotation.x = -t * 0.15 * k; wire.rotation.y = -t * 0.2 * k;
    rings.forEach(r => {
      r.rotation.z += 0.002 * k;
      const u = r.userData; u.t += 0.01 * u.speed * k;
      u.node.position.set(Math.cos(u.t) * u.r, Math.sin(u.t) * u.r, 0);
    });
    cubes.forEach(c => {
      c.rotation.x += c.userData.rx * k; c.rotation.y += c.userData.ry * k;
      c.position.y = c.userData.base + Math.sin(t + c.userData.ph) * 0.4 * k;
    });
    points.rotation.y = t * 0.02 * k;

    // smooth follow of mouse + scroll depth
    group.rotation.y += (mouse.x * 0.8 - group.rotation.y) * 0.05;
    group.rotation.x += (mouse.y * 0.5 - group.rotation.x) * 0.05;
    camera.position.z = 9 + Math.min(scrollY / 300, 4);
    renderer.render(scene, camera);
  };
  tick();
})();
