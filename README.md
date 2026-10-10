# Sarada CCTV

Standalone React + Vite + TypeScript private CCTV dashboard for a Daichi NVR using go2rtc WebRTC signaling. This project does **not** change the Sarada-Portfolio or OpenMES repositories.

## Current status

- Five camera slots, responsive dark dashboard, fullscreen view, main/sub quality selector, play/pause, and retry.
- Only **NVR channel 0** is confirmed: `daichi_sub` (`/live/0/SUB`) and `daichi_main` (`/live/0/MAIN`). The other four slots are intentionally unmapped; do not assume NVR channel numbering.
- Browser playback is **not guaranteed** for HEVC/H.265 sources. If unsupported, configure an H.264 substream on the NVR (if available) or a separate transcoding pipeline.
- No user authentication is built into this app. Network isolation is required.
- No NVR password is stored in this repo.

## Prerequisites

Ubuntu with Docker Compose, running `daichi-go2rtc` container, and a working `go2rtc.yaml` with `daichi_sub` and `daichi_main`.

## Connect the two Docker projects without exposing the go2rtc API

Create a dedicated Docker network:

```bash
docker network create cctv_internal
```

Attach go2rtc to the network **persistently** by editing `/mnt/drive-3/go2rtc/compose.yaml`:

```yaml
services:
  go2rtc:
    # Keep ALL your existing image, volumes, ports, restart settings.
    networks:
      - cctv_internal

networks:
  cctv_internal:
    external: true
```

**Merge**, do not replace, your existing service definition. Then run from `/mnt/drive-3/go2rtc`:

```bash
docker compose config -q
docker compose up -d --force-recreate go2rtc
```

Remove the previously added `100.98.140.29:1984:1984/tcp` mapping from go2rtc if present; retain `127.0.0.1:1984:1984/tcp`. The viewer container will reach go2rtc via Docker DNS `daichi-go2rtc:1984`. No browser needs access to the management API.

## Start the CCTV app

```bash
cd ~/sarada-cctv
docker compose config -q
docker compose up -d --build
```

Default port binding is `127.0.0.1:8098:80` so the app is **not exposed to your LAN, tailnet, or internet** until you explicitly configure access. From your Mac, tunnel:

```bash
ssh -N -L 8098:127.0.0.1:8098 sp-homelab@192.168.1.8
```

Open `http://127.0.0.1:8098` on your Mac. Click Play on Camera 01. Browser sends WebRTC SDP to `/api/webrtc?src=daichi_sub`, which Nginx proxies to go2rtc. Only two allowlisted stream names are accepted; all other `/api/` routes return 404.

## WebRTC media networking

The signaling endpoint uses HTTP on port 8098, but **media uses go2rtc's port 8555** separately. Your go2rtc currently advertises `192.168.1.8` as an ICE candidate and binds port 8555 to the LAN IP. This can work from a Mac on the same LAN, but may fail for remote VPN devices that cannot reach the LAN address.

For Tailscale-only media, add `100.98.140.29` to `webrtc.candidates` in `go2rtc.yaml`, and add a `100.98.140.29:8555:8555` TCP+UDP mapping in go2rtc's Compose. Ensure the go2rtc API remains localhost-only. Confirm Tailscale ACLs restrict access to trusted devices. Use the VPN address only after verifying the host Tailscale IP is stable.

## Private hostname: cctv.saradap.space

Do **not** publish a public Cloudflare Tunnel, public A record to your WAN address, or forward router ports. A private domain with HTTPS requires a separate step:

1. Configure split DNS for LAN and tailnet to resolve `cctv.saradap.space` to a private address reachable from each network. Public Cloudflare DNS alone does not provide this split behavior. Tailscale split DNS requires a reachable DNS resolver; consider AdGuard Home or Pi-hole for LAN resolution.
2. Put an HTTPS reverse proxy on private interfaces only, with a Cloudflare DNS-01 certificate challenge (requires carefully scoped Cloudflare DNS API token). Do not reuse or modify the OpenMES Caddy configuration without reviewing its bindings.
3. Restrict route access to trusted LAN and Tailscale clients; optionally add authentication as defense in depth. HTTPS is important for WebRTC and credentials.
4. Only then change the CCTV app's host binding from loopback to a private proxy connection.

The shipped Compose is deliberately loopback-only until these steps are complete.

## Add the other four cameras

1. Determine their actual RTSP paths with the NVR (don't guess based on IPs alone).
2. Add stream names such as `daichi_cam2_sub`, `daichi_cam2_main` to the **protected** go2rtc YAML.
3. Update `src/config/cameras.ts` to assign the verified stream names.
4. Update the `nginx.conf` `arg_src` allowlist to include the same names.
5. Rebuild only this CCTV app; restart go2rtc only if its configuration changed.

## GitHub

Create a private `sarada-cctv` GitHub repository, then:

```bash
git init
git branch -M main
git add .
git commit -m "Initial private CCTV dashboard"
git remote add origin git@github.com:YOUR_USERNAME/sarada-cctv.git
git push -u origin main
```

If the remote already exists, use `git remote set-url origin ...`. Check `ssh -T git@github.com` if push fails. Never commit `go2rtc.yaml`, NVR credentials, or Cloudflare tokens.

## Security notes

- The UI's “Private network” label is descriptive, **not an authentication mechanism**.
- Nginx only exposes a narrow WebRTC signaling route; it does not provide user authentication.
- Keep go2rtc API `1984` bound to localhost and internal Docker network, not to public or broad VPN interfaces.
- Rotate the NVR password previously disclosed in terminal output, and update the protected go2rtc YAML accordingly.
