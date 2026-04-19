'use client';

import { removeBackground } from '@imgly/background-removal';
import { useRef, useState, useEffect, useCallback } from 'react';
import { useColorScheme } from '@mui/material/styles';

import { Iconify } from 'src/components/iconify';

import Box from '@mui/material/Box';

// ----------------------------------------------------------------------

const M = (f, b) => ({ front: f, back: b || f });
const P = (name) => `/mockups/${name.split(' ').join('%20')}`;

const FALLBACK_MOCKUP_IMGS = {
  tshirt: {
    black:  M(P('Black T shirt Front.png'),       P('Black t shirt back.png')),
    white:  M(P('white tshirt-front.png'),         P('white tshirt-back.png')),
    gray:   M(P('Gray T shirt front.png'),         P('t shirt back.png')),
    navy:   M(P('Dark blue t shirt front.png'),    P('Dark blue t shirt back.png')),
    brown:  M(P('Brown t shirt front.png'),        P('Brown T shirt back.png')),
    red:    M(P('Red T shirt front.png'),          P('Red T shirt back.png')),
    yellow: M(P('Yellow t shirt front.png'),       P('Yellow T shirt back.png')),
  },
  hoodie: {
    black:  M(P('Black Hoodie front.png'),         P('Black Hoodie back.png')),
    white:  M(P('white hoodie-front.png'),         P('White hoodie-back.png')),
    gray:   M(P('Gray Hoodie front.png'),          P('Gray hoodie back.png')),
    navy:   M(P('Dark blue hoodie front.png'),     P('Dark Blue hoodie back.png')),
    blue:   M(P('Blue hoodie front.png'),          P('Blue hoodie back.png')),
    brown:  M(P('Brown Hoodie front.png'),         P('Brown Hoodie back.png')),
    purple: M(P('Purple hoodie front.png'),        P('Purple Hoodie back.png')),
    yellow: M(P('Yellow Hoodie front.png'),        P('Yellow Hoodie back.png')),
  },
  longsleeve: {
    black:  M(P('Long sleeves shirt black front.png')),
    gray:   M(P('Long sleeves gray front.png')),
    navy:   M(P('Long sleeves shirt dark blue front.png')),
  },
};

const FALLBACK_VARIANTS = [
  { id: 'black',  name: 'Хар',      hex: '#0a0a0a' },
  { id: 'white',  name: 'Цагаан',   hex: '#f0f0f0' },
  { id: 'gray',   name: 'Саарал',   hex: '#888888' },
  { id: 'navy',   name: 'Хар цэнхэр', hex: '#1a2e4a' },
  { id: 'blue',   name: 'Цэнхэр',   hex: '#1e5799' },
  { id: 'brown',  name: 'Бор',      hex: '#6b3a2a' },
  { id: 'red',    name: 'Улаан',    hex: '#c0392b' },
  { id: 'yellow', name: 'Шар',      hex: '#d4a017' },
  { id: 'purple', name: 'Ягаан',    hex: '#6a0dad' },
];

function buildMockupData(rows) {
  if (!rows || rows.length === 0) return { imgs: FALLBACK_MOCKUP_IMGS, variants: FALLBACK_VARIANTS };

  const imgs = {};
  const variantMap = {};

  rows.forEach((row) => {
    if (!imgs[row.garment_type]) imgs[row.garment_type] = {};
    imgs[row.garment_type][row.color_id] = M(row.front_url, row.back_url || row.front_url);
    if (!variantMap[row.color_id]) {
      variantMap[row.color_id] = { id: row.color_id, name: row.color_name, hex: row.color_hex };
    }
  });

  const variants = Object.values(variantMap);
  return { imgs, variants };
}

const BG_COLORS = [
  { hex: '#0d0d16', name: 'Dark' },
  { hex: '#111118', name: 'Darker' },
  { hex: '#000000', name: 'Black' },
  { hex: '#1a0a2e', name: 'Purple Dark' },
  { hex: '#0a1628', name: 'Navy Dark' },
  { hex: '#f5f5f5', name: 'Light Gray' },
  { hex: '#e8e8e8', name: 'Gray' },
  { hex: '#ffffff', name: 'White' },
];

const TABS = [
  { id: 'garment', icon: '👕', label: 'Хувцас' },
  { id: 'design', icon: '🖼', label: 'Зураг' },
  { id: 'text', icon: '✏️', label: 'Текст' },
  { id: 'bg', icon: '🌅', label: 'Дэвсгэр' },
];

let _nextId = 1;
const nextId = () => String(_nextId++);

const HANDLE_R = 7;
const ROT_DIST = 30;

function toLocal(cx, cy, px, py, rot) {
  const dx = cx - px; const dy = cy - py;
  const cos = Math.cos(-rot); const sin = Math.sin(-rot);
  return { lx: dx * cos - dy * sin, ly: dx * sin + dy * cos };
}

function drawSelectionHandles(ctx, hw, hh) {
  const pad = 6;
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#9b30ff'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 3]);
  ctx.strokeRect(-hw - pad, -hh - pad, (hw + pad) * 2, (hh + pad) * 2);
  ctx.setLineDash([]);
  ctx.strokeStyle = 'rgba(155,48,255,0.6)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, -hh - pad); ctx.lineTo(0, -hh - ROT_DIST); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, -hh - ROT_DIST, HANDLE_R, 0, Math.PI * 2);
  ctx.fillStyle = '#9b30ff'; ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.arc(0, -hh - ROT_DIST, 3.5, -Math.PI * 0.8, Math.PI * 0.8); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, -hh - ROT_DIST, 3.5, Math.PI * 0.2, Math.PI * 1.8); ctx.stroke();
  [[-hw-pad,-hh-pad],[hw+pad,-hh-pad],[-hw-pad,hh+pad],[hw+pad,hh+pad]].forEach(([x, y]) => {
    ctx.fillStyle = '#9b30ff'; ctx.fillRect(x - HANDLE_R, y - HANDLE_R, HANDLE_R * 2, HANDLE_R * 2);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
    ctx.strokeRect(x - HANDLE_R, y - HANDLE_R, HANDLE_R * 2, HANDLE_R * 2);
  });
  ctx.restore();
}

// ----------------------------------------------------------------------
// Small reusable UI pieces

function SliderRow({ label, value, min, max, suffix, onChange }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1.5 }}>
      {label && (
        <Box component="span" sx={{ fontSize: '0.68rem', color: '#555', textTransform: 'uppercase', minWidth: 66, flexShrink: 0, letterSpacing: '0.5px' }}>
          {label}
        </Box>
      )}
      <input
        type="range" min={min} max={max} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          flex: 1, WebkitAppearance: 'none', height: 3, borderRadius: 2, outline: 'none', cursor: 'pointer',
          background: `linear-gradient(90deg,#9b30ff ${pct}%,#1e1e2e ${pct}%)`,
        }}
      />
      <Box component="span" sx={{ color: '#9b30ff', fontFamily: '"Orbitron",sans-serif', fontSize: '0.65rem', minWidth: 36, textAlign: 'right', flexShrink: 0 }}>
        {value}{suffix}
      </Box>
    </Box>
  );
}

function Btn({ children, active, variant, onClick, sx: sxProp }) {
  const isPrimary = variant === 'primary';
  return (
    <Box
      component="button" onClick={onClick}
      sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75,
        px: 1.5, py: 1, cursor: 'pointer', borderRadius: '4px', transition: 'all 0.15s',
        fontFamily: '"Rajdhani",sans-serif', fontSize: '0.82rem', letterSpacing: '0.5px',
        background: isPrimary ? 'linear-gradient(135deg,#9b30ff,#6a0dad)' : active ? 'rgba(155,48,255,0.18)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${isPrimary || active ? '#9b30ff' : 'rgba(155,48,255,0.18)'}`,
        color: isPrimary || active ? '#fff' : '#999',
        '&:hover': {
          borderColor: '#9b30ff', color: '#fff',
          background: isPrimary ? 'linear-gradient(135deg,#b040ff,#7a1dcd)' : 'rgba(155,48,255,0.12)',
          boxShadow: '0 0 14px rgba(155,48,255,0.3)',
        },
        ...sxProp,
      }}
    >
      {children}
    </Box>
  );
}

function SectionLabel({ children }) {
  return (
    <Box sx={{ fontSize: '0.62rem', color: '#444', letterSpacing: '2.5px', textTransform: 'uppercase', mb: 1.25, fontFamily: '"Orbitron",sans-serif' }}>
      {children}
    </Box>
  );
}

// ----------------------------------------------------------------------

export function CustomizerView() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme !== 'light';

  const [MOCKUP_IMGS, setMockupImgs] = useState(FALLBACK_MOCKUP_IMGS);
  const [VARIANTS, setVariants] = useState(FALLBACK_VARIANTS);

  useEffect(() => {
    fetch('/api/mockups')
      .then((r) => r.json())
      .then(({ mockups }) => {
        if (mockups && mockups.length > 0) {
          const { imgs, variants } = buildMockupData(mockups);
          setMockupImgs(imgs);
          setVariants(variants);
        }
      })
      .catch(() => {});
  }, []);

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const ctxRef = useRef(null);
  const sizeRef = useRef({ W: 0, H: 0 });
  const loadedImgs = useRef({});
  const dragging = useRef(false);
  const dragMode = useRef('design');
  const dragAction = useRef('move'); // 'move' | 'rotate' | 'resize'
  const dragStart = useRef(null);   // stores initial state on drag start

  // Helper: get design geometry in canvas space
  const getDesignGeom = useCallback((d, mr) => {
    const px = mr.dx + d.dx * mr.dw;
    const py = mr.dy + d.dy * mr.dh;
    const sz = (d.size / 100) * mr.dw;
    const aspect = d.img.width / d.img.height;
    const hw = sz / 2;
    const hh = (sz / aspect) / 2;
    const rot = (d.rot * Math.PI) / 180;
    return { px, py, hw, hh, rot };
  }, []);

  // Helper: get text geometry in canvas space
  const getTextGeom = useCallback((t, mr) => {
    const px = mr.dx + t.tx * mr.dw;
    const py = mr.dy + t.ty * mr.dh;
    const hw = (t.measuredWidth || t.size * (t.content?.length || 1) * 0.55) / 2;
    const hh = t.size * 0.6;
    const rot = ((t.rot || 0) * Math.PI) / 180;
    return { px, py, hw, hh, rot };
  }, []);

  // Detect which handle (if any) was clicked for selected design
  const detectAction = useCallback((canvasX, canvasY) => {
    const d = S.current.designs.find((x) => x.id === S.current.selDesignId);
    if (!d?.img || !S.current.mockupRect) return null;
    const { px, py, hw, hh, rot } = getDesignGeom(d, S.current.mockupRect);
    const { lx, ly } = toLocal(canvasX, canvasY, px, py, rot);
    // Rotation handle
    if (Math.hypot(lx, ly - (-hh - ROT_DIST)) < HANDLE_R + 8) return 'rotate';
    // Corner handles
    const corners = [[-hw, -hh], [hw, -hh], [-hw, hh], [hw, hh]];
    for (const [cx, cy] of corners) {
      if (Math.hypot(lx - cx, ly - cy) < HANDLE_R + 8) return 'resize';
    }
    // Inside box → move
    if (Math.abs(lx) <= hw + 4 && Math.abs(ly) <= hh + 4) return 'move';
    return null;
  }, [getDesignGeom]);

  const S = useRef({
    type: 'tshirt',
    view: 'front',
    colorId: 'black',
    bg: '#0d0d16',
    mockupRect: null,
    designs: [],
    texts: [],
    selDesignId: null,
    selTextId: null,
  });

  // UI state
  const [type, setType] = useState('tshirt');
  const [view, setView] = useState('front');
  const [colorId, setColorId] = useState('black');
  const [bg, setBg] = useState('#0d0d16');
  const [bgHexInput, setBgHexInput] = useState('#0d0d16');
  const [activeTab, setActiveTab] = useState('garment');
  const [activeDragMode, setActiveDragMode] = useState('design');

  const [designs, setDesigns] = useState([]);
  const [selDesignId, setSelDesignId] = useState(null);
  const [dSize, setDSize] = useState(30);
  const [dRot, setDRot] = useState(0);
  const [dOp, setDOp] = useState(100);
  const [dBlend, setDBlend] = useState('normal');

  const [texts, setTexts] = useState([]);
  const [selTextId, setSelTextId] = useState(null);
  const [tContent, setTContent] = useState('');
  const [tFont, setTFont] = useState('Arial');
  const [tColor, setTColor] = useState('#ffffff');
  const [tSize, setTSize] = useState(26);
  const [tRot, setTRot] = useState(0);

  const [toast, setToast] = useState('');
  const [bgRemoving, setBgRemoving] = useState(false);
  const [sendDialog, setSendDialog] = useState(false);
  const [sendStep, setSendStep] = useState(0); // 0=idle, 1=downloaded, 2=opened
  const [zoom, setZoom] = useState(1);
  const zoomRef = useRef(1);
  const pinchRef = useRef(null);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }, []);

  // ── REDRAW ──────────────────────────────────────────────────────────────
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    const { W, H } = sizeRef.current;
    if (!canvas || !ctx || !W) return;

    // Background — user-chosen solid color
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = S.current.bg;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = 'rgba(155,48,255,0.05)';
    ctx.beginPath();
    for (let x = 24; x < W; x += 32)
      for (let y = 24; y < H; y += 32)
        ctx.arc(x, y, 1, 0, Math.PI * 2);
    ctx.fill();

    // Draw mockup using actual product photo for current type + color + view
    const key = `${S.current.type}_${S.current.colorId}_${S.current.view}`;
    const mockImg = loadedImgs.current[key];

    if (mockImg) {
      const iw = mockImg.naturalWidth || mockImg.width;
      const ih = mockImg.naturalHeight || mockImg.height;
      const aspect = iw / ih;
      // Fit image inside canvas preserving aspect ratio (like objectFit: contain)
      let dw, dh;
      if (aspect > W / H) {
        dw = W * 0.92;
        dh = dw / aspect;
      } else {
        dh = H * 0.92;
        dw = dh * aspect;
      }
      const dx = (W - dw) / 2;
      const dy = (H - dh) / 2;
      ctx.drawImage(mockImg, dx, dy, dw, dh);
      S.current.mockupRect = { dx, dy, dw, dh };
    } else {
      S.current.mockupRect = { dx: W * 0.1, dy: H * 0.08, dw: W * 0.8, dh: H * 0.84 };
    }

    const mr = S.current.mockupRect;

    // Draw designs
    S.current.designs.forEach((d) => {
      if (!d.img) return;
      const px = mr.dx + d.dx * mr.dw;
      const py = mr.dy + d.dy * mr.dh;
      const sz = (d.size / 100) * mr.dw;
      const aspect = d.img.width / d.img.height;
      const rot = (d.rot * Math.PI) / 180;
      ctx.save();
      ctx.globalAlpha = d.op / 100;
      ctx.globalCompositeOperation = d.blend === 'normal' ? 'source-over' : d.blend;
      ctx.translate(px, py);
      ctx.rotate(rot);
      ctx.drawImage(d.img, -sz / 2, -(sz / aspect) / 2, sz, sz / aspect);
      if (d.id === S.current.selDesignId) {
        drawSelectionHandles(ctx, sz / 2, (sz / aspect) / 2);
      }
      ctx.restore();
    });

    // Draw texts
    S.current.texts.forEach((t) => {
      if (!t.content) return;
      const px = mr.dx + t.tx * mr.dw;
      const py = mr.dy + t.ty * mr.dh;
      const rot = ((t.rot || 0) * Math.PI) / 180;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(rot);
      ctx.font = `bold ${t.size}px ${t.font}`;
      ctx.fillStyle = t.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(t.content, 0, 0);
      const metrics = ctx.measureText(t.content);
      t.measuredWidth = metrics.width;
      if (t.id === S.current.selTextId) {
        drawSelectionHandles(ctx, metrics.width / 2, t.size * 0.6);
      }
      ctx.restore();
    });
  }, []);

  // ── CANVAS SETUP ──────────────────────────────────────────────────────────
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const cont = containerRef.current;
    if (!canvas || !cont) return;
    const W = cont.clientWidth;
    const H = cont.clientHeight || W;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    sizeRef.current = { W, H };
    const ctx = canvas.getContext('2d');
    ctxRef.current = ctx;
    ctx.scale(dpr, dpr);
    redraw();
  }, [redraw]);

  useEffect(() => {
    Object.entries(MOCKUP_IMGS).forEach(([t, colors]) => {
      Object.entries(colors).forEach(([c, views]) => {
        Object.entries(views).forEach(([v, url]) => {
          const img = new Image();
          img.onload = () => { loadedImgs.current[`${t}_${c}_${v}`] = img; redraw(); };
          img.src = url;
        });
      });
    });
  }, [MOCKUP_IMGS, redraw]);

  useEffect(() => {
    const timer = setTimeout(resizeCanvas, 80);
    window.addEventListener('resize', resizeCanvas);
    return () => { clearTimeout(timer); window.removeEventListener('resize', resizeCanvas); };
  }, [resizeCanvas]);

  // ── DRAG (mouse + touch) ──────────────────────────────────────────────────
  const applyDragMove = useCallback((clientX, clientY) => {
    if (!dragging.current || !S.current.mockupRect || !canvasRef.current) return;
    const r = canvasRef.current.getBoundingClientRect();
    const canvasX = (clientX - r.left) / zoomRef.current;
    const canvasY = (clientY - r.top) / zoomRef.current;
    const { dx, dy, dw, dh } = S.current.mockupRect;

    if (dragMode.current === 'text') {
      const t = S.current.texts.find((x) => x.id === S.current.selTextId);
      if (!t || !dragStart.current) return;
      if (dragAction.current === 'move') {
        t.tx = Math.max(0, Math.min(1, (canvasX - dx) / dw));
        t.ty = Math.max(0, Math.min(1, (canvasY - dy) / dh));
      } else if (dragAction.current === 'rotate') {
        const { px, py } = dragStart.current;
        const angle = Math.atan2(canvasY - py, canvasX - px) * 180 / Math.PI;
        t.rot = ((angle + 90) % 360 + 360) % 360;
        setTRot(Math.round(t.rot));
      } else if (dragAction.current === 'resize') {
        const { px, py, size, canvasX: sx, canvasY: sy } = dragStart.current;
        const initDist = Math.hypot(sx - px, sy - py);
        const currDist = Math.hypot(canvasX - px, canvasY - py);
        if (initDist > 1) {
          const newSize = Math.max(8, Math.min(200, size * currDist / initDist));
          t.size = newSize; setTSize(Math.round(newSize));
        }
      }
      redraw(); return;
    }

    const d = S.current.designs.find((x) => x.id === S.current.selDesignId);
    if (!d || !dragStart.current) return;

    if (dragAction.current === 'move') {
      d.dx = Math.max(0, Math.min(1, (canvasX - dx) / dw));
      d.dy = Math.max(0, Math.min(1, (canvasY - dy) / dh));
    } else if (dragAction.current === 'rotate') {
      const { px, py } = dragStart.current;
      const angle = Math.atan2(canvasY - py, canvasX - px) * 180 / Math.PI;
      d.rot = ((angle + 90) % 360 + 360) % 360;
      setDRot(Math.round(d.rot));
    } else if (dragAction.current === 'resize') {
      const { px, py, size, canvasX: sx, canvasY: sy } = dragStart.current;
      const initDist = Math.hypot(sx - px, sy - py);
      const currDist = Math.hypot(canvasX - px, canvasY - py);
      if (initDist > 1) {
        const newSize = Math.max(5, Math.min(85, size * currDist / initDist));
        d.size = newSize;
        setDSize(Math.round(newSize));
      }
    }
    redraw();
  }, [redraw]);

  const startDrag = useCallback((canvasX, canvasY) => {
    const mr = S.current.mockupRect;

    // 1. Check handles of selected design
    if (S.current.selDesignId !== null) {
      const action = detectAction(canvasX, canvasY);
      if (action) {
        dragging.current = true; dragAction.current = action; dragMode.current = 'design';
        const d = S.current.designs.find((x) => x.id === S.current.selDesignId);
        if (d && mr) { const { px, py } = getDesignGeom(d, mr); dragStart.current = { canvasX, canvasY, size: d.size, rot: d.rot, px, py }; }
        return;
      }
    }

    // 2. Check handles of selected text
    if (S.current.selTextId !== null && mr) {
      const t = S.current.texts.find((x) => x.id === S.current.selTextId);
      if (t) {
        const { px, py, hw, hh, rot } = getTextGeom(t, mr);
        const { lx, ly } = toLocal(canvasX, canvasY, px, py, rot);
        const pad = 6;
        let action = null;
        if (Math.hypot(lx, ly - (-hh - pad - ROT_DIST)) < HANDLE_R + 8) action = 'rotate';
        else if ([[-hw-pad,-hh-pad],[hw+pad,-hh-pad],[-hw-pad,hh+pad],[hw+pad,hh+pad]].some(([cx,cy]) => Math.hypot(lx-cx,ly-cy) < HANDLE_R+8)) action = 'resize';
        else if (Math.abs(lx) <= hw + pad + 4 && Math.abs(ly) <= hh + pad + 4) action = 'move';
        if (action) {
          dragging.current = true; dragAction.current = action; dragMode.current = 'text';
          dragStart.current = { canvasX, canvasY, size: t.size, rot: t.rot || 0, px, py };
          return;
        }
      }
    }

    // 3. Hit-test texts (topmost first)
    if (mr) {
      const hitText = [...S.current.texts].reverse().find((t) => {
        if (!t.content) return false;
        const { px, py, hw, hh, rot } = getTextGeom(t, mr);
        const { lx, ly } = toLocal(canvasX, canvasY, px, py, rot);
        return Math.abs(lx) <= hw + 6 && Math.abs(ly) <= hh + 6;
      });
      if (hitText) {
        S.current.selTextId = hitText.id; S.current.selDesignId = null;
        setSelTextId(hitText.id); setSelDesignId(null);
        setTContent(hitText.content); setTFont(hitText.font); setTColor(hitText.color);
        setTSize(hitText.size); setTRot(hitText.rot || 0);
        dragging.current = true; dragAction.current = 'move'; dragMode.current = 'text'; setActiveDragMode('text');
        const { px, py } = getTextGeom(hitText, mr);
        dragStart.current = { canvasX, canvasY, size: hitText.size, rot: hitText.rot || 0, px, py };
        redraw(); return;
      }
    }

    // 4. Hit-test designs (topmost first)
    if (mr) {
      const hit = [...S.current.designs].reverse().find((d) => {
        if (!d.img) return false;
        const { px, py, hw, hh, rot } = getDesignGeom(d, mr);
        const { lx, ly } = toLocal(canvasX, canvasY, px, py, rot);
        return Math.abs(lx) <= hw + 4 && Math.abs(ly) <= hh + 4;
      });
      if (hit) {
        S.current.selDesignId = hit.id; S.current.selTextId = null;
        setSelDesignId(hit.id); setSelTextId(null);
        setDSize(hit.size); setDRot(hit.rot); setDOp(hit.op); setDBlend(hit.blend);
        dragging.current = true; dragAction.current = 'move'; dragMode.current = 'design'; setActiveDragMode('design');
        const { px, py } = getDesignGeom(hit, mr);
        dragStart.current = { canvasX, canvasY, size: hit.size, rot: hit.rot, px, py };
        redraw(); return;
      }
    }

    // 5. Clicked empty — deselect all
    S.current.selDesignId = null; S.current.selTextId = null;
    setSelDesignId(null); setSelTextId(null);
    redraw();
  }, [detectAction, getDesignGeom, getTextGeom, redraw]);

  const endDrag = useCallback(() => { dragging.current = false; dragStart.current = null; }, []);

  const applyZoom = useCallback((next) => {
    const clamped = Math.max(1, Math.min(4, next));
    zoomRef.current = clamped;
    setZoom(clamped);
  }, []);

  // Mouse
  const onMouseDown = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    startDrag((e.clientX - r.left) / zoomRef.current, (e.clientY - r.top) / zoomRef.current);
  };
  const onMouseMove = (e) => applyDragMove(e.clientX, e.clientY);
  const onMouseUp = () => endDrag();

  // Touch — needs passive:false to allow preventDefault
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onTouchStart = (e) => {
      e.preventDefault();
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        pinchRef.current = { dist: Math.hypot(dx, dy), zoom: zoomRef.current };
        endDrag();
      } else {
        const t = e.touches[0];
        const r = canvas.getBoundingClientRect();
        startDrag((t.clientX - r.left) / zoomRef.current, (t.clientY - r.top) / zoomRef.current);
      }
    };
    const onTouchMove = (e) => {
      e.preventDefault();
      if (e.touches.length === 2 && pinchRef.current) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        const next = Math.max(1, Math.min(4, pinchRef.current.zoom * dist / pinchRef.current.dist));
        zoomRef.current = next; setZoom(next);
      } else if (e.touches.length === 1 && e.touches[0]) {
        applyDragMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const onTouchEnd = (e) => { e.preventDefault(); if (e.touches.length < 2) pinchRef.current = null; endDrag(); };
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd, { passive: false });
    return () => {
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
    };
  }, [startDrag, applyDragMove, endDrag]);

  // Wheel — resize selected item
  const onWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 2 : -2;
    if (dragMode.current === 'text') {
      const t = S.current.texts.find((x) => x.id === S.current.selTextId);
      if (!t) return;
      t.size = Math.max(8, Math.min(120, t.size + delta * 2));
      setTSize(t.size);
    } else {
      const d = S.current.designs.find((x) => x.id === S.current.selDesignId);
      if (!d) return;
      d.size = Math.max(5, Math.min(85, d.size + delta));
      setDSize(d.size);
    }
    redraw();
  };

  // ── DESIGN ACTIONS ────────────────────────────────────────────────────────
  const handleUpload = (e) => {
    const f = e.target.files[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const id = nextId();
        S.current.designs.push({ id, img, dx: 0.5, dy: 0.38, size: 30, rot: 0, op: 100, blend: 'normal' });
        S.current.selDesignId = id;
        setDesigns(S.current.designs.map((d) => ({ id: d.id, name: `Зураг ${d.id}` })));
        setSelDesignId(id);
        setDSize(30); setDRot(0); setDOp(100); setDBlend('normal');
        dragMode.current = 'design'; setActiveDragMode('design');
        setActiveTab('design');
        redraw();
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(f);
    e.target.value = '';
  };

  const selectDesign = (id) => {
    S.current.selDesignId = id; S.current.selTextId = null;
    const d = S.current.designs.find((x) => x.id === id);
    if (d) { setDSize(d.size); setDRot(d.rot); setDOp(d.op); setDBlend(d.blend); }
    setSelDesignId(id); setSelTextId(null);
    dragMode.current = 'design'; setActiveDragMode('design');
    redraw();
  };

  const deleteDesign = (id) => {
    S.current.designs = S.current.designs.filter((d) => d.id !== id);
    if (S.current.selDesignId === id) S.current.selDesignId = null;
    setDesigns(S.current.designs.map((d) => ({ id: d.id, name: `Зураг ${d.id}` })));
    if (selDesignId === id) setSelDesignId(null);
    redraw();
  };

  const updateDesign = (field, val) => {
    const d = S.current.designs.find((x) => x.id === S.current.selDesignId); if (!d) return;
    d[field] = val;
    if (field === 'size') setDSize(val); if (field === 'rot') setDRot(val);
    if (field === 'op') setDOp(val); if (field === 'blend') setDBlend(val);
    redraw();
  };

  const handleRemoveBg = async () => {
    const d = S.current.designs.find((x) => x.id === S.current.selDesignId); if (!d) return;
    setBgRemoving(true);
    try {
      const blob = await removeBackground(d.img.src);
      const url = URL.createObjectURL(blob);
      const newImg = new Image();
      newImg.onload = () => { d.img = newImg; redraw(); URL.revokeObjectURL(url); showToast('Дэвсгэр амжилттай арилгагдлаа!'); };
      newImg.src = url;
    } catch { showToast('Дэвсгэр арилгахад алдаа гарлаа.'); }
    finally { setBgRemoving(false); }
  };

  // ── TEXT ACTIONS ──────────────────────────────────────────────────────────
  const handleAddText = () => {
    const id = nextId();
    S.current.texts.push({ id, content: 'Текст', tx: 0.5, ty: 0.5, font: 'Arial', color: '#ffffff', size: 26, rot: 0 });
    S.current.selTextId = id; S.current.selDesignId = null;
    setTexts(S.current.texts.map((t) => ({ id: t.id, content: t.content })));
    setSelTextId(id); setSelDesignId(null);
    setTContent('Текст'); setTFont('Arial'); setTColor('#ffffff'); setTSize(26); setTRot(0);
    dragMode.current = 'text'; setActiveDragMode('text');
    redraw();
  };

  const selectText = (id) => {
    S.current.selTextId = id; S.current.selDesignId = null;
    const t = S.current.texts.find((x) => x.id === id);
    if (t) { setTContent(t.content); setTFont(t.font); setTColor(t.color); setTSize(t.size); setTRot(t.rot || 0); }
    setSelTextId(id); setSelDesignId(null);
    dragMode.current = 'text'; setActiveDragMode('text');
    redraw();
  };

  const deleteText = (id) => {
    S.current.texts = S.current.texts.filter((t) => t.id !== id);
    if (S.current.selTextId === id) S.current.selTextId = null;
    setTexts(S.current.texts.map((t) => ({ id: t.id, content: t.content })));
    if (selTextId === id) setSelTextId(null);
    redraw();
  };

  const updateText = (field, val) => {
    const t = S.current.texts.find((x) => x.id === S.current.selTextId); if (!t) return;
    t[field] = val;
    if (field === 'content') setTContent(val); if (field === 'font') setTFont(val);
    if (field === 'color') setTColor(val); if (field === 'size') setTSize(val);
    if (field === 'rot') setTRot(val);
    redraw();
  };

  // ── GLOBAL ────────────────────────────────────────────────────────────────
  const applyType = (t) => {
    S.current.type = t; setType(t);
    if (!MOCKUP_IMGS[t]?.[S.current.colorId]?.front) {
      const first = Object.keys(MOCKUP_IMGS[t] || {})[0] || 'black';
      S.current.colorId = first; setColorId(first);
    }
    redraw();
  };
  const applyView = (v) => { S.current.view = v; setView(v); redraw(); };
  const applyColorVariant = (id) => { S.current.colorId = id; setColorId(id); redraw(); };
  const applyBg = (c) => { S.current.bg = c; setBg(c); setBgHexInput(c); redraw(); };

  const handleReset = () => {
    S.current.designs = []; S.current.texts = [];
    S.current.selDesignId = null; S.current.selTextId = null;
    setDesigns([]); setTexts([]); setSelDesignId(null); setSelTextId(null);
    redraw();
  };

  const downloadCanvas = useCallback((filename) => {
    const src = canvasRef.current;
    const scale = 3;
    const hc = document.createElement('canvas');
    hc.width = src.width * scale / (window.devicePixelRatio || 1);
    hc.height = src.height * scale / (window.devicePixelRatio || 1);
    const hCtx = hc.getContext('2d');
    hCtx.imageSmoothingEnabled = true;
    hCtx.imageSmoothingQuality = 'high';
    hCtx.drawImage(src, 0, 0, hc.width, hc.height);
    const a = document.createElement('a');
    a.download = filename;
    a.href = hc.toDataURL('image/png', 1.0);
    a.click();
  }, []);

  const handleDownload = useCallback(() => downloadCanvas('ench4nt-mockup.png'), [downloadCanvas]);

  const handleSendToMessenger = () => {
    setSendStep(0);
    setSendDialog(true);
  };

  const handleDownloadDesign = useCallback(() => {
    downloadCanvas('ench4nt-design.png');
    setSendStep(1);
  }, [downloadCanvas]);

  const handleOpenMessengerFromDialog = () => {
    window.open('https://www.messenger.com/t/100718614798925', '_blank');
    setSendStep(2);
  };

  // ── TAB PANELS ───────────────────────────────────────────────────────────

  const GarmentPanel = (
    <Box sx={{ p: 2.5 }}>
      <SectionLabel>Хувцасны төрөл</SectionLabel>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, mb: 2.5 }}>
        <Btn active={type === 'tshirt'} onClick={() => applyType('tshirt')}>👕 Подволк</Btn>
        <Btn active={type === 'hoodie'} onClick={() => applyType('hoodie')}>🧥 Малгайтай цамц</Btn>
        <Btn active={type === 'longsleeve'} onClick={() => applyType('longsleeve')}>👔 Цамц</Btn>
      </Box>

      <SectionLabel>Өнгө сонгох</SectionLabel>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 1.5, mb: 2.5 }}>
        {VARIANTS.filter((v) => MOCKUP_IMGS[type]?.[v.id]?.front).map((v) => (
          <Box
            key={v.id}
            onClick={() => applyColorVariant(v.id)}
            sx={{
              cursor: 'pointer', borderRadius: 1, overflow: 'hidden',
              border: `2px solid ${colorId === v.id ? '#9b30ff' : 'rgba(155,48,255,0.15)'}`,
              boxShadow: colorId === v.id ? '0 0 12px rgba(155,48,255,0.4)' : 'none',
              transition: 'all 0.15s',
              '&:hover': { borderColor: '#9b30ff', boxShadow: '0 0 8px rgba(155,48,255,0.3)' },
            }}
          >
            <Box
              component="img"
              src={MOCKUP_IMGS[type]?.[v.id]?.front || ''}
              alt={v.name}
              sx={{ width: '100%', aspectRatio: '4/5', objectFit: 'contain', display: 'block', background: '#f5f5f5' }}
            />
            <Box sx={{
              textAlign: 'center', py: 0.6,
              fontSize: '0.62rem', fontFamily: '"Rajdhani",sans-serif', letterSpacing: '0.5px',
              color: colorId === v.id ? '#9b30ff' : '#666',
              background: '#0d0d18',
            }}>
              {v.name}
            </Box>
          </Box>
        ))}
      </Box>

      <SectionLabel>Харах тал</SectionLabel>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
        <Btn active={view === 'front'} onClick={() => applyView('front')}>◧ Урд тал</Btn>
        <Btn active={view === 'back'} onClick={() => applyView('back')}>◨ Ар тал</Btn>
      </Box>
    </Box>
  );

  const DesignPanel = (
    <Box sx={{ p: 2.5 }}>
      {/* Drag mode toggle */}
      <SectionLabel>Чирэх горим</SectionLabel>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 2.5 }}>
        <Btn active={activeDragMode === 'design'} onClick={() => { dragMode.current = 'design'; setActiveDragMode('design'); }}>🖼 Зураг</Btn>
        <Btn active={activeDragMode === 'text'} onClick={() => { dragMode.current = 'text'; setActiveDragMode('text'); }}>✏️ Текст</Btn>
      </Box>

      {/* Upload */}
      <SectionLabel>Зураг нэмэх</SectionLabel>
      <label>
        <Box
          sx={{
            border: '1px dashed rgba(155,48,255,0.28)', borderRadius: 1, p: '14px 16px',
            textAlign: 'center', cursor: 'pointer', background: 'rgba(155,48,255,0.025)',
            transition: 'all 0.2s', mb: 2,
            '&:hover': { borderColor: '#9b30ff', background: 'rgba(155,48,255,0.07)' },
          }}
        >
          <Box sx={{ fontSize: '1.4rem', mb: 0.5 }}>⬆</Box>
          <Box sx={{ fontSize: '0.74rem', color: '#555', letterSpacing: '0.5px' }}>PNG, JPG, SVG дэмжинэ</Box>
        </Box>
        <input type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />
      </label>

      {/* Design list */}
      {designs.length > 0 && <SectionLabel>Нэмсэн зурагнууд</SectionLabel>}
      {designs.map((d) => (
        <Box key={d.id} onClick={() => selectDesign(d.id)}
          sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            px: 1.5, py: 1, mb: 0.75, cursor: 'pointer', borderRadius: 1,
            background: selDesignId === d.id ? 'rgba(155,48,255,0.12)' : 'rgba(255,255,255,0.02)',
            border: `1px solid ${selDesignId === d.id ? '#9b30ff' : 'rgba(155,48,255,0.1)'}`,
            transition: 'all 0.12s', '&:hover': { borderColor: 'rgba(155,48,255,0.35)' },
          }}
        >
          <Box sx={{ fontSize: '0.82rem', color: selDesignId === d.id ? '#e0e0e0' : '#888' }}>{d.name}</Box>
          <Box component="button" onClick={(e) => { e.stopPropagation(); deleteDesign(d.id); }}
            sx={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', px: 0.5, fontSize: '0.9rem', lineHeight: 1, '&:hover': { color: '#ff5555' } }}>✕</Box>
        </Box>
      ))}

      {/* Selected design controls */}
      {selDesignId && (
        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(155,48,255,0.1)' }}>
          <Btn
            onClick={handleRemoveBg}
            sx={{ width: '100%', mb: 1.75, opacity: bgRemoving ? 0.55 : 1, pointerEvents: bgRemoving ? 'none' : 'auto' }}
          >
            {bgRemoving ? '⏳ Боловсруулж байна...' : '✂ Дэвсгэр арилгах'}
          </Btn>
          <SliderRow label="Хэмжээ" value={dSize} min={5} max={85} suffix="%" onChange={(v) => updateDesign('size', v)} />
          <SliderRow label="Эргэлт" value={dRot} min={0} max={360} suffix="°" onChange={(v) => updateDesign('rot', v)} />
          <SliderRow label="Тунгалаг" value={dOp} min={5} max={100} suffix="%" onChange={(v) => updateDesign('op', v)} />
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Box component="span" sx={{ fontSize: '0.68rem', color: '#555', textTransform: 'uppercase', minWidth: 66, flexShrink: 0, letterSpacing: '0.5px' }}>Blend</Box>
            <select value={dBlend} onChange={(e) => updateDesign('blend', e.target.value)}
              style={{ flex: 1, background: '#0c0c18', border: '1px solid rgba(155,48,255,0.2)', color: '#d0d0d0', padding: '8px 10px', fontFamily: 'Rajdhani,sans-serif', fontSize: '0.88rem', outline: 'none', borderRadius: 4 }}>
              {['normal', 'multiply', 'screen', 'overlay', 'soft-light'].map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </Box>
        </Box>
      )}
    </Box>
  );

  const TextPanel = (
    <Box sx={{ p: 2.5 }}>
      <Btn onClick={handleAddText} sx={{ width: '100%', mb: 2 }}>+ Текст нэмэх</Btn>

      {texts.length > 0 && <SectionLabel>Нэмсэн текстүүд</SectionLabel>}
      {texts.map((t) => (
        <Box key={t.id} onClick={() => selectText(t.id)}
          sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            px: 1.5, py: 1, mb: 0.75, cursor: 'pointer', borderRadius: 1,
            background: selTextId === t.id ? 'rgba(155,48,255,0.12)' : 'rgba(255,255,255,0.02)',
            border: `1px solid ${selTextId === t.id ? '#9b30ff' : 'rgba(155,48,255,0.1)'}`,
            transition: 'all 0.12s', '&:hover': { borderColor: 'rgba(155,48,255,0.35)' },
          }}
        >
          <Box sx={{ fontSize: '0.82rem', color: selTextId === t.id ? '#e0e0e0' : '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '82%' }}>{t.content}</Box>
          <Box component="button" onClick={(e) => { e.stopPropagation(); deleteText(t.id); }}
            sx={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', px: 0.5, fontSize: '0.9rem', lineHeight: 1, '&:hover': { color: '#ff5555' } }}>✕</Box>
        </Box>
      ))}

      {selTextId && (
        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(155,48,255,0.1)' }}>
          <input
            type="text" value={tContent} maxLength={60} placeholder="Текст оруулах..."
            onChange={(e) => updateText('content', e.target.value)}
            style={{ width: '100%', background: '#0c0c18', border: '1px solid rgba(155,48,255,0.2)', color: '#e0e0e0', padding: '10px 12px', fontFamily: 'Rajdhani,sans-serif', fontSize: '0.95rem', outline: 'none', borderRadius: 4, marginBottom: 14, boxSizing: 'border-box' }}
          />
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1.5 }}>
            <Box component="span" sx={{ fontSize: '0.68rem', color: '#555', textTransform: 'uppercase', minWidth: 66, flexShrink: 0, letterSpacing: '0.5px' }}>Фонт</Box>
            <select value={tFont} onChange={(e) => updateText('font', e.target.value)}
              style={{ flex: 1, background: '#0c0c18', border: '1px solid rgba(155,48,255,0.2)', color: '#d0d0d0', padding: '8px 10px', fontFamily: 'Rajdhani,sans-serif', fontSize: '0.88rem', outline: 'none', borderRadius: 4 }}>
              {['Arial', 'Orbitron', 'Georgia', 'Courier New', 'Verdana'].map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1.5 }}>
            <Box component="span" sx={{ fontSize: '0.68rem', color: '#555', textTransform: 'uppercase', minWidth: 66, flexShrink: 0, letterSpacing: '0.5px' }}>Өнгө</Box>
            <input type="color" value={tColor} onChange={(e) => updateText('color', e.target.value)}
              style={{ width: 36, height: 32, border: '1px solid rgba(155,48,255,0.2)', borderRadius: 4, background: 'none', cursor: 'pointer', padding: 2 }} />
            <Box sx={{ fontSize: '0.82rem', color: '#666', fontFamily: 'Rajdhani,sans-serif' }}>{tColor}</Box>
          </Box>
          <SliderRow label="Хэмжээ" value={tSize} min={8} max={200} suffix="px" onChange={(v) => updateText('size', v)} />
          <SliderRow label="Эргэлт" value={tRot} min={0} max={360} suffix="°" onChange={(v) => updateText('rot', v)} />
        </Box>
      )}
    </Box>
  );

  const BgPanel = (
    <Box sx={{ p: 2.5 }}>
      <SectionLabel>Дэвсгэрийн өнгө</SectionLabel>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px', mb: 2.5 }}>
        {BG_COLORS.map((c) => (
          <Box
            key={c.hex} onClick={() => applyBg(c.hex)} title={c.name}
            sx={{
              aspectRatio: '1', borderRadius: '6px', cursor: 'pointer', background: c.hex,
              border: bg === c.hex ? '2px solid #9b30ff' : c.hex === '#ffffff' ? '2px solid #333' : '2px solid rgba(255,255,255,0.08)',
              boxShadow: bg === c.hex ? '0 0 0 3px rgba(155,48,255,0.35)' : 'none',
              transition: 'all 0.12s', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', pb: 0.5,
              '&:hover': { transform: 'scale(1.1)', boxShadow: '0 0 8px rgba(155,48,255,0.4)' },
            }}
          >
            <Box sx={{ fontSize: '0.5rem', color: c.hex === '#ffffff' || c.hex === '#f5f5f5' || c.hex === '#e8e8e8' ? '#999' : 'rgba(255,255,255,0.5)', fontFamily: '"Rajdhani",sans-serif', letterSpacing: '0.5px' }}>
              {c.name}
            </Box>
          </Box>
        ))}
      </Box>
      <SectionLabel>Custom HEX</SectionLabel>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <input type="color" value={bgHexInput} onChange={(e) => applyBg(e.target.value)}
          style={{ width: 38, height: 34, border: '1px solid rgba(155,48,255,0.2)', borderRadius: 4, background: 'none', cursor: 'pointer', flexShrink: 0, padding: 2 }} />
        <input type="text" value={bgHexInput} maxLength={7} placeholder="#0d0d16"
          onChange={(e) => { setBgHexInput(e.target.value); if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) applyBg(e.target.value); }}
          style={{ flex: 1, background: '#0c0c18', border: '1px solid rgba(155,48,255,0.2)', color: '#e0e0e0', padding: '9px 12px', fontFamily: 'Rajdhani,sans-serif', fontSize: '0.9rem', outline: 'none', borderRadius: 4 }}
        />
      </Box>
    </Box>
  );

  const tabContent = {
    garment: GarmentPanel,
    design: DesignPanel,
    text: TextPanel,
    bg: BgPanel,
  };

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ minHeight: '100vh', background: isDark ? '#060609' : '#f4f4f6', color: isDark ? '#e0e0e0' : '#111', pt: { xs: '64px', md: '88px' }, pb: { xs: '80px', md: 8 }, transition: 'background 0.3s, color 0.3s' }}>

      {/* Page header */}
      <Box sx={{ px: { xs: 2, md: 5 }, mb: { xs: 1, md: 2 } }}>
        <Box sx={{ fontFamily: '"Orbitron",sans-serif', fontSize: '0.55rem', letterSpacing: '4px', color: '#9b30ff', textTransform: 'uppercase' }}>
          Ench4nt Studio
        </Box>
        <Box sx={{ fontFamily: '"Orbitron",sans-serif', fontSize: { xs: '1.1rem', md: 'clamp(1.3rem,3.5vw,2rem)' }, fontWeight: 900, color: '#e8e8e8', lineHeight: 1.1 }}>
          ЗАГВАР <Box component="span" sx={{ color: '#9b30ff' }}>БҮТЭЭХ</Box>
        </Box>
      </Box>

      {/* How it works — compact on mobile */}
      <Box sx={{ px: { xs: 2, md: 5 }, mb: { xs: 1.5, md: 3 } }}>
        <Box sx={{
          display: 'flex', gap: { xs: 0, sm: 1.5 },
          overflowX: { xs: 'auto', sm: 'visible' },
          p: { xs: '10px 0', md: 2 },
          background: { sm: 'rgba(155,48,255,0.04)' },
          border: { sm: '1px solid rgba(155,48,255,0.12)' },
          borderRadius: { sm: 1.5 },
          scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' },
        }}>
          {[
            { step: '01', icon: '🎨', title: 'Загварлах' },
            { step: '02', icon: '⬇', title: 'Татах' },
            { step: '03', icon: '📎', title: 'Хавсаргах' },
            { step: '04', icon: '✅', title: 'Илгээх' },
          ].map((s, i) => (
            <Box key={s.step} sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 }, flex: { sm: 1 }, flexShrink: 0, px: { xs: 1.5, sm: 0 } }}>
              {i > 0 && <Box sx={{ display: { xs: 'none', sm: 'block' }, color: '#333', fontSize: '0.7rem', mx: 0.5 }}>→</Box>}
              <Box sx={{ fontSize: { xs: '1.1rem', sm: '1rem' } }}>{s.icon}</Box>
              <Box>
                <Box sx={{ fontSize: '0.55rem', fontFamily: '"Orbitron",sans-serif', color: '#9b30ff', letterSpacing: '0.5px' }}>{s.step}</Box>
                <Box sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem' }, fontWeight: 700, color: '#aaa', fontFamily: '"Orbitron",sans-serif', whiteSpace: 'nowrap' }}>{s.title}</Box>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Main grid */}
      <Box sx={{
        px: { xs: 0, md: 5 },
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: '1fr 350px' },
        gap: { xs: 0, lg: 3 },
        alignItems: 'start',
        maxWidth: 1280,
        mx: 'auto',
      }}>

        {/* ── CANVAS COLUMN ── */}
        <Box
          ref={containerRef}
            sx={{
              position: 'relative',
              width: '100%',
              aspectRatio: '1 / 1',
              maxHeight: { xs: 'min(92vw, 520px)', lg: 'none' },
              background: '#0d0d16',
              overflow: 'hidden',
              border: { xs: 'none', md: '1px solid rgba(155,48,255,0.14)' },
              borderBottom: '1px solid rgba(155,48,255,0.1)',
            }}
          >
            <canvas
              ref={canvasRef}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
              onWheel={onWheel}
              style={{
                width: '100%', height: '100%', display: 'block', touchAction: 'none', cursor: 'crosshair',
                transform: `scale(${zoom})`, transformOrigin: 'center center',
                transition: pinchRef.current ? 'none' : 'transform 0.15s',
              }}
            />

            {/* Floating view toggle — bottom center */}
            <Box sx={{
              position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
              display: 'flex', background: 'rgba(6,6,9,0.88)', backdropFilter: 'blur(10px)',
              border: '1px solid rgba(155,48,255,0.22)', borderRadius: '20px', p: '3px', gap: '2px',
            }}>
              {['front', 'back'].map((v) => (
                <Box key={v} component="button" onClick={() => applyView(v)}
                  sx={{
                    px: { xs: 1.5, sm: 2.5 }, py: { xs: 0.5, sm: 0.75 }, border: 'none', cursor: 'pointer', borderRadius: '16px',
                    fontFamily: '"Rajdhani",sans-serif', fontSize: { xs: '0.7rem', sm: '0.78rem' }, letterSpacing: '1px', textTransform: 'uppercase',
                    background: view === v ? 'rgba(155,48,255,0.3)' : 'transparent',
                    color: view === v ? '#fff' : '#555', transition: 'all 0.15s',
                  }}
                >
                  {v === 'front' ? '▣ Урд' : '▣ Ар'}
                </Box>
              ))}
            </Box>

            {/* Zoom buttons — bottom right */}
            <Box sx={{ position: 'absolute', bottom: 10, right: 10, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Box component="button" onClick={() => applyZoom(zoomRef.current + 0.5)} title="Томруулах"
                sx={{ width: 30, height: 30, border: '1px solid rgba(155,48,255,0.3)', background: 'rgba(6,6,9,0.88)', backdropFilter: 'blur(8px)', cursor: 'pointer', borderRadius: '6px', color: '#9b30ff', fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', '&:hover': { background: 'rgba(155,48,255,0.2)' } }}>+</Box>
              <Box component="button" onClick={() => applyZoom(zoomRef.current - 0.5)} title="Жижигрүүлэх"
                sx={{ width: 30, height: 30, border: '1px solid rgba(155,48,255,0.2)', background: 'rgba(6,6,9,0.88)', backdropFilter: 'blur(8px)', cursor: 'pointer', borderRadius: '6px', color: zoom > 1 ? '#9b30ff' : '#333', fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', '&:hover': { background: 'rgba(155,48,255,0.1)' } }}>−</Box>
              {zoom > 1 && (
                <Box component="button" onClick={() => applyZoom(1)} title="Анхны хэмжээ"
                  sx={{ width: 30, height: 30, border: '1px solid rgba(155,48,255,0.2)', background: 'rgba(6,6,9,0.88)', backdropFilter: 'blur(8px)', cursor: 'pointer', borderRadius: '6px', color: '#666', fontSize: '0.55rem', fontFamily: '"Orbitron",sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', '&:hover': { color: '#aaa' } }}>1:1</Box>
              )}
            </Box>

            {/* Floating action icons — top right */}
            <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              {[
                { icon: '⬇', title: 'Татах', onClick: handleDownload, hover: '#9b30ff' },
                { icon: '↺', title: 'Арилгах', onClick: handleReset, hover: '#ff5555' },
              ].map(({ icon, title, onClick, hover }) => (
                <Box key={title} component="button" onClick={onClick} title={title}
                  sx={{
                    width: { xs: 30, sm: 34 }, height: { xs: 30, sm: 34 },
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid rgba(155,48,255,0.2)', background: 'rgba(6,6,9,0.85)',
                    backdropFilter: 'blur(8px)', cursor: 'pointer', borderRadius: '6px',
                    color: '#555', fontSize: '0.9rem', transition: 'all 0.15s',
                    '&:hover': { color: hover, borderColor: hover },
                  }}>
                  {icon}
                </Box>
              ))}
            </Box>
          </Box>

        {/* ── CONTROLS COLUMN ── */}
        <Box sx={{
          display: 'flex', flexDirection: 'column',
          background: '#09090f',
          border: { lg: '1px solid rgba(155,48,255,0.12)' },
          borderTop: '1px solid rgba(155,48,255,0.1)',
        }}>

          {/* Tab bar */}
          <Box sx={{ display: 'flex', borderBottom: '1px solid rgba(155,48,255,0.1)' }}>
            {TABS.map((tab) => (
              <Box
                key={tab.id}
                component="button"
                onClick={() => setActiveTab(tab.id)}
                sx={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.3,
                  py: { xs: 1, sm: 1.25 }, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                  background: activeTab === tab.id ? 'rgba(155,48,255,0.1)' : 'transparent',
                  borderBottom: `2px solid ${activeTab === tab.id ? '#9b30ff' : 'transparent'}`,
                  color: activeTab === tab.id ? '#9b30ff' : '#444',
                  '&:hover': { color: '#aaa', background: 'rgba(155,48,255,0.05)' },
                }}
              >
                <Box sx={{ fontSize: { xs: '0.95rem', sm: '1.05rem' }, lineHeight: 1 }}>{tab.icon}</Box>
                <Box sx={{ fontSize: '0.55rem', fontFamily: '"Orbitron",sans-serif', letterSpacing: '0.8px', textTransform: 'uppercase' }}>{tab.label}</Box>
              </Box>
            ))}
          </Box>

          {/* Tab content — no max height on mobile, scroll freely */}
          <Box sx={{ overflowY: { xs: 'visible', lg: 'auto' }, maxHeight: { lg: 'calc(100vh - 300px)' } }}>
            {tabContent[activeTab]}
          </Box>

          {/* Send button — desktop only (mobile has sticky footer) */}
          <Box sx={{ display: { xs: 'none', lg: 'block' }, p: 2, borderTop: '1px solid rgba(155,48,255,0.08)' }}>
            <Box component="button" onClick={handleSendToMessenger}
              sx={{
                width: '100%', border: 'none', cursor: 'pointer', py: 1.875, borderRadius: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1,
                fontFamily: '"Orbitron",sans-serif', fontSize: '0.72rem', fontWeight: 700,
                letterSpacing: '2.5px', textTransform: 'uppercase', color: '#fff',
                background: 'linear-gradient(135deg,#9b30ff,#6a0dad)',
                boxShadow: '0 4px 20px rgba(155,48,255,0.3)', transition: 'all 0.2s',
                '&:hover': { boxShadow: '0 4px 36px rgba(155,48,255,0.55)', transform: 'translateY(-1px)' },
              }}>
              <Iconify icon="logos:messenger" width={18} style={{ flexShrink: 0 }} /> Мессенжерт илгээх
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Sticky send button — mobile only */}
      <Box sx={{
        display: { xs: 'flex', lg: 'none' },
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
        p: 1.5, gap: 1,
        background: 'rgba(6,6,9,0.95)', backdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(155,48,255,0.2)',
      }}>
        <Box component="button" onClick={handleSendToMessenger}
          sx={{
            flex: 1, border: 'none', cursor: 'pointer', py: 1.5, borderRadius: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1,
            fontFamily: '"Orbitron",sans-serif', fontSize: '0.68rem', fontWeight: 700,
            letterSpacing: '1.5px', textTransform: 'uppercase', color: '#fff',
            background: 'linear-gradient(135deg,#9b30ff,#6a0dad)',
            boxShadow: '0 0 20px rgba(155,48,255,0.4)',
          }}>
          <Iconify icon="logos:messenger" width={16} /> Мессенжерт илгээх
        </Box>
      </Box>

      {/* Send dialog */}
      {sendDialog && (
        <Box sx={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2,
        }}
          onClick={() => { setSendDialog(false); setSendStep(0); }}
        >
          <Box
            onClick={(e) => e.stopPropagation()}
            sx={{
              background: '#0d0d1a', border: '1px solid rgba(155,48,255,0.3)',
              borderRadius: 2, p: { xs: 2.5, md: 3.5 }, maxWidth: 420, width: '100%',
              boxShadow: '0 0 60px rgba(155,48,255,0.2)',
            }}
          >
            <Box sx={{ fontFamily: '"Orbitron",sans-serif', fontSize: '0.85rem', fontWeight: 700, color: '#e8e8e8', mb: 0.75, letterSpacing: '1px' }}>
              ЗАХИАЛГА ИЛГЭЭХ
            </Box>
            <Box sx={{ fontSize: '0.72rem', color: '#555', mb: 2.5, lineHeight: 1.5 }}>
              Доорх 2 алхамыг дарааллаар хийнэ үү
            </Box>

            {/* Step 1 */}
            <Box sx={{
              p: 2, borderRadius: 1.5, mb: 1.5,
              border: '1px solid', transition: 'all 0.3s',
              borderColor: sendStep >= 1 ? '#9b30ff' : 'rgba(155,48,255,0.2)',
              background: sendStep >= 1 ? 'rgba(155,48,255,0.08)' : 'rgba(255,255,255,0.02)',
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <Box sx={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.65rem', fontWeight: 700, fontFamily: '"Orbitron",sans-serif',
                  background: sendStep >= 1 ? '#9b30ff' : 'rgba(155,48,255,0.15)',
                  color: sendStep >= 1 ? '#fff' : '#9b30ff',
                }}>
                  {sendStep >= 1 ? '✓' : '1'}
                </Box>
                <Box sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#ccc', fontFamily: '"Orbitron",sans-serif', letterSpacing: '0.5px' }}>
                  Дизайн татах
                </Box>
              </Box>
              <Box sx={{ fontSize: '0.65rem', color: '#555', mb: 1.5, ml: '37px', lineHeight: 1.4 }}>
                Таны дизайн PNG файл болж татагдана. Үүнийг Messenger-т хавсаргаж илгээнэ үү.
              </Box>
              <Box
                component="button"
                onClick={handleDownloadDesign}
                sx={{
                  ml: '37px', border: 'none', cursor: 'pointer', px: 2, py: 0.9, borderRadius: 1,
                  fontFamily: '"Orbitron",sans-serif', fontSize: '0.65rem', fontWeight: 700,
                  letterSpacing: '1px', textTransform: 'uppercase',
                  background: sendStep >= 1 ? 'rgba(155,48,255,0.15)' : 'linear-gradient(135deg,#9b30ff,#6a0dad)',
                  color: '#fff', transition: 'all 0.2s',
                  '&:hover': { opacity: 0.85 },
                }}
              >
                {sendStep >= 1 ? '✓ Татагдлаа' : '⬇ Татах'}
              </Box>
            </Box>

            {/* Step 2 */}
            <Box sx={{
              p: 2, borderRadius: 1.5, mb: 2,
              border: '1px solid', transition: 'all 0.3s',
              opacity: sendStep >= 1 ? 1 : 0.4,
              borderColor: sendStep >= 2 ? '#9b30ff' : 'rgba(155,48,255,0.2)',
              background: sendStep >= 2 ? 'rgba(155,48,255,0.08)' : 'rgba(255,255,255,0.02)',
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <Box sx={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.65rem', fontWeight: 700, fontFamily: '"Orbitron",sans-serif',
                  background: sendStep >= 2 ? '#9b30ff' : 'rgba(155,48,255,0.15)',
                  color: sendStep >= 2 ? '#fff' : '#9b30ff',
                }}>
                  {sendStep >= 2 ? '✓' : '2'}
                </Box>
                <Box sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#ccc', fontFamily: '"Orbitron",sans-serif', letterSpacing: '0.5px' }}>
                  Messenger нээх
                </Box>
              </Box>
              <Box sx={{ fontSize: '0.65rem', color: '#555', mb: 1.5, ml: '37px', lineHeight: 1.4 }}>
                Messenger нээгдэнэ. Татсан зургийг 📎 дарж хавсаргаад илгээнэ үү. Бид хүлээн авсны дараа хариу илгээнэ.
              </Box>
              <Box
                component="button"
                onClick={handleOpenMessengerFromDialog}
                disabled={sendStep < 1}
                sx={{
                  ml: '37px', border: 'none', cursor: sendStep >= 1 ? 'pointer' : 'not-allowed',
                  px: 2, py: 0.9, borderRadius: 1,
                  fontFamily: '"Orbitron",sans-serif', fontSize: '0.65rem', fontWeight: 700,
                  letterSpacing: '1px', textTransform: 'uppercase',
                  background: sendStep >= 1 ? 'linear-gradient(135deg,#9b30ff,#6a0dad)' : 'rgba(155,48,255,0.08)',
                  color: sendStep >= 1 ? '#fff' : '#555', transition: 'all 0.2s',
                  '&:hover': { opacity: sendStep >= 1 ? 0.85 : 1 },
                }}
              >
                <Iconify icon="logos:messenger" width={16} style={{ flexShrink: 0 }} /> Messenger нээх
              </Box>
            </Box>

            {sendStep >= 2 && (
              <Box sx={{ p: 1.5, background: 'rgba(0,180,100,0.08)', border: '1px solid rgba(0,180,100,0.2)', borderRadius: 1, mb: 2 }}>
                <Box sx={{ fontSize: '0.7rem', color: '#4caf50', fontWeight: 600, mb: 0.3 }}>✅ Амжилттай!</Box>
                <Box sx={{ fontSize: '0.65rem', color: '#555', lineHeight: 1.4 }}>
                  Бид таны дизайныг хүлээн авсны дараа захиалгын баталгаажуулалт болон татах холбоосыг Messenger-ээр илгээнэ.
                </Box>
              </Box>
            )}

            <Box
              component="button"
              onClick={() => { setSendDialog(false); setSendStep(0); }}
              sx={{
                width: '100%', border: '1px solid rgba(155,48,255,0.2)', cursor: 'pointer',
                py: 1, borderRadius: 1, background: 'transparent',
                fontFamily: '"Orbitron",sans-serif', fontSize: '0.65rem', color: '#555',
                letterSpacing: '1px', '&:hover': { borderColor: '#9b30ff', color: '#ccc' },
              }}
            >
              Хаах
            </Box>
          </Box>
        </Box>
      )}

      {/* Toast */}
      <Box sx={{
        position: 'fixed', bottom: 28, left: '50%', zIndex: 9999, pointerEvents: 'none',
        transform: `translateX(-50%) translateY(${toast ? 0 : 90}px)`,
        background: '#0f0f1c', border: '1px solid #9b30ff',
        boxShadow: '0 0 24px rgba(155,48,255,0.45)',
        fontFamily: '"Rajdhani",sans-serif', fontSize: '0.9rem', letterSpacing: '0.5px', color: '#e8e8e8',
        px: 3.5, py: 1.5, borderRadius: '6px', transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)', whiteSpace: 'nowrap',
      }}>
        {toast}
      </Box>
    </Box>
  );
}
