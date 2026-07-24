"""
Loads hymns from the package directory.

For now this repository loads a hymn on demand.
Later it will be extended to load the complete Mass package.
"""

from pathlib import Path

from presenter.config import PACKAGE_DIR
from presenter.markdown_parser import MarkdownParser
from presenter.models import Hymn


class HymnRepository:
    """Provides access to hymn markdown files."""

    def __init__(self):
        self._parser = MarkdownParser()
        self._items_dir = PACKAGE_DIR / "items"

    def load(self, filename: str) -> Hymn:
        """
        Load and parse a hymn.

        Raises FileNotFoundError if the file does not exist.
        """

        path = self._items_dir / filename

        return self._parser.parse(path)


hymn_repository = HymnRepository()