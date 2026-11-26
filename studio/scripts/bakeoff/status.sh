#!/usr/bin/env bash
# Thin wrapper: see run_tools.py in this folder.
exec python3 "$(dirname "$(readlink -f "$0")")/run_tools.py" status "$@"
