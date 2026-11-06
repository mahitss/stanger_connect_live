import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  Send,
} from './ArchitecturalGlyphs';
import {
  CurvedTextArc,
  CurvedOrbitalSeal,
  CurvedSectionHeading,
} from './CurvedTextHeader';
import {
  GLASS_ARCHITECTURAL_FLOORS,
  evaluateRollingBookKinematics,
  evaluateVerticalArchitectureScrollState,
  buildInitialCharacterMessengerBubbles,
  appendCharacterMessengerPing,
  sanitizeEditorialUiCopy,
  compactMinimalUiText,
  buildLegalComplianceDocumentsSpec,
  buildWorkspaceSkeletonLoaderSpec,
  buildLiveInteractiveProductDemoSpec,
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
    // Tactile Warm Architectural Graphite & Linen Paper Base
    ctx.fillStyle = '#141417';
    ctx.fillRect(0, 0, 512, 1024);

    // Fine Architectural Grid & Paper Grain Dots
    ctx.strokeStyle = 'rgba(244, 242, 237, 0.06)';
    ctx.lineWidth = 1;
    for (let x = 24; x < 512; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 1024);
      ctx.stroke();
    }
    for (let y = 24; y < 1024; y += 24) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }

    // Subtle Editorial Margin Hairlines
    ctx.strokeStyle = 'rgba(244, 242, 237, 0.22)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(28, 28, 456, 968);

    const chapterLabels = [
      '01. Study Room & Pomodoro',
      '02. Invite-First Chat & Calls',
      '03. Photo Moments & Feed',
      '04. QR Scanner & Analytics',
      '05. Break Arcade & Privacy',
    ];

    for (let i = 0; i < 5; i++) {
      const yBase = 64 + i * 184;
      ctx.fillStyle = 'rgba(24, 24, 28, 0.92)';
      ctx.fillRect(48, yBase, 416, 152);

      ctx.strokeStyle = 'rgba(244, 242, 237, 0.18)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(48, yBase, 416, 152);

      ctx.fillStyle = '#F4F2ED';
      ctx.font = '600 19px sans-serif';
      ctx.fillText(chapterLabels[i], 68, yBase + 38);

      ctx.fillStyle = 'rgba(161, 158, 150, 0.55)';
      for (let line = 0; line < 3; line++) {
        const lineY = yBase + 66 + line * 24;
        const lineW = line === 2 ? 236 : 348;
        ctx.fillRect(68, lineY, lineW, 6);
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
    ctx.fillStyle = '#121215';
    ctx.fillRect(0, 0, 256, 512);

    ctx.strokeStyle = 'rgba(244, 242, 237, 0.24)';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 236, 492);

    // Subtle Editorial Header Bar
    ctx.fillStyle = '#1C1C21';
    ctx.fillRect(20, 24, 216, 40);

    ctx.fillStyle = accentHex || '#F4F2ED';
    ctx.font = '600 15px monospace';
    ctx.fillText(handleText.slice(0, 16), 30, 49);

    // Clean Editorial Message Rows on Phone Screen
    for (let i = 0; i < 4; i++) {
      const y = 88 + i * 96;
      const isRight = i % 2 === 1;
      ctx.fillStyle = isRight ? '#27272D' : '#18181C';
      ctx.fillRect(isRight ? 48 : 20, y, 188, 72);
      ctx.strokeStyle = 'rgba(244, 242, 237, 0.12)';
      ctx.lineWidth = 1;
      ctx.strokeRect(isRight ? 48 : 20, y, 188, 72);
      ctx.fillStyle = '#F4F2ED';
      ctx.fillRect((isRight ? 48 : 20) + 14, y + 20, 132, 6);
      ctx.fillStyle = '#9E9B93';
      ctx.fillRect((isRight ? 48 : 20) + 14, y + 38, 96, 6);
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

  // Initialize Three.js 3D Obsidian & Smoked Silver Glassy Architecture, Rolling Book & Animated Phone Characters
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
    renderer.toneMappingExposure = 1.35;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    mountEl.innerHTML = '';
    mountEl.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x040406, 0.018);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    const initialCamY = 5.2 - sceneControlRef.current.targetRollRatio * 10.4;
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 120);
    camera.position.set(0, initialCamY, 11.8);
    camera.lookAt(0, initialCamY - 0.4, 0);

    // Monochrome Studio Platinum & Smoked Silver Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x27272a, 1.65);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.9);
    keyLight.position.set(6, 14, 10);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.bias = -0.0005;
    }
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xe4e4e7, 2.1);
    rimLight.position.set(-8, 7, -6);
    scene.add(rimLight);

    // Shared PBR Materials: Smoked Quartz Silver Glass, Anodized Gunmetal, Liquid Platinum
    const smokedSilverGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0xf4f4f5,
      emissive: 0x3f3f46,
      emissiveIntensity: 0.28,
      roughness: 0.08,
      metalness: 0.22,
      transmission: isSoftwareGl ? 0 : 0.84,
      transparent: true,
      opacity: isSoftwareGl ? 0.48 : 0.94,
      ior: 1.54,
      thickness: 1.4,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      depthWrite: false,
    });

    const obsidianCoverMat = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      emissive: 0x18181b,
      emissiveIntensity: 0.25,
      roughness: 0.22,
      metalness: 0.82,
    });

    const brushedPlatinumMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x52525b,
      emissiveIntensity: 0.35,
      roughness: 0.14,
      metalness: 0.92,
    });

    const codexPageTex = createProceduralCodexPageTexture(renderer);
    const codexPageMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: codexPageTex,
      roughness: 0.24,
      metalness: 0.2,
      emissive: 0xd4d4d8,
      emissiveIntensity: 0.42,
      side: THREE.DoubleSide,
    });

    // ========================================================================
    // 1. HERO COMPOSITE 3D ROLLING BOOK & SMOKED GLASS FRONT PEDESTAL
    // ========================================================================
    const rollingBookGroup = new THREE.Group();
    rollingBookGroup.position.set(-2.65, initialCamY - 0.45, 1.2);
    scene.add(rollingBookGroup);

    // Part 1: Front Base Multi-Tiered Smoked Glass Pedestal
    const pedestalGeo = new THREE.CylinderGeometry(1.9, 2.25, 0.42, 36);
    const pedestalMesh = new THREE.Mesh(pedestalGeo, smokedSilverGlassMat);
    pedestalMesh.position.set(0, -1.95, 0);
    rollingBookGroup.add(pedestalMesh);

    // Part 2: Brushed Platinum Rim Bevel Ring on Pedestal
    const pedestalRingGeo = new THREE.TorusGeometry(2.02, 0.055, 16, 48);
    const pedestalRingMesh = new THREE.Mesh(pedestalRingGeo, brushedPlatinumMat);
    pedestalRingMesh.rotation.x = Math.PI / 2;
    pedestalRingMesh.position.set(0, -1.74, 0);
    rollingBookGroup.add(pedestalRingMesh);

    // Part 3: Contact Shadow Disc beneath Pedestal
    const shadowGeo = new THREE.CircleGeometry(2.45, 32);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.set(0, -2.17, 0);
    rollingBookGroup.add(shadowMesh);

    // Part 4 & 5: Left & Right Sculpted Gunmetal-Obsidian Book Covers
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

    // Part 6: Central Brushed Silver Spine Cylinder
    const spineGeo = new THREE.CylinderGeometry(0.13, 0.13, 2.45, 20);
    const spineMesh = new THREE.Mesh(spineGeo, brushedPlatinumMat);
    spineMesh.position.set(0, 0, -0.05);
    rollingBookGroup.add(spineMesh);

    // Part 7: Upper Brushed Platinum Scroll Roller (Rolls the Book Scroll Up/Down)
    const rollerGeo = new THREE.CylinderGeometry(0.18, 0.18, 2.55, 24);
    const upperRollerGroup = new THREE.Group();
    const upperRollerMesh = new THREE.Mesh(rollerGeo, brushedPlatinumMat);
    upperRollerMesh.rotation.z = Math.PI / 2;
    upperRollerGroup.add(upperRollerMesh);
    upperRollerGroup.position.set(0, 1.05, 0.28);
    rollingBookGroup.add(upperRollerGroup);

    // Part 8: Lower Brushed Platinum Scroll Roller (Moves down as Book unfurls, rolls back up)
    const lowerRollerGroup = new THREE.Group();
    const lowerRollerMesh = new THREE.Mesh(rollerGeo, brushedPlatinumMat);
    lowerRollerMesh.rotation.z = Math.PI / 2;
    lowerRollerGroup.add(lowerRollerMesh);
    lowerRollerGroup.position.set(0, -0.25, 0.32);
    rollingBookGroup.add(lowerRollerGroup);

    // Part 9: Unfurling Monochrome Codex Scroll Sheet between Upper & Lower Rollers
    const scrollSheetGeo = new THREE.PlaneGeometry(2.28, 1.0, 16, 24);
    const scrollSheetMesh = new THREE.Mesh(scrollSheetGeo, codexPageMat);
    scrollSheetMesh.position.set(0, 0.4, 0.3);
    rollingBookGroup.add(scrollSheetMesh);

    // Part 10: Smoked Glass Casing Arch around the Rolling Book
    const glassArchGeo = new THREE.TorusGeometry(1.85, 0.06, 16, 48, Math.PI);
    const glassArchMesh = new THREE.Mesh(glassArchGeo, smokedSilverGlassMat);
    glassArchMesh.position.set(0, 0.42, 0);
    rollingBookGroup.add(glassArchMesh);

    // ========================================================================
    // 2. 5-FLOOR VERTICAL SMOKED GLASS TOWER & SILVER PHONE CHARACTERS
    // ========================================================================
    const towerGroup = new THREE.Group();
    towerGroup.position.set(2.45, 0, 0.4);
    scene.add(towerGroup);

    // 4 Vertical Smoked Glass Elevator Columns spanning from Top Spire (+7.5m) to Foundation (-7.5m)
    const columnGeo = new THREE.CylinderGeometry(0.09, 0.09, 16.0, 16);
    const columnOffsets = [
      [-1.85, -1.25],
      [1.85, -1.25],
      [-1.85, 1.25],
      [1.85, 1.25],
    ];
    columnOffsets.forEach(([cx, cz]) => {
      const col = new THREE.Mesh(columnGeo, smokedSilverGlassMat);
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

      // Floor Smoked Glass Slab
      const slabMesh = new THREE.Mesh(floorSlabGeo, smokedSilverGlassMat);
      slabMesh.position.set(0, floorY - 0.65, 0);
      towerGroup.add(slabMesh);

      // Floor Brushed Chrome Rim
      const rimMat = new THREE.MeshStandardMaterial({
        color: accentColor,
        roughness: 0.16,
        metalness: 0.92,
        emissive: accentColor,
        emissiveIntensity: 0.55,
      });
      const rimMesh = new THREE.Mesh(floorRimGeo, rimMat);
      rimMesh.rotation.x = Math.PI / 2;
      rimMesh.position.set(0, floorY - 0.55, 0);
      towerGroup.add(rimMesh);

      // Composite 8-Part Animated Character in Brushed Titanium Suit with Phone & Messenger Bubble
      const charGroup = new THREE.Group();
      charGroup.position.set(0, floorY - 0.52, 0.32);

      const suitMat = new THREE.MeshStandardMaterial({
        color: 0xd4d4d8,
        emissive: 0x3f3f46,
        emissiveIntensity: 0.32,
        roughness: 0.26,
        metalness: 0.78,
      });
      const headSculptMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0x52525b,
        emissiveIntensity: 0.3,
        roughness: 0.22,
        metalness: 0.65,
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
        emissive: 0xe4e4e7,
        emissiveIntensity: 0.72,
        roughness: 0.12,
        metalness: 0.25,
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

      // 3. Sculpted Silver Head
      const headMesh = new THREE.Mesh(headGeo, headSculptMat);
      headMesh.position.set(0, 1.16, 0);
      charGroup.add(headMesh);

      // 4. Obsidian Optical Visor / Glasses
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

      // 6 & 7. Right Arm + Glowing Titanium Smartphone Group
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

  const [demoRoomCode, setDemoRoomCode] = useState<string>(activeStudyRoomCode || 'STUDY-204');
  const [demoTimerMinutes, setDemoTimerMinutes] = useState<number>(25);
  const [demoIsRunning, setDemoIsRunning] = useState<boolean>(true);
  const [demoSoundscape, setDemoSoundscape] = useState<string>('Rain');
  const [isSkeletonPreviewActive, setIsSkeletonPreviewActive] = useState<boolean>(false);

  const liveDemoSpec = buildLiveInteractiveProductDemoSpec({
    activeRoomCode: demoRoomCode,
    timerMinutes: demoTimerMinutes,
    isRunning: demoIsRunning,
    completedMinutesToday: dailyCompletedMinutes,
    dailyTargetMinutes: dailyTargetMinutes,
    soundscapePreset: demoSoundscape,
  });
  const legalSpec = buildLegalComplianceDocumentsSpec();
  const skeletonSpec = buildWorkspaceSkeletonLoaderSpec({
    isLoading: isSkeletonPreviewActive,
    rowCount: 3,
  });

  return (
    <div
      data-testid="glass-3d-architecture-showcase"
      data-palette-theme="obsidian-silver"
      data-surface-texture="architectural-paper-grain"
      className="tactile-editorial-shell relative min-h-screen w-full text-[#F4F2ED] selection:bg-zinc-700"
    >
      {/* Fixed Full-Viewport Three.js 3D Architectural Canvas */}
      <div
        ref={canvasMountRef}
        data-testid="glass-3d-architecture-canvas"
        data-book-roll-percent={currentKinematics.rollProgressPercent}
        data-active-floor={currentKinematics.activeFloorIndex}
        className="fixed inset-0 z-0 pointer-events-none opacity-45"
      />

      {/* Minimal 3-Zone Top Bar */}
      <header className="sticky top-0 z-30 border-b border-zinc-800 bg-[#0C0C0E] px-6 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-8">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'auto' });
            }}
            className="font-display text-base font-bold tracking-widest text-[#F4F2ED] whitespace-nowrap shrink-0"
          >
            MR. STRANGER
          </a>

          <nav
            aria-label="Mr. Stranger Features"
            className="hidden md:flex items-center gap-6 text-xs font-medium text-[#9E9B93] shrink-0"
          >
            {[
              { floorIndex: 1, shortLabel: '01 Study' },
              { floorIndex: 2, shortLabel: '02 Chat' },
              { floorIndex: 3, shortLabel: '03 Moments' },
              { floorIndex: 4, shortLabel: '04 QR' },
              { floorIndex: 5, shortLabel: '05 Arcade' },
            ].map((navItem) => {
              const floor =
                GLASS_ARCHITECTURAL_FLOORS.find(
                  (f) => f.floorIndex === navItem.floorIndex
                ) || GLASS_ARCHITECTURAL_FLOORS[0];
              const isActive =
                floor.floorIndex === currentKinematics.activeFloorIndex;
              return (
                <button
                  key={floor.floorIndex}
                  type="button"
                  onClick={() => handleJumpToFloor(floor)}
                  className={`py-1 border-b whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'border-[#F4F2ED] text-[#F4F2ED] font-semibold'
                      : 'border-transparent text-[#9E9B93] hover:text-[#F4F2ED]'
                  }`}
                >
                  {navItem.shortLabel}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              data-testid="toggle-book-roll-btn"
              onClick={handleToggleBookRoll}
              className="hidden sm:inline-flex items-center px-2.5 py-1.5 text-xs font-mono text-[#9E9B93] hover:text-[#F4F2ED] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>{bookRollPercent >= 75 ? 'Roll Up' : 'Roll Down'}</span>
            </button>

            <button
              type="button"
              data-testid="switch-to-workspace-studio-btn"
              onClick={() => onEnterWorkspacePage('hub', false)}
              className="inline-flex items-center border border-zinc-700 bg-[#E6E2D8] px-4 py-1.5 text-xs font-semibold text-[#141413] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Enter Mr. Stranger Workspace</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Sculptural Curved-Text Studio Content (De-Bulked & Minimal) */}
      <main className="relative z-10 mx-auto max-w-7xl px-6 sm:px-8 pt-6 pb-16 space-y-8">
        {/* SECTION 1: CURVED-TEXT HERO ARC + ORBITAL SEAL + COMPACT LIVE DEMO */}
        <section
          data-testid="front-glass-base-hero"
          className="border-b border-zinc-800 pb-8"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Curved SVG Headline Arc + Orbital Seal + Minimal Actions */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex-1 w-full">
                  <CurvedTextArc
                    id="studio-hero"
                    testId="curved-text-hero-arc"
                    primaryText="MR. STRANGER / SILENT STUDY"
                    secondaryText="FOCUS · VOICE · ARCADE"
                  />
                </div>
                <CurvedOrbitalSeal
                  id="studio-orbital"
                  testId="curved-text-orbital-seal"
                  ringText="LIVE PRESENCE · SILENT STUDY ·"
                  centerLabel={activeStudyRoomCode}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-b border-zinc-800 py-2.5 text-xs font-mono tabular-nums text-[#9E9B93]">
                <span className="text-[#F4F2ED] font-semibold">
                  {currentDisplayName}
                </span>
                <span>
                  {dailyCompletedMinutes}/{dailyTargetMinutes}m
                </span>
                <span>{streakCount}d Streak</span>
                <span>{participationPoints} pts</span>
                <span data-testid="rolling-book-state-badge">
                  Roll {currentKinematics.rollProgressPercent}%
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => onEnterWorkspacePage('hub', false)}
                  className="px-4 py-2 border border-zinc-700 bg-[#E6E2D8] text-xs font-semibold text-[#141413] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Open Live Workspace
                </button>
                <button
                  type="button"
                  data-testid="glass-hero-log-pomodoro-btn"
                  onClick={onQuickLogFocusSprint}
                  className="px-4 py-2 border border-zinc-700 bg-[#121215] text-xs font-mono tabular-nums text-[#F4F2ED] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  +25m Focus ({dailyCompletedMinutes}/{dailyTargetMinutes}m)
                </button>
                <button
                  type="button"
                  data-testid="glass-hero-open-qr-btn"
                  onClick={() => onEnterWorkspacePage('hub', true)}
                  className="px-4 py-2 border border-zinc-800 bg-[#0C0C0E] text-xs font-mono tabular-nums text-[#9E9B93] hover:text-[#F4F2ED] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Scan QR ({recentQrScansCount})
                </button>
              </div>
            </div>

            {/* Right Column: Minimal Live Interactive Product Demo */}
            <div
              data-testid={liveDemoSpec.containerTestId}
              className="lg:col-span-5 border border-zinc-800 bg-[#121215] p-4 space-y-3"
            >
              <CurvedSectionHeading
                id="live-demo-curve"
                title={`DEMO / ${liveDemoSpec.activeRoomCode}`}
                meta={`${liveDemoSpec.timerMinutes}:00 · ${liveDemoSpec.progressPercent}%`}
              />

              <div className="grid grid-cols-2 gap-2">
                {liveDemoSpec.availableRooms.slice(0, 2).map((room) => (
                  <button
                    key={room}
                    type="button"
                    onClick={() => setDemoRoomCode(room)}
                    className={`px-3 py-1.5 text-xs font-mono border text-center cursor-pointer ${
                      demoRoomCode === room
                        ? 'border-zinc-500 bg-[#1C1C21] text-[#F4F2ED] font-semibold'
                        : 'border-zinc-800 bg-[#0C0C0E] text-[#9E9B93]'
                    }`}
                  >
                    {room}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800">
                <div className="flex items-center gap-1">
                  {[15, 25, 50].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setDemoTimerMinutes(mins)}
                      className={`flex-1 py-1 text-[11px] font-mono border cursor-pointer ${
                        demoTimerMinutes === mins
                          ? 'border-zinc-500 bg-[#1C1C21] text-[#F4F2ED]'
                          : 'border-zinc-800 bg-[#0C0C0E] text-[#9E9B93]'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1">
                  {['Rain', 'Cafe', 'Forest'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setDemoSoundscape(preset)}
                      className={`flex-1 py-1 text-[11px] font-mono border cursor-pointer ${
                        demoSoundscape === preset
                          ? 'border-zinc-500 bg-[#1C1C21] text-[#F4F2ED]'
                          : 'border-zinc-800 bg-[#0C0C0E] text-[#9E9B93]'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setDemoIsRunning((prev) => !prev)}
                  className="px-3 py-1 border border-zinc-700 bg-[#0C0C0E] text-xs font-mono text-[#F4F2ED] cursor-pointer"
                >
                  {demoIsRunning ? 'Pause' : 'Start'}
                </button>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={bookRollPercent}
                  onChange={handleSliderRollChange}
                  aria-label="Roll Mr. Stranger Feature Guidebook Up and Down"
                  data-testid="book-roll-slider"
                  className="h-1.5 flex-1 cursor-pointer appearance-none bg-zinc-800 accent-[#F4F2ED]"
                />
                <button
                  type="button"
                  onClick={onQuickLogFocusSprint}
                  className="px-3 py-1 border border-zinc-700 bg-[#E6E2D8] text-xs font-semibold text-[#141413] font-mono cursor-pointer"
                >
                  +{demoTimerMinutes}m
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: COMPACT CURVED-HEADER STUDIO INDEX (5 Stages, Zero Prose Bulk) */}
        <div className="divide-y divide-zinc-800 border-b border-zinc-800">
          {GLASS_ARCHITECTURAL_FLOORS.map((floor) => {
            const latestBubble = messengerBubbles
              .filter((b) => b.floorIndex === floor.floorIndex)
              .slice(-1)[0];

            return (
              <section
                key={floor.floorIndex}
                ref={(el) => {
                  floorSectionRefs.current[floor.floorIndex] = el;
                }}
                data-testid={`glass-architecture-floor-${floor.floorIndex}`}
                onPointerMove={(e) => handleCardPointerMove(floor.floorIndex, e)}
                onPointerLeave={() => handleCardPointerLeave(floor.floorIndex)}
                className="py-4"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                  {/* Curved SVG Stage Title */}
                  <div className="lg:col-span-5">
                    <CurvedSectionHeading
                      id={`floor-${floor.floorIndex}`}
                      title={`0${floor.floorIndex} / ${compactMinimalUiText(floor.tierLabel, 3)}`}
                      meta={floor.character.handle}
                    />
                  </div>

                  {/* Minimal 1-Line Ping Strip */}
                  <div
                    data-testid={`phone-character-card-${floor.floorIndex}`}
                    className="lg:col-span-4"
                  >
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendCharacterPing(floor.floorIndex);
                      }}
                      className="flex items-center gap-2"
                    >
                      <span className="font-mono text-xs text-[#9E9B93] shrink-0">
                        {floor.character.name.split(' ')[0]}:
                      </span>
                      <input
                        type="text"
                        value={customInputByFloor[floor.floorIndex] || ''}
                        onChange={(e) =>
                          setCustomInputByFloor((prev) => ({
                            ...prev,
                            [floor.floorIndex]: e.target.value,
                          }))
                        }
                        placeholder={
                          latestBubble
                            ? compactMinimalUiText(latestBubble.text, 4)
                            : 'Ping...'
                        }
                        aria-label={`Send message to ${floor.character.name}`}
                        className="flex-1 border border-zinc-800 bg-[#0C0C0E] px-2.5 py-1 text-xs text-[#F4F2ED] placeholder-[#9E9B93] focus:border-zinc-500 focus:outline-none"
                      />
                      <button
                        type="submit"
                        data-testid={`trigger-messenger-ping-btn-${floor.floorIndex}`}
                        aria-label={`Send to ${floor.character.name}`}
                        className="inline-flex h-7 px-2.5 items-center justify-center border border-zinc-700 bg-[#121215] text-xs font-mono text-[#F4F2ED] shrink-0 cursor-pointer"
                      >
                        <Send className="h-3 w-3" />
                      </button>
                    </form>
                  </div>

                  {/* Single Launch Action */}
                  <div className="lg:col-span-3 flex justify-end">
                    <button
                      type="button"
                      data-testid={`launch-floor-workspace-btn-${floor.floorIndex}`}
                      onClick={() =>
                        onEnterWorkspacePage(
                          floor.targetWorkspacePage,
                          floor.floorIndex === 4
                        )
                      }
                      className="border border-zinc-700 bg-[#E6E2D8] px-3.5 py-1.5 text-xs font-semibold text-[#141413] whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Open 0{floor.floorIndex}
                    </button>
                  </div>
                </div>
              </section>
            );
          })}
        </div>

        {/* SECTION 3: MINIMAL SKELETON & LEGAL BAR (TOS + PRIVACY POLICY) */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div
            data-testid={skeletonSpec.containerTestId}
            className="border border-zinc-800 bg-[#121215] p-4 space-y-2"
          >
            <div className="flex items-center justify-between">
              <CurvedSectionHeading
                id="skeleton-curve"
                title="SKELETON STATE"
                meta={isSkeletonPreviewActive ? 'SYNCING' : 'READY'}
              />
              <button
                type="button"
                onClick={() => setIsSkeletonPreviewActive((prev) => !prev)}
                className="px-2.5 py-1 border border-zinc-700 bg-[#0C0C0E] text-[11px] font-mono text-[#F4F2ED] cursor-pointer"
              >
                Toggle
              </button>
            </div>
            <div className="space-y-1.5">
              {skeletonSpec.rows.map((row) => (
                <div key={row.rowId} className="flex items-center gap-3">
                  <span className="font-mono text-[10px] text-[#9E9B93]">
                    {row.indexCode}
                  </span>
                  <div
                    className="h-2 bg-zinc-800"
                    style={{ width: `${row.primaryWidthPercent}%` }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border border-zinc-800 bg-[#121215] p-4">
            <article
              id={legalSpec.tosElementId}
              data-testid={legalSpec.tosElementId}
              className="space-y-1.5"
            >
              <CurvedSectionHeading
                id="tos-curve"
                title={legalSpec.termsOfServiceTitle}
              />
              <div className="text-xs font-mono text-[#9E9B93] space-y-1">
                {legalSpec.termsOfServiceSections.map((sec) => (
                  <div key={sec.sectionNumber}>
                    {sec.sectionNumber} / {compactMinimalUiText(sec.heading, 3)}
                  </div>
                ))}
              </div>
            </article>

            <article
              id={legalSpec.privacyPolicyElementId}
              data-testid={legalSpec.privacyPolicyElementId}
              className="space-y-1.5 border-l border-zinc-800 pl-4"
            >
              <CurvedSectionHeading
                id="privacy-curve"
                title={legalSpec.privacyPolicyTitle}
              />
              <div className="text-xs font-mono text-[#9E9B93] space-y-1">
                {legalSpec.privacyPolicySections.map((sec) => (
                  <div key={sec.sectionNumber}>
                    {sec.sectionNumber} / {compactMinimalUiText(sec.heading, 3)}
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
};
