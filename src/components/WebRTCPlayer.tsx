import { useEffect, useRef, useState } from 'react';
import { AlertCircle, LoaderCircle, Play, RefreshCw } from 'lucide-react';

type Props = { stream: string | null; active: boolean; className?: string };
type Status = 'idle' | 'connecting' | 'live' | 'error';

export default function WebRTCPlayer({ stream, active, className = '' }: Props) {
  const video = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!stream || !active) { setStatus('idle'); return; }
    let disposed = false;
    const controller = new AbortController();
    const peer = new RTCPeerConnection();
    const timeout = window.setTimeout(() => {
      if (!disposed && peer.connectionState !== 'connected') {
        setError('Connection timed out. Check the WebRTC candidate address and port 8555.');
        setStatus('error');
        peer.close();
      }
    }, 20000);

    setStatus('connecting');
    setError('');
    peer.addTransceiver('video', { direction: 'recvonly' });
    peer.addTransceiver('audio', { direction: 'recvonly' });
    peer.ontrack = (event) => {
      if (disposed || !video.current) return;
      const current = video.current.srcObject;
      const media = current instanceof MediaStream ? current : new MediaStream();
      if (!media.getTracks().some((track) => track.id === event.track.id)) media.addTrack(event.track);
      video.current.srcObject = media;
      void video.current.play().catch(() => { /* user may need to click play */ });
    };
    peer.onconnectionstatechange = () => {
      if (disposed) return;
      if (peer.connectionState === 'connected') setStatus('live');
      if (peer.connectionState === 'failed' || peer.connectionState === 'disconnected') {
        setError('Peer connection lost. Retry or check VPN connectivity.');
        setStatus('error');
      }
    };

    async function connect() {
      try {
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        // Use complete ICE candidates for a conventional non-trickle SDP exchange.
        if (peer.iceGatheringState !== 'complete') {
          await new Promise<void>((resolve) => {
            const onChange = () => {
              if (peer.iceGatheringState === 'complete' || peer.signalingState === 'closed') {
                peer.removeEventListener('icegatheringstatechange', onChange);
                resolve();
              }
            };
            peer.addEventListener('icegatheringstatechange', onChange);
            window.setTimeout(() => { peer.removeEventListener('icegatheringstatechange', onChange); resolve(); }, 5000);
          });
        }
        if (disposed || peer.signalingState === 'closed') return;
        const response = await fetch(`/api/webrtc?src=${encodeURIComponent(stream!)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/sdp' },
          body: peer.localDescription?.sdp,
          signal: controller.signal
        });
        if (!response.ok) throw new Error(`Signaling HTTP ${response.status}`);
        const answer = await response.text();
        if (!disposed && peer.signalingState !== 'closed') {
          await peer.setRemoteDescription({ type: 'answer', sdp: answer });
        }
      } catch (err) {
        if (disposed) return;
        setError(err instanceof Error ? err.message : 'Could not start the stream');
        setStatus('error');
      }
    }
    void connect();
    return () => {
      disposed = true;
      controller.abort();
      window.clearTimeout(timeout);
      peer.close();
      if (video.current) video.current.srcObject = null;
    };
  }, [stream, active, retry]);

  if (!stream) return <div className={`player-placeholder ${className}`}><AlertCircle size={28}/><span>Stream not configured</span><small>Map this camera to an NVR channel</small></div>;
  if (!active) return <div className={`player-placeholder ${className}`}><Play size={28}/><span>Stream paused</span><small>Press Play to start</small></div>;
  return <div className={`player-shell ${className}`}>
    <video ref={video} autoPlay muted playsInline controls={status === 'live'} />
    {status === 'connecting' && <div className="player-overlay"><LoaderCircle className="spin" size={26}/><span>Connecting to camera…</span></div>}
    {status === 'error' && <div className="player-overlay error-overlay"><AlertCircle size={26}/><span>{error}</span><button onClick={() => setRetry(n => n + 1)}><RefreshCw size={14}/> Retry</button></div>}
    {status === 'live' && <span className="live-indicator"><i/> LIVE</span>}
  </div>;
}
