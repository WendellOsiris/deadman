from flask import Flask, jsonify, render_template
import subprocess
import yaml
import os

app = Flask(__name__)

config_path = os.path.join(os.path.dirname(__file__), '..', 'config.yaml')
with open(config_path) as f:
    config = yaml.safe_load(f)

WAKPI_USER = config['wakpi_user']
WAKPI_HOST = config['wakpi_host']
GAMING_PC_IP = config['gaming_pc_ip']
WAKE_COMMAND = config['wake_command']
SHUTDOWN_COMMAND = config['shutdown_command']
PC_NAME = config.get('pc_name', 'gaming pc')
PORT = config.get('port', 5000)


def ssh_wakpi(command):
    result = subprocess.run(
        ['ssh', '-o', 'StrictHostKeyChecking=no', f'{WAKPI_USER}@{WAKPI_HOST}', command],
        capture_output=True,
        timeout=10
    )
    return result.returncode == 0


def ping_pc():
    result = subprocess.run(
        ['ping', '-c', '1', '-W', '1', GAMING_PC_IP],
        capture_output=True
    )
    return result.returncode == 0


@app.route('/')
def index():
    return render_template('index.html', pc_name=PC_NAME)


@app.route('/api/status')
def status():
    return jsonify({'online': ping_pc()})


@app.route('/api/wake', methods=['POST'])
def wake():
    ok = ssh_wakpi(WAKE_COMMAND)
    return jsonify({'ok': ok, 'error': None if ok else 'ssh failed'})


@app.route('/api/shutdown', methods=['POST'])
def shutdown():
    ok = ssh_wakpi(SHUTDOWN_COMMAND)
    return jsonify({'ok': ok, 'error': None if ok else 'ssh failed'})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=PORT)