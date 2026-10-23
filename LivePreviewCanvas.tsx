/**
 * @fileoverview Refined & Enhanced Live Gameplay Preview Component.
 * Features:
 * - High visual fidelity: cosmic void, glowing nebulae, blue marble Earth, twinkling starfield.
 * - Layered lunar ridges, textured terrain, and glowing holographic landing pad with guidance beams.
 * - Autonomous phased Apollo descent loop (Orbital Entry -> Deceleration -> Final Touchdown -> Launch).
 * - Live neon dotted trajectory prediction line with surface touchdown reticle.
 * - Real spacecraft model asset rendering with livery glow, dynamic engine plume & ground spotlight.
 * - Sleek CRT telemetry cockpit HUD and mini tactical radar pip.
 */

import React, {useEffect, useRef} from 'react';

interface LivePreviewCanvasProps {
  landerColor?: string;
  pilotCallsign?: string;
  landerImage?: HTMLImageElement | null;
}

export default function LivePreviewCanvas({
  landerColor = '#10b981',
  pilotCallsign = 'APOLLO-11',
  landerImage = null,
}: LivePreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const width = 500;
    const height = 310;

    // Multi-phase autonomous flight cycle:
    // 0: Orbital Insertion (glide in from top left)
    // 1: Deceleration & Alignment (retro-burn to cancel horizontal speed)
    // 2: Terminal Descent (soft retro thruster touchdown)
    // 3: Touchdown Confirmed (pause, sparks, beacon glow)
    // 4: Ascent Boost (blast off to restart cycle)
    let phase = 0;
    let phaseTimer = 0;

    let shipX = 80;
    let shipY = 65;
    let shipVx = 16;
    let shipVy = 5;
    let shipAngle = 0.08;

    interface PreviewParticle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
      color: string;
      size: number;
    }

    const particles: PreviewParticle[] = [];

    // Starfield
    const stars: {x: number; y: number; r: number; color: string; speed: number}[] = [];
    const starColors = ['#ffffff', '#bae6fd', '#fef08a', '#fbcfe8'];
    for (let i = 0; i < 60; i++) {
      stars.push({
        x: (i * 137.5) % width,
        y: (i * 73.1) % (height * 0.72),
        r: i % 4 === 0 ? 1.8 : i % 2 === 0 ? 1.2 : 0.8,
        color: starColors[i % starColors.length],
        speed: 1.5 + (i % 5) * 0.4,
      });
    }

    const padX = width * 0.52;
    const padW = 106;
    const padY = height - 46;

    const render = () => {
      t += 0.016;
      phaseTimer += 0.016;

      // -----------------------------------------------------------------------
      // 1. COSMIC ENVIRONMENT (Void, Nebulae, Earth, Twinkling Stars)
      // -----------------------------------------------------------------------
      // Cosmic gradient
      const spaceGrad = ctx.createLinearGradient(0, 0, 0, height);
      spaceGrad.addColorStop(0, '#02040a');
      spaceGrad.addColorStop(0.5, '#040815');
      spaceGrad.addColorStop(1, '#070f24');
      ctx.fillStyle = spaceGrad;
      ctx.fillRect(0, 0, width, height);

      // Procedural Nebulae
      const neb1 = ctx.createRadialGradient(width * 0.28, 80, 10, width * 0.28, 80, 150);
      neb1.addColorStop(0, 'rgba(56, 189, 248, 0.12)');
      neb1.addColorStop(0.6, 'rgba(168, 85, 247, 0.06)');
      neb1.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = neb1;
      ctx.fillRect(0, 0, width, height);

      const neb2 = ctx.createRadialGradient(width * 0.78, 140, 15, width * 0.78, 140, 160);
      neb2.addColorStop(0, 'rgba(236, 72, 153, 0.08)');
      neb2.addColorStop(0.5, 'rgba(59, 130, 246, 0.05)');
      neb2.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = neb2;
      ctx.fillRect(0, 0, width, height);

      // Blue Marble Earth in Deep Space
      const earthX = width - 58;
      const earthY = 48;
      const earthRadius = 24;

      // Atmospheric outer glow
      const earthGlow = ctx.createRadialGradient(earthX, earthY, earthRadius * 0.8, earthX, earthY, earthRadius * 1.5);
      earthGlow.addColorStop(0, 'rgba(56, 189, 248, 0.4)');
      earthGlow.addColorStop(0.6, 'rgba(14, 165, 233, 0.12)');
      earthGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = earthGlow;
      ctx.beginPath();
      ctx.arc(earthX, earthY, earthRadius * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Earth body
      const earthBody = ctx.createRadialGradient(earthX - 8, earthY - 8, 3, earthX, earthY, earthRadius);
      earthBody.addColorStop(0, '#7dd3fc');
      earthBody.addColorStop(0.4, '#0284c7');
      earthBody.addColorStop(0.85, '#034078');
      earthBody.addColorStop(1, '#020617');
      ctx.fillStyle = earthBody;
      ctx.beginPath();
      ctx.arc(earthX, earthY, earthRadius, 0, Math.PI * 2);
      ctx.fill();

      // Swirling white clouds on Earth
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(earthX - 6, earthY - 4, 6, 0, Math.PI * 2);
      ctx.arc(earthX + 4, earthY + 3, 7, 0, Math.PI * 2);
      ctx.arc(earthX - 9, earthY + 8, 5, 0, Math.PI * 2);
      ctx.fill();

      // Twinkling Starfield
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        const twinkle = 0.35 + 0.65 * Math.sin(t * s.speed + i);
        ctx.fillStyle = s.color;
        ctx.globalAlpha = Math.max(0.15, Math.min(1, twinkle));
        ctx.fillRect(s.x, s.y, s.r, s.r);
      }
      ctx.globalAlpha = 1.0;

      // -----------------------------------------------------------------------
      // 2. LUNAR TOPOGRAPHY (Background Basalt Ridge & Textured Plateau)
      // -----------------------------------------------------------------------
      // Distant mountain silhouette
      ctx.fillStyle = '#0c1628';
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let x = 0; x <= width; x += 16) {
        const my = height * 0.62 + Math.sin(x * 0.014 + 1.2) * 28 + Math.cos(x * 0.038) * 14;
        ctx.lineTo(x, my);
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();

      // Midground craters and crags
      ctx.fillStyle = '#162238';
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let x = 0; x <= width; x += 12) {
        const cy = height * 0.72 + Math.sin(x * 0.022 + 0.5) * 18 + Math.cos(x * 0.05) * 9;
        ctx.lineTo(x, cy);
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();

      // Foreground lunar regolith polygon with smooth landing shelf
      const groundGrad = ctx.createLinearGradient(0, height - 80, 0, height);
      groundGrad.addColorStop(0, '#1e293b');
      groundGrad.addColorStop(0.5, '#111827');
      groundGrad.addColorStop(1, '#080d19');
      ctx.fillStyle = groundGrad;
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1.8;

      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let x = 0; x <= width; x += 8) {
        let ty = padY;
        if (x < padX - 10 || x > padX + padW + 10) {
          ty = padY + 6 + Math.sin(x * 0.04 + 0.8) * 14 + Math.cos(x * 0.08) * 7;
        }
        ctx.lineTo(x, ty);
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // -----------------------------------------------------------------------
      // 3. MULTI-LAYERED HOLOGRAPHIC LANDING PLATFORM
      // -----------------------------------------------------------------------
      // Base foundation
      ctx.fillStyle = '#022c22';
      ctx.fillRect(padX - 4, padY, padW + 8, 12);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.strokeRect(padX - 4, padY, padW + 8, 12);

      // Flanking strobe beacon lights
      const strobePhase = Math.floor(t * 5) % 2;
      ctx.fillStyle = strobePhase === 0 ? '#10b981' : '#ffffff';
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 12;
      ctx.fillRect(padX - 2, padY - 10, 5, 10);
      ctx.fillRect(padX + padW - 3, padY - 10, 5, 10);
      ctx.shadowBlur = 0;

      // Vertical holographic guidance laser beams
      ctx.save();
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 6]);
      ctx.lineDashOffset = -t * 20;
      ctx.beginPath();
      ctx.moveTo(padX, padY);
      ctx.lineTo(padX, padY - 150);
      ctx.moveTo(padX + padW, padY);
      ctx.lineTo(padX + padW, padY - 150);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Floating 3D Holographic Multiplier Pill Badge
      ctx.save();
      const holoPulse = 0.8 + 0.2 * Math.sin(t * 4);
      ctx.globalAlpha = holoPulse;
      const badgeY = padY - 26;
      ctx.fillStyle = 'rgba(2, 6, 23, 0.9)';
      ctx.fillRect(padX + padW / 2 - 42, badgeY, 84, 15);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(padX + padW / 2 - 42, badgeY, 84, 15);

      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 7.5px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PAD ALPHA [1.0x]', padX + padW / 2, badgeY + 11);
      ctx.restore();

      // Runway chevrons
      ctx.fillStyle = '#10b981';
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('>>> LAND HERE <<<', padX + padW / 2, padY + 9);
      ctx.textAlign = 'left';

      // -----------------------------------------------------------------------
      // 4. AUTONOMOUS FLIGHT SIMULATION (Phased Cycle)
      // -----------------------------------------------------------------------
      const targetPadCenterX = padX + padW / 2;
      const targetPadTouchY = padY - 16;

      let isThrusting = false;

      if (phase === 0) {
        // Orbital Glide
        shipVy += 0.22; // gravity
        shipX += shipVx * 0.055;
        shipY += shipVy * 0.055;
        shipAngle = Math.sin(t * 1.5) * 0.05;

        if (shipX > targetPadCenterX - 70) {
          phase = 1;
          phaseTimer = 0;
        }
      } else if (phase === 1) {
        // Deceleration & Align Burn
        const dx = targetPadCenterX - shipX;
        const targetAngle = Math.max(-0.35, Math.min(0.35, dx * 0.015 - shipVx * 0.04));
        shipAngle += (targetAngle - shipAngle) * 0.08;

        isThrusting = true;
        shipVx *= 0.97;
        shipVy = Math.max(-2, Math.min(6, (targetPadTouchY - shipY) * 0.12));

        shipX += shipVx * 0.06;
        shipY += shipVy * 0.05;

        if (Math.abs(dx) < 15 && shipY > targetPadTouchY - 50) {
          phase = 2;
          phaseTimer = 0;
        }
      } else if (phase === 2) {
        // Terminal Descent
        const dx = targetPadCenterX - shipX;
        shipAngle += (0 - shipAngle) * 0.1;
        shipVx += dx * 0.08;
        shipVx *= 0.92;

        const distToTouch = targetPadTouchY - shipY;
        if (distToTouch > 4) {
          isThrusting = shipVy > 3.5;
          shipVy += (isThrusting ? -0.45 : 0.25);
          shipVy = Math.max(0.5, Math.min(4.5, shipVy));
          shipX += shipVx * 0.04;
          shipY += shipVy * 0.04;
        } else {
          // Touchdown!
          shipY = targetPadTouchY;
          shipVx = 0;
          shipVy = 0;
          shipAngle = 0;
          phase = 3;
          phaseTimer = 0;

          // Touchdown sparkles
          for (let k = 0; k < 18; k++) {
            const spd = 20 + Math.random() * 50;
            const ang = -Math.PI * 0.9 + Math.random() * Math.PI * 0.8;
            particles.push({
              x: shipX + (Math.random() - 0.5) * 20,
              y: padY - 2,
              vx: Math.cos(ang) * spd,
              vy: Math.sin(ang) * spd,
              life: 0,
              maxLife: 24,
              color: Math.random() < 0.5 ? '#10b981' : '#f59e0b',
              size: 2,
            });
          }
        }
      } else if (phase === 3) {
        // Touchdown Pause
        shipX = targetPadCenterX;
        shipY = targetPadTouchY;
        shipVx = 0;
        shipVy = 0;
        shipAngle = 0;
        isThrusting = false;

        if (phaseTimer > 1.8) {
          phase = 4;
          phaseTimer = 0;
        }
      } else if (phase === 4) {
        // Ascent Boost to Re-enter Orbit
        isThrusting = true;
        shipAngle += (-0.2 - shipAngle) * 0.08;
        shipVy -= 0.6;
        shipVx += 0.45;

        shipX += shipVx * 0.05;
        shipY += shipVy * 0.05;

        if (shipY < 40 || shipX > width + 40) {
          // Reset to beginning of orbit loop
          phase = 0;
          phaseTimer = 0;
          shipX = 60;
          shipY = 70;
          shipVx = 18;
          shipVy = 4;
          shipAngle = 0.06;
        }
      }

      // Spawn thruster plume particles
      if (isThrusting) {
        const flameX = shipX - Math.sin(shipAngle) * 16;
        const flameY = shipY + Math.cos(shipAngle) * 16;
        for (let p = 0; p < 2; p++) {
          particles.push({
            x: flameX + (Math.random() - 0.5) * 5,
            y: flameY + (Math.random() - 0.5) * 5,
            vx: -Math.sin(shipAngle) * (40 + Math.random() * 30) + (Math.random() - 0.5) * 14,
            vy: Math.cos(shipAngle) * (50 + Math.random() * 40) + (Math.random() - 0.5) * 14,
            life: 0,
            maxLife: 16 + Math.random() * 8,
            color: Math.random() < 0.55 ? '#f59e0b' : Math.random() < 0.85 ? '#ef4444' : '#60a5fa',
            size: 2.5 + Math.random() * 2,
          });
        }

        // Billowing regolith dust spray when firing near ground
        if (shipY > padY - 55) {
          for (let d = 0; d < 2; d++) {
            const dir = Math.random() > 0.5 ? 1 : -1;
            particles.push({
              x: shipX + (Math.random() - 0.5) * 24,
              y: padY,
              vx: dir * (30 + Math.random() * 45),
              vy: -6 - Math.random() * 14,
              life: 0,
              maxLife: 22,
              color: '#94a3b8',
              size: 2 + Math.random() * 2.5,
            });
          }
        }
      }

      // -----------------------------------------------------------------------
      // 5. LIVE DOTTED TRAJECTORY PREDICTION LINE (Level 1 Avionics Feature)
      // -----------------------------------------------------------------------
      if (phase !== 3) {
        ctx.save();
        ctx.setLineDash([4, 5]);
        ctx.lineDashOffset = -t * 30;
        ctx.lineWidth = 2;
        ctx.strokeStyle = landerColor;
        ctx.shadowColor = landerColor;
        ctx.shadowBlur = 6;

        let curSimX = shipX;
        let curSimY = shipY;
        let curSimVx = shipVx;
        let curSimVy = shipVy;
        const dtSim = 0.06;

        ctx.beginPath();
        ctx.moveTo(curSimX, curSimY);
        let impactX = targetPadCenterX;
        let impactY = targetPadTouchY;
        let hit = false;

        for (let s = 0; s < 40; s++) {
          curSimVy += (isThrusting ? -0.3 : 0.35);
          curSimX += curSimVx * dtSim * 15;
          curSimY += curSimVy * dtSim * 15;
          ctx.lineTo(curSimX, curSimY);

          if (curSimY >= padY - 6) {
            impactX = curSimX;
            impactY = padY;
            hit = true;
            break;
          }
        }
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.shadowBlur = 0;

        // Target intercept reticle
        if (hit) {
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(impactX, impactY, 7 + Math.sin(t * 6) * 2, 0, Math.PI * 2);
          ctx.moveTo(impactX - 10, impactY);
          ctx.lineTo(impactX + 10, impactY);
          ctx.moveTo(impactX, impactY - 10);
          ctx.lineTo(impactX, impactY + 10);
          ctx.stroke();
        }
        ctx.restore();
      }

      // -----------------------------------------------------------------------
      // 6. DRAW PARTICLES (Exhaust plumes, dust, sparks)
      // -----------------------------------------------------------------------
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
          continue;
        }
        p.x += p.vx * 0.055;
        p.y += p.vy * 0.055;
        const pAlpha = 1 - p.life / p.maxLife;

        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, pAlpha);
        const pSize = Math.max(1, p.size * pAlpha);
        ctx.fillRect(p.x - pSize / 2, p.y - pSize / 2, pSize, pSize);
      }
      ctx.globalAlpha = 1.0;

      // -----------------------------------------------------------------------
      // 7. DRAW THE SPACECRAFT (Uses Identical Spacecraft Model Asset)
      // -----------------------------------------------------------------------
      ctx.save();
      ctx.translate(shipX, shipY);
      ctx.rotate(shipAngle);

      // Spacecraft vessel dimensions
      const craftW = 46;
      const craftH = 34;

      // Livery halo glow
      ctx.shadowColor = landerColor;
      ctx.shadowBlur = 10;

      if (landerImage && landerImage.complete && landerImage.naturalWidth > 0) {
        // Draw real spacecraft asset
        ctx.drawImage(landerImage, -craftW / 2, -craftH / 2, craftW, craftH);
      } else {
        // High-fidelity procedural Apollo Lunar Module
        // Fuselage
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-craftW / 2 + 8, -craftH / 2 + 6, craftW - 16, craftH - 14);

        // Livery accent band
        ctx.fillStyle = landerColor;
        ctx.fillRect(-craftW / 2 + 10, -craftH / 2 + 8, craftW - 20, 5);

        // Cockpit dome
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(0, -craftH / 2 + 7, 6, Math.PI, 0);
        ctx.fill();

        // Engine nozzle
        ctx.fillStyle = '#475569';
        ctx.fillRect(-6, craftH / 2 - 8, 12, 6);

        // Landing gear struts
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-10, 4);
        ctx.lineTo(-20, craftH / 2);
        ctx.lineTo(-24, craftH / 2);
        ctx.moveTo(10, 4);
        ctx.lineTo(20, craftH / 2);
        ctx.lineTo(24, craftH / 2);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;

      // Dynamic engine flame cone
      if (isThrusting) {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(-6, craftH / 2 - 3);
        ctx.lineTo(6, craftH / 2 - 3);
        ctx.lineTo(0, craftH / 2 + 14 + Math.random() * 8);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#60a5fa';
        ctx.beginPath();
        ctx.moveTo(-3, craftH / 2 - 3);
        ctx.lineTo(3, craftH / 2 - 3);
        ctx.lineTo(0, craftH / 2 + 8 + Math.random() * 4);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();

      // Dynamic ground spotlight illuminating terrain beneath ship
      if (isThrusting && shipY < padY) {
        ctx.save();
        const spot = ctx.createRadialGradient(shipX, shipY + 16, 4, shipX, shipY + 40, 50);
        spot.addColorStop(0, 'rgba(255, 176, 0, 0.32)');
        spot.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = spot;
        ctx.beginPath();
        ctx.arc(shipX, shipY + 30, 50, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Callsign pill badge above craft
      ctx.save();
      const badgeText = phase === 3 ? 'TOUCHDOWN CONFIRMED' : pilotCallsign;
      ctx.font = 'bold 7.5px "Press Start 2P", monospace';
      const bW = ctx.measureText(badgeText).width + 12;
      ctx.fillStyle = 'rgba(2, 6, 23, 0.9)';
      ctx.fillRect(shipX - bW / 2, shipY - 26, bW, 14);
      ctx.strokeStyle = phase === 3 ? '#10b981' : landerColor;
      ctx.lineWidth = 1.2;
      ctx.strokeRect(shipX - bW / 2, shipY - 26, bW, 14);

      ctx.fillStyle = phase === 3 ? '#10b981' : landerColor;
      ctx.textAlign = 'center';
      ctx.fillText(badgeText, shipX, shipY - 16);
      ctx.restore();

      // -----------------------------------------------------------------------
      // 8. MINI TACTICAL RADAR MINIMAP (Top Right)
      // -----------------------------------------------------------------------
      const rW = 75;
      const rH = 38;
      const rX = width - rW - 10;
      const rY = 28;

      ctx.save();
      ctx.fillStyle = 'rgba(2, 6, 23, 0.88)';
      ctx.fillRect(rX, rY, rW, rH);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1;
      ctx.strokeRect(rX, rY, rW, rH);

      // Radar pad pip
      const rPadX = rX + (padX / width) * rW;
      const rPadW = (padW / width) * rW;
      const rPadY = rY + (padY / height) * rH;
      ctx.fillStyle = '#10b981';
      ctx.fillRect(rPadX, rPadY, rPadW, 2);

      // Radar ship pip with pulse
      const rShipX = rX + (shipX / width) * rW;
      const rShipY = rY + (shipY / height) * rH;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(rShipX, rShipY, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(rShipX, rShipY, 4.5, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#10b981';
      ctx.font = '5px "Press Start 2P", monospace';
      ctx.fillText('RADAR', rX + 4, rY + 8);
      ctx.restore();

      // -----------------------------------------------------------------------
      // 9. CRT SCANLINES & TELEMETRY OVERLAY
      // -----------------------------------------------------------------------
      ctx.fillStyle = 'rgba(0, 0, 0, 0.14)';
      for (let y = 0; y < height; y += 3) {
        ctx.fillRect(0, y, width, 1.2);
      }

      // Top Telemetry Header
      ctx.fillStyle = 'rgba(2, 6, 23, 0.9)';
      ctx.fillRect(0, 0, width, 22);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 22);
      ctx.lineTo(width, 22);
      ctx.stroke();

      // Live Recording Indicator
      const recBlink = Math.sin(t * 5) > 0;
      ctx.fillStyle = recBlink ? '#ef4444' : '#7f1d1d';
      ctx.beginPath();
      ctx.arc(10, 11, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('LIVE FEED // AUTONOMOUS DRONE SIM', 18, 14);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#38bdf8';
      const altM = Math.max(0, Math.round(targetPadTouchY - shipY));
      const vspd = Math.round(shipVy * 4);
      ctx.fillText(`ALT: ${altM}M  V-SPD: ${vspd}PX/S`, width - 10, 14);

      // Bottom Telemetry Bar
      ctx.fillStyle = 'rgba(2, 6, 23, 0.9)';
      ctx.fillRect(0, height - 18, width, 18);
      ctx.strokeStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(0, height - 18);
      ctx.lineTo(width, height - 18);
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 7px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`CRAFT: ${pilotCallsign} // SECTOR: MARE TRANQUILLITATIS`, 8, height - 6);

      ctx.textAlign = 'right';
      const phaseNames = ['ORBITAL INSERTION', 'ALIGNMENT BURN', 'TERMINAL DESCENT', 'TOUCHDOWN CONFIRMED', 'ASCENT BOOST'];
      ctx.fillStyle = phase === 3 ? '#10b981' : isThrusting ? '#f59e0b' : '#38bdf8';
      ctx.fillText(`AUTOPILOT: ${phaseNames[phase]}`, width - 8, height - 6);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [landerColor, pilotCallsign, landerImage]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-1">
      <div className="relative border-4 border-emerald-500/80 bg-black shadow-[8px_8px_0px_0px_#064e3b] overflow-hidden max-w-full">
        {/* High-Tech CRT Corner Badges */}
        <div className="absolute top-1 left-1 text-[7px] text-emerald-400 font-mono z-10 pointer-events-none select-none bg-black/70 px-1.5 py-0.5 border border-emerald-500/40">
          PROBE CAM-01 [60 FPS]
        </div>
        <div className="absolute bottom-1 right-1 text-[6.5px] text-zinc-400 font-mono z-10 pointer-events-none select-none bg-black/70 px-1.5 py-0.5 border border-zinc-700">
          HD-OPTICAL // RAW FEED
        </div>

        <canvas
          ref={canvasRef}
          width={500}
          height={310}
          className="block w-full h-auto aspect-[16/10] max-h-[350px] object-cover"
        />
      </div>
    </div>
  );
}
