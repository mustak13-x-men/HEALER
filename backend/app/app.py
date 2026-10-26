import os
import sys

# Ensure backend root is on sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_root = os.path.dirname(current_dir)
if backend_root not in sys.path:
    sys.path.insert(0, backend_root)

# If this module was imported as 'app', mark it as a package so 'app.xxx' imports succeed
mod = sys.modules[__name__]
if not hasattr(mod, "__path__"):
    mod.__path__ = [current_dir]

from app.main import app
