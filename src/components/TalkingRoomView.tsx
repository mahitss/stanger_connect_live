import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck, Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';
import { OnlinePeer } from '../../server';

interface TalkingRoomViewProps {
  currentUid: string;
  currentName: string;
  acceptedPeers: OnlinePeer[];
  incomingSignal: {
    fromUid: string;
    fromName: string;
    callType: 'audio' | 'video';
    signalData: Record<string, unknown>;
  } | null;
  onSendSignal: (
    toUid: string,
    callType: 'audio' | 'video',
    signalData: Record<string, unknown>
  ) => void;
  onClearIncomingSignal: () => void;
}

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

export const TalkingRoomView: React.FC<TalkingRoomViewProps> = ({
  currentName,
  acceptedPeers,
  incomingSignal,
  onSendSignal,
  onClearIncomingSignal,
}) => {
  const [selectedPeerUid, setSelectedPeerUid] = useState<string>('');
  const [callStatus, setCallStatus] = useState<'idle' | 'ringing' | 'calling' | 'connected'>('idle');
  const [callType, setCallType] = useState<'audio' | 'video'>('video');
  const [mediaError, setMediaError] = useState<string>('');

  // Strict Permission-First Hardware Gate: Camera & Mic are NEVER open by default
  const [hardwarePermissionGranted, setHardwarePermissionGranted] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [hardwareGateNotice, setHardwareGateNotice] = useState(
    'Camera & Microphone are closed by default. Grant permission first, then hardware opens only when a call with an accepted connection starts.'
  );

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const peerConnRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const cleanupCall = () => {
    if (peerConnRef.current) {
      peerConnRef.current.close();
      peerConnRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setCallStatus('idle');
    setMicMuted(false);
    setCamOff(false);
    setHardwareGateNotice(
      hardwarePermissionGranted
        ? 'Call ended. Camera & Microphone tracks have been stopped and closed.'
        : 'Camera & Microphone are closed by default. Grant permission first.'
    );
  };

  useEffect(() => {
    return () => cleanupCall();
  }, []);

  const handleGrantHardwarePermission = () => {
    setHardwarePermissionGranted(true);
    setMediaError('');
    setHardwareGateNotice(
      'Permission granted. Camera & Microphone remain closed until you start or accept a live call.'
    );
  };

  const acquireLocalMedia = async (mode: 'audio' | 'video'): Promise<MediaStream | null> => {
    setMediaError('');
    if (!hardwarePermissionGranted) {
      setMediaError(
        'Hardware permission required: Please click "Grant Camera & Mic Permission" first before opening media.'
      );
      return null;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: mode === 'video',
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setHardwareGateNotice(
        mode === 'video'
          ? 'Camera & Microphone active for connected peer call.'
          : 'Microphone active for connected voice call (Camera closed).'
      );
      return stream;
    } catch (err) {
      setMediaError(
        err instanceof Error
          ? `Camera/Microphone access note: ${err.message}`
          : 'Could not access physical camera or microphone.'
      );
      return null;
    }
  };

  const createPeerConnection = (targetUid: string, mode: 'audio' | 'video') => {
    const pc = new RTCPeerConnection(RTC_CONFIG);
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        onSendSignal(targetUid, mode, { type: 'candidate', candidate: event.candidate });
      }
    };
    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };
    peerConnRef.current = pc;
    return pc;
  };

  const startCall = async (targetUid: string, mode: 'audio' | 'video') => {
    if (!targetUid) return;
    if (!hardwarePermissionGranted) {
      setMediaError(
        'Please click "Grant Camera & Mic Permission" first so your camera/mic is only opened with your explicit consent.'
      );
      return;
    }
    const isAccepted = acceptedPeers.some((p) => p.uid === targetUid);
    if (!isAccepted) {
      setMediaError('Calls are restricted to accepted connections only.');
      return;
    }

    setSelectedPeerUid(targetUid);
    setCallType(mode);
    setCallStatus('calling');

    const stream = await acquireLocalMedia(mode);
    const pc = createPeerConnection(targetUid, mode);
    if (stream) {
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    }

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    onSendSignal(targetUid, mode, { type: 'offer', sdp: offer });
  };

  const handleAcceptIncomingCall = async () => {
    if (!incomingSignal) return;
    const { fromUid, callType: incomingMode, signalData } = incomingSignal;
    setHardwarePermissionGranted(true);
    setSelectedPeerUid(fromUid);
    setCallType(incomingMode);
    setCallStatus('connected');

    const stream = await acquireLocalMedia(incomingMode);
    const pc = createPeerConnection(fromUid, incomingMode);
    if (stream) {
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    }

    await pc.setRemoteDescription(
      new RTCSessionDescription(signalData.sdp as RTCSessionDescriptionInit)
    );
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    onSendSignal(fromUid, incomingMode, { type: 'answer', sdp: answer });
    onClearIncomingSignal();
  };

  useEffect(() => {
    if (!incomingSignal) return;
    const { signalData } = incomingSignal;

    const handleSignal = async () => {
      if (signalData.type === 'offer') {
        // Never auto-open camera/mic on incoming offer — ring and wait for explicit user acceptance
        setCallStatus('ringing');
      } else if (signalData.type === 'answer' && peerConnRef.current) {
        await peerConnRef.current.setRemoteDescription(
          new RTCSessionDescription(signalData.sdp as RTCSessionDescriptionInit)
        );
        setCallStatus('connected');
        onClearIncomingSignal();
      } else if (signalData.type === 'candidate' && peerConnRef.current) {
        await peerConnRef.current.addIceCandidate(
          new RTCIceCandidate(signalData.candidate as RTCIceCandidateInit)
        );
        onClearIncomingSignal();
      } else if (signalData.type === 'hangup') {
        cleanupCall();
        onClearIncomingSignal();
      }
    };

    handleSignal().catch((err) => console.error('WebRTC signal error:', err));
  }, [incomingSignal]);

  const toggleMute = () => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setMicMuted((m) => !m);
  };

  const toggleCamera = () => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getVideoTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setCamOff((c) => !c);
  };

  const hangupCall = () => {
    if (selectedPeerUid) {
      onSendSignal(selectedPeerUid, callType, { type: 'hangup' });
    }
    cleanupCall();
  };

  const hasActiveLocalTracks = Boolean(localStreamRef.current);

  return (
    <section className="space-y-6" aria-label="Voice and Video Talking Mode">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Live Voice & Video Calling
          </h1>
          <p className="text-sm text-zinc-400">
            Invite-first WebRTC voice & video calling with strict permission-gated camera and microphone hardware
          </p>
        </div>
        <div className="text-xs text-zinc-400 font-mono">
          Caller Identity: <span className="text-white font-semibold">{currentName}</span>
        </div>
      </div>

      {/* Permission-First Hardware Privacy Gate Banner */}
      <div
        className="p-4 rounded-lg border border-zinc-800/80 bg-[#0A0A0C] flex flex-wrap items-center justify-between gap-4"
        data-testid="talking-hardware-gate"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-white">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Permission-First Camera & Microphone Gate</span>
            <span aria-hidden="true" className="text-zinc-600">·</span>
            <span className="font-mono text-zinc-400">
              Hardware: {hasActiveLocalTracks ? 'OPEN IN CALL' : 'CLOSED'}
            </span>
          </div>
          <p className="text-xs text-zinc-400">{hardwareGateNotice}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!hardwarePermissionGranted ? (
            <button
              type="button"
              onClick={handleGrantHardwarePermission}
              className="px-4 py-2 text-xs font-semibold bg-white hover:bg-zinc-200 text-black rounded-md whitespace-nowrap shrink-0"
            >
              Grant Camera & Mic Permission
            </button>
          ) : (
            <span className="px-3 py-1.5 text-xs font-mono text-emerald-400 bg-[#050505] border border-zinc-800 rounded-md">
              Permission Verified · Ready on Join
            </span>
          )}
        </div>
      </div>

      {incomingSignal && callStatus === 'ringing' && (
        <div className="p-4 rounded-lg bg-[#0A0A0C] border border-white/40 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-sm font-bold text-white">
              Incoming {incomingSignal.callType === 'video' ? 'Video' : 'Voice'} Call from{' '}
              {incomingSignal.fromName}
            </div>
            <p className="text-xs text-zinc-400">
              Your camera and microphone are currently closed. Accepting will grant permission and open media for this call.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAcceptIncomingCall}
              className="px-4 py-2 text-xs font-semibold bg-white hover:bg-zinc-200 text-black rounded-md whitespace-nowrap shrink-0"
            >
              Accept & Open {incomingSignal.callType === 'video' ? 'Camera/Mic' : 'Mic'}
            </button>
            <button
              type="button"
              onClick={() => {
                onSendSignal(incomingSignal.fromUid, incomingSignal.callType, { type: 'hangup' });
                onClearIncomingSignal();
                setCallStatus('idle');
              }}
              className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-md whitespace-nowrap shrink-0"
            >
              Decline
            </button>
          </div>
        </div>
      )}

      {mediaError && (
        <div className="p-4 rounded-md bg-rose-950/40 border border-rose-500/40 text-xs text-rose-200">
          {mediaError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-4 p-5 rounded-lg border border-zinc-800/80 bg-[#0A0A0C] space-y-4">
          <h2 className="text-base font-bold text-white border-b border-zinc-800/80 pb-3">
            Accepted Online Connections ({acceptedPeers.length})
          </h2>

          {acceptedPeers.length === 0 ? (
            <div className="py-6 space-y-2 text-xs text-zinc-400">
              <p className="text-white font-medium">No accepted connections online right now</p>
              <p>
                Random calls are blocked for security. First send a connection invite in the Online Directory; once accepted, voice and video calls unlock here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {acceptedPeers.map((peer) => (
                <div
                  key={peer.uid}
                  className="p-3.5 rounded-md bg-[#050505] border border-zinc-800/80 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white truncate">
                      {peer.displayName}
                    </div>
                    <div className="text-xs text-zinc-400 font-mono tabular-nums">
                      Streak {peer.streakCount}d · Online now
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => startCall(peer.uid, 'audio')}
                      className="px-3 py-1.5 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-100 border border-zinc-800 rounded whitespace-nowrap shrink-0"
                    >
                      Voice Call
                    </button>
                    <button
                      type="button"
                      onClick={() => startCall(peer.uid, 'video')}
                      className="px-3 py-1.5 text-xs font-semibold bg-white hover:bg-zinc-200 text-black rounded whitespace-nowrap shrink-0"
                    >
                      Video Call
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-3 border-t border-zinc-800/80 space-y-2">
            <div className="text-xs font-semibold text-zinc-300">
              Hardware Self-Test (Requires Permission First)
            </div>
            <button
              type="button"
              onClick={() => acquireLocalMedia('video')}
              className="w-full py-2 px-3 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-100 border border-zinc-800 rounded-md whitespace-nowrap shrink-0"
            >
              Test My Camera & Microphone
            </button>
          </div>
        </div>

        <div className="lg:col-span-8 p-5 rounded-lg border border-zinc-800/80 bg-[#0A0A0C] space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative aspect-video bg-[#050505] border border-zinc-800/80 rounded-md overflow-hidden flex items-center justify-center">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {!hasActiveLocalTracks && (
                <div className="text-xs text-zinc-500 font-mono text-center px-4">
                  Camera & Mic Closed (Standby)
                </div>
              )}
              <div className="absolute bottom-3 left-3 text-xs font-mono text-zinc-200 bg-black/80 border border-zinc-800 px-2.5 py-1 rounded">
                {currentName} ({hasActiveLocalTracks ? 'Live Stream' : 'Hardware Closed'})
              </div>
            </div>

            <div className="relative aspect-video bg-[#050505] border border-zinc-800/80 rounded-md overflow-hidden flex items-center justify-center">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              {callStatus !== 'connected' && (
                <div className="text-xs text-zinc-500 font-mono text-center px-4">
                  No Remote Peer Connected
                </div>
              )}
              <div className="absolute bottom-3 left-3 text-xs font-mono text-zinc-200 bg-black/80 border border-zinc-800 px-2.5 py-1 rounded">
                {callStatus === 'connected'
                  ? 'Remote Peer Stream (Connected)'
                  : callStatus === 'calling'
                  ? 'Dialing Accepted Connection...'
                  : 'Waiting for Peer Join'}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-800/80">
            <div className="text-xs text-zinc-400 font-mono">
              Call State: <span className="text-white font-semibold uppercase">{callStatus}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleMute}
                disabled={!hasActiveLocalTracks}
                className="px-3.5 py-2 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-zinc-200 border border-zinc-800 rounded-md flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                {micMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                <span>{micMuted ? 'Unmute Mic' : 'Mute Mic'}</span>
              </button>
              <button
                type="button"
                onClick={toggleCamera}
                disabled={!hasActiveLocalTracks}
                className="px-3.5 py-2 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-zinc-200 border border-zinc-800 rounded-md flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                {camOff ? <VideoOff className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
                <span>{camOff ? 'Enable Camera' : 'Disable Camera'}</span>
              </button>
              <button
                type="button"
                onClick={hangupCall}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-md flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <PhoneOff className="w-3.5 h-3.5" />
                <span>End Call & Lock Hardware</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
