import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import * as m from 'motion/react-m';
import { ShieldCheck, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

const RECEIPT_PRESETS = {
  apple: {
    id: 'apple',
    name: 'Apple Store BKC',
    icon: '🍏',
    location: 'BANDRA KURLA COMPLEX • MUMBAI, MH',
    invoice: 'INV-APL-2026-9042',
    date: '18-OCT-2026  15:42 IST',
    cashier: 'POS-04 • CASHIER: VIKRAM',
    gstin: '27AABCA1429B1Z8',
    subtotal: '₹1,47,203.39',
    tax: '₹26,496.61',
    total: '₹1,73,700',
    topBadge: { title: '12m Warranty Active', sub: 'Expires in 28 Days • Claim Alert Set', color: 'amber' },
    bottomBadge: { title: 'Verified Vault Record', sub: '₹1,73,700 Official Apple Invoice', color: 'emerald' },
    items: [
      {
        name: 'Apple iPhone 16 Pro 256GB Desert Titanium',
        sku: 'SKU: MYNQ3HN/A • IMEI: 359182049182741',
        price: '₹1,29,900',
        badge: '12M OFFICIAL WARRANTY ACTIVE',
        badgeColor: '#b45309',
        badgeBg: '#fef3c7',
        status: 'Expires in 28 Days • Claim Window Open',
      },
      {
        name: 'AirPods Pro (2nd Gen) with MagSafe USB-C',
        sku: 'SKU: MTJV3HN/A • S/N: H4C7K9J2L1',
        price: '₹24,900',
        badge: '12M MANUFACTURER COVERAGE',
        badgeColor: '#047857',
        badgeBg: '#d1fae5',
        status: 'Valid Thru 18-OCT-2027 • Full Protection',
      },
      {
        name: 'AppleCare+ 2-Year Extended Protection Plan',
        sku: 'AGREEMENT: AC-IND-2026-99014',
        price: '₹18,900',
        badge: '24M EXTENDED SHIELD ACTIVE',
        badgeColor: '#4338ca',
        badgeBg: '#e0e7ff',
        status: 'Includes Accidental Damage & Battery Support',
      },
    ],
  },
  croma: {
    id: 'croma',
    name: 'Croma Electronics',
    icon: '⚡',
    location: 'PHOENIX PALLADIUM • LOWER PAREL, MUMBAI',
    invoice: 'INV-CRM-2026-4401',
    date: '15-OCT-2026  18:15 IST',
    cashier: 'POS-02 • CASHIER: RAHUL M',
    gstin: '27AACCT1187R1Z4',
    subtotal: '₹1,10,161.00',
    tax: '₹19,829.00',
    total: '₹1,29,990',
    topBadge: { title: '24m Warranty Active', sub: 'Full Comprehensive OLED Coverage', color: 'emerald' },
    bottomBadge: { title: 'Verified Vault Record', sub: '₹1,29,990 Croma Retail Invoice', color: 'emerald' },
    items: [
      {
        name: 'Sony Bravia 55" 4K OLED Smart Google TV',
        sku: 'MODEL: XR-55A80L • S/N: 7082914-SNY',
        price: '₹1,14,990',
        badge: '24M COMPREHENSIVE WARRANTY',
        badgeColor: '#047857',
        badgeBg: '#d1fae5',
        status: 'Full Panel & Motherboard Protection Active',
      },
      {
        name: 'Philips Daily Collection Induction Cooktop',
        sku: 'MODEL: HD4928/01 • S/N: PH-88192',
        price: '₹3,299',
        badge: '12M WARRANTY (EXPIRING SOON)',
        badgeColor: '#b45309',
        badgeBg: '#fef3c7',
        status: 'Expiring in 20 Days • Free Service Window',
      },
      {
        name: 'Croma ZipCare 1-Year Extended Shield',
        sku: 'POLICY: CR-ZC-2026-0918',
        price: '₹11,701',
        badge: '12M EXTENDED BREAKDOWN SHIELD',
        badgeColor: '#4338ca',
        badgeBg: '#e0e7ff',
        status: 'Free In-Home Technician Visits Included',
      },
    ],
  },
  ikea: {
    id: 'ikea',
    name: 'IKEA Mumbai',
    icon: '🛋️',
    location: 'TURBHE • NAVI MUMBAI, MH',
    invoice: 'INV-IKEA-2026-309',
    date: '06-OCT-2026  12:30 IST',
    cashier: 'EXPRESS-08 • SELF-CHECKOUT',
    gstin: '27AABCI4829K1Z2',
    subtotal: '₹13,796.60',
    tax: '₹2,483.40',
    total: '₹16,280',
    topBadge: { title: '10-Year Guarantee', sub: 'IKEA Structural Warranty Active', color: 'emerald' },
    bottomBadge: { title: 'Verified Vault Record', sub: '₹16,280 Official IKEA Invoice', color: 'emerald' },
    items: [
      {
        name: 'IKEA MARKUS Ergonomic Office Chair Vissle',
        sku: 'ARTICLE: 702.611.50 • LOT: 2026-W38',
        price: '₹14,990',
        badge: '10-YEAR OFFICIAL GUARANTEE',
        badgeColor: '#047857',
        badgeBg: '#d1fae5',
        status: 'Frame & Gas Cylinder Covered to Oct 2036',
      },
      {
        name: 'IKEA TERTIAL Work Lamp Dark Grey',
        sku: 'ARTICLE: 503.553.95 • LOT: 2026-W40',
        price: '₹1,290',
        badge: '12M MANUFACTURER COVERAGE',
        badgeColor: '#b45309',
        badgeBg: '#fef3c7',
        status: 'Expires in 16 Days • Action Recommended',
      },
    ],
  },
};

/**
 * Hero3DReceipt
 * High-definition 3D physical thermal receipt with real-time interactive store switching,
 * razor-sharp procedural typography, natural paper curl folds, serrated tear edges,
 * studio lighting, realistic floor contact shadow, and smooth mouse parallax.
 */
export default function Hero3DReceipt({ className = '' }) {
  const mountRef = useRef(null);
  const containerRef = useRef(null);
  const [selectedPreset, setSelectedPreset] = useState('apple');
  const [isHovered, setIsHovered] = useState(false);
  const updateTextureRef = useRef(null);
  const receiptMeshRef = useRef(null);

  // Draw procedural receipt canvas
  const drawReceipt = useCallback((data) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1536;
    const ctx = canvas.getContext('2d');

    // Pure crisp white thermal paper background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Top Serrated / Zigzag Cut Edge
    ctx.fillStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    const toothW = 24;
    const toothH = 12;
    for (let x = 0; x < canvas.width; x += toothW) {
      ctx.lineTo(x + toothW / 2, toothH);
      ctx.lineTo(x + toothW, 0);
    }
    ctx.lineTo(canvas.width, 0);
    ctx.lineTo(0, 0);
    ctx.fill();

    // Subtle paper edge border
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 3;
    ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

    // ── Header Section ───────────────────────────────────
    ctx.textAlign = 'center';

    // Store Logo Emblem
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(canvas.width / 2, 85, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('B', canvas.width / 2, 95);

    // Store Name
    ctx.fillStyle = '#090d16';
    ctx.font = '900 40px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(data.name.toUpperCase(), canvas.width / 2, 160);

    ctx.fillStyle = '#475569';
    ctx.font = '600 21px monospace';
    ctx.fillText(data.location, canvas.width / 2, 196);
    ctx.fillText('TAX INVOICE & PROOF OF PURCHASE', canvas.width / 2, 226);

    // Metadata Grid
    ctx.textAlign = 'left';
    ctx.fillStyle = '#64748b';
    ctx.font = '600 21px monospace';
    ctx.fillText(`DATE: ${data.date}`, 68, 280);
    ctx.fillText(data.cashier, 68, 312);

    ctx.textAlign = 'right';
    ctx.fillText(`INV: ${data.invoice}`, canvas.width - 68, 280);
    ctx.fillText(`GSTIN: ${data.gstin}`, canvas.width - 68, 312);

    // Perforated Separator
    ctx.fillStyle = '#cbd5e1';
    for (let x = 68; x < canvas.width - 68; x += 16) {
      ctx.fillRect(x, 345, 8, 3);
    }

    // Line Items Header
    ctx.textAlign = 'left';
    ctx.fillStyle = '#475569';
    ctx.font = '700 22px monospace';
    ctx.fillText('ITEM DESCRIPTION', 68, 385);
    ctx.textAlign = 'right';
    ctx.fillText('TOTAL (INR)', canvas.width - 68, 385);

    // Itemized Products
    let curY = 435;
    data.items.forEach((item) => {
      ctx.textAlign = 'left';
      ctx.fillStyle = '#090d16';
      ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(item.name, 68, curY);

      ctx.textAlign = 'right';
      ctx.font = 'bold 30px monospace';
      ctx.fillText(item.price, canvas.width - 68, curY);

      curY += 34;
      ctx.textAlign = 'left';
      ctx.fillStyle = '#64748b';
      ctx.font = '500 20px monospace';
      ctx.fillText(item.sku, 68, curY);

      curY += 30;
      ctx.fillStyle = item.badgeBg;
      ctx.beginPath();
      ctx.roundRect(68, curY - 22, 420, 34, 6);
      ctx.fill();

      ctx.fillStyle = item.badgeColor;
      ctx.font = 'bold 19px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(`🛡️  ${item.badge}`, 80, curY + 2);

      curY += 34;
      ctx.fillStyle = '#475569';
      ctx.font = '500 19px monospace';
      ctx.fillText(item.status, 68, curY);

      curY += 48;
    });

    // Separator
    ctx.fillStyle = '#cbd5e1';
    for (let x = 68; x < canvas.width - 68; x += 16) {
      ctx.fillRect(x, curY, 8, 3);
    }
    curY += 40;

    // Calculation Box
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.roundRect(68, curY, canvas.width - 136, 180, 12);
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#475569';
    ctx.font = '600 23px monospace';
    ctx.fillText('SUBTOTAL (TAXABLE)', 100, curY + 44);
    ctx.textAlign = 'right';
    ctx.fillText(data.subtotal, canvas.width - 100, curY + 44);

    ctx.textAlign = 'left';
    ctx.fillText('CGST (9%) + SGST (9%)', 100, curY + 84);
    ctx.textAlign = 'right';
    ctx.fillText(data.tax, canvas.width - 100, curY + 84);

    // Grand Total
    ctx.textAlign = 'left';
    ctx.fillStyle = '#090d16';
    ctx.font = '900 32px monospace';
    ctx.fillText('GRAND TOTAL (PAID)', 100, curY + 144);
    ctx.textAlign = 'right';
    ctx.font = '900 38px monospace';
    ctx.fillText(data.total, canvas.width - 100, curY + 144);

    curY += 225;

    // High-Density 1D Barcode
    ctx.fillStyle = '#090d16';
    const barStartX = 84;
    const barEndX = canvas.width - 84;
    const barSlot = (barEndX - barStartX) / 110;

    for (let b = 0; b < 110; b++) {
      const isThick = (b * 7 + 13) % 5 === 0 || (b * 3 + 5) % 7 === 0;
      const isGap = (b * 11 + 3) % 9 === 0;
      if (!isGap) {
        ctx.fillRect(barStartX + b * barSlot, curY, isThick ? 6 : 2.5, 75);
      }
    }

    curY += 100;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#64748b';
    ctx.font = '600 20px monospace';
    ctx.fillText('8 901234 567890 20261018 9042', canvas.width / 2, curY);

    curY += 46;
    // Security Seal
    ctx.fillStyle = '#047857';
    ctx.font = 'bold 21px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('✓  VERIFIED & SYNCED TO BILLBOX SECURE VAULT', canvas.width / 2, curY);

    // Bottom Serrated Cut
    ctx.fillStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    for (let x = 0; x < canvas.width; x += toothW) {
      ctx.lineTo(x + toothW / 2, canvas.height - toothH);
      ctx.lineTo(x + toothW, canvas.height);
    }
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.fill();

    return canvas;
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 480;
    const height = mount.clientHeight || 560;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
    camera.position.set(0, 0, 8.2);

    // 2. High-DPI Antialiased WebGL Renderer
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      mount.appendChild(renderer.domElement);
    } catch (e) {
      console.warn('WebGL init fallback:', e);
      return;
    }

    // 3. Crisp Pure White Studio Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.85);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
    keyLight.position.set(4, 6, 6);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.8);
    fillLight.position.set(-4, -2, 4);
    scene.add(fillLight);

    // 4. Initial Texture & Material
    const initialCanvas = drawReceipt(RECEIPT_PRESETS[selectedPreset]);
    const texture = new THREE.CanvasTexture(initialCanvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;

    // Ref for updating texture dynamically
    updateTextureRef.current = (presetKey) => {
      const newCanvas = drawReceipt(RECEIPT_PRESETS[presetKey]);
      texture.image = newCanvas;
      texture.needsUpdate = true;
    };

    // 5. Geometry with Natural Thermal Paper Curvature
    const receiptGeo = new THREE.PlaneGeometry(3.0, 4.5, 48, 48);
    const pos = receiptGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);

      // Natural curl: bottom rolls forward slightly, top curls back
      const roll = Math.sin((vy + 2.2) * 0.7) * 0.08;
      // Gentle horizontal wave (wallet folds)
      const fold = Math.sin(vy * 2.2) * 0.04;
      // Gentle lateral page bow
      const bow = Math.cos(vx * 1.2) * 0.03;

      pos.setZ(i, roll + fold - bow);
    }
    receiptGeo.computeVertexNormals();

    const receiptMat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.25,
      metalness: 0.02,
      side: THREE.DoubleSide,
    });

    const receiptMesh = new THREE.Mesh(receiptGeo, receiptMat);
    scene.add(receiptMesh);
    receiptMeshRef.current = receiptMesh;

    // Position centered and fully in view
    receiptMesh.position.set(0, -0.05, 0.1);
    receiptMesh.rotation.set(-0.05, -0.16, -0.02);

    // 6. Soft Blurred Contact Floor Shadow
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const sctx = shadowCanvas.getContext('2d');
    const shadowGrad = sctx.createRadialGradient(128, 128, 10, 128, 128, 115);
    shadowGrad.addColorStop(0, 'rgba(15, 23, 42, 0.28)');
    shadowGrad.addColorStop(0.5, 'rgba(15, 23, 42, 0.09)');
    shadowGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
    sctx.fillStyle = shadowGrad;
    sctx.fillRect(0, 0, 256, 256);

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowGeo = new THREE.PlaneGeometry(4.4, 4.4);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.position.set(0, -2.45, -0.4);
    shadowMesh.rotation.x = -Math.PI / 2.3;
    scene.add(shadowMesh);

    // 7. Interactive Mouse Parallax Tracking
    let targetRotY = -0.16;
    let targetRotX = -0.05;
    let currentRotY = -0.16;
    let currentRotX = -0.05;

    const handleMouseMove = (e) => {
      const rect = mount.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetRotY = -0.16 + nx * 0.28;
      targetRotX = -0.05 + ny * 0.22;
    };

    const handleMouseLeave = () => {
      targetRotY = -0.16;
      targetRotX = -0.05;
    };

    mount.addEventListener('mousemove', handleMouseMove);
    mount.addEventListener('mouseleave', handleMouseLeave);

    // 8. Render Loop
    let animId;
    let startTime = performance.now();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = (performance.now() - startTime) / 1000;

      // Spring lerp for silky smooth mouse reaction
      currentRotY += (targetRotY - currentRotY) * 0.08;
      currentRotX += (targetRotX - currentRotX) * 0.08;

      // Subtle levitation
      const floatY = Math.sin(elapsed * 1.5) * 0.06;
      const floatRotZ = Math.cos(elapsed * 1.2) * 0.012;

      receiptMesh.position.y = -0.05 + floatY;
      receiptMesh.rotation.y = currentRotY;
      receiptMesh.rotation.x = currentRotX;
      receiptMesh.rotation.z = -0.02 + floatRotZ;

      shadowMesh.scale.set(
        1 + floatY * 0.25,
        1 + floatY * 0.25,
        1
      );

      renderer.render(scene, camera);
    };

    animate();

    // 9. Responsive Resize
    const handleResize = () => {
      if (!mount) return;
      const w = mount.clientWidth || 480;
      const h = mount.clientHeight || 560;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      mount.removeEventListener('mousemove', handleMouseMove);
      mount.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);

      receiptGeo.dispose();
      receiptMat.dispose();
      texture.dispose();
      shadowGeo.dispose();
      shadowMat.dispose();
      shadowTex.dispose();
      renderer.dispose();

      if (mount && renderer.domElement) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [drawReceipt, selectedPreset]);

  // Handle Preset Switching
  const handleSelectPreset = (key) => {
    setSelectedPreset(key);
    if (updateTextureRef.current) {
      updateTextureRef.current(key);
    }
    // Quick celebratory spring twist
    if (receiptMeshRef.current) {
      receiptMeshRef.current.rotation.y += 0.35;
    }
  };

  const currentPresetData = RECEIPT_PRESETS[selectedPreset];

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative w-full max-w-[480px] mx-auto flex flex-col items-center select-none px-2 sm:px-0 ${className}`}
    >
      {/* 3D Canvas Showcase Area */}
      <div className="relative w-full h-[460px] sm:h-[550px] flex items-center justify-center">
        {/* Soft Ambient Spotlight Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[360px] h-[300px] sm:h-[360px] bg-gradient-to-tr from-accent/15 via-sky-400/10 to-transparent rounded-full blur-[80px] pointer-events-none -z-10" />

        {/* 3D WebGL Canvas */}
        <div
          ref={mountRef}
          className="w-full h-full cursor-grab active:cursor-grabbing relative z-10"
        />

        {/* Floating Status Pill 1: Top Right */}
        <m.div
          key={`top-${selectedPreset}`}
          initial={{ opacity: 0, scale: 0.85, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="absolute -top-2 right-1 sm:-top-3 sm:right-2 p-2 sm:p-3 rounded-2xl bg-surface/95 border border-line shadow-xl backdrop-blur-xl flex items-center gap-2.5 sm:gap-3 pointer-events-none z-20 transition-all origin-top-right max-w-[210px] sm:max-w-xs scale-90 sm:scale-100"
        >
          <div className="size-8 sm:size-9 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-500 shrink-0">
            <AlertTriangle className="size-4 sm:size-4.5" />
          </div>
          <div className="text-left text-xs min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-fg truncate">{currentPresetData.topBadge.title}</span>
              <span className="inline-block size-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
            </div>
            <p className="text-[10px] sm:text-[11px] text-fg-3 truncate">{currentPresetData.topBadge.sub}</p>
          </div>
        </m.div>

        {/* Floating Status Pill 2: Bottom Left */}
        <m.div
          key={`bottom-${selectedPreset}`}
          initial={{ opacity: 0, scale: 0.85, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="absolute -bottom-2 left-1 sm:-bottom-3 sm:left-2 p-2 sm:p-3 rounded-2xl bg-surface/95 border border-line shadow-xl backdrop-blur-xl flex items-center gap-2.5 sm:gap-3 pointer-events-none z-20 transition-all origin-bottom-left max-w-[210px] sm:max-w-xs scale-90 sm:scale-100"
        >
          <div className="size-8 sm:size-9 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-500 shrink-0">
            <ShieldCheck className="size-4 sm:size-4.5" />
          </div>
          <div className="text-left text-xs min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-fg truncate">{currentPresetData.bottomBadge.title}</span>
              <span className="text-[9px] sm:text-[10px] font-mono px-1 sm:px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 font-semibold shrink-0">256-BIT</span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-fg-3 truncate">{currentPresetData.bottomBadge.sub}</p>
          </div>
        </m.div>
      </div>

      {/* Interactive Store Switcher Chips */}
      <div className="mt-3 inline-flex flex-wrap justify-center items-center gap-1.5 p-1 rounded-xl bg-surface/90 border border-line shadow-xs backdrop-blur-md z-30 max-w-full">
        {Object.values(RECEIPT_PRESETS).map((p) => (
          <m.button
            key={p.id}
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSelectPreset(p.id)}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedPreset === p.id
                ? 'bg-accent text-white shadow-xs'
                : 'text-fg-2 hover:text-fg hover:bg-hover'
            }`}
          >
            <span>{p.icon}</span>
            <span>{p.name}</span>
          </m.button>
        ))}
      </div>
    </div>
  );
}
