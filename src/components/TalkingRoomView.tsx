import React, { useEffect, useRef, useState } from 'react';
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
  onSendSignal: (toUid: string, callType: 'audio' | 'video', signalData: Record<string, unknown>) => void;
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
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'connected'>('idle');
  const [callType, setCallType] = useState<'audio' | 'video'>('video');
  const [mediaError, setMediaError] = useState<string>('');
  const [micMuted, setMicMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);

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
  };

  useEffect(() => {
    return () => cleanupCall();
  }, []);

  const acquireLocalMedia = async (mode: 'audio' | 'video'): Promise<MediaStream | null> => {
    setMediaError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: mode === 'video',
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      setMediaError(
        err instanceof Error
          ? `Camera/Microphone access error: ${err.message}`
          : 'Could not access camera or microphone.'
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

  // Handle incoming WebRTC signaling messages
  useEffect(() => {
    if (!incomingSignal) return;
    const { fromUid, callType: incomingMode, signalData } = incomingSignal;

    const handleSignal = async () => {
      if (signalData.type === 'offer') {
        setSelectedPeerUid(fromUid);
        setCallType(incomingMode);
        setCallStatus('connected');

        const stream = await acquireLocalMedia(incomingMode);
        const pc = createPeerConnection(fromUid, incomingMode);
        if (stream) {
          stream.getTracks().forEach((track) => pc.addTrack(track, stream));
        }

        await pc.setRemoteDescription(new RTCSessionDescription(signalData.sdp as RTCSessionDescriptionInit));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        onSendSignal(fromUid, incomingMode, { type: 'answer', sdp: answer });
        onClearIncomingSignal();
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

  return (
    <section className="space-y-6" aria-label="Voice and Video Talking Mode">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            Live Voice & Video Calling
          </h1>
          <p className="text-sm text-slate-400">
            Peer-to-peer WebRTC audio and video streams negotiated over the real-time WebSocket signaling server
          </p>
        </div>
        <div className="text-xs text-slate-400">
          Caller Identity: <span className="text-slate-100 font-semibold">{currentName}</span>
        </div>
      </div>

      {mediaError && (
        <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-500/40 text-xs text-rose-200">
          {mediaError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Connected Peers Available to Call (4 cols) */}
        <div className="lg:col-span-4 p-5 rounded-xl border border-slate-800 bg-slate-900 space-y-4">
          <h2 className="text-base font-bold text-white border-b border-slate-800 pb-3">
            Online Connections ({acceptedPeers.length})
          </h2>

          {acceptedPeers.length === 0 ? (
            <div className="py-6 space-y-2 text-xs text-slate-400">
              <p className="text-slate-200 font-medium">No online connections ready to call</p>
              <p>
                Send a connection request to an online person in the Online Hub. Once accepted, you can start a live voice or video call with them here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {acceptedPeers.map((peer) => (
                <div
                  key={peer.uid}
                  className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white truncate">
                      {peer.displayName}
                    </div>
                    <div className="text-xs text-slate-400">
                      Streak {peer.streakCount}d · Online now
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => startCall(peer.uid, 'audio')}
                      className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-md whitespace-nowrap shrink-0"
                    >
                      Voice Call
                    </button>
                    <button
                      type="button"
                      onClick={() => startCall(peer.uid, 'video')}
                      className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-md whitespace-nowrap shrink-0"
                    >
                      Video Call
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-3 border-t border-slate-800 space-y-2">
            <div className="text-xs font-semibold text-slate-300">Camera & Mic Self-Check</div>
            <button
              type="button"
              onClick={() => acquireLocalMedia('video')}
              className="w-full py-2 px-3 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg whitespace-nowrap shrink-0"
            >
              Preview My Camera & Microphone
            </button>
          </div>
        </div>

        {/* Dual Video Stage (8 cols) */}
        <div className="lg:col-span-8 p-5 rounded-xl border border-slate-800 bg-slate-900 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative aspect-video bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex items-center justify-center">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 left-3 text-xs font-medium text-slate-200 bg-slate-950/80 px-2.5 py-1 rounded">
                {currentName} (Local Stream)
              </div>
            </div>

            <div className="relative aspect-video bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex items-center justify-center">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 left-3 text-xs font-medium text-slate-200 bg-slate-950/80 px-2.5 py-1 rounded">
                {callStatus === 'connected'
                  ? 'Remote Peer Stream (Connected)'
                  : callStatus === 'calling'
                  ? 'Dialing Remote Peer...'
                  : 'Waiting for Peer Stream'}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
            <div className="text-xs text-slate-400">
              Call State: <span className="text-slate-200 font-semibold uppercase">{callStatus}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleMute}
                className="px-3.5 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg whitespace-nowrap shrink-0"
              >
                {micMuted ? 'Unmute Mic' : 'Mute Mic'}
              </button>
              <button
                type="button"
                onClick={toggleCamera}
                className="px-3.5 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg whitespace-nowrap shrink-0"
              >
                {camOff ? 'Enable Camera' : 'Disable Camera'}
              </button>
              <button
                type="button"
                onClick={hangupCall}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-lg whitespace-nowrap shrink-0"
              >
                End Call
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
