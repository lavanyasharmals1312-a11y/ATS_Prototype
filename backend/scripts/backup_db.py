#!/usr/bin/env python3
"""
Database backup script.
Usage: python scripts/backup_db.py
Creates: backups/proex_ats_YYYYMMDD_HHMMSS.sql

Run manually or add to cron:
  0 2 * * * cd /path/to/backend && python scripts/backup_db.py
"""
import os
import sys
import subprocess
from datetime import datetime
from pathlib import Path

# Add backend to path so we can import settings
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.config import settings


def backup():
    # Create backups directory
    backup_dir = Path(__file__).parent.parent / "backups"
    backup_dir.mkdir(exist_ok=True)

    # Generate timestamped filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = backup_dir / f"proex_ats_{timestamp}.sql"

    # Parse DATABASE_URL to get pg_dump args
    # postgresql+asyncpg://user:pass@host:port/dbname
    url = settings.database_url.replace("postgresql+asyncpg://", "")
    user_pass, host_db = url.split("@")
    user, password = user_pass.split(":")
    host_port, dbname = host_db.split("/")

    if ":" in host_port:
        host, port = host_port.split(":")
    else:
        host, port = host_port, "5432"

    env = os.environ.copy()
    env["PGPASSWORD"] = password

    cmd = [
        "pg_dump",
        "-h", host,
        "-p", port,
        "-U", user,
        "-d", dbname,
        "-f", str(backup_file),
        "--no-password",
        "--verbose",
    ]

    print(f"Backing up to: {backup_file}")
    result = subprocess.run(cmd, env=env, capture_output=True, text=True)

    if result.returncode == 0:
        size_mb = backup_file.stat().st_size / 1024 / 1024
        print(f"Backup complete: {backup_file.name} ({size_mb:.2f} MB)")
        _clean_old_backups(backup_dir, keep=7)
    else:
        print(f"Backup failed: {result.stderr}")
        sys.exit(1)


def _clean_old_backups(backup_dir: Path, keep: int = 7):
    """Keep only the most recent N backups."""
    backups = sorted(backup_dir.glob("*.sql"), key=lambda f: f.stat().st_mtime)
    for old in backups[:-keep]:
        old.unlink()
        print(f"Removed old backup: {old.name}")


if __name__ == "__main__":
    backup()