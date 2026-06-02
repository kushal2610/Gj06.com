"""
Run this ONCE to generate your VAPID keys for push notifications.
Copy the output into your .env file.

Usage:
    python generate_vapid.py
"""
from pywebpush import Vapid

v = Vapid()
v.generate_keys()

print("\n── VAPID Keys Generated ─────────────────────────")
print(f"VAPID_PUBLIC_KEY={v.public_key.public_bytes_raw().hex()}")
print(f"VAPID_PRIVATE_KEY={v.private_key.private_bytes_raw().hex()}")
print("\nCopy these into your .env file.")
print("Keep the private key secret — never commit it to Git.\n")