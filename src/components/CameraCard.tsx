import { Maximize2, Pause, Play, Video } from 'lucide-react';
import type { Camera } from '../config/cameras';
import WebRTCPlayer from './WebRTCPlayer';

type Props = { camera: Camera; playing: boolean; onToggle: () => void; onExpand: () => void };
export default function CameraCard({ camera, playing, onToggle, onExpand }: Props) {
  const available = !!camera.subStream;
  return <article className="camera-card">
    <div className="camera-heading"><div className="camera-icon"><Video size={17}/></div><div className="camera-title"><strong>{camera.name}</strong><span>{camera.location}</span></div><span className={`status-pill ${available ? 'ready' : ''}`}>{available ? 'Configured' : 'Pending'}</span></div>
    <WebRTCPlayer stream={camera.subStream} active={playing} />
    <div className="camera-actions"><span className="stream-label">{available ? 'SUB · Live preview' : 'No source'}</span><div className="action-group"><button title={playing ? 'Pause stream' : 'Play stream'} onClick={onToggle} disabled={!available}>{playing ? <Pause size={16}/> : <Play size={16}/>}</button><button title="Expand camera" onClick={onExpand} disabled={!available}><Maximize2 size={16}/></button></div></div>
  </article>;
}
