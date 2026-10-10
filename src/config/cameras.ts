export type Camera = { id: number; name: string; location: string; subStream: string | null; mainStream: string | null };

// The NVR channel 0 is confirmed. Remaining cameras are intentionally NOT assigned
// guessed RTSP paths. Add them to go2rtc and the nginx stream allowlist first.
export const cameras: Camera[] = [
  { id: 1, name: 'Camera 01', location: 'NVR channel 0', subStream: 'daichi_sub', mainStream: 'daichi_main' },
  { id: 2, name: 'Camera 02', location: 'Not configured', subStream: null, mainStream: null },
  { id: 3, name: 'Camera 03', location: 'Not configured', subStream: null, mainStream: null },
  { id: 4, name: 'Camera 04', location: 'Not configured', subStream: null, mainStream: null },
  { id: 5, name: 'Camera 05', location: 'Not configured', subStream: null, mainStream: null }
];
