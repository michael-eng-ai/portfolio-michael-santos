"""Generate a SHA-256 password hash for DASHBOARD_PASSWORD_HASH env var.

Usage:
    python dashboard/generate_password_hash.py
"""

import getpass
import hashlib
import sys


def main() -> None:
    password = getpass.getpass("Enter dashboard password: ")
    confirm = getpass.getpass("Confirm password: ")

    if password != confirm:
        print("ERROR: passwords do not match", file=sys.stderr)
        sys.exit(1)

    if len(password) < 8:
        print("ERROR: password must be at least 8 characters", file=sys.stderr)
        sys.exit(1)

    password_hash = hashlib.sha256(password.encode()).hexdigest()
    print(f"\nAdd to .env.worker.local or environment:")
    print(f"DASHBOARD_PASSWORD_HASH={password_hash}")


if __name__ == "__main__":
    main()
