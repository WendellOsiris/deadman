# deadman

A Raspberry Pi-based remote PC power controller. Uses a GPIO-controlled relay to simulate motherboard power button presses, accessible via a clean web interface from anywhere on your Tailscale network.

## How it works

A Raspberry Pi Zero W sits inside your PC case wired to the motherboard's PWR SW header via a relay board. A Flask server on an always-on machine exposes a simple API. The web frontend lets you wake or hard-shutdown your PC from your phone.

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
2. `pip3 install flask --break-system-packages`
3. Configure `WAKPI_HOST` and `GAMING_PC_IP` in `app.py`
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
wakpi_user: your_pi_username
wakpi_host: your_pi_hostname_or_tailscale_name
gaming_pc_ip: your_gaming_pc_local_ip
wake_command: "python3 ~/wake-pc.py"
shutdown_command: "python3 ~/shutdown-pc.py"
port: 5000
```

`config.yaml` is gitignored and should never be committed.