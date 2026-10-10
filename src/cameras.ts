export type Camera = { id: string; name: string; location: string; sub?: string; main?: string };
// Only NVR channel 0 is verified. Replace placeholders after testing each NVR channel.
// NEVER place RTSP credentials or direct NVR URLs in this frontend file.
export const cameras: Camera[] = [
  { id: 'cam1', name: 'Camera 01', location: 'NVR channel 0 · Verified', sub: 'daichi_sub', main: 'daichi_main' },
  { id: 'cam2', name: 'Camera 02', location: 'Awaiting stream mapping' },
  { id: 'cam3', name: 'Camera 03', location: 'Awaiting stream mapping' },
  { id: 'cam4', name: 'Camera 04', location: 'Awaiting stream mapping' },
  { id: 'cam5', name: 'Camera 05', location: 'Awaiting stream mapping' },
];
