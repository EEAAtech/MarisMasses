"""
Loads the Mass sequence from sequence.json.

The sequence determines the order in which presentation items
(hymns, responses, etc.) are presented during Mass.
"""

import json

from presenter.config import PACKAGE_DIR


class SequenceRepository:
    """Loads and provides access to the presentation sequence."""

    def __init__(self):
        self._sequence_file = PACKAGE_DIR / "sequence.json"

    def load(self):
        """
        Load sequence.json.

        Returns a list of filenames.
        """

        with self._sequence_file.open(
            "r",
            encoding="utf-8"
        ) as fp:

            data = json.load(fp)

        return data["items"]


sequence_repository = SequenceRepository()