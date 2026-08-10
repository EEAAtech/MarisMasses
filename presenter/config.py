import os
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent

STATIC_DIR = PROJECT_ROOT / "static"

PACKAGE_DIR = PROJECT_ROOT / "package"

STATE_DIR = PROJECT_ROOT / "state"

LOG_DIR = PROJECT_ROOT / "logs"


# GitHub repository containing the Controller/Presenter applications.
# These values are safe to keep in the public repository.
GITHUB_OWNER = "EEAAtech"
GITHUB_REPO = "MarisMasses"
GITHUB_BRANCH = "main"

GITHUB_PACKAGE_PATH = "package"

# GitHub token used only for archiving old package files.
# Set this as an environment variable on the Raspberry Pi.
GITHUB_TOKEN = os.environ.get("MASSCAST_GITHUB_TOKEN")