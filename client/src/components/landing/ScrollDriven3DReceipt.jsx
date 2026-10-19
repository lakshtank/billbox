import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * ScrollDriven3DReceipt
 * Continuous 3D interactive receipt that travels smoothly down the page as the user scrolls.
 *
 * Waypoint Journey:
 * 1. Hero (Scroll 0% - 22%): Floats top-right beside the headline, showing store items & paper folds.
 * 2. Scanner (Scroll 22% - 50%): Glides down and pivots forward into the scanning beam.
 * 3. Warranty Radar (Scroll 50% - 75%): Glides down with orbiting 30d & 90d warranty shields.
 * 4. Vault & Final CTA (Scroll 75% - 100%): Descends into the digital secure vault with particle lock.
 */
export default function ScrollDriven3DReceipt({ className = '' }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 7.5);

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      mount.appendChild(renderer.domElement);
    } catch (e) {
      console.warn('WebGL initialization fallback:', e);
      return;
    }

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 2.2); // Clean white key light
    dirLight1.position.set(5, 6, 4);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x6366f1, 1.6); // Subtle accent fill
    dirLight2.position.set(-5, -4, 3);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0xffffff, 1.2, 15);
    pointLight.position.set(0, 1, 4);
    scene.add(pointLight);

    // 3. High-Definition Procedural Receipt Texture
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 760;
    const ctx = canvas.getContext('2d');

    // Receipt Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header Accent
    ctx.fillStyle = '#6366f1';
    ctx.fillRect(0, 0, canvas.width, 16);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('BILLBOX SECURE VAULT', 36, 62);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px monospace';
    ctx.fillText('SMART RECEIPT & WARRANTY VAULT', 36, 90);
    ctx.fillText('-----------------------------------', 36, 114);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 19px sans-serif';
    ctx.fillText('Apple Store BKC', 36, 148);
    ctx.font = '13px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('INV-APL-2026-9042 • 18 OCT 2026', 36, 172);

    // Items List
    const receiptItems = [
      { name: 'Apple iPhone 16 Pro 256GB', price: '₹1,29,900', warranty: '12m Warranty' },
      { name: 'AirPods Pro (2nd Gen) USB-C', price: '₹24,900', warranty: '12m Warranty' },
      { name: 'AppleCare+ Extended Protect', price: '₹18,900', warranty: 'Active • 3 Years' },
    ];

    let y = 222;
    receiptItems.forEach((it) => {
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(it.name, 36, y);
      ctx.fillStyle = '#38bdf8';
      ctx.font = '13px monospace';
      ctx.fillText(it.price, 370, y);
      y += 24;
      ctx.fillStyle = '#10b981';
      ctx.font = '12px sans-serif';
      ctx.fillText(`🛡️ ${it.warranty}`, 36, y);
      y += 36;
    });

    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px monospace';
    ctx.fillText('-----------------------------------', 36, y);
    y += 26;

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('GRAND TOTAL:  ₹1,73,700', 36, y);
    y += 40;

    // Barcode rendering
    ctx.fillStyle = '#64748b';
    for (let bx = 36; bx < 476; bx += Math.random() > 0.4 ? 8 : 4) {
      ctx.fillRect(bx, y, Math.random() > 0.5 ? 4 : 2, 45);
    }
    y += 66;

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('✓ CLOUD ENCRYPTED & VAULT SECURED', 36, y);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;

    // 4. Main 3D Floating Receipt Mesh
    const receiptGeo = new THREE.PlaneGeometry(2.7, 3.8, 16, 16);
    // Authentic paper fold vertex wave
    const pos = receiptGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      pos.setZ(i, Math.sin(vx * 1.6) * 0.08 + Math.cos(vy * 1.2) * 0.05);
    }
    receiptGeo.computeVertexNormals();

    const receiptMat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.35,
      metalness: 0.12,
      side: THREE.DoubleSide,
    });

    const receiptMesh = new THREE.Mesh(receiptGeo, receiptMat);
    scene.add(receiptMesh);

    // 5. Holographic Ring around Receipt
    const ringGeo = new THREE.TorusGeometry(2.25, 0.02, 16, 90);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x6366f1,
      transparent: true,
      opacity: 0.65,
      wireframe: true,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    scene.add(ringMesh);

    // 6. 3D Laser Scanning Beam Mesh
    const laserGeo = new THREE.PlaneGeometry(3.0, 0.05);
    const laserMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
    });
    const laserMesh = new THREE.Mesh(laserGeo, laserMat);
    laserMesh.position.set(0, 0, 0.15);
    receiptMesh.add(laserMesh);

    // 7. Floating Holographic Warranty Shield Badge
    const badgeGeo = new THREE.OctahedronGeometry(0.5, 1);
    const badgeMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      metalness: 0.9,
      roughness: 0.1,
      wireframe: true,
      transparent: true,
      opacity: 0.85,
    });
    const badgeMesh = new THREE.Mesh(badgeGeo, badgeMat);
    scene.add(badgeMesh);

    const innerGeo = new THREE.SphereGeometry(0.22, 16, 16);
    const innerMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    badgeMesh.add(innerMesh);

    // 8. Ambient Depth Particle Constellation
    const particleCount = 200;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    const c1 = new THREE.Color(0x6366f1);
    const c2 = new THREE.Color(0x38bdf8);
    const c3 = new THREE.Color(0x10b981);

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      particlePositions[idx] = (Math.random() - 0.5) * 14;
      particlePositions[idx + 1] = (Math.random() - 0.5) * 12;
      particlePositions[idx + 2] = (Math.random() - 0.5) * 8;

      const col = Math.random() > 0.6 ? c1 : Math.random() > 0.5 ? c2 : c3;
      particleColors[idx] = col.r;
      particleColors[idx + 1] = col.g;
      particleColors[idx + 2] = col.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.06,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // 9. Scroll Tracking & Waypoint Interpolation
    let targetScrollRatio = 0;
    let currentScrollRatio = 0;

    const updateScrollRatio = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        targetScrollRatio = Math.max(0, Math.min(1, window.scrollY / docHeight));
      }
    };

    window.addEventListener('scroll', updateScrollRatio, { passive: true });
    updateScrollRatio();

    // 10. Mouse Pointer Parallax
    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;

    const handlePointerMove = (e) => {
      targetMouseX = (e.clientX / window.innerWidth) * 2 - 1;
      targetMouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    // 11. Animation Loop
    let animId;
    let startTime = performance.now();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = (performance.now() - startTime) / 1000;

      // Smooth scroll lerp (inertia)
      currentScrollRatio += (targetScrollRatio - currentScrollRatio) * 0.08;

      // Smooth mouse lerp
      currentMouseX += (targetMouseX * 0.35 - currentMouseX) * 0.06;
      currentMouseY += (targetMouseY * 0.25 - currentMouseY) * 0.06;

      // Waypoint Transitions along the Scroll Journey
      // p: 0.0 -> Hero
      // p: 0.3 -> Live Scanner Demo
      // p: 0.6 -> Warranty Radar
      // p: 0.9 -> Vault & Bottom
      const p = currentScrollRatio;
      const isMobile = window.innerWidth < 1024;

      // Calculate Target 3D Coordinates
      let posX, posY, posZ, rotX, rotY, rotZ, scale;

      if (p <= 0.25) {
        // Stage 1: Hero
        const t = p / 0.25;
        posX = isMobile ? 0 : THREE.MathUtils.lerp(1.7, 0.4, t);
        posY = THREE.MathUtils.lerp(0.2, -0.6, t);
        posZ = THREE.MathUtils.lerp(0.5, 1.2, t);
        rotX = THREE.MathUtils.lerp(-0.15, 0.05, t);
        rotY = isMobile ? 0 : THREE.MathUtils.lerp(0.35, -0.05, t);
        rotZ = THREE.MathUtils.lerp(-0.05, 0.02, t);
        scale = isMobile ? 0.75 : THREE.MathUtils.lerp(0.95, 1.05, t);
        laserMat.opacity = THREE.MathUtils.lerp(0, 0.8, t);
      } else if (p <= 0.6) {
        // Stage 2: Scanner to Warranty Radar
        const t = (p - 0.25) / 0.35;
        posX = isMobile ? 0 : THREE.MathUtils.lerp(0.4, 1.8, t);
        posY = THREE.MathUtils.lerp(-0.6, -1.8, t);
        posZ = THREE.MathUtils.lerp(1.2, 0.7, t);
        rotX = THREE.MathUtils.lerp(0.05, -0.15, t);
        rotY = isMobile ? 0 : THREE.MathUtils.lerp(-0.05, 0.45, t);
        rotZ = THREE.MathUtils.lerp(0.02, -0.08, t);
        scale = isMobile ? 0.7 : THREE.MathUtils.lerp(1.05, 0.95, t);
        laserMat.opacity = Math.max(0, 0.8 - t * 1.5);
      } else {
        // Stage 3: Warranty Radar to Vault
        const t = (p - 0.6) / 0.4;
        posX = isMobile ? 0 : THREE.MathUtils.lerp(1.8, 0, t);
        posY = THREE.MathUtils.lerp(-1.8, -3.2, t);
        posZ = THREE.MathUtils.lerp(0.7, 0.2, t);
        rotX = THREE.MathUtils.lerp(-0.15, 0.2, t);
        rotY = isMobile ? 0 : THREE.MathUtils.lerp(0.45, 0, t);
        rotZ = THREE.MathUtils.lerp(-0.08, 0, t);
        scale = isMobile ? 0.65 : THREE.MathUtils.lerp(0.95, 0.8, t);
        laserMat.opacity = 0;
      }

      // Sine-wave levitation offset
      const floatY = Math.sin(elapsed * 1.6) * 0.08;
      const floatX = Math.cos(elapsed * 1.2) * 0.04;

      // Apply positions to receipt
      receiptMesh.position.set(posX + floatX, posY + floatY, posZ);
      receiptMesh.rotation.set(rotX + currentMouseY, rotY + currentMouseX, rotZ);
      receiptMesh.scale.set(scale, scale, scale);

      // Ring follows receipt
      ringMesh.position.set(posX + floatX, posY + floatY, posZ - 0.1);
      ringMesh.rotation.z = elapsed * 0.4;
      ringMesh.scale.set(scale, scale, scale);

      // Laser sweep animation across receipt surface
      laserMesh.position.y = Math.sin(elapsed * 3.0) * 1.6;

      // Badge orbits receipt
      badgeMesh.position.set(
        posX + Math.cos(elapsed * 1.5) * 1.8,
        posY + Math.sin(elapsed * 1.8) * 1.2,
        posZ + 0.6
      );
      badgeMesh.rotation.x = elapsed * 1.2;
      badgeMesh.rotation.y = elapsed * 1.4;

      // Particle constellation drift
      particles.rotation.y = elapsed * 0.025;
      particles.rotation.x = elapsed * 0.012;

      renderer.render(scene, camera);
    };

    animate();

    // 12. Window Resize Handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', updateScrollRatio);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);

      // Clean Disposal
      receiptGeo.dispose();
      receiptMat.dispose();
      texture.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      laserGeo.dispose();
      laserMat.dispose();
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
      className={`fixed inset-0 pointer-events-none z-10 overflow-hidden ${className}`}
      aria-hidden="true"
    />
  );
}
