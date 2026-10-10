import { useState } from 'react';
import { Activity, Camera as CameraIcon, ChevronDown, LayoutGrid, LockKeyhole, Maximize2, ShieldCheck, X } from 'lucide-react';
import CameraCard from './components/CameraCard';
import WebRTCPlayer from './components/WebRTCPlayer';
import { cameras } from './config/cameras';
import './App.css';

export default function App() {
  const [playing, setPlaying] = useState<Record<number, boolean>>({});
  const [selected, setSelected] = useState<number | null>(null);
  const [quality, setQuality] = useState<'sub' | 'main'>('main');
  const configured = cameras.filter(c => c.subStream).length;
  const activeCamera = cameras.find(c => c.id === selected);
  const toggle = (id: number) => setPlaying(prev => ({ ...prev, [id]: !prev[id] }));
  return <div className="app">
    <aside className="sidebar"><div className="brand"><div className="brand-icon"><CameraIcon size={22} /></div><div><strong>SARADA<span> CCTV</span></strong><small>HOME SURVEILLANCE</small></div></div><div className="nav-label">WORKSPACE</div><div className="nav-item active"><LayoutGrid size={18} /> Live monitoring</div><div className="sidebar-bottom"><ShieldCheck size={18} /><div><strong>Private deployment</strong><span>LAN + Tailscale access</span></div></div></aside>
    <main className="main"><header className="topbar"><div className="breadcrumbs">Home <span>/</span> <strong>Live Monitoring</strong></div><div className="topbar-right"><span className="vpn-badge"><LockKeyhole size={14} /> PRIVATE NETWORK</span><div className="avatar">S</div></div></header>
      <div className="content"><div className="heading-row"><div><div className="eyebrow"><span className="dot" /> SYSTEM OVERVIEW</div><h1>Live Monitoring</h1><p>Monitor your Daichi cameras in one secure workspace.</p></div><div className="system-status"><Activity size={18} /><div><strong>Viewer ready</strong><span>Connection status shown per stream</span></div><ChevronDown size={15} /></div></div>
        <div className="stats"><div className="stat"><span>Total camera slots</span><strong>05</strong><small>Configured capacity</small></div><div className="stat"><span>Mapped streams</span><strong>{String(configured).padStart(2, '0')}</strong><small>Confirmed NVR channel</small></div><div className="stat"><span>Pending mapping</span><strong>{String(5 - configured).padStart(2, '0')}</strong><small>Awaiting channel paths</small></div><div className="stat"><span>Streaming protocol</span><strong className="stat-word">WebRTC</strong><small>Low latency playback</small></div></div>
        <div className="section-heading"><div><h2>Camera feeds <span>{configured} / 5 configured</span></h2><p>Start a feed to connect. Expand to switch between sub and main streams.</p></div><div className="view-mode"><LayoutGrid size={16} /> Grid view</div></div>
        <div className="camera-grid">{cameras.map(camera => <CameraCard key={camera.id} camera={camera} playing={!!playing[camera.id]} onToggle={() => toggle(camera.id)} onExpand={() => { setSelected(camera.id); setQuality('main'); }} />)}</div>
        <footer className="footer"><span>SARADA CCTV · Private homelab monitoring</span><span>No recording or authentication is provided by this UI</span></footer></div>
    </main>
    {activeCamera && <div className="modal-backdrop" onMouseDown={() => setSelected(null)}><section className="modal" onMouseDown={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={`${activeCamera.name} fullscreen viewer`}><div className="modal-header"><div><strong>{activeCamera.name}</strong><span>{activeCamera.location}</span></div><div className="modal-actions"><div className="quality-switch"><button className={quality === 'sub' ? 'chosen' : ''} onClick={() => setQuality('sub')}>Sub</button><button className={quality === 'main' ? 'chosen' : ''} onClick={() => setQuality('main')}>Main</button></div><button title="Browser fullscreen" onClick={e => e.currentTarget.closest('.modal')?.requestFullscreen?.()}><Maximize2 size={18} /></button><button title="Close" onClick={() => setSelected(null)}><X size={20} /></button></div></div><WebRTCPlayer className="modal-player" stream={quality === 'main' ? activeCamera.mainStream : activeCamera.subStream} active={true} /><p className="modal-note">HEVC/H.265 may not play in every browser. If the main stream fails, try the sub stream or configure an H.264 source on the NVR.</p></section></div>}
  </div>;
}
