"""Run the website and a temporary public Cloudflare tunnel without a database."""
import argparse
import os
from pathlib import Path
import queue
import re
import secrets
import socket
import subprocess
import sys
import threading
import time

ROOT = Path(__file__).resolve().parent
RUNTIME = ROOT / '.hosting'
RUNTIME.mkdir(exist_ok=True)
STOP = RUNTIME / 'stop'
URL_FILE = ROOT / 'public-url.txt'


def tunnel_failure():
    log_path = RUNTIME / 'tunnel.log'
    details = log_path.read_text(encoding='utf-8', errors='replace') if log_path.exists() else ''
    if 'failed to request quick Tunnel' in details and (
        'context deadline exceeded' in details or 'timeout' in details.lower()
    ):
        return ('Cloudflare did not respond while creating the HTTPS address '
                '(api.trycloudflare.com timed out). Retry the launch; if it repeats, '
                'check your connection, proxy/VPN, or try another network. '
                'See .hosting/tunnel.log.')
    errors = [line.strip() for line in details.splitlines()
              if 'failed' in line.lower() or ' ERR ' in line]
    return ('Tunnel exited. ' + (errors[-1] + ' ' if errors else '')
            + 'See .hosting/tunnel.log.')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--stop', action='store_true')
    args = parser.parse_args()
    if args.stop:
        STOP.touch()
        print('Stop requested. The server and tunnel will close within a few seconds.', flush=True)
        return

    import msvcrt
    lock = (RUNTIME / 'lock').open('a+b')
    lock.seek(0)
    try:
        msvcrt.locking(lock.fileno(), msvcrt.LK_NBLCK, 1)
    except OSError:
        raise SystemExit('Hosting is already running. See public-url.txt.')
    STOP.unlink(missing_ok=True)
    URL_FILE.unlink(missing_ok=True)
    cloudflared = ROOT / 'tools' / 'cloudflared.exe'
    if not cloudflared.is_file():
        raise SystemExit('Missing tools/cloudflared.exe. See README.md.')

    # Reserve a free loopback port for this hosting session.
    with socket.socket() as probe:
        probe.bind(('127.0.0.1', 0))
        port = probe.getsockname()[1]
    env = os.environ.copy()
    env['DJANGO_DEBUG'] = 'false'
    env['DJANGO_SECRET_KEY'] = secrets.token_urlsafe(64)
    env['PYTHONUNBUFFERED'] = '1'
    subprocess.run([sys.executable, 'manage.py', 'collectstatic', '--noinput'], cwd=ROOT, env=env, check=True)
    processes = []
    output = queue.Queue()
    creationflags = subprocess.CREATE_NO_WINDOW
    try:
        tunnel = subprocess.Popen(
            [str(cloudflared), 'tunnel', '--protocol', 'http2', '--url', f'http://127.0.0.1:{port}'],
            cwd=ROOT, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
            text=True, encoding='utf-8', errors='replace', creationflags=creationflags,
        )
        processes.append(tunnel)

        def read_tunnel():
            with (RUNTIME / 'tunnel.log').open('w', encoding='utf-8') as log:
                for line in tunnel.stdout:
                    log.write(line)
                    log.flush()
                    match = re.search(r'https://[a-z0-9-]+\.trycloudflare\.com', line)
                    if match and match.group() != 'https://api.trycloudflare.com':
                        output.put(match.group())

        reader = threading.Thread(target=read_tunnel, daemon=True)
        reader.start()
        print('Creating temporary HTTPS address...', flush=True)
        deadline = time.monotonic() + 90
        address = None
        while time.monotonic() < deadline and not STOP.exists():
            if tunnel.poll() is not None:
                reader.join(timeout=2)
                raise RuntimeError(tunnel_failure())
            try:
                address = output.get(timeout=1)
                break
            except queue.Empty:
                pass
        if not address:
            raise RuntimeError('No public URL received. See .hosting/tunnel.log.')
        env['DJANGO_ALLOWED_HOSTS'] = 'localhost,127.0.0.1,' + address.removeprefix('https://')
        server = subprocess.Popen(
            [sys.executable, '-m', 'waitress', f'--listen=127.0.0.1:{port}', '--url-scheme=https', 'config.wsgi:application'],
            cwd=ROOT, env=env, creationflags=creationflags,
        )
        processes.append(server)
        for _ in range(100):
            if server.poll() is not None:
                raise RuntimeError('Website server exited.')
            try:
                with socket.create_connection(('127.0.0.1', port), timeout=.2):
                    break
            except OSError:
                time.sleep(.1)
        else:
            raise RuntimeError('Website server did not start.')
        URL_FILE.write_text(address + '\n', encoding='utf-8')
        print(f'Website: {address}', flush=True)
        print('Keep the laptop awake and online. Ctrl+C stops hosting.', flush=True)
        while not STOP.exists():
            if any(p.poll() is not None for p in processes):
                raise RuntimeError('A hosting process stopped. Restart host_public.py.')
            time.sleep(1)
    except KeyboardInterrupt:
        pass
    finally:
        for process in reversed(processes):
            if process.poll() is None:
                process.terminate()
                try:
                    process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    process.kill()
                    process.wait()
        URL_FILE.unlink(missing_ok=True)
        STOP.unlink(missing_ok=True)
        lock.close()
        print('Hosting stopped.', flush=True)


if __name__ == '__main__':
    try:
        main()
    except (RuntimeError, subprocess.CalledProcessError) as exc:
        print(f'Hosting could not start: {exc}', file=sys.stderr, flush=True)
        sys.exit(1)
