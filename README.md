# deadman

A Raspberry Pi-based remote PC power controller. Uses a GPIO-controlled relay to simulate motherboard power button presses, accessible via a clean web interface from anywhere on your Tailscale network.

## How it works

Three separate machines work together:

- **Server** — an always-on machine (e.g. a home server or NAS) that runs the Flask app and serves the web UI
- **Pi** — a Raspberry Pi Zero W that receives SSH commands from the server and triggers a relay wired to the gaming PC's motherboard power button header
- **Gaming PC** — the machine being controlled; its Tailscale IP is pinged by the server to report online status

All three are connected via Tailscale. The web UI is only accessible on the Tailscale network.

## Hardware

- Raspberry Pi Zero W
- 2-channel 5V relay module with optocoupler
- Jumper wires

## Stack

- **Pi**: Python + RPi.GPIO
- **Server**: Flask (runs on always-on machine)
- **Frontend**: Vanilla JS PWA

## Setup

### Pi

1. Flash Raspberry Pi OS Lite
2. Install Tailscale
3. Wire relay to GPIO17 (pin 11), 5V (pin 2), GND (pin 6)
4. Wire relay COM and NO to motherboard PWR SW header
5. Deploy `wake-pc.py` and `shutdown-pc.py`

### Server

1. Clone this repo
2. `sudo apt-get install python3-flask python3-yaml`
3. Copy and fill in `config.yaml` (see Configuration below)
4. Run with systemd

### iPhone

Add the web app URL to your home screen for a native app feel.

## Security

Access is restricted to Tailscale network only. No additional authentication required.

## Configuration

Copy the example config and fill in your values:
```bash
cp config.yaml.example config.yaml
```

Edit `config.yaml`:
```yaml
host: 100.x.x.x        # Tailscale IP of the server machine (run `tailscale ip`)
port: 5000
wakpi_user: pi          # SSH user on the Pi
wakpi_host: 100.x.x.x  # Tailscale IP of the Pi
gaming_pc_ip: 100.x.x.x  # Tailscale IP of the gaming PC (pinged for status)
pc_name: gaming pc
wake_command: "python3 ~/wake-pc.py"
shutdown_command: "python3 ~/shutdown-pc.py"
```

Each machine has a different Tailscale IP — run `tailscale ip` on each to find them.

`config.yaml` is gitignored and should never be committed.