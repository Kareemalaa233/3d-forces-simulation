/**
 * ============================================================================
 * 3D Force Vector Resolution & Resultant Simulator
 * ============================================================================
 * Problem Statement (Question 4):
 *   Determine the magnitude and coordinate direction angles of the resultant
 *   force acting on the support shaft at the origin:
 *     - Force F1 = 400 N: Lies in a vertical plane angled 20° from +x toward -y,
 *       making a 60° angle with the +z axis.
 *       * Step 1 (Vertical Plane Split):
 *           F1z  = 400 * cos(60°) = +200.00 N
 *           F1xy = 400 * sin(60°) =  346.41 N
 *       * Step 2 (XY Horizontal Plane Split):
 *           F1x  =  346.41 * cos(20°) = +325.52 N
 *           F1y  = -346.41 * sin(20°) = -118.48 N
 *
 *     - Force F2 = 500 N: Defined directly by coordinate direction angles
 *       α = 60° (with +x), β = 60° (with +y), γ = 135° (with +z).
 *       * Single-Click Direct Resolution:
 *           F2x = 500 * cos(60°)  = +250.00 N
 *           F2y = 500 * cos(60°)  = +250.00 N
 *           F2z = 500 * cos(135°) = -353.55 N
 *
 *     - Resultant Force FR = F1 + F2:
 *           FRx = 325.52 + 250.00 = +575.52 N
 *           FRy = -118.48 + 250.00 = +131.52 N
 *           FRz = 200.00 - 353.55 = -153.55 N
 *           |FR| = sqrt(FRx^2 + FRy^2 + FRz^2) = 610.0 N
 *           α = 19.4°, β = 77.5°, γ = 104.6°
 * ============================================================================
 */

const canvas = document.getElementById('simCanvas');
const ctx = canvas.getContext('2d');

// ============================================================================
// 1. Physics Constants & 3D Vector Coordinates
// ============================================================================
const DEG = Math.PI / 180;

// Force F1 = 400 N
const F1_MAG = 400;
const F1_Z   = F1_MAG * Math.cos(60 * DEG);        // +200.00 N
const F1_XY  = F1_MAG * Math.sin(60 * DEG);        //  346.41 N
const F1_X   = F1_XY * Math.cos(20 * DEG);         // +325.52 N
const F1_Y   = -F1_XY * Math.sin(20 * DEG);        // -118.48 N

// Force F2 = 500 N
const F2_MAG = 500;
const F2_X   = F2_MAG * Math.cos(60 * DEG);        // +250.00 N
const F2_Y   = F2_MAG * Math.cos(60 * DEG);        // +250.00 N
const F2_Z   = F2_MAG * Math.cos(135 * DEG);       // -353.55 N

// Resultant FR = F1 + F2
const FR_X   = F1_X + F2_X;                        // +575.52 N
const FR_Y   = F1_Y + F2_Y;                        // +131.52 N
const FR_Z   = F1_Z + F2_Z;                        // -153.55 N

// World unit scale: 100 N = 1.0 unit in 3D space
const SCALE = 1 / 100;

const V_O     = { x: 0,            y: 0,            z: 0 };
const V_F1    = { x: F1_X * SCALE, y: F1_Y * SCALE, z: F1_Z * SCALE };
const V_F1_XY = { x: F1_X * SCALE, y: F1_Y * SCALE, z: 0 };
const V_F1_X  = { x: F1_X * SCALE, y: 0,            z: 0 };
const V_F1_Y  = { x: 0,            y: F1_Y * SCALE, z: 0 };
const V_F1_Z  = { x: 0,            y: 0,            z: F1_Z * SCALE };

const V_F2    = { x: F2_X * SCALE, y: F2_Y * SCALE, z: F2_Z * SCALE };
const V_F2_X  = { x: F2_X * SCALE, y: 0,            z: 0 };
const V_F2_Y  = { x: 0,            y: F2_Y * SCALE, z: 0 };
const V_F2_Z  = { x: 0,            y: 0,            z: F2_Z * SCALE };

const V_FR    = { x: FR_X * SCALE, y: FR_Y * SCALE, z: FR_Z * SCALE };
const V_FR_XY = { x: FR_X * SCALE, y: FR_Y * SCALE, z: 0 };
const V_FR_X  = { x: FR_X * SCALE, y: 0,            z: 0 };
const V_FR_Y  = { x: 0,            y: FR_Y * SCALE, z: 0 };
const V_FR_Z  = { x: 0,            y: 0,            z: FR_Z * SCALE };

// ============================================================================
// 2. Simulation State, Animation Channels & Undo Stack
// ============================================================================
let state = {
  f1Stage: 0,  // 0: unresolved, 1: split on vertical plane (F1z, F1xy), 2: split on XY plane (F1x, F1y)
  f2Stage: 0,  // 0: unresolved, 1: resolved in one click onto x, y, z axes (F2x, F2y, F2z)
  showF1: true,
  showF2: true,
  showFR: false
};

let historyStack = [];

// Smoothly interpolated animation progress [0..1]
let anim = {
  f1Step1: 0,
  f1Step2: 0,
  f2Resolved: 0,
  frProg: 0
};

// Interactive Hover Targets
let hoveredForce = null; // 'F1' | 'F2' | null
let hoveredPlane = null; // plane id when hovered

// ============================================================================
// 3. 3D Orbit Camera & Zoom Configuration
// ============================================================================
const BASE_DIST = 13.5;
let cam = {
  yaw: 0.72,
  pitch: 0.36,
  distance: BASE_DIST,
  targetYaw: 0.72,
  targetPitch: 0.36,
  targetDist: BASE_DIST,
  panX: 0,
  panY: 10
};

let isDragging = false;
let isPanning = false;
let dragMoved = false;
let lastMouse = { x: 0, y: 0 };
let mousePos = { x: -1000, y: -1000 };

let forceHitSegments = [];
let planePolygonsScreen = [];

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

/**
 * Projects a 3D world point {x, y, z} onto 2D screen coordinates {x, y, depth, scale}.
 */
function project3D(p) {
  const w = window.innerWidth;
  const h = window.innerHeight;

  const cosP = Math.cos(cam.pitch);
  const sinP = Math.sin(cam.pitch);
  const cosY = Math.cos(cam.yaw);
  const sinY = Math.sin(cam.yaw);

  const eyeX = cam.distance * cosP * cosY;
  const eyeY = cam.distance * cosP * sinY;
  const eyeZ = cam.distance * sinP;

  const rightX = -sinY;
  const rightY = cosY;
  const rightZ = 0;

  const upX = -sinP * cosY;
  const upY = -sinP * sinY;
  const upZ = cosP;

  const dx = p.x - eyeX;
  const dy = p.y - eyeY;
  const dz = p.z - eyeZ;

  const camX = p.x * rightX + p.y * rightY + p.z * rightZ;
  const camY = p.x * upX + p.y * upY + p.z * upZ;
  const depth = dx * (-cosP * cosY) + dy * (-cosP * sinY) + dz * (-sinP);

  const fovScale = Math.min(w, h) * 8.4;
  const perspective = fovScale / Math.max(0.35, depth);

  return {
    x: w * 0.5 + camX * perspective + cam.panX,
    y: h * 0.5 - camY * perspective + cam.panY,
    depth,
    scale: perspective
  };
}

function lerp3D(a, b, t) {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t
  };
}

// ============================================================================
// 4. State Transitions & Undo Actions
// ============================================================================
function pushState(nextState) {
  historyStack.push({ ...state });
  state = { ...nextState };
  updateButtons();
}

function clickForceF1() {
  if (state.f1Stage === 0) {
    pushState({ ...state, f1Stage: 1 });
  } else if (state.f1Stage === 1) {
    pushState({ ...state, f1Stage: 2 });
  }
}

function clickForceF2() {
  if (state.f2Stage === 0) {
    pushState({ ...state, f2Stage: 1 });
  }
}

function toggleF1() {
  pushState({ ...state, showF1: !state.showF1 });
}

function toggleF2() {
  pushState({ ...state, showF2: !state.showF2 });
}

function toggleResultant() {
  if (!state.showFR) {
    pushState({ ...state, f1Stage: 2, f2Stage: 1, showF1: true, showF2: true, showFR: true });
  } else {
    pushState({ ...state, showFR: false });
  }
}

function undoResolution() {
  if (historyStack.length === 0) return;
  state = historyStack.pop();
  updateButtons();
}

function resetAll() {
  if (state.f1Stage === 0 && state.f2Stage === 0 && state.showF1 && state.showF2 && !state.showFR) return;
  historyStack.push({ ...state });
  state = { f1Stage: 0, f2Stage: 0, showF1: true, showF2: true, showFR: false };
  updateButtons();
}

function updateButtons() {
  document.getElementById('btn-undo').disabled = historyStack.length === 0;

  const f1Btn = document.getElementById('btn-toggle-f1');
  f1Btn.className = state.showF1 ? 'sim-btn btn-sky-on' : 'sim-btn btn-sky-off';

  const f2Btn = document.getElementById('btn-toggle-f2');
  f2Btn.className = state.showF2 ? 'sim-btn btn-emerald-on' : 'sim-btn btn-emerald-off';

  const frBtn = document.getElementById('btn-fr');
  frBtn.className = state.showFR ? 'sim-btn btn-fuchsia-on' : 'sim-btn btn-fuchsia-off';
}

// ============================================================================
// 5. 3D Drawing Primitives (Planes, Lines, Force Vectors, Arcs, Support Shaft)
// ============================================================================
function drawPlane3D(id, pts3D, rgbColor, isHovered) {
  const pts2D = pts3D.map(project3D);
  ctx.save();
  ctx.beginPath();
  pts2D.forEach((p, idx) => {
    if (idx === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.closePath();

  // Only fill the plane surface when hovered; otherwise draw dotted boundary lines
  if (isHovered) {
    ctx.fillStyle = `rgba(${rgbColor}, 0.30)`;
    ctx.fill();
    ctx.strokeStyle = `rgba(${rgbColor}, 0.95)`;
    ctx.lineWidth = 2.2;
    ctx.setLineDash([]);
    ctx.stroke();
  } else {
    ctx.strokeStyle = `rgba(${rgbColor}, 0.48)`;
    ctx.lineWidth = 1.4;
    ctx.setLineDash([4, 5]);
    ctx.stroke();
  }
  ctx.restore();

  planePolygonsScreen.push({ id, poly: pts2D });
}

function drawLine3D(a, b, color, width = 1.5, dash = []) {
  const pa = project3D(a);
  const pb = project3D(b);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(pa.x, pa.y);
  ctx.lineTo(pb.x, pb.y);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dash);
  ctx.stroke();
  ctx.restore();
}

function drawArrow3D(from, to, color, width = 3.2, label = '', subLabel = '', headSize = 12, alpha = 1.0, registerHitId = null) {
  if (alpha <= 0.02) return;
  const p1 = project3D(from);
  const p2 = project3D(to);
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.hypot(dx, dy);
  if (len < 2) return;

  const angle = Math.atan2(dy, dx);

  ctx.save();
  ctx.globalAlpha = alpha;

  if (registerHitId && hoveredForce === registerHitId) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 18;
    width += 1.6;
  }

  // Vector Shaft
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x - Math.cos(angle) * (headSize * 0.7), p2.y - Math.sin(angle) * (headSize * 0.7));
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Vector Arrowhead
  ctx.beginPath();
  ctx.moveTo(p2.x, p2.y);
  ctx.lineTo(
    p2.x - headSize * Math.cos(angle - Math.PI / 6.5),
    p2.y - headSize * Math.sin(angle - Math.PI / 6.5)
  );
  ctx.lineTo(
    p2.x - headSize * 0.72 * Math.cos(angle),
    p2.y - headSize * 0.72 * Math.sin(angle)
  );
  ctx.lineTo(
    p2.x - headSize * Math.cos(angle + Math.PI / 6.5),
    p2.y - headSize * Math.sin(angle + Math.PI / 6.5)
  );
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();

  // Floating Label Pill
  if (label) {
    const offsetDist = 18;
    const lx = p2.x + Math.cos(angle) * offsetDist;
    const ly = p2.y + Math.sin(angle) * offsetDist;

    ctx.font = 'bold 13px ui-sans-serif, system-ui, sans-serif';
    const m1 = ctx.measureText(label).width;
    const m2 = subLabel ? ctx.measureText(subLabel).width * 0.85 : 0;
    const boxW = Math.max(m1, m2) + 14;
    const boxH = subLabel ? 34 : 22;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(lx - boxW / 2, ly - boxH / 2, boxW, boxH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, lx, subLabel ? ly - 6 : ly);

    if (subLabel) {
      ctx.font = '600 11px ui-sans-serif, system-ui, sans-serif';
      ctx.fillStyle = color;
      ctx.fillText(subLabel, lx, ly + 8);
    }
  }

  ctx.restore();

  if (registerHitId) {
    forceHitSegments.push({
      id: registerHitId,
      x1: p1.x,
      y1: p1.y,
      x2: p2.x,
      y2: p2.y
    });
  }
}

function drawAngleArc3D(dir1, dir2, radius, label, color = '#e2e8f0') {
  const l1 = Math.hypot(dir1.x, dir1.y, dir1.z) || 1;
  const l2 = Math.hypot(dir2.x, dir2.y, dir2.z) || 1;
  const u1 = { x: dir1.x / l1, y: dir1.y / l1, z: dir1.z / l1 };
  const u2 = { x: dir2.x / l2, y: dir2.y / l2, z: dir2.z / l2 };

  const steps = 20;
  const arcPts3D = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const vx = u1.x * (1 - t) + u2.x * t;
    const vy = u1.y * (1 - t) + u2.y * t;
    const vz = u1.z * (1 - t) + u2.z * t;
    const vl = Math.hypot(vx, vy, vz) || 1;
    arcPts3D.push({
      x: (vx / vl) * radius,
      y: (vy / vl) * radius,
      z: (vz / vl) * radius
    });
  }

  const pts2D = arcPts3D.map(project3D);
  ctx.save();
  ctx.beginPath();
  pts2D.forEach((p, idx) => {
    if (idx === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const mid3D = arcPts3D[Math.floor(steps / 2)];
  const labelPos = project3D({
    x: mid3D.x * 1.22,
    y: mid3D.y * 1.22,
    z: mid3D.z * 1.22
  });
  ctx.font = 'bold 12px Georgia, serif';
  const tw = ctx.measureText(label).width;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
  ctx.beginPath();
  ctx.roundRect(labelPos.x - tw / 2 - 4, labelPos.y - 9, tw + 8, 18, 4);
  ctx.fill();

  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, labelPos.x, labelPos.y);
  ctx.restore();
}

function drawSupportRod() {
  const rodStart = { x: -3.2, y: 0.4, z: 0.55 };
  const rodTip = { x: 0, y: 0, z: 0 };
  const pStart = project3D(rodStart);
  const pConeBase = project3D({ x: -0.55, y: 0.07, z: 0.09 });
  const pTip = project3D(rodTip);

  ctx.save();
  const gradWall = ctx.createRadialGradient(pStart.x, pStart.y, 4, pStart.x, pStart.y, 46);
  gradWall.addColorStop(0, 'rgba(148, 138, 118, 0.38)');
  gradWall.addColorStop(1, 'rgba(148, 138, 118, 0)');
  ctx.fillStyle = gradWall;
  ctx.beginPath();
  ctx.arc(pStart.x, pStart.y, 46, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(pStart.x, pStart.y);
  ctx.lineTo(pConeBase.x, pConeBase.y);
  ctx.strokeStyle = '#a67c52';
  ctx.lineWidth = 14;
  ctx.lineCap = 'round';
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(pStart.x, pStart.y);
  ctx.lineTo(pConeBase.x, pConeBase.y);
  ctx.strokeStyle = '#d4b28c';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.stroke();

  const angle = Math.atan2(pConeBase.y - pTip.y, pConeBase.x - pTip.x);
  const perp = angle + Math.PI / 2;
  ctx.beginPath();
  ctx.moveTo(pTip.x, pTip.y);
  ctx.lineTo(pConeBase.x + Math.cos(perp) * 7, pConeBase.y + Math.sin(perp) * 7);
  ctx.lineTo(pConeBase.x - Math.cos(perp) * 7, pConeBase.y - Math.sin(perp) * 7);
  ctx.closePath();
  ctx.fillStyle = '#b99168';
  ctx.strokeStyle = '#5c4028';
  ctx.lineWidth = 1.2;
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

// ============================================================================
// 6. Geometry Hit-Testing (2D Polygon & Line Segment Distance)
// ============================================================================
function pointInPolygon2D(pt, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y;
    const xj = poly[j].x, yj = poly[j].y;
    const intersect = ((yi > pt.y) !== (yj > pt.y)) &&
      (pt.x < (xj - xi) * (pt.y - yi) / ((yj - yi) || 1e-6) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function distToSegment2D(p, s) {
  const dx = s.x2 - s.x1;
  const dy = s.y2 - s.y1;
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) return Math.hypot(p.x - s.x1, p.y - s.y1);
  let t = ((p.x - s.x1) * dx + (p.y - s.y1) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (s.x1 + t * dx), p.y - (s.y1 + t * dy));
}

// ============================================================================
// 7. Main Animation & Render Loop
// ============================================================================
function render() {
  const w = window.innerWidth;
  const h = window.innerHeight;

  cam.yaw += (cam.targetYaw - cam.yaw) * 0.15;
  cam.pitch += (cam.targetPitch - cam.pitch) * 0.15;
  cam.distance += (cam.targetDist - cam.distance) * 0.15;

  anim.f1Step1    += ((state.f1Stage >= 1 ? 1 : 0) - anim.f1Step1) * 0.12;
  anim.f1Step2    += ((state.f1Stage >= 2 ? 1 : 0) - anim.f1Step2) * 0.12;
  anim.f2Resolved += ((state.f2Stage >= 1 ? 1 : 0) - anim.f2Resolved) * 0.12;
  anim.frProg     += ((state.showFR ? 1 : 0) - anim.frProg) * 0.12;

  ctx.clearRect(0, 0, w, h);

  const bgGrad = ctx.createRadialGradient(w * 0.5, h * 0.5, 40, w * 0.5, h * 0.5, Math.max(w, h) * 0.75);
  bgGrad.addColorStop(0, '#162033');
  bgGrad.addColorStop(1, '#090d16');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  forceHitSegments = [];
  planePolygonsScreen = [];

  // 1. Reference & F1 Projection Planes (Dotted outlines; shaded fill only on hover)
  drawPlane3D(
    'xy_main',
    [
      { x: 4.4, y: -2.2, z: 0 },
      { x: 4.4, y: 3.6,  z: 0 },
      { x: -0.8, y: 3.6, z: 0 },
      { x: -0.8, y: -2.2, z: 0 }
    ],
    '99, 102, 241',
    hoveredPlane === 'xy_main'
  );

  drawPlane3D(
    'xz_main',
    [
      { x: 0,   y: 0, z: 0 },
      { x: 4.2, y: 0, z: 0 },
      { x: 4.2, y: 0, z: 3.0 },
      { x: 0,   y: 0, z: 3.0 }
    ],
    '251, 191, 36',
    hoveredPlane === 'xz_main'
  );

  drawPlane3D(
    'yz_main',
    [
      { x: 0, y: 0,   z: 0 },
      { x: 0, y: 3.6, z: 0 },
      { x: 0, y: 3.6, z: 3.0 },
      { x: 0, y: 0,   z: 3.0 }
    ],
    '168, 85, 247',
    hoveredPlane === 'yz_main'
  );

  if (state.showF1) {
    drawPlane3D(
      'f1_xy_plane',
      [V_O, V_F1_X, V_F1_XY, V_F1_Y],
      '56, 189, 248',
      hoveredPlane === 'f1_xy_plane'
    );
    drawLine3D(V_O, V_F1_XY, 'rgba(56, 189, 248, 0.5)', 1.3, [4, 4]);

    drawPlane3D(
      'f1_vert_plane',
      [V_O, V_F1_XY, V_F1, V_F1_Z],
      '56, 189, 248',
      hoveredPlane === 'f1_vert_plane'
    );
  }

  planePolygonsScreen.reverse();

  // 2. Support Shaft & Coordinate Axes
  drawSupportRod();

  const axisLen = 5.2;
  drawLine3D({ x: -3.5, y: 0, z: 0 }, V_O, 'rgba(148, 163, 184, 0.35)', 1.4, [4, 5]);
  drawLine3D({ x: 0, y: -3.5, z: 0 }, V_O, 'rgba(148, 163, 184, 0.35)', 1.4, [4, 5]);
  drawLine3D({ x: 0, y: 0, z: -4.2 }, V_O, 'rgba(148, 163, 184, 0.35)', 1.4, [4, 5]);

  drawArrow3D(V_O, { x: axisLen, y: 0, z: 0 }, '#cbd5e1', 2.2, 'x', '', 9);
  drawArrow3D(V_O, { x: 0, y: axisLen, z: 0 }, '#cbd5e1', 2.2, 'y', '', 9);
  drawArrow3D(V_O, { x: 0, y: 0, z: axisLen * 0.85 }, '#cbd5e1', 2.2, 'z', '', 9);

  // 3. Force F1 = 400 N (Two-Stage Planar Resolution)
  if (state.showF1) {
    drawAngleArc3D({ x: 0, y: 0, z: 1 }, V_F1, 1.45, '60°', '#7dd3fc');
    drawAngleArc3D({ x: 1, y: 0, z: 0 }, V_F1_XY, 1.85, '20°', '#7dd3fc');

    const f1BaseAlpha = 1.0 - anim.f1Step1 * 0.45;
    drawArrow3D(V_O, V_F1, '#0ea5e9', 4.2, 'F₁ = 400 N', '', 14, f1BaseAlpha, 'F1');

    if (anim.f1Step1 > 0.01) {
      const t1 = anim.f1Step1;
      const curF1Z = lerp3D(V_F1, V_F1_Z, t1);
      const curF1XY = lerp3D(V_F1, V_F1_XY, t1);

      drawArrow3D(V_O, curF1Z, '#38bdf8', 3.6, 'F₁z = 200 N', '400 cos 60°', 12, t1);

      const f1xyAlpha = t1 * (1 - anim.f1Step2 * 0.5);
      drawArrow3D(V_O, curF1XY, '#f59e0b', 3.6, 'F₁xy = 346.4 N', '400 sin 60°', 12, f1xyAlpha, 'F1');
    }

    if (anim.f1Step2 > 0.01) {
      const t2 = anim.f1Step2;
      const curF1X = lerp3D(V_F1_XY, V_F1_X, t2);
      const curF1Y = lerp3D(V_F1_XY, V_F1_Y, t2);

      drawArrow3D(V_O, curF1X, '#fb7185', 3.6, 'F₁x = 325.5 N', '346.4 cos 20°', 12, t2);
      drawArrow3D(V_O, curF1Y, '#34d399', 3.6, 'F₁y = −118.5 N', '−346.4 sin 20°', 12, t2);
    }
  }

  // 4. Force F2 = 500 N (One-Click Coordinate Direction Angle Resolution, No Planes)
  if (state.showF2) {
    drawAngleArc3D({ x: 1, y: 0, z: 0 }, V_F2, 1.55, '60°', '#6ee7b7');
    drawAngleArc3D({ x: 0, y: 1, z: 0 }, V_F2, 1.85, '60°', '#6ee7b7');
    drawAngleArc3D({ x: 0, y: 0, z: 1 }, V_F2, 1.15, '135°', '#fcd34d');

    const f2BaseAlpha = 1.0 - anim.f2Resolved * 0.45;
    drawArrow3D(V_O, V_F2, '#10b981', 4.2, 'F₂ = 500 N', '', 14, f2BaseAlpha, 'F2');

    if (anim.f2Resolved > 0.01) {
      const t = anim.f2Resolved;
      const curF2X = lerp3D(V_F2, V_F2_X, t);
      const curF2Y = lerp3D(V_F2, V_F2_Y, t);
      const curF2Z = lerp3D(V_F2, V_F2_Z, t);

      drawArrow3D(V_O, curF2X, '#fb7185', 3.6, 'F₂x = 250 N', '500 cos 60°', 12, t);
      drawArrow3D(V_O, curF2Y, '#34d399', 3.6, 'F₂y = 250 N', '500 cos 60°', 12, t);
      drawArrow3D(V_O, curF2Z, '#38bdf8', 3.6, 'F₂z = −353.6 N', '500 cos 135°', 12, t);
    }
  }

  // 5. Resultant Force FR = 610 N
  if (anim.frProg > 0.01) {
    const tr = anim.frProg;
    const curFR = lerp3D(V_O, V_FR, tr);

    drawLine3D(V_FR_X, V_FR_XY, 'rgba(232, 121, 249, 0.5)', 1.3, [4, 4]);
    drawLine3D(V_FR_Y, V_FR_XY, 'rgba(232, 121, 249, 0.5)', 1.3, [4, 4]);
    drawLine3D(V_FR_XY, V_FR, 'rgba(232, 121, 249, 0.65)', 1.5, [4, 4]);
    drawLine3D(V_FR_Z, V_FR, 'rgba(232, 121, 249, 0.5)', 1.3, [4, 4]);

    drawArrow3D(
      V_O,
      curFR,
      '#e879f9',
      5.0,
      'F_R = 610.0 N',
      'α=19.4°, β=77.5°, γ=104.6°',
      16,
      tr
    );
  }

  // Origin Marker
  const pO = project3D(V_O);
  ctx.save();
  ctx.beginPath();
  ctx.arc(pO.x, pO.y, 4.5, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2;
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  requestAnimationFrame(render);
}

// ============================================================================
// 8. User Input & Event Listeners
// ============================================================================
function updateHoverTargets(clientX, clientY) {
  mousePos = { x: clientX, y: clientY };

  let foundForce = null;
  let minDist = 16;
  for (const seg of forceHitSegments) {
    const d = distToSegment2D(mousePos, seg);
    if (d < minDist) {
      minDist = d;
      foundForce = seg.id;
    }
  }
  hoveredForce = foundForce;

  let foundPlane = null;
  if (!foundForce) {
    for (const pl of planePolygonsScreen) {
      if (pointInPolygon2D(mousePos, pl.poly)) {
        foundPlane = pl.id;
        break;
      }
    }
  }
  hoveredPlane = foundPlane;

  canvas.classList.toggle('pointer-hover', Boolean(hoveredForce || hoveredPlane));
}

canvas.addEventListener('contextmenu', (e) => e.preventDefault());

canvas.addEventListener('pointerdown', (e) => {
  isDragging = true;
  isPanning = (e.button === 2 || e.shiftKey);
  dragMoved = false;
  lastMouse = { x: e.clientX, y: e.clientY };
  canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener('pointermove', (e) => {
  if (isDragging) {
    const dx = e.clientX - lastMouse.x;
    const dy = e.clientY - lastMouse.y;
    if (Math.hypot(dx, dy) > 3) dragMoved = true;

    if (isPanning) {
      cam.panX += dx;
      cam.panY += dy;
    } else {
      cam.targetYaw -= dx * 0.0085;
      cam.targetPitch = Math.max(-1.45, Math.min(1.45, cam.targetPitch + dy * 0.0085));
    }
    lastMouse = { x: e.clientX, y: e.clientY };
  } else {
    updateHoverTargets(e.clientX, e.clientY);
  }
});

canvas.addEventListener('pointerup', (e) => {
  isDragging = false;
  canvas.releasePointerCapture(e.pointerId);

  if (!dragMoved && e.button === 0) {
    updateHoverTargets(e.clientX, e.clientY);
    if (hoveredForce === 'F1') {
      clickForceF1();
    } else if (hoveredForce === 'F2') {
      clickForceF2();
    }
  }
});

// Zoom Controls (15% to 600%)
const zoomSlider = document.getElementById('zoom-slider');
const zoomResetBtn = document.getElementById('btn-zoom-reset');

function setZoomPercent(pct) {
  const clamped = Math.max(15, Math.min(600, Math.round(pct)));
  cam.targetDist = BASE_DIST / (clamped / 100);
  zoomSlider.value = String(clamped);
  zoomResetBtn.textContent = `${clamped}%`;
}

canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const currentPct = (BASE_DIST / cam.targetDist) * 100;
  const factor = e.deltaY < 0 ? 1.14 : 1 / 1.14;
  setZoomPercent(currentPct * factor);
}, { passive: false });

document.getElementById('btn-zoom-in').addEventListener('click', () => {
  const currentPct = (BASE_DIST / cam.targetDist) * 100;
  setZoomPercent(currentPct * 1.25);
});

document.getElementById('btn-zoom-out').addEventListener('click', () => {
  const currentPct = (BASE_DIST / cam.targetDist) * 100;
  setZoomPercent(currentPct / 1.25);
});

zoomResetBtn.addEventListener('click', () => {
  cam.panX = 0;
  cam.panY = 10;
  setZoomPercent(100);
});

zoomSlider.addEventListener('input', (e) => {
  setZoomPercent(Number(e.target.value));
});

document.getElementById('btn-undo').addEventListener('click', undoResolution);
document.getElementById('btn-reset').addEventListener('click', resetAll);
document.getElementById('btn-toggle-f1').addEventListener('click', toggleF1);
document.getElementById('btn-toggle-f2').addEventListener('click', toggleF2);
document.getElementById('btn-fr').addEventListener('click', toggleResultant);

updateButtons();
requestAnimationFrame(render);
