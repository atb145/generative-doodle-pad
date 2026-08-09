(() => {
  const canvas = document.getElementById("pad");
  const ctx = canvas.getContext("2d");

  const symmetryInput = document.getElementById("symmetry");
  const symmetryVal = document.getElementById("symmetryVal");
  const brushInput = document.getElementById("brush");
  const brushVal = document.getElementById("brushVal");
  const trailInput = document.getElementById("trail");
  const trailVal = document.getElementById("trailVal");
  const rainbowInput = document.getElementById("rainbow");
  const showLinesInput = document.getElementById("showLines");
  const clearBtn = document.getElementById("clearBtn");
  const saveBtn = document.getElementById("saveBtn");
  const panelToggle = document.getElementById("panelToggle");
  const panelBody = document.getElementById("panelBody");
  const collapseBtn = document.getElementById("collapseBtn");

  let dpr = Math.max(1, window.devicePixelRatio || 1);
  let width, height, cx, cy;

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    cx = width / 2;
    cy = height / 2;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#0a0a12";
    ctx.fillRect(0, 0, width, height);
  }
  window.addEventListener("resize", resize);
  resize();

  let hue = 260;
  let particles = [];
  let pointerDown = false;
  let lastX = 0, lastY = 0;
  let hasLast = false;

  function spawnBurst(x, y, vx, vy) {
    const size = parseFloat(brushInput.value);
    const speed = Math.min(30, Math.hypot(vx, vy));
    const count = Math.max(1, Math.round(speed / 3) + 1);

    for (let i = 0; i < count; i++) {
      const angle = Math.atan2(vy, vx) + (Math.random() - 0.5) * 1.2;
      const spd = 0.5 + Math.random() * 1.5 + speed * 0.05;
      particles.push({
        x, y,
        vx: Math.cos(angle) * spd + vx * 0.15,
        vy: Math.sin(angle) * spd + vy * 0.15,
        life: 1,
        decay: 0.008 + Math.random() * 0.012,
        size: size * (0.5 + Math.random() * 0.9),
        hue: rainbowInput.checked ? (hue + Math.random() * 40 - 20) : 260
      });
    }
  }

  function rotatePoint(x, y, angle) {
    const dx = x - cx, dy = y - cy;
    const cos = Math.cos(angle), sin = Math.sin(angle);
    return { x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos };
  }

  function drawParticleAllSymmetries(p) {
    const n = parseInt(symmetryInput.value, 10);
    const step = (Math.PI * 2) / n;
    ctx.fillStyle = `hsla(${p.hue}, 85%, 65%, ${p.life})`;
    for (let i = 0; i < n; i++) {
      const angle = step * i;
      const pt = rotatePoint(p.x, p.y, angle);
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();

      // also mirror across the axis for extra richness when n > 1
      const mdx = p.x - cx, mdy = p.y - cy;
      const mirroredAngle = Math.atan2(mdy, -mdx);
      const mirrorPt = rotatePoint(
        cx + Math.hypot(mdx, mdy) * Math.cos(mirroredAngle),
        cy + Math.hypot(mdx, mdy) * Math.sin(mirroredAngle),
        angle
      );
      ctx.beginPath();
      ctx.arc(mirrorPt.x, mirrorPt.y, p.size * p.life * 0.9, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawMirrorLines() {
    const n = parseInt(symmetryInput.value, 10);
    if (n < 2) return;
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    const step = (Math.PI * 2) / n;
    const r = Math.hypot(width, height);
    for (let i = 0; i < n; i++) {
      const angle = step * i;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
      ctx.stroke();
    }
    ctx.restore();
  }

  function tick() {
    const trailAmount = parseFloat(trailInput.value);
    const fadeAlpha = 1 / (trailAmount * 4 + 4);
    ctx.fillStyle = `rgba(10, 10, 18, ${fadeAlpha})`;
    ctx.fillRect(0, 0, width, height);

    if (showLinesInput.checked) drawMirrorLines();

    ctx.globalCompositeOperation = "lighter";
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.98;
      p.vy *= 0.98;
      p.life -= p.decay;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      drawParticleAllSymmetries(p);
    }
    ctx.globalCompositeOperation = "source-over";

    hue = (hue + 0.15) % 360;

    if (particles.length > 4000) particles.splice(0, particles.length - 4000);

    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  function pointerPos(e) {
    if (e.touches && e.touches.length) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  }

  function onDown(e) {
    pointerDown = true;
    hasLast = false;
    const { x, y } = pointerPos(e);
    lastX = x; lastY = y;
    spawnBurst(x, y, 0, 0);
    e.preventDefault();
  }

  function onMove(e) {
    if (!pointerDown) return;
    const { x, y } = pointerPos(e);
    const vx = hasLast ? x - lastX : 0;
    const vy = hasLast ? y - lastY : 0;
    hasLast = true;

    const steps = Math.max(1, Math.floor(Math.hypot(vx, vy) / 4));
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      spawnBurst(lastX + vx * t, lastY + vy * t, vx, vy);
    }

    lastX = x; lastY = y;
    e.preventDefault();
  }

  function onUp() {
    pointerDown = false;
    hasLast = false;
  }

  canvas.addEventListener("mousedown", onDown);
  canvas.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);

  canvas.addEventListener("touchstart", onDown, { passive: false });
  canvas.addEventListener("touchmove", onMove, { passive: false });
  window.addEventListener("touchend", onUp);

  symmetryInput.addEventListener("input", () => symmetryVal.textContent = symmetryInput.value);
  brushInput.addEventListener("input", () => brushVal.textContent = brushInput.value);
  trailInput.addEventListener("input", () => trailVal.textContent = trailInput.value);

  clearBtn.addEventListener("click", () => {
    particles = [];
    ctx.fillStyle = "#0a0a12";
    ctx.fillRect(0, 0, width, height);
  });

  saveBtn.addEventListener("click", () => {
    const link = document.createElement("a");
    link.download = `doodle-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  });

  function toggleCollapse() {
    const collapsed = panelBody.classList.toggle("collapsed");
    collapseBtn.textContent = collapsed ? "+" : "–";
  }
  panelToggle.addEventListener("click", (e) => {
    if (e.target === collapseBtn) return;
    toggleCollapse();
  });
  collapseBtn.addEventListener("click", toggleCollapse);
})();
