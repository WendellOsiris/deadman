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
