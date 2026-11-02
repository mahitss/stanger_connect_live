import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  BookOpen,
  Layers,
  MessageSquare,
  Send,
  Smartphone,
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  GLASS_ARCHITECTURAL_FLOORS,
  evaluateRollingBookKinematics,
  evaluateVerticalArchitectureScrollState,
  buildInitialCharacterMessengerBubbles,
  appendCharacterMessengerPing,
  type CharacterMessengerBubble,
  type GlassArchitecturalFloorSpec,
  type RollingBookDirection,
} from '../utils/rules';

export interface GlassArchitectureShowcaseProps {
  currentDisplayName: string;
  currentEmail: string;
  activeStudyRoomCode: string;
  dailyCompletedMinutes: number;
  dailyTargetMinutes: number;
  streakCount: number;
  participationPoints: number;
  recentQrScansCount: number;
  onEnterWorkspacePage: (
    targetPage: 'hub' | 'study' | 'chat' | 'moments' | 'privacy',
    openQrScanner?: boolean
  ) => void;
  onQuickLogFocusSprint: () => void;
}

function createProceduralCodexPageTexture(renderer: THREE.WebGLRenderer): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, 512, 1024);
    grad.addColorStop(0, '#0f2942');
    grad.addColorStop(0.5, '#163b5c');
    grad.addColorStop(1, '#0b1d33');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 1024);

    // Golden & Cyan Luminous Codex Borders
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 8;
    ctx.strokeRect(18, 18, 476, 988);

    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 4;
    ctx.strokeRect(34, 34, 444, 956);

    const chapterColors = ['#38bdf8', '#818cf8', '#c084fc', '#34d399', '#fbbf24'];
    const chapterLabels = [
      'I · SILENT STUDY SANCTUARY',
      'II · INVITE-FIRST MESSENGER',
      'III · MOMENTS & TOWNSQUARE',
      'IV · OPTICAL QR ROOM SCANNER',
      'V · ZERO-TRUST SECURITY VAULT',
    ];

    for (let i = 0; i < 5; i++) {
      const yBase = 68 + i * 182;
      ctx.fillStyle = 'rgba(12, 24, 44, 0.88)';
      ctx.fillRect(50, yBase, 412, 152);

      ctx.strokeStyle = chapterColors[i];
      ctx.lineWidth = 3;
      ctx.strokeRect(50, yBase, 412, 152);

      ctx.fillStyle = chapterColors[i];
      ctx.font = 'bold 21px sans-serif';
      ctx.fillText(chapterLabels[i], 68, yBase + 38);

      ctx.fillStyle = 'rgba(241, 245, 249, 0.88)';
      for (let line = 0; line < 3; line++) {
        const lineY = yBase + 64 + line * 24;
        const lineW = line === 2 ? 250 : 356;
        ctx.fillRect(68, lineY, lineW, 9);
      }
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return tex;
}

function createPhoneScreenTexture(
  renderer: THREE.WebGLRenderer,
  accentHex: string,
  handleText: string
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#091526';
    ctx.fillRect(0, 0, 256, 512);

    ctx.strokeStyle = accentHex;
    ctx.lineWidth = 8;
    ctx.strokeRect(8, 8, 240, 496);

    // Top status bar
    ctx.fillStyle = accentHex;
    ctx.fillRect(24, 28, 208, 42);

    ctx.fillStyle = '#020617';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(handleText.slice(0, 14), 34, 55);

    // Chat bubbles on phone screen
    for (let i = 0; i < 4; i++) {
      const y = 96 + i * 94;
      const isRight = i % 2 === 1;
      ctx.fillStyle = isRight ? accentHex : '#1e293b';
      ctx.fillRect(isRight ? 54 : 24, y, 178, 68);
      ctx.fillStyle = isRight ? '#020617' : '#f8fafc';
      ctx.fillRect((isRight ? 54 : 24) + 14, y + 18, 130, 10);
      ctx.fillRect((isRight ? 54 : 24) + 14, y + 38, 96, 10);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return tex;
}

export const GlassArchitectureShowcase: React.FC<GlassArchitectureShowcaseProps> = ({
  currentDisplayName,
  currentEmail,
  activeStudyRoomCode,
  dailyCompletedMinutes,
  dailyTargetMinutes,
  streakCount,
  participationPoints,
  recentQrScansCount,
  onEnterWorkspacePage,
  onQuickLogFocusSprint,
}) => {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const floorSectionRefs = useRef<Record<number, HTMLElement | null>>({});

  // Scroll & Book Roll State (0 to 100%)
  const [bookRollPercent, setBookRollPercent] = useState<number>(42);
  const [rollDirection, setRollDirection] = useState<RollingBookDirection>('rolling_down');
  const [isAutoRollingBook, setIsAutoRollingBook] = useState<boolean>(true);
  const [activeFloorIndex, setActiveFloorIndex] = useState<number>(2);
  const [isBottomDockCollapsed, setIsBottomDockCollapsed] = useState<boolean>(false);
  const [messengerBubbles, setMessengerBubbles] = useState<CharacterMessengerBubble[]>(() =>
    buildInitialCharacterMessengerBubbles()
  );
  const [customInputByFloor, setCustomInputByFloor] = useState<Record<number, string>>({});
  const [cardTiltByFloor, setCardTiltByFloor] = useState<
    Record<number, { rotateX: number; rotateY: number }>
  >({});

  const sceneControlRef = useRef<{
    targetRollRatio: number;
    currentRollRatio: number;
    isAutoRolling: boolean;
    activeFloorIdx: number;
  }>({
    targetRollRatio: 0.42,
    currentRollRatio: 0.42,
    isAutoRolling: true,
    activeFloorIdx: 2,
  });

  useEffect(() => {
    sceneControlRef.current.targetRollRatio = Math.max(0, Math.min(1, bookRollPercent / 100));
    sceneControlRef.current.isAutoRolling = isAutoRollingBook;
    sceneControlRef.current.activeFloorIdx = activeFloorIndex;
  }, [bookRollPercent, isAutoRollingBook, activeFloorIndex]);

  // Synchronize page scroll position with the 3D Rolling Book & Vertical Tower Camera
  useEffect(() => {
    let lastScrollRatio = 0;
    const handleScroll = () => {
      const docEl = document.documentElement;
      const maxScroll = Math.max(1, docEl.scrollHeight - window.innerHeight);
      const ratio = Math.max(0, Math.min(1, window.scrollY / maxScroll));
      const delta = ratio - lastScrollRatio;
      if (Math.abs(delta) > 0.004) {
        const nextDir: RollingBookDirection = delta > 0 ? 'rolling_down' : 'rolling_up';
        const nextPercent = Math.round(ratio * 100);
        setRollDirection(nextDir);
        setBookRollPercent(nextPercent);
        const kinematics = evaluateRollingBookKinematics(nextPercent, nextDir);
        setActiveFloorIndex(kinematics.activeFloorIndex);
        lastScrollRatio = ratio;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Initialize Three.js 3D Glassy Architecture, Rolling Book & Animated Phone Characters
  useEffect(() => {
    const mountEl = canvasMountRef.current;
    if (!mountEl) return;

    const isSoftwareGl = (() => {
      const probeCanvas = document.createElement('canvas');
      const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      return;
    }

    const width = Math.max(320, mountEl.clientWidth || window.innerWidth);
    const height = Math.max(420, mountEl.clientHeight || window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    mountEl.innerHTML = '';
    mountEl.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x040b18, 0.022);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 120);
    camera.position.set(0, 4.2, 11.8);
    camera.lookAt(0, 3.4, 0);

    // Studio Warm/Cool Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0xbae6fd, 0x0f172a, 1.35);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff4d6, 2.5);
    keyLight.position.set(6, 14, 10);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.bias = -0.0005;
    }
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.75);
    rimLight.position.set(-8, 7, -6);
    scene.add(rimLight);

    // Shared PBR Materials
    const crystalGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0x7dd3fc,
      roughness: 0.1,
      metalness: 0.12,
      transmission: isSoftwareGl ? 0 : 0.86,
      transparent: true,
      opacity: isSoftwareGl ? 0.42 : 0.94,
      ior: 1.54,
      thickness: 1.4,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      depthWrite: false,
    });

    const obsidianCoverMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.25,
      metalness: 0.72,
    });

    const brushedGoldMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      roughness: 0.18,
      metalness: 0.94,
    });

    const codexPageTex = createProceduralCodexPageTexture(renderer);
    const codexPageMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: codexPageTex,
      roughness: 0.3,
      metalness: 0.12,
      emissive: 0x0284c7,
      emissiveIntensity: 0.28,
      side: THREE.DoubleSide,
    });

    // ========================================================================
    // 1. HERO COMPOSITE 3D ROLLING BOOK & GLASS FRONT BASE PEDESTAL (12 parts)
    // ========================================================================
    const rollingBookGroup = new THREE.Group();
    rollingBookGroup.position.set(-2.65, 3.8, 1.2);
    scene.add(rollingBookGroup);

    // Part 1: Front Base Multi-Tiered Glass Pedestal
    const pedestalGeo = new THREE.CylinderGeometry(1.9, 2.25, 0.42, 36);
    const pedestalMesh = new THREE.Mesh(pedestalGeo, crystalGlassMat);
    pedestalMesh.position.set(0, -1.95, 0);
    rollingBookGroup.add(pedestalMesh);

    // Part 2: Gold Rim Bevel Ring on Pedestal
    const pedestalRingGeo = new THREE.TorusGeometry(2.02, 0.055, 16, 48);
    const pedestalRingMesh = new THREE.Mesh(pedestalRingGeo, brushedGoldMat);
    pedestalRingMesh.rotation.x = Math.PI / 2;
    pedestalRingMesh.position.set(0, -1.74, 0);
    rollingBookGroup.add(pedestalRingMesh);

    // Part 3: Contact Shadow Disc beneath Pedestal
    const shadowGeo = new THREE.CircleGeometry(2.45, 32);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x020617,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.set(0, -2.17, 0);
    rollingBookGroup.add(shadowMesh);

    // Part 4 & 5: Left & Right Sculpted Glass-Obsidian Book Covers
    const coverGeo = new THREE.BoxGeometry(1.5, 2.35, 0.14);
    const leftCoverGroup = new THREE.Group();
    const leftCoverMesh = new THREE.Mesh(coverGeo, obsidianCoverMat);
    leftCoverMesh.position.set(-0.76, 0, 0);
    leftCoverGroup.add(leftCoverMesh);
    rollingBookGroup.add(leftCoverGroup);

    const rightCoverGroup = new THREE.Group();
    const rightCoverMesh = new THREE.Mesh(coverGeo, obsidianCoverMat);
    rightCoverMesh.position.set(0.76, 0, 0);
    rightCoverGroup.add(rightCoverMesh);
    rollingBookGroup.add(rightCoverGroup);

    // Part 6: Central Gold Spine Cylinder
    const spineGeo = new THREE.CylinderGeometry(0.13, 0.13, 2.45, 20);
    const spineMesh = new THREE.Mesh(spineGeo, brushedGoldMat);
    spineMesh.position.set(0, 0, -0.05);
    rollingBookGroup.add(spineMesh);

    // Part 7: Upper Scroll Roller (Rolls the Book Scroll Up/Down)
    const rollerGeo = new THREE.CylinderGeometry(0.18, 0.18, 2.55, 24);
    const upperRollerGroup = new THREE.Group();
    const upperRollerMesh = new THREE.Mesh(rollerGeo, brushedGoldMat);
    upperRollerMesh.rotation.z = Math.PI / 2;
    upperRollerGroup.add(upperRollerMesh);
    upperRollerGroup.position.set(0, 1.05, 0.28);
    rollingBookGroup.add(upperRollerGroup);

    // Part 8: Lower Scroll Roller (Moves down as the Book unfurls, and rolls back up)
    const lowerRollerGroup = new THREE.Group();
    const lowerRollerMesh = new THREE.Mesh(rollerGeo, brushedGoldMat);
    lowerRollerMesh.rotation.z = Math.PI / 2;
    lowerRollerGroup.add(lowerRollerMesh);
    lowerRollerGroup.position.set(0, -0.25, 0.32);
    rollingBookGroup.add(lowerRollerGroup);

    // Part 9: Unfurling Codex Scroll Sheet between Upper & Lower Rollers
    const scrollSheetGeo = new THREE.PlaneGeometry(2.28, 1.0, 16, 24);
    const scrollSheetMesh = new THREE.Mesh(scrollSheetGeo, codexPageMat);
    scrollSheetMesh.position.set(0, 0.4, 0.3);
    rollingBookGroup.add(scrollSheetMesh);

    // Part 10: Refractive Glass Casing Arch around the Rolling Book
    const glassArchGeo = new THREE.TorusGeometry(1.85, 0.06, 16, 48, Math.PI);
    const glassArchMesh = new THREE.Mesh(glassArchGeo, crystalGlassMat);
    glassArchMesh.position.set(0, 0.42, 0);
    rollingBookGroup.add(glassArchMesh);

    // ========================================================================
    // 2. 5-FLOOR VERTICAL 3D GLASS TOWER & ANIMATED PHONE MESSENGER CHARACTERS
    // ========================================================================
    const towerGroup = new THREE.Group();
    towerGroup.position.set(2.45, 0, 0.4);
    scene.add(towerGroup);

    // 4 Vertical Glass Elevator Columns spanning from Top Spire (+7.5m) to Foundation (-7.5m)
    const columnGeo = new THREE.CylinderGeometry(0.09, 0.09, 16.0, 16);
    const columnOffsets = [
      [-1.85, -1.25],
      [1.85, -1.25],
      [-1.85, 1.25],
      [1.85, 1.25],
    ];
    columnOffsets.forEach(([cx, cz]) => {
      const col = new THREE.Mesh(columnGeo, crystalGlassMat);
      col.position.set(cx, -0.2, cz);
      towerGroup.add(col);
    });

    const disposablePhoneTextures: THREE.CanvasTexture[] = [];
    const characterGroups: Array<{
      floorIndex: number;
      baseElevationY: number;
      group: THREE.Group;
      phoneGroup: THREE.Group;
      bubbleMesh: THREE.Mesh;
      ringMesh: THREE.Mesh;
    }> = [];

    const floorSlabGeo = new THREE.CylinderGeometry(2.25, 2.35, 0.2, 36);
    const floorRimGeo = new THREE.TorusGeometry(2.3, 0.045, 12, 48);
    const headGeo = new THREE.SphereGeometry(0.28, 20, 20);
    const torsoGeo = new THREE.CylinderGeometry(0.26, 0.38, 0.88, 20);
    const armGeo = new THREE.CylinderGeometry(0.075, 0.075, 0.58, 12);
    const phoneBodyGeo = new THREE.BoxGeometry(0.32, 0.56, 0.045);
    const bubbleGeo = new THREE.BoxGeometry(0.86, 0.3, 0.07);

    GLASS_ARCHITECTURAL_FLOORS.forEach((floor) => {
      const floorY = floor.elevationY;
      const accentColor = new THREE.Color(floor.accentHex);

      // Floor Glass Slab
      const slabMesh = new THREE.Mesh(floorSlabGeo, crystalGlassMat);
      slabMesh.position.set(0, floorY - 0.65, 0);
      towerGroup.add(slabMesh);

      // Floor Accent Neon/Gold Rim
      const rimMat = new THREE.MeshStandardMaterial({
        color: accentColor,
        roughness: 0.22,
        metalness: 0.85,
        emissive: accentColor,
        emissiveIntensity: 0.45,
      });
      const rimMesh = new THREE.Mesh(floorRimGeo, rimMat);
      rimMesh.rotation.x = Math.PI / 2;
      rimMesh.position.set(0, floorY - 0.55, 0);
      towerGroup.add(rimMesh);

      // Composite 8-Part Animated Character with Phone & Messenger Bubble
      const charGroup = new THREE.Group();
      charGroup.position.set(0, floorY - 0.52, 0.32);

      const suitMat = new THREE.MeshStandardMaterial({
        color: accentColor,
        roughness: 0.34,
        metalness: 0.38,
      });
      const skinMat = new THREE.MeshStandardMaterial({
        color: 0xfde68a,
        roughness: 0.55,
        metalness: 0.08,
      });
      const phoneTex = createPhoneScreenTexture(
        renderer,
        floor.accentHex,
        floor.character.handle
      );
      disposablePhoneTextures.push(phoneTex);

      const phoneScreenMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: phoneTex,
        emissive: accentColor,
        emissiveIntensity: 0.65,
        roughness: 0.14,
        metalness: 0.2,
      });

      // 1. Character Ground Contact Disc
      const charBaseDisc = new THREE.Mesh(
        new THREE.CircleGeometry(0.64, 24),
        shadowMat
      );
      charBaseDisc.rotation.x = -Math.PI / 2;
      charBaseDisc.position.set(0, 0.02, 0);
      charGroup.add(charBaseDisc);

      // 2. Torso
      const torsoMesh = new THREE.Mesh(torsoGeo, suitMat);
      torsoMesh.position.set(0, 0.48, 0);
      charGroup.add(torsoMesh);

      // 3. Head
      const headMesh = new THREE.Mesh(headGeo, skinMat);
      headMesh.position.set(0, 1.16, 0);
      charGroup.add(headMesh);

      // 4. Optical Visor / Glasses
      const visorMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.38, 0.1, 0.16),
        obsidianCoverMat
      );
      visorMesh.position.set(0, 1.17, 0.21);
      charGroup.add(visorMesh);

      // 5. Left Arm
      const leftArm = new THREE.Mesh(armGeo, suitMat);
      leftArm.position.set(-0.36, 0.54, 0.15);
      leftArm.rotation.z = 0.28;
      leftArm.rotation.x = -0.45;
      charGroup.add(leftArm);

      // 6 & 7. Right Arm + Glowing Smartphone Group
      const phoneGroup = new THREE.Group();
      phoneGroup.position.set(0.34, 0.72, 0.46);
      const rightArm = new THREE.Mesh(armGeo, suitMat);
      rightArm.position.set(0.04, -0.14, -0.2);
      rightArm.rotation.x = -0.85;
      rightArm.rotation.z = -0.22;
      phoneGroup.add(rightArm);

      const phoneMesh = new THREE.Mesh(phoneBodyGeo, phoneScreenMat);
      phoneMesh.rotation.x = -0.28;
      phoneMesh.rotation.y = -0.24;
      phoneGroup.add(phoneMesh);
      charGroup.add(phoneGroup);

      // 8. Floating 3D Messenger Chat Bubble above Character
      const bubbleMesh = new THREE.Mesh(bubbleGeo, phoneScreenMat);
      bubbleMesh.position.set(0, 1.66, 0.2);
      charGroup.add(bubbleMesh);

      towerGroup.add(charGroup);
      characterGroups.push({
        floorIndex: floor.floorIndex,
        baseElevationY: floorY - 0.52,
        group: charGroup,
        phoneGroup,
        bubbleMesh,
        ringMesh: rimMesh,
      });
    });

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    let lastTimeMs = performance.now();
    let elapsedSec = 0;
    let frameId = 0;
    let isDisposed = false;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (gl && typeof gl.fenceSync === 'function') {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (isDisposed) return;
          const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            frameId = window.setTimeout(cb, 80);
          }
        };
        frameId = window.setTimeout(poll, 5);
      } else {
        frameId = window.setTimeout(cb, 80);
      }
    }

    function tick() {
      if (isDisposed) return;
      const nowMs = performance.now();
      const dt = Math.min(Math.max(0.001, (nowMs - lastTimeMs) * 0.001), 0.1);
      lastTimeMs = nowMs;
      elapsedSec += dt;

      const ctrl = sceneControlRef.current;

      let desiredRoll = ctrl.targetRollRatio;
      if (ctrl.isAutoRolling) {
        desiredRoll = 0.2 + (Math.sin(elapsedSec * 0.8) * 0.5 + 0.5) * 0.72;
      }

      ctrl.currentRollRatio = THREE.MathUtils.damp(
        ctrl.currentRollRatio,
        desiredRoll,
        4.5,
        dt
      );
      const roll = ctrl.currentRollRatio;

      // Animate the 3D Rolling Book (Covers open/close, upper & lower rollers spin, scroll sheet unfurls up & down)
      const openAngle = 0.28 + roll * 0.85;
      leftCoverGroup.rotation.y = -openAngle;
      rightCoverGroup.rotation.y = openAngle;

      const scrollLen = 0.55 + roll * 2.55;
      scrollSheetMesh.scale.y = scrollLen;
      scrollSheetMesh.position.y = 1.05 - scrollLen * 0.5;
      lowerRollerGroup.position.y = 1.05 - scrollLen;

      upperRollerMesh.rotation.x = roll * Math.PI * 8;
      lowerRollerMesh.rotation.x = -roll * Math.PI * 8;

      rollingBookGroup.rotation.y = Math.sin(elapsedSec * 0.55) * 0.2 + 0.22;
      rollingBookGroup.position.y =
        camera.position.y - 0.45 + Math.sin(elapsedSec * 1.2) * 0.1;

      // Smoothly glide camera vertically from Top Spire (+5.2m) down to Foundation Vault (-5.2m)
      const targetCamY = 5.2 - ctrl.targetRollRatio * 10.4;
      camera.position.y = THREE.MathUtils.damp(camera.position.y, targetCamY, 3.8, dt);
      camera.lookAt(0, camera.position.y - 0.4, 0);

      // Animate all 5 Characters moving up & down in the 3D Glass Architecture while using their phones
      characterGroups.forEach((item) => {
        const phase = item.floorIndex * 1.25;
        const bobOffset = Math.sin(elapsedSec * 2.1 + phase) * 0.34;
        item.group.position.y = item.baseElevationY + bobOffset;
        item.group.rotation.y = Math.sin(elapsedSec * 0.9 + phase) * 0.35 - 0.28;

        item.phoneGroup.position.y = 0.72 + Math.sin(elapsedSec * 4.2 + phase) * 0.05;
        item.bubbleMesh.position.y = 1.66 + Math.cos(elapsedSec * 3.0 + phase) * 0.1;
        const isCurrentFloor = item.floorIndex === ctrl.activeFloorIdx;
        const targetScale = isCurrentFloor ? 1.18 : 0.96;
        item.group.scale.setScalar(
          THREE.MathUtils.damp(item.group.scale.x, targetScale, 5, dt)
        );
      });

      towerGroup.rotation.y = Math.sin(elapsedSec * 0.3) * 0.14;

      renderer.render(scene, camera);
      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    // Immediate synchronous first render so initial paint always shows the 3D scene
    tick();

    const handleResize = () => {
      if (!mountEl || isDisposed) return;
      const w = Math.max(320, mountEl.clientWidth || window.innerWidth);
      const h = Math.max(420, mountEl.clientHeight || window.innerHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      isDisposed = true;
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      codexPageTex.dispose();
      disposablePhoneTextures.forEach((t) => t.dispose());
      renderer.dispose();
    };
  }, []);

  const currentKinematics = evaluateRollingBookKinematics(bookRollPercent, rollDirection);
  const verticalState = evaluateVerticalArchitectureScrollState(
    bookRollPercent / 100,
    0,
    0
  );

  const handleToggleBookRoll = () => {
    setIsAutoRollingBook(false);
    const nextPercent = bookRollPercent >= 75 ? 8 : 100;
    const nextDir: RollingBookDirection =
      nextPercent > bookRollPercent ? 'rolling_down' : 'rolling_up';
    setRollDirection(nextDir);
    setBookRollPercent(nextPercent);
    setActiveFloorIndex(evaluateRollingBookKinematics(nextPercent, nextDir).activeFloorIndex);
  };

  const handleSliderRollChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = Number(e.target.value);
    const nextDir: RollingBookDirection =
      nextVal >= bookRollPercent ? 'rolling_down' : 'rolling_up';
    setIsAutoRollingBook(false);
    setRollDirection(nextDir);
    setBookRollPercent(nextVal);
    setActiveFloorIndex(evaluateRollingBookKinematics(nextVal, nextDir).activeFloorIndex);
  };

  const handleJumpToFloor = (floor: GlassArchitecturalFloorSpec) => {
    setIsAutoRollingBook(false);
    const targetPercent = Math.round(((floor.floorIndex - 1) / 4) * 100);
    setRollDirection(
      targetPercent >= bookRollPercent ? 'rolling_down' : 'rolling_up'
    );
    setBookRollPercent(targetPercent);
    setActiveFloorIndex(floor.floorIndex);
    const targetEl = floorSectionRefs.current[floor.floorIndex];
    if (targetEl && typeof targetEl.scrollIntoView === 'function') {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleSendCharacterPing = (floorIndex: number) => {
    const customMsg = customInputByFloor[floorIndex] || '';
    setMessengerBubbles((prev) =>
      appendCharacterMessengerPing(prev, floorIndex, customMsg)
    );
    setCustomInputByFloor((prev) => ({ ...prev, [floorIndex]: '' }));
  };

  const handleCardPointerMove = (
    floorIndex: number,
    e: React.PointerEvent<HTMLElement>
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / Math.max(1, rect.width) - 0.5;
    const relY = (e.clientY - rect.top) / Math.max(1, rect.height) - 0.5;
    setCardTiltByFloor((prev) => ({
      ...prev,
      [floorIndex]: {
        rotateX: Number((-relY * 7).toFixed(2)),
        rotateY: Number((relX * 9).toFixed(2)),
      },
    }));
  };

  const handleCardPointerLeave = (floorIndex: number) => {
    setCardTiltByFloor((prev) => ({
      ...prev,
      [floorIndex]: { rotateX: 0, rotateY: 0 },
    }));
  };

  return (
    <div
      data-testid="glass-3d-architecture-showcase"
      className="relative min-h-screen w-full text-slate-100 selection:bg-sky-500/30"
      style={{
        background:
          'radial-gradient(circle at 20% 15%, rgba(56, 189, 248, 0.2), transparent 40%), radial-gradient(circle at 80% 25%, rgba(192, 132, 252, 0.18), transparent 44%), linear-gradient(180deg, #040915 0%, #071226 50%, #040812 100%)',
      }}
    >
      {/* Fixed Full-Viewport Three.js 3D Glassy Architecture & Rolling Book Canvas */}
      <div
        ref={canvasMountRef}
        data-testid="glass-3d-architecture-canvas"
        data-book-roll-percent={currentKinematics.rollProgressPercent}
        data-active-floor={currentKinematics.activeFloorIndex}
        className="fixed inset-0 z-0 pointer-events-none"
      />

      {/* Single-Line Top Refractive Glass Architectural Navigation Header */}
      <header
        className="sticky top-0 z-30 border-b border-white/15 px-4 sm:px-6 py-3"
        style={{
          background:
            'linear-gradient(135deg, rgba(6, 14, 28, 0.84) 0%, rgba(12, 24, 46, 0.78) 100%)',
          boxShadow:
            'inset 0 1px 0 0 rgba(255, 255, 255, 0.24), 0 14px 36px -12px rgba(2, 6, 23, 0.75)',
        }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-sky-300/35 text-sky-300"
              style={{
                background:
                  'linear-gradient(145deg, rgba(56, 189, 248, 0.25), rgba(14, 165, 233, 0.08))',
                boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.35)',
              }}
            >
              <BookOpen className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-semibold tracking-tight text-white truncate">
                <span>Mr. Stranger · 3D Glass Codex</span>
                <span aria-hidden="true" className="text-slate-500">
                  ·
                </span>
                <span className="text-xs font-normal text-sky-300 truncate">
                  {currentDisplayName} ({currentEmail})
                </span>
              </div>
              <p
                data-testid="rolling-book-state-badge"
                className="text-[11px] text-slate-300 truncate"
              >
                {currentKinematics.bookStateLabel} · Elevation{' '}
                {verticalState.cameraElevationY}m
              </p>
            </div>
          </div>

          {/* Floor Quick-Jump Nav Links */}
          <nav
            aria-label="3D Architectural Floors"
            className="hidden xl:flex items-center gap-4 text-xs font-medium text-slate-300 shrink-0"
          >
            {GLASS_ARCHITECTURAL_FLOORS.map((floor) => {
              const isActive = floor.floorIndex === currentKinematics.activeFloorIndex;
              return (
                <button
                  key={floor.floorIndex}
                  type="button"
                  onClick={() => handleJumpToFloor(floor)}
                  className={`py-1 transition-colors border-b-2 whitespace-nowrap ${
                    isActive
                      ? 'border-sky-400 text-white font-semibold'
                      : 'border-transparent text-slate-400 hover:text-slate-100'
                  }`}
                >
                  0{floor.floorIndex}. {floor.character.name.split(' ')[0]}
                </button>
              );
            })}
          </nav>

          {/* Single-Row Action Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              data-testid="toggle-book-roll-btn"
              onClick={handleToggleBookRoll}
              className="inline-flex items-center gap-1.5 rounded-xl border border-sky-300/35 px-3 py-2 text-xs font-semibold text-sky-100 transition hover:border-sky-200/60 whitespace-nowrap"
              style={{
                background:
                  'linear-gradient(135deg, rgba(56, 189, 248, 0.24), rgba(30, 58, 138, 0.42))',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.28)',
              }}
            >
              {bookRollPercent >= 75 ? (
                <>
                  <ArrowUpCircle className="h-4 w-4 text-sky-300" />
                  <span>Roll Book Up</span>
                </>
              ) : (
                <>
                  <ArrowDownCircle className="h-4 w-4 text-sky-300" />
                  <span>Roll Book Down</span>
                </>
              )}
            </button>

            <button
              type="button"
              data-testid="switch-to-workspace-studio-btn"
              onClick={() => onEnterWorkspacePage('hub', false)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300/40 px-3.5 py-2 text-xs font-semibold text-emerald-50 transition hover:border-emerald-200/70 whitespace-nowrap"
              style={{
                background:
                  'linear-gradient(135deg, rgba(16, 185, 129, 0.36), rgba(5, 150, 105, 0.56))',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.32)',
              }}
            >
              <Layers className="h-4 w-4" />
              <span>Open Full Workspace Studio</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Scrollable 3D Glass Architectural Content */}
      <main className="relative z-10 mx-auto max-w-7xl px-4 sm:px-8 pt-6 pb-32">
        {/* SECTION 1: UNOBSTRUCTED 3D GLASS FRONT BASE STAGE (3D Rolling Book Left + 3D Phone Character Tower Right) */}
        <section
          data-testid="front-glass-base-hero"
          className="relative mb-16 flex flex-col justify-between min-h-[540px] rounded-3xl border border-white/20 p-6 sm:p-8"
          style={{
            background:
              'linear-gradient(180deg, rgba(8, 17, 34, 0.42) 0%, rgba(10, 22, 44, 0.14) 48%, rgba(8, 17, 34, 0.62) 100%)',
            boxShadow:
              'inset 0 1px 1px 0 rgba(255, 255, 255, 0.35), inset 0 -1px 1px 0 rgba(56, 189, 248, 0.25), 0 28px 64px -15px rgba(2, 6, 23, 0.78)',
          }}
        >
          {/* Top Stage Header Overlay (Leaves Central 3D Rolling Book & 3D Phone Tower 100% Unobstructed) */}
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div className="max-w-xl space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-sky-300">
                <span>3D Optical Glass Front Base</span>
                <span aria-hidden="true">·</span>
                <span>Kinetic Rolling Book</span>
                <span aria-hidden="true">·</span>
                <span>5-Level Vertical Phone Architecture</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
                Unfurl the 3D Glass Codex &amp; Scroll the Living Tower.
              </h1>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                Watch the <strong className="text-white">3D Codex Book roll up and down</strong> on
                the left glass pedestal while{' '}
                <strong className="text-white">
                  animated 3D characters using phones and social media messengers
                </strong>{' '}
                move up and down the 5-story glass tower on the right.
              </p>
            </div>

            {/* Compact Refractive Glass Scroll Codex Readout */}
            <div
              className="w-full lg:w-80 shrink-0 rounded-2xl border border-white/25 p-4"
              style={{
                background:
                  'linear-gradient(160deg, rgba(12, 24, 46, 0.72) 0%, rgba(30, 58, 138, 0.42) 100%)',
                boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.32)',
              }}
            >
              <div className="flex items-center justify-between text-[11px] text-amber-300 mb-2">
                <span className="font-semibold uppercase tracking-wider">
                  3D Rolling Book Status
                </span>
                <span className="font-mono">
                  {currentKinematics.rollProgressPercent}% Unfurled
                </span>
              </div>
              <div
                className="h-2.5 w-full rounded-full border border-amber-200/50"
                style={{
                  background:
                    'linear-gradient(90deg, #b45309 0%, #fde68a 50%, #b45309 100%)',
                }}
              />
              <div
                className="mx-1.5 border-x border-amber-300/30 px-3 py-2.5 text-xs"
                style={{ background: 'rgba(10, 20, 38, 0.78)' }}
              >
                <p className="font-semibold text-sky-300 truncate">
                  {currentKinematics.activeChapterTitle}
                </p>
                <p className="mt-1 text-[11px] text-slate-200 line-clamp-2">
                  {verticalState.activeFloor.whatTheAppDoes}
                </p>
              </div>
              <div
                className="h-2.5 w-full rounded-full border border-amber-200/50"
                style={{
                  background:
                    'linear-gradient(90deg, #92400e 0%, #fcd34d 50%, #92400e 100%)',
                }}
              />
            </div>
          </div>

          {/* Center 3D Stage Spatial Labels (Floating Callouts Pointing to Left 3D Book & Right 3D Phone Characters) */}
          <div className="my-auto py-12 grid grid-cols-1 sm:grid-cols-2 gap-6 pointer-events-none">
            <div className="flex flex-col items-start justify-end">
              <div
                className="rounded-xl border border-amber-300/35 px-3.5 py-2 text-xs text-amber-100"
                style={{ background: 'rgba(12, 22, 40, 0.68)' }}
              >
                <span className="font-semibold text-amber-300">
                  Left 3D Pedestal:
                </span>{' '}
                Rolling Codex Book ({currentKinematics.unfurledScrollLengthMeters}m
                Scroll Unfurled)
              </div>
            </div>
            <div className="flex flex-col items-end justify-end">
              <div
                className="rounded-xl border border-sky-300/35 px-3.5 py-2 text-xs text-sky-100"
                style={{ background: 'rgba(12, 22, 40, 0.68)' }}
              >
                <span className="font-semibold text-sky-300">
                  Right 3D Glass Tower:
                </span>{' '}
                {verticalState.activeFloor.character.name} on{' '}
                {verticalState.activeFloor.character.messengerApp}
              </div>
            </div>
          </div>

          {/* Unified Collapsible Bottom Glass Control Dock (Follows Three.js Skill Section 5) */}
          <div className="mx-auto w-full max-w-4xl">
            <div className="flex justify-center mb-1.5">
              <button
                type="button"
                onClick={() => setIsBottomDockCollapsed((prev) => !prev)}
                className="inline-flex items-center gap-1.5 rounded-t-xl border border-b-0 border-white/20 px-4 py-1 text-[11px] font-medium text-slate-200 hover:text-white"
                style={{ background: 'rgba(10, 19, 36, 0.85)' }}
              >
                {isBottomDockCollapsed ? (
                  <>
                    <ChevronUp className="h-3.5 w-3.5 text-sky-300" />
                    <span>Show 3D Book &amp; Elevator Controls</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3.5 w-3.5 text-sky-300" />
                    <span>Hide Controls (Zen 3D View)</span>
                  </>
                )}
              </button>
            </div>

            {!isBottomDockCollapsed && (
              <div
                className="rounded-2xl border border-white/25 p-4 space-y-3"
                style={{
                  background:
                    'linear-gradient(145deg, rgba(8, 16, 32, 0.82), rgba(15, 25, 48, 0.78))',
                  boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.28)',
                }}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-[240px]">
                    <span className="text-xs font-medium text-slate-300 whitespace-nowrap">
                      Rolled Up
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={bookRollPercent}
                      onChange={handleSliderRollChange}
                      aria-label="Roll 3D Book Up and Down"
                      data-testid="book-roll-slider"
                      className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-slate-800 accent-sky-400"
                    />
                    <span className="text-xs font-medium text-slate-300 whitespace-nowrap">
                      Rolled Down ({currentKinematics.rollProgressPercent}%)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAutoRollingBook((prev) => !prev)}
                      className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-medium text-sky-200 hover:border-sky-300/60"
                      style={{ background: 'rgba(30, 41, 59, 0.75)' }}
                    >
                      {isAutoRollingBook ? 'Pause Auto-Roll' : 'Resume Auto-Roll'}
                    </button>
                    <button
                      type="button"
                      data-testid="glass-hero-log-pomodoro-btn"
                      onClick={onQuickLogFocusSprint}
                      className="rounded-lg border border-sky-400/40 px-3 py-1.5 text-xs font-semibold text-sky-100 hover:border-sky-300"
                      style={{ background: 'rgba(14, 165, 233, 0.25)' }}
                    >
                      +25m Focus ({dailyCompletedMinutes}/{dailyTargetMinutes}m)
                    </button>
                    <button
                      type="button"
                      data-testid="glass-hero-open-qr-btn"
                      onClick={() => onEnterWorkspacePage('hub', true)}
                      className="rounded-lg border border-emerald-400/40 px-3 py-1.5 text-xs font-semibold text-emerald-100 hover:border-emerald-300"
                      style={{ background: 'rgba(16, 185, 129, 0.25)' }}
                    >
                      QR Studio ({recentQrScansCount})
                    </button>
                  </div>
                </div>

                {/* 5 Animated Phone Character Elevator Selector Buttons */}
                <div className="grid grid-cols-5 gap-2 pt-1 border-t border-white/10">
                  {GLASS_ARCHITECTURAL_FLOORS.map((floor) => {
                    const isSelected =
                      floor.floorIndex === currentKinematics.activeFloorIndex;
                    return (
                      <button
                        key={floor.floorIndex}
                        type="button"
                        onClick={() => handleJumpToFloor(floor)}
                        className={`flex items-center justify-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs transition-transform duration-200 ${
                          isSelected
                            ? 'border-sky-300/75 -translate-y-0.5 text-white font-semibold'
                            : 'border-white/10 text-slate-300 hover:border-white/30'
                        }`}
                        style={{
                          background: isSelected
                            ? floor.glassTintRgba
                            : 'rgba(15, 23, 42, 0.65)',
                        }}
                      >
                        <Smartphone
                          className="h-3.5 w-3.5 shrink-0"
                          style={{ color: floor.accentHex }}
                        />
                        <span className="truncate">
                          0{floor.floorIndex}. {floor.character.name.split(' ')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* SECTION 2: TOP-TO-BOTTOM 3D GLASS ARCHITECTURAL FLOORS (SHOWING WHAT THE APP DOES AS WE SCROLL) */}
        <div className="relative space-y-14">
          {GLASS_ARCHITECTURAL_FLOORS.map((floor, idx) => {
            const floorBubbles = messengerBubbles
              .filter((b) => b.floorIndex === floor.floorIndex)
              .slice(-3);
            const tilt = cardTiltByFloor[floor.floorIndex] || {
              rotateX: 0,
              rotateY: 0,
            };
            const isEven = idx % 2 === 1;

            return (
              <section
                key={floor.floorIndex}
                ref={(el) => {
                  floorSectionRefs.current[floor.floorIndex] = el;
                }}
                data-testid={`glass-architecture-floor-${floor.floorIndex}`}
                onPointerMove={(e) => handleCardPointerMove(floor.floorIndex, e)}
                onPointerLeave={() => handleCardPointerLeave(floor.floorIndex)}
                className="relative rounded-3xl border border-white/25 p-6 sm:p-9 transition-transform duration-200"
                style={{
                  background: `linear-gradient(135deg, rgba(10, 20, 38, 0.68) 0%, ${floor.glassTintRgba} 52%, rgba(8, 16, 32, 0.74) 100%)`,
                  boxShadow:
                    'inset 0 1px 1px 0 rgba(255, 255, 255, 0.36), 0 24px 54px -15px rgba(2, 6, 23, 0.82)',
                  transform: `perspective(1200px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
                }}
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  {/* Architectural Floor Explanation & Live Feature Controls */}
                  <div
                    className={`lg:col-span-7 space-y-4 ${
                      isEven ? 'lg:order-2' : 'lg:order-1'
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                      <span
                        className="font-semibold tracking-wider uppercase"
                        style={{ color: floor.accentHex }}
                      >
                        0{floor.floorIndex}. {floor.floorCode}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{floor.tierLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-slate-300">
                        Elevation {floor.elevationY > 0 ? `+${floor.elevationY}` : floor.elevationY}m
                      </span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                      {floor.title}
                    </h2>

                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                      Unfurled Book Section: {floor.bookChapterTitle}
                    </p>

                    <p className="text-sm sm:text-base text-slate-100 leading-relaxed">
                      {floor.whatTheAppDoes}
                    </p>

                    <ul className="space-y-2 pt-1">
                      {floor.featureHighlights.map((feat, fIdx) => (
                        <li
                          key={fIdx}
                          className="flex items-center gap-2.5 text-sm text-slate-100"
                        >
                          <CheckCircle2
                            className="h-4 w-4 shrink-0"
                            style={{ color: floor.accentHex }}
                          />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="pt-3 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        data-testid={`launch-floor-workspace-btn-${floor.floorIndex}`}
                        onClick={() =>
                          onEnterWorkspacePage(
                            floor.targetWorkspacePage,
                            floor.floorIndex === 4
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-4 py-2.5 text-xs font-semibold text-white transition hover:border-white/50"
                        style={{
                          background: `linear-gradient(135deg, ${floor.accentHex}44, rgba(15, 23, 42, 0.85))`,
                          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
                        }}
                      >
                        <ExternalLink className="h-4 w-4" style={{ color: floor.accentHex }} />
                        <span>
                          {floor.floorIndex === 4
                            ? 'Launch QR Scanner & History Studio'
                            : `Open ${floor.title.split(' ')[0]} in Workspace`}
                        </span>
                      </button>

                      <button
                        type="button"
                        data-testid={`trigger-messenger-ping-btn-${floor.floorIndex}`}
                        onClick={() => handleSendCharacterPing(floor.floorIndex)}
                        className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-3.5 py-2.5 text-xs font-medium text-slate-100 hover:border-white/40 hover:text-white"
                        style={{ background: 'rgba(15, 23, 42, 0.68)' }}
                      >
                        <MessageSquare className="h-4 w-4" style={{ color: floor.accentHex }} />
                        <span>Ping {floor.character.name.split(' ')[0]}’s Phone</span>
                      </button>
                    </div>
                  </div>

                  {/* Animated 3D Character Using Phone & Social Media Messenger Mockup */}
                  <div
                    data-testid={`phone-character-card-${floor.floorIndex}`}
                    className={`lg:col-span-5 ${
                      isEven ? 'lg:order-1' : 'lg:order-2'
                    }`}
                  >
                    <div
                      className="relative mx-auto max-w-sm rounded-3xl border border-white/25 p-5"
                      style={{
                        background:
                          'linear-gradient(165deg, rgba(12, 22, 42, 0.84) 0%, rgba(7, 13, 26, 0.88) 100%)',
                        boxShadow:
                          'inset 0 1px 1px rgba(255, 255, 255, 0.35), 0 24px 48px -12px rgba(2, 6, 23, 0.9)',
                      }}
                    >
                      <div className="mb-3.5 flex items-center justify-between border-b border-white/15 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/25 text-xs font-bold text-white"
                            style={{
                              background: `linear-gradient(135deg, ${floor.accentHex}, rgba(15,23,42,0.9))`,
                            }}
                          >
                            {floor.character.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')}
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-white">
                              {floor.character.name} ·{' '}
                              <span className="text-slate-300 font-normal">
                                {floor.character.handle}
                              </span>
                            </div>
                            <div
                              className="text-[11px]"
                              style={{ color: floor.accentHex }}
                            >
                              {floor.character.messengerApp}
                            </div>
                          </div>
                        </div>
                        <Smartphone
                          className="h-4 w-4"
                          style={{ color: floor.accentHex }}
                        />
                      </div>

                      <div className="mb-3 flex items-center justify-between text-[11px] text-slate-300">
                        <span>{floor.character.role}</span>
                        <span className="text-white font-medium">
                          {floor.character.statusBadge}
                        </span>
                      </div>

                      {/* Live Social Media Messenger Bubbles Inside the Character's Phone */}
                      <div className="space-y-2.5 my-3">
                        {floorBubbles.map((bubble) => (
                          <div
                            key={bubble.id}
                            className="rounded-2xl border border-white/15 p-3 text-xs text-slate-100"
                            style={{
                              background:
                                'linear-gradient(135deg, rgba(30, 41, 59, 0.82), rgba(15, 23, 42, 0.88))',
                            }}
                          >
                            <div className="flex items-center justify-between text-[10px] text-slate-300 mb-1">
                              <span className="font-semibold text-white">
                                {bubble.characterName} ({bubble.characterHandle})
                              </span>
                              <span>{bubble.timestampLabel}</span>
                            </div>
                            <p className="leading-relaxed text-slate-100">
                              {bubble.text}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Interactive Phone Messenger Input Form */}
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleSendCharacterPing(floor.floorIndex);
                        }}
                        className="mt-3 flex items-center gap-2 pt-2 border-t border-white/15"
                      >
                        <input
                          type="text"
                          value={customInputByFloor[floor.floorIndex] || ''}
                          onChange={(e) =>
                            setCustomInputByFloor((prev) => ({
                              ...prev,
                              [floor.floorIndex]: e.target.value,
                            }))
                          }
                          placeholder={`Message ${floor.character.name.split(' ')[0]} on ${floor.character.messengerApp}...`}
                          aria-label={`Send message to ${floor.character.name}`}
                          className="flex-1 rounded-xl border border-white/20 bg-slate-900/90 px-3 py-2 text-xs text-white placeholder-slate-400 focus:border-sky-400 focus:outline-none"
                        />
                        <button
                          type="submit"
                          aria-label={`Send to ${floor.character.name}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/20 text-white transition hover:border-white/50"
                          style={{ background: floor.accentHex }}
                        >
                          <Send className="h-3.5 w-3.5 text-slate-950" />
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
};
