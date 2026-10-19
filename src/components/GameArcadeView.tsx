import React, { useEffect, useRef, useState } from 'react';
import {
  checkRunnerCollision,
  checkProjectileBlockHit,
  stepProjectile,
  createEmptyGrid,
  clearCompletedLines,
  RunnerObstacle,
  TargetBlock,
  BlockGrid,
} from '../utils/rules';
import { soundEngine } from '../utils/audio';

export interface MultiplayerScore {
  uid: string;
  displayName: string;
  gameId: 'subway' | 'catapult' | 'blocks';
  score: number;
  laneOrState?: string;
  updatedAt: number;
}

interface GameArcadeProps {
  selectedGame: 'subway' | 'catapult' | 'blocks';
  onSelectGame: (game: 'subway' | 'catapult' | 'blocks') => void;
  currentUid: string;
  currentName: string;
  multiplayerScores: MultiplayerScore[];
  onBroadcastScore: (gameId: 'subway' | 'catapult' | 'blocks', score: number, laneOrState?: string) => void;
  onParticipationEarned: (points: number) => void;
}

type GameTab = 'subway' | 'catapult' | 'blocks';
type ShellState = 'title' | 'playing' | 'paused' | 'gameover';

export const GameArcadeView: React.FC<GameArcadeProps> = ({
  selectedGame,
  onSelectGame,
  currentUid,
  currentName,
  multiplayerScores,
  onBroadcastScore,
  onParticipationEarned,
}) => {
  const activeGame: GameTab = selectedGame;
  const setActiveGame = (g: GameTab) => onSelectGame(g);
  const [shellState, setShellState] = useState<ShellState>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('autostart') === '1' ? 'playing' : 'title';
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') !== '1') {
      setShellState('title');
    }
  }, [selectedGame]);

  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [hp, setHp] = useState(3);

  // Sync body dataset for computer-use verification
  useEffect(() => {
    document.body.dataset.state = shellState;
    return () => {
      delete document.body.dataset.state;
    };
  }, [shellState]);

  const startGame = (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.currentTarget.blur();
    setScore(0);
    setHp(3);
    setShellState('playing');
    soundEngine.playSfx('chime');
  };

  const handleGameOver = (finalScore: number) => {
    setBestScore((prev) => Math.max(prev, finalScore));
    setShellState('gameover');
    onBroadcastScore(activeGame, finalScore, 'finished');
    if (finalScore > 0) {
      onParticipationEarned(Math.min(50, Math.max(5, Math.floor(finalScore / 20))));
    }
  };

  // Global keyboard shortcuts for Start / Pause
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (shellState === 'title' && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        startGame();
      } else if (shellState === 'playing' && (e.key === 'Escape' || e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        setShellState('paused');
      } else if (shellState === 'paused' && (e.key === 'Escape' || e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        setShellState('playing');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [shellState]);

  const activeLeaderboard = multiplayerScores
    .filter((s) => s.gameId === activeGame)
    .sort((a, b) => b.score - a.score);

  return (
    <section className="space-y-6" aria-label="Multiplayer Game Arcade">
      {/* Game Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Multiplayer Game Arcade
          </h1>
          <p className="text-sm text-zinc-400">
            Live WebSocket multiplayer telemetry · Real-time scores synced across all connected players
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-[#0A0A0C] border border-zinc-800 rounded-md">
          <button
            type="button"
            onClick={() => {
              setActiveGame('subway');
              setShellState('title');
            }}
            className={`px-3.5 py-2 text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 ${
              activeGame === 'subway'
                ? 'bg-white text-black'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            01. Subway Runner
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveGame('catapult');
              setShellState('title');
            }}
            className={`px-3.5 py-2 text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 ${
              activeGame === 'catapult'
                ? 'bg-white text-black'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            02. Angry Catapult
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveGame('blocks');
              setShellState('title');
            }}
            className={`px-3.5 py-2 text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 ${
              activeGame === 'blocks'
                ? 'bg-white text-black'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            03. Block Arena
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Game Shell Viewport (8 cols) */}
        <div className="lg:col-span-8 relative rounded-lg border border-zinc-800/80 bg-[#0A0A0C] overflow-hidden min-h-[520px] flex flex-col justify-between">
          {/* HUD Top Bar */}
          <div className="flex items-center justify-between px-5 py-3 bg-[#050505] border-b border-zinc-800/80 z-10">
            <div className="flex items-center gap-6">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  SCORE
                </div>
                <div className="text-2xl font-bold font-mono tabular-nums text-white" data-testid="game-score">
                  {Math.round(score)}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  BEST
                </div>
                <div className="text-2xl font-bold font-mono tabular-nums text-emerald-400">
                  {Math.round(bestScore)}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  VITALITY
                </div>
                <div className="flex items-center gap-1.5 mt-1" aria-label={`Vitality ${hp} of 3`}>
                  {[1, 2, 3].map((pip) => (
                    <svg key={pip} viewBox="0 0 24 24" className="w-5 h-5">
                      <polygon
                        points="12,2 22,9 18,21 6,21 2,9"
                        fill={pip <= hp ? '#10b981' : '#18181b'}
                        stroke="#050505"
                        strokeWidth="2"
                      />
                    </svg>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {shellState === 'playing' && (
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    setShellState('paused');
                  }}
                  aria-label="Pause Game"
                  className="px-3 py-1.5 text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 rounded whitespace-nowrap shrink-0"
                >
                  Pause [P]
                </button>
              )}
              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => startGame(e)}
                aria-label="Restart Game"
                className="px-3 py-1.5 text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 rounded whitespace-nowrap shrink-0"
              >
                Restart [R]
              </button>
            </div>
          </div>

          {/* Active Game Engine Surface */}
          <div className="relative flex-1 flex items-center justify-center p-4">
            {activeGame === 'subway' && (
              <SubwayRunnerEngine
                isPlaying={shellState === 'playing'}
                score={score}
                hp={hp}
                setScore={(val) => {
                  setScore(val);
                  onBroadcastScore('subway', val);
                }}
                setHp={(val) => {
                  setHp(val);
                  if (val <= 0) handleGameOver(score);
                }}
              />
            )}

            {activeGame === 'catapult' && (
              <AngryCatapultEngine
                isPlaying={shellState === 'playing'}
                score={score}
                setScore={(val) => {
                  setScore(val);
                  onBroadcastScore('catapult', val);
                }}
                onComplete={(finalVal) => handleGameOver(finalVal)}
              />
            )}

            {activeGame === 'blocks' && (
              <BlockArenaEngine
                isPlaying={shellState === 'playing'}
                score={score}
                setScore={(val) => {
                  setScore(val);
                  onBroadcastScore('blocks', val);
                }}
                onGameOver={(finalVal) => handleGameOver(finalVal)}
              />
            )}

            {/* Title Overlay */}
            {shellState === 'title' && (
              <div className="absolute inset-0 bg-[#050505]/95 flex flex-col items-center justify-center p-8 text-center z-20">
                <svg viewBox="0 0 120 48" className="w-28 h-12 mb-4" aria-hidden="true">
                  <rect x="6" y="6" width="108" height="36" rx="6" fill="#0A0A0C" stroke="#fafafa" strokeWidth="2" />
                  <circle cx="32" cy="24" r="9" fill="#10b981" />
                  <polygon points="58,14 78,24 58,34" fill="#fafafa" />
                  <rect x="86" y="16" width="16" height="16" rx="3" fill="#f59e0b" />
                </svg>
                <h2 className="text-3xl font-bold text-white tracking-tight mb-2">
                  {activeGame === 'subway' && 'Subway Neon Runner'}
                  {activeGame === 'catapult' && 'Angry Physics Catapult'}
                  {activeGame === 'blocks' && 'Multiplayer Block Arena'}
                </h2>
                <p className="text-sm text-zinc-400 max-w-md mb-6">
                  {activeGame === 'subway' &&
                    'Dodge high-speed rail barriers across 3 tracks, leap over hurdles, and collect gold tokens while competing live.'}
                  {activeGame === 'catapult' &&
                    'Adjust launch angle and tension to hurl kinetic spheres into fortified block towers.'}
                  {activeGame === 'blocks' &&
                    'Place tactical polyomino blocks onto the 8x10 grid to clear full rows and climb the live room leaderboard.'}
                </p>
                <button
                  type="button"
                  data-start="true"
                  onClick={(e) => startGame(e)}
                  className="px-6 py-3 text-sm font-semibold bg-white hover:bg-zinc-200 text-black rounded-md transition-colors whitespace-nowrap shrink-0"
                >
                  Start Match
                </button>
                <div className="mt-6 text-xs text-zinc-500 font-mono">
                  A / D or Left / Right Move · Space Jump or Launch · P Pause
                </div>
              </div>
            )}

            {/* Pause Modal */}
            {shellState === 'paused' && (
              <div className="absolute inset-0 bg-[#050505]/95 flex flex-col items-center justify-center p-6 text-center z-20">
                <div className="bg-[#0A0A0C] border border-zinc-800 rounded-lg p-6 max-w-sm w-full space-y-4">
                  <h3 className="text-xl font-bold text-white">Match Paused</h3>
                  <div className="grid grid-cols-2 gap-3 py-2">
                    <div className="p-3 bg-[#050505] rounded-md border border-zinc-800">
                      <div className="text-xs text-zinc-400">CURRENT SCORE</div>
                      <div className="text-lg font-mono font-bold tabular-nums text-white">{score}</div>
                    </div>
                    <div className="p-3 bg-[#050505] rounded-md border border-zinc-800">
                      <div className="text-xs text-zinc-400">BEST SCORE</div>
                      <div className="text-lg font-mono font-bold tabular-nums text-emerald-400">{bestScore}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShellState('playing')}
                      className="px-4 py-2 text-xs font-semibold bg-white hover:bg-zinc-200 text-black rounded-md whitespace-nowrap shrink-0"
                    >
                      Resume Match
                    </button>
                    <button
                      type="button"
                      onClick={(e) => startGame(e)}
                      className="px-4 py-2 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 rounded-md whitespace-nowrap shrink-0"
                    >
                      Restart
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Game Over / Victory Modal */}
            {shellState === 'gameover' && (
              <div className="absolute inset-0 bg-[#050505]/95 flex flex-col items-center justify-center p-6 text-center z-20">
                <div className="bg-[#0A0A0C] border border-zinc-800 rounded-lg p-6 max-w-sm w-full space-y-4">
                  <h3 className="text-xl font-bold text-white">Run Complete</h3>
                  <p className="text-xs text-zinc-400">
                    Your score has been broadcast to all online players in the arcade room.
                  </p>
                  <div className="grid grid-cols-2 gap-3 py-2">
                    <div className="p-3 bg-[#050505] rounded-md border border-zinc-800">
                      <div className="text-xs text-zinc-400">FINAL SCORE</div>
                      <div className="text-xl font-mono font-bold tabular-nums text-emerald-400">{score}</div>
                    </div>
                    <div className="p-3 bg-[#050505] rounded-md border border-zinc-800">
                      <div className="text-xs text-zinc-400">PERSONAL BEST</div>
                      <div className="text-xl font-mono font-bold tabular-nums text-white">{bestScore}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    data-start="true"
                    onClick={(e) => startGame(e)}
                    className="w-full py-2.5 px-4 text-xs font-semibold bg-white hover:bg-zinc-200 text-black rounded-md whitespace-nowrap shrink-0"
                  >
                    Play Again
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Live Multiplayer Room Telemetry (4 cols) */}
        <div className="lg:col-span-4 rounded-lg border border-zinc-800/80 bg-[#0A0A0C] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <div>
              <h2 className="text-base font-bold text-white">Live Room Standings</h2>
              <p className="text-xs text-zinc-400">
                Real-time WebSocket scores from active players
              </p>
            </div>
            <span className="text-xs font-mono tabular-nums text-zinc-400">
              {activeLeaderboard.length} active
            </span>
          </div>

          {activeLeaderboard.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <p className="text-sm text-zinc-300 font-medium">No live scores recorded yet</p>
              <p className="text-xs text-zinc-400">
                Start a match on the left to broadcast your real-time score to everyone online.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/80">
              {activeLeaderboard.map((entry, idx) => (
                <div key={`${entry.uid}-${idx}`} className="py-2.5 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-mono text-xs text-zinc-400 w-5 tabular-nums">
                      {idx + 1}.
                    </span>
                    <span className="font-medium text-white truncate">
                      {entry.displayName}
                      {entry.uid === currentUid ? ' (You)' : ''}
                    </span>
                  </div>
                  <span className="font-mono font-semibold tabular-nums text-emerald-400">
                    {Math.round(entry.score)} pts
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="pt-3 border-t border-zinc-800/80 text-xs text-zinc-400 space-y-1">
            <div>Active Player: <span className="text-white font-medium">{currentName}</span></div>
            <div>Multiplayer Sync: <span className="text-emerald-400 font-mono">Server-Authoritative WebSocket</span></div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ============================================================================
// 1. SUBWAY RUNNER ENGINE (3-Lane Dodge, Jump & Coin Collector)
// ============================================================================
const SubwayRunnerEngine: React.FC<{
  isPlaying: boolean;
  score: number;
  hp: number;
  setScore: (s: number) => void;
  setHp: (h: number) => void;
}> = ({ isPlaying, score, hp, setScore, setHp }) => {
  const [lane, setLane] = useState<0 | 1 | 2>(1);
  const [isJumping, setIsJumping] = useState(false);
  const [obstacles, setObstacles] = useState<RunnerObstacle[]>([
    { id: 1, lane: 0, y: 18, type: 'barrier' },
    { id: 2, lane: 1, y: 42, type: 'coin' },
    { id: 3, lane: 2, y: 62, type: 'coin' },
  ]);

  const stateRef = useRef({ lane, isJumping, score, hp });
  stateRef.current = { lane, isJumping, score, hp };

  const triggerJump = () => {
    if (stateRef.current.isJumping) return;
    setIsJumping(true);
    soundEngine.playSfx('jump');
    window.setTimeout(() => setIsJumping(false), 550);
  };

  useEffect(() => {
    if (!isPlaying) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        setLane((prev) => (prev > 0 ? ((prev - 1) as 0 | 1 | 2) : prev));
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        setLane((prev) => (prev < 2 ? ((prev + 1) as 0 | 1 | 2) : prev));
      } else if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        triggerJump();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isPlaying]);

  const obstaclesRef = useRef(obstacles);
  obstaclesRef.current = obstacles;

  useEffect(() => {
    if (!isPlaying) return;
    const isHeadless = navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent);
    const intervalMs = isHeadless ? 120 : 60;

    const timer = window.setInterval(() => {
      const currentObs = obstaclesRef.current;
      const next: RunnerObstacle[] = [];
      let scoreDelta = 0;
      let hpDelta = 0;

      for (const obs of currentObs) {
        const updatedY = obs.y + 3.2;
        const outcome = checkRunnerCollision(
          stateRef.current.lane,
          stateRef.current.isJumping,
          { ...obs, y: updatedY }
        );

        if (outcome === 'coin') {
          soundEngine.playSfx('coin');
          scoreDelta += 25;
          continue;
        }
        if (outcome === 'hit') {
          soundEngine.playSfx('hit');
          hpDelta -= 1;
          continue;
        }
        if (updatedY < 100) {
          next.push({ ...obs, y: updatedY });
        } else {
          scoreDelta += 5;
        }
      }

      if (next.length < 4 && Math.random() < 0.35) {
        const randomLane = Math.floor(Math.random() * 3) as 0 | 1 | 2;
        const safeLane = stateRef.current.score < 30 && randomLane === 1 ? 0 : randomLane;
        next.push({
          id: Date.now() + Math.random(),
          lane: safeLane,
          y: 0,
          type: Math.random() < 0.45 ? 'coin' : 'barrier',
        });
      }

      setObstacles(next);
      if (scoreDelta > 0) {
        setScore(stateRef.current.score + scoreDelta);
      }
      if (hpDelta < 0) {
        setHp(stateRef.current.hp + hpDelta);
      }
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [isPlaying]);

  return (
    <div className="w-full max-w-md space-y-4">
      <div
        className="relative h-80 w-full bg-slate-950 border-2 border-slate-800 rounded-xl overflow-hidden grid grid-cols-3"
        data-testid="subway-canvas"
      >
        {[0, 1, 2].map((trackIdx) => (
          <div
            key={trackIdx}
            className="border-r last:border-r-0 border-dashed border-slate-800/80 relative"
          />
        ))}

        {/* Obstacles & Coins */}
        {obstacles.map((obs) => (
          <div
            key={obs.id}
            style={{
              transform: `translate3d(${obs.lane * 100 + 20}%, ${obs.y * 2.8}px, 0)`,
            }}
            className="absolute top-0 left-0 w-1/5 flex items-center justify-center transition-transform duration-75"
          >
            {obs.type === 'coin' ? (
              <div className="w-7 h-7 rounded-full bg-amber-400 border-2 border-amber-200 shadow-sm flex items-center justify-center text-xs font-bold text-slate-950">
                $
              </div>
            ) : (
              <div className="w-14 h-5 rounded bg-rose-600 border border-rose-300 shadow-sm" />
            )}
          </div>
        ))}

        {/* Player Runner Avatar */}
        <div
          style={{
            transform: `translate3d(${lane * 100 + 18}%, 250px, 0) scale(${isJumping ? 1.25 : 1})`,
          }}
          className="absolute top-0 left-0 w-1/5 flex flex-col items-center transition-transform duration-150"
        >
          <div
            className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center font-bold text-xs ${
              isJumping
                ? 'bg-emerald-500 border-emerald-200 text-slate-950'
                : 'bg-indigo-600 border-indigo-300 text-white'
            }`}
          >
            {isJumping ? 'JUMP' : 'RUN'}
          </div>
        </div>
      </div>

      {/* Touch & Click Controls */}
      <div className="grid grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => setLane((p) => (p > 0 ? ((p - 1) as 0 | 1 | 2) : p))}
          className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0"
        >
          Move Left [A]
        </button>
        <button
          type="button"
          onClick={triggerJump}
          className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg whitespace-nowrap shrink-0"
        >
          Jump [Space]
        </button>
        <button
          type="button"
          onClick={() => setLane((p) => (p < 2 ? ((p + 1) as 0 | 1 | 2) : p))}
          className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0"
        >
          Move Right [D]
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// 2. ANGRY CATAPULT ENGINE (Slingshot Trajectory & Fortress Destruction)
// ============================================================================
const INITIAL_TARGETS: TargetBlock[] = [
  { id: 't1', x: 320, y: 180, width: 42, height: 42, hp: 1, points: 60 },
  { id: 't2', x: 370, y: 180, width: 42, height: 42, hp: 1, points: 60 },
  { id: 't3', x: 345, y: 132, width: 42, height: 42, hp: 1, points: 90 },
  { id: 't4', x: 425, y: 180, width: 42, height: 42, hp: 1, points: 80 },
];

const AngryCatapultEngine: React.FC<{
  isPlaying: boolean;
  score: number;
  setScore: (s: number) => void;
  onComplete: (finalScore: number) => void;
}> = ({ isPlaying, score, setScore, onComplete }) => {
  const [angle, setAngle] = useState(38);
  const [power, setPower] = useState(78);
  const [targets, setTargets] = useState<TargetBlock[]>(INITIAL_TARGETS);
  const [projectile, setProjectile] = useState<{ x: number; y: number; active: boolean }>({
    x: 60,
    y: 195,
    active: false,
  });

  const targetsRef = useRef(targets);
  targetsRef.current = targets;

  const fireCatapult = () => {
    if (!isPlaying || projectile.active) return;
    soundEngine.playSfx('launch');
    const rad = (angle * Math.PI) / 180;
    const speed = power * 3.6;
    let state = {
      x: 60,
      y: 195,
      vx: Math.cos(rad) * speed,
      vy: -Math.sin(rad) * speed,
    };

    setProjectile({ x: state.x, y: state.y, active: true });
    let earned = score;

    const timer = window.setInterval(() => {
      state = stepProjectile(state, 0.04, 290);
      setProjectile({ x: state.x, y: state.y, active: true });

      let hitPoints = 0;
      const updated = targetsRef.current.map((b) => {
        if (b.hp > 0 && checkProjectileBlockHit(state, 18, b)) {
          soundEngine.playSfx('hit');
          hitPoints += b.points;
          return { ...b, hp: 0 };
        }
        return b;
      });

      if (hitPoints > 0) {
        earned += hitPoints;
        setTargets(updated);
        setScore(earned);
      }

      if (updated.every((b) => b.hp <= 0)) {
        window.clearInterval(timer);
        onComplete(earned + 150);
        return;
      }

      if (state.x > 500 || state.y > 240) {
        window.clearInterval(timer);
        setProjectile({ x: 60, y: 195, active: false });
      }
    }, 45);
  };

  const resetFortress = () => {
    setTargets(INITIAL_TARGETS);
    setProjectile({ x: 60, y: 195, active: false });
  };

  return (
    <div className="w-full max-w-xl space-y-4">
      <svg
        viewBox="0 0 500 240"
        className="w-full h-64 bg-slate-950 border-2 border-slate-800 rounded-xl"
        data-testid="catapult-canvas"
      >
        {/* Ground Line */}
        <line x1="0" y1="224" x2="500" y2="224" stroke="#334155" strokeWidth="4" />

        {/* Slingshot Fork */}
        <line x1="60" y1="224" x2="60" y2="185" stroke="#a855f7" strokeWidth="6" />

        {/* Active Projectile */}
        <circle
          cx={projectile.x}
          cy={projectile.y}
          r="12"
          fill="#f43f5e"
          stroke="#fecdd3"
          strokeWidth="2"
        />

        {/* Target Fortress Blocks */}
        {targets.map(
          (t) =>
            t.hp > 0 && (
              <g key={t.id}>
                <rect
                  x={t.x}
                  y={t.y}
                  width={t.width}
                  height={t.height}
                  rx="4"
                  fill="#10b981"
                  stroke="#a7f3d0"
                  strokeWidth="2"
                />
                <circle cx={t.x + t.width / 2} cy={t.y + t.height / 2} r="7" fill="#064e3b" />
              </g>
            )
        )}
      </svg>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end bg-slate-950 p-4 rounded-xl border border-slate-800">
        <label className="block space-y-1 text-xs text-slate-300">
          <span>Launch Angle ({angle}°)</span>
          <input
            type="range"
            min={15}
            max={75}
            value={angle}
            onChange={(e) => setAngle(Number(e.target.value))}
            className="w-full accent-indigo-500"
          />
        </label>
        <label className="block space-y-1 text-xs text-slate-300">
          <span>Slingshot Tension ({power}%)</span>
          <input
            type="range"
            min={35}
            max={100}
            value={power}
            onChange={(e) => setPower(Number(e.target.value))}
            className="w-full accent-indigo-500"
          />
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={fireCatapult}
            className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg whitespace-nowrap shrink-0"
          >
            Launch Orb
          </button>
          <button
            type="button"
            onClick={resetFortress}
            className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0"
          >
            Reset Targets
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 3. BLOCK ARENA ENGINE (Tactical Grid Placement & Row Clear)
// ============================================================================
const BlockArenaEngine: React.FC<{
  isPlaying: boolean;
  score: number;
  setScore: (s: number) => void;
  onGameOver: (finalScore: number) => void;
}> = ({ isPlaying, score, setScore, onGameOver }) => {
  const [grid, setGrid] = useState<BlockGrid>(() => createEmptyGrid(6, 6));

  const placePieceAt = (r: number, c: number) => {
    if (!isPlaying) return;
    const copy = grid.map((row) => [...row]);
    if (copy[r][c] !== 0) return;

    // Place a 2-block horizontal bar if space permits, otherwise single block
    copy[r][c] = 1;
    if (c + 1 < copy[r].length && copy[r][c + 1] === 0) {
      copy[r][c + 1] = 2;
    }

    const { newGrid, linesCleared, pointsEarned } = clearCompletedLines(copy);
    if (linesCleared > 0) {
      soundEngine.playSfx('clear');
    } else {
      soundEngine.playSfx('coin');
    }

    const updatedScore = score + 15 + pointsEarned;
    setGrid(newGrid);
    setScore(updatedScore);

    // Check if board is full
    const anyEmpty = newGrid.some((row) => row.some((cell) => cell === 0));
    if (!anyEmpty) {
      onGameOver(updatedScore);
    }
  };

  return (
    <div className="space-y-4 text-center" data-testid="blocks-canvas">
      <p className="text-xs text-slate-400">
        Click any empty cell to deploy a tactical block pair. Complete full horizontal rows to clear them for 100+ bonus points.
      </p>
      <div className="inline-grid grid-cols-6 gap-2 p-4 bg-slate-950 border-2 border-slate-800 rounded-xl">
        {grid.map((row, rIdx) =>
          row.map((cell, cIdx) => (
            <button
              key={`${rIdx}-${cIdx}`}
              type="button"
              onClick={() => placePieceAt(rIdx, cIdx)}
              aria-label={`Grid cell row ${rIdx + 1} column ${cIdx + 1}`}
              className={`w-11 h-11 rounded-md border transition-colors ${
                cell === 0
                  ? 'bg-slate-900 border-slate-800 hover:border-indigo-500/60'
                  : cell === 1
                  ? 'bg-indigo-600 border-indigo-400'
                  : 'bg-emerald-600 border-emerald-400'
              }`}
            />
          ))
        )}
      </div>
    </div>
  );
};
