"""Serve the static project page locally, with byte ranges for video seeking."""
from __future__ import annotations

import argparse
import os
import re
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import BinaryIO


class PreviewHandler(SimpleHTTPRequestHandler):
    """Single-range HTTP support, as used by native HTML video players."""

    range_remaining: int | None = None

    def end_headers(self) -> None:
        self.send_header("Accept-Ranges", "bytes")
        # Assets can be replaced during a local review without a stale cache.
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def send_head(self) -> BinaryIO | None:
        self.range_remaining = None
        path = Path(self.translate_path(self.path))
        requested = self.headers.get("Range")
        if not requested or not path.is_file():
            return super().send_head()
        match = re.fullmatch(r"bytes=(\d*)-(\d*)", requested)
        # Multiple/malformed ranges may be ignored with a normal 200 response.
        if not match or not any(match.groups()):
            return super().send_head()
        try:
            source = path.open("rb")
        except OSError:
            self.send_error(404, "File not found")
            return None
        stat = os.fstat(source.fileno())
        size = stat.st_size
        first, last = match.groups()
        if first:
            start = int(first)
            end = min(int(last), size - 1) if last else size - 1
        else:
            start = max(0, size - int(last))
            end = size - 1
        if start >= size or end < start:
            source.close()
            self.send_response(416)
            self.send_header("Content-Range", f"bytes */{size}")
            self.send_header("Content-Length", "0")
            self.end_headers()
            return None
        self.range_remaining = end - start + 1
        self.send_response(206)
        self.send_header("Content-Type", self.guess_type(str(path)))
        self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.send_header("Content-Length", str(self.range_remaining))
        self.send_header("Last-Modified", self.date_time_string(stat.st_mtime))
        self.end_headers()
        source.seek(start)
        return source

    def copyfile(self, source: BinaryIO, outputfile: BinaryIO) -> None:
        try:
            if self.range_remaining is None:
                super().copyfile(source, outputfile)
                return
            remaining = self.range_remaining
            while remaining:
                data = source.read(min(128 * 1024, remaining))
                if not data:
                    break
                outputfile.write(data)
                remaining -= len(data)
        except (BrokenPipeError, ConnectionResetError):
            # Native media players cancel obsolete requests when seeking.
            pass


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()
    directory = Path(__file__).resolve().parent
    handler = partial(PreviewHandler, directory=str(directory))
    with ThreadingHTTPServer(("127.0.0.1", args.port), handler) as server:
        print(f"DepthUMI local preview: http://127.0.0.1:{args.port}/", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()
