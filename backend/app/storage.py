"""Storage adapter. Local-disk impl now; S3/R2 swaps in behind the same Protocol later."""

import os
from pathlib import Path
from typing import BinaryIO, Protocol

from app.config import get_settings

settings = get_settings()


class StorageAdapter(Protocol):
    def put(self, key: str, data: bytes) -> None: ...
    def open(self, key: str) -> BinaryIO: ...
    def exists(self, key: str) -> bool: ...


class LocalStorage:
    def __init__(self, root: str) -> None:
        self.root = Path(root)
        self.root.mkdir(parents=True, exist_ok=True)

    def _path(self, key: str) -> Path:
        return self.root / key

    def put(self, key: str, data: bytes) -> None:
        p = self._path(key)
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_bytes(data)

    def open(self, key: str) -> BinaryIO:
        return open(self._path(key), "rb")

    def exists(self, key: str) -> bool:
        return self._path(key).exists()


def get_storage() -> StorageAdapter:
    if settings.storage_backend == "local":
        return LocalStorage(settings.local_storage_dir)
    raise NotImplementedError(
        f"Storage backend '{settings.storage_backend}' not implemented yet (Phase 0 = local)."
    )
