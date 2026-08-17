import socket
import os
from config import OFFICE_SUBNET


def get_effective_office_subnet(server_ip: str | None) -> str:
    """OFFICE_SUBNET env var wins; otherwise the server's own subnet IS the
    office subnet (the server PC sits in the office). Fixes the hardcoded
    192.168.29 default that blocked every other network."""
    if os.environ.get("OFFICE_SUBNET"):
        return OFFICE_SUBNET
    if server_ip:
        return ".".join(server_ip.split(".")[:3])
    return OFFICE_SUBNET


def get_server_local_ip() -> str | None:
    """Detect the server (office PC) local IP address."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return None


def is_office_ip(client_ip: str) -> tuple[bool, str]:
    """
    Two-layer check to verify the client is on the office WiFi.

    Layer 1 — Localhost (127.0.0.1):
        Requests from the server PC itself are allowed only when
        the server is already on the office WiFi subnet.

    Layer 2 — Subnet check:
        Any other device must share the same subnet as the server.
        Devices on home or external networks are blocked.
    """

    server_ip = get_server_local_ip()
    if not server_ip:
        return False, "Server IP could not be detected. Please contact the admin."

    server_subnet = ".".join(server_ip.split(".")[:3])
    office_subnet = get_effective_office_subnet(server_ip)

    # ── Layer 1: Localhost = server PC browser ────────────────
    if not client_ip or client_ip in ("127.0.0.1", "::1"):
        if server_subnet == office_subnet:
            return True, f"Server PC verified (Office IP: {server_ip})"
        else:
            return False, f"Server is not on the office WiFi ({server_ip}). Please connect to the office WiFi."

    # ── Layer 2: Other device subnet check ───────────────────
    if server_subnet != office_subnet:
        return False, f"Server is not on the office WiFi ({server_ip})."

    client_subnet = ".".join(client_ip.split(".")[:3])
    if client_subnet != office_subnet:
        return False, f"Device is not connected to the office WiFi ({client_ip})."

    return True, f"Office WiFi verified | Server: {server_ip} | Device: {client_ip}"


def get_client_real_ip(request) -> str:
    """Extract the real client IP from the request headers."""
    forwarded = request.headers.get("X-Forwarded-For", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    real = request.headers.get("X-Real-IP", "")
    if real:
        return real.strip()
    return request.remote_addr or ""
