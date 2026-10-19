import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Hero3DCanvas
 * Immersive Three.js 3D interactive hero canvas.
 * Features:
 * - Floating, physically-modeled 3D receipt mesh with paper texture and glowing edges
 * - Orbiting holographic warranty security badges and metallic rings
 * - Interactive 3D particle constellation with mouse parallax & gyro tracking
 * - Dynamic lighting with neon cyan and ultraviolet specular highlights
 */
export default function Hero3DCanvas({ className = '' }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // 1. Scene, Camera, Renderer
    const width = mount.clientWidth || 600;
    const height = mount.clientHeight || 550;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 7.5);

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
      console.warn('WebGL not supported, falling back gracefully:', e);
      return;
    }

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x6366f1, 2.4); // Indigo / Purple
    dirLight1.position.set(5, 5, 4);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x06b6d4, 1.8); // Cyan
    dirLight2.position.set(-5, -3, 3);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0x38bdf8, 2.5, 12);
    pointLight.position.set(0, 1, 3);
    scene.add(pointLight);

    // 3. Procedural Receipt Texture
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');

    // Draw Receipt Canvas
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Decorative receipt header
    ctx.fillStyle = '#6366f1';
    ctx.fillRect(0, 0, canvas.width, 14);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText('BILLBOX VAULT', 40, 60);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '15px monospace';
    ctx.fillText('AI RECEIPT & WARRANTY VAULT', 40, 88);
    ctx.fillText('-----------------------------------', 40, 110);

    ctx.fillStyle = '#f8fafc';
    ctx.font = '18px sans-serif';
    ctx.fillText('Apple Store BKC', 40, 145);
    ctx.font = '14px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('INV-2026-9042 • 18 OCT 2026', 40, 170);

    // Items
    const items = [
      { name: 'MacBook Pro 16" M4', price: '₹2,49,900', warranty: '3 Years AppleCare+' },
      { name: 'AirPods Pro (2nd Gen)', price: '₹24,900', warranty: '1 Year Warranty' },
      { name: 'MagSafe 140W Adapter', price: '₹9,500', warranty: 'Covered' },
    ];

    let y = 220;
    items.forEach((it) => {
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(it.name, 40, y);
      ctx.fillStyle = '#38bdf8';
      ctx.font = '13px monospace';
      ctx.fillText(it.price, 380, y);
      y += 24;
      ctx.fillStyle = '#10b981';
      ctx.font = '12px sans-serif';
      ctx.fillText(`✓ ${it.warranty}`, 40, y);
      y += 36;
    });

    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px monospace';
    ctx.fillText('-----------------------------------', 40, y);
    y += 28;

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('TOTAL:  ₹2,84,300', 40, y);
    y += 40;

    // Barcode lines
    ctx.fillStyle = '#64748b';
    for (let bx = 40; bx < 470; bx += Math.random() > 0.4 ? 8 : 4) {
      ctx.fillRect(bx, y, Math.random() > 0.5 ? 4 : 2, 45);
    }
    y += 65;

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('PROTECTED BY BILLBOX AI ENGINE', 40, y);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;

    // 4. Main 3D Floating Receipt Mesh
    const receiptGeo = new THREE.PlaneGeometry(2.8, 3.9, 16, 16);
    // Subtle curl on vertices
    const pos = receiptGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      pos.setZ(i, Math.sin(vx * 1.5) * 0.08 + Math.cos(vy * 1.2) * 0.06);
    }
    receiptGeo.computeVertexNormals();

    const receiptMat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.35,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });

    const receiptMesh = new THREE.Mesh(receiptGeo, receiptMat);
    receiptMesh.position.set(-0.3, 0.1, 0.2);
    receiptMesh.rotation.set(-0.1, 0.25, -0.05);
    scene.add(receiptMesh);

    // 5. Holographic Border Ring around receipt
    const ringGeo = new THREE.TorusGeometry(2.3, 0.025, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x6366f1,
      transparent: true,
      opacity: 0.7,
      wireframe: true,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2.3;
    ringMesh.position.set(-0.3, -0.1, 0);
    scene.add(ringMesh);

    // 6. Floating Holographic Warranty Shield Badge
    const badgeGeo = new THREE.OctahedronGeometry(0.55, 1);
    const badgeMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      metalness: 0.85,
      roughness: 0.15,
      wireframe: true,
      transparent: true,
      opacity: 0.85,
    });
    const badgeMesh = new THREE.Mesh(badgeGeo, badgeMat);
    badgeMesh.position.set(1.5, 1.2, 0.8);
    scene.add(badgeMesh);

    // Inner glowing sphere inside badge
    const innerGeo = new THREE.SphereGeometry(0.24, 16, 16);
    const innerMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    badgeMesh.add(innerMesh);

    // 7. Floating 3D Star/Dust Particle Constellation
    const particleCount = 220;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    const c1 = new THREE.Color(0x6366f1);
    const c2 = new THREE.Color(0x38bdf8);
    const c3 = new THREE.Color(0x10b981);

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      particlePositions[idx] = (Math.random() - 0.5) * 12;
      particlePositions[idx + 1] = (Math.random() - 0.5) * 10;
      particlePositions[idx + 2] = (Math.random() - 0.5) * 8;

      const col = Math.random() > 0.6 ? c1 : Math.random() > 0.5 ? c2 : c3;
      particleColors[idx] = col.r;
      particleColors[idx + 1] = col.g;
      particleColors[idx + 2] = col.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.065,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // 8. Mouse / Pointer Parallax Interaction
    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;

    const handlePointerMove = (e) => {
      const rect = mount.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetMouseX = x * 0.45;
      targetMouseY = y * 0.35;
    };

    window.addEventListener('pointermove', handlePointerMove);

    // 9. Animation Loop
    let animId;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // Smooth mouse lerp
      currentMouseX += (targetMouseX - currentMouseX) * 0.05;
      currentMouseY += (targetMouseY - currentMouseY) * 0.05;

      // Levitation sine waves
      receiptMesh.position.y = 0.1 + Math.sin(time * 1.4) * 0.12;
      receiptMesh.rotation.y = 0.25 + Math.cos(time * 0.8) * 0.08 + currentMouseX;
      receiptMesh.rotation.x = -0.1 + Math.sin(time * 1.1) * 0.06 + currentMouseY;

      // Ring rotation
      ringMesh.rotation.z = time * 0.35;
      ringMesh.position.y = -0.1 + Math.sin(time * 1.4) * 0.1;

      // Badge orbiting
      badgeMesh.rotation.x = time * 0.9;
      badgeMesh.rotation.y = time * 1.2;
      badgeMesh.position.y = 1.1 + Math.sin(time * 2.0) * 0.18;
      badgeMesh.position.x = 1.5 + Math.cos(time * 1.2) * 0.15;

      // Slow particle field drift
      particles.rotation.y = time * 0.035;
      particles.rotation.x = time * 0.015;

      renderer.render(scene, camera);
    };

    animate();

    // 10. Resize handler
    const handleResize = () => {
      if (!mount) return;
      const nw = mount.clientWidth;
      const nh = mount.clientHeight;
      if (nw && nh) {
        camera.aspect = nw / nh;
        camera.updateProjectionMatrix();
        renderer.setSize(nw, nh);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);

      // Clean disposal
      receiptGeo.dispose();
      receiptMat.dispose();
      texture.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      badgeGeo.dispose();
      badgeMat.dispose();
      innerGeo.dispose();
      innerMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      renderer.dispose();

      if (mount && renderer.domElement) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className={`relative w-full h-[380px] sm:h-[480px] lg:h-[560px] overflow-hidden select-none pointer-events-auto ${className}`}
      aria-label="3D Interactive Receipt and Warranty Model"
    >
      {/* Background radial glow */}
      <div className="absolute inset-0 -z-10 pointer-events-none flex items-center justify-center">
        <div className="w-[320px] h-[320px] sm:w-[480px] sm:h-[480px] rounded-full bg-accent/15 blur-[90px] animate-pulse" />
      </div>
    </div>
  );
}
