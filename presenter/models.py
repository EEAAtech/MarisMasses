"""
Core domain models used by MassCast.

This module contains:
    - PresenterState : Current runtime presentation state.
    - Slide          : One paragraph that can be projected.
    - Hymn           : One parsed markdown hymn.
"""

from dataclasses import dataclass, asdict, field
from typing import List


@dataclass
class PresenterState:
    """
    Current runtime state of the presenter.

    There is exactly one PresenterState instance shared by all
    connected clients.
    """

    currentItemId: str = ""
    currentSlideIndex: int = 0
    fontSize: int = 75

    def to_dict(self):
        """Return the state as a serializable dictionary."""
        return asdict(self)


@dataclass
class Slide:
    """
    Represents one projected paragraph.

    label:
        Button text displayed on the controller.
        Example: "1", "2", "Ch"

    kind:
        "verse" or "chorus"

    text:
        Text projected on the TV.
    """

    label: str
    kind: str
    text: str


@dataclass
class Hymn:
    """
    Represents one parsed hymn.
    """

    title: str
    slides: List[Slide] = field(default_factory=list)

    def slide_count(self) -> int:
        """Return the number of slides."""
        return len(self.slides)

    def has_chorus(self) -> bool:
        """Return True if the hymn contains a chorus."""
        return any(slide.kind == "chorus" for slide in self.slides)