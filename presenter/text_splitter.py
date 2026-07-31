"""
Utility functions for splitting long hymn slides into
multiple presentation slides while preserving lyric lines.

The splitter tries to:
1. Keep complete lyric lines together.
2. Balance the resulting parts.
3. Only split a lyric line if it is itself too long.
"""

from presenter.models import Slide


# Approximate maximum characters that comfortably fit on one slide.
# This can be tuned later after testing on the TV.
MAX_CHARS_PER_SLIDE = 180


def split_slide(slide: Slide) -> list[Slide]:
    """
    Split a Slide into one or more Slides.

    Short slides are returned unchanged.

    Long slides are split at lyric line boundaries whenever possible.
    """

    # Remove blank lines while preserving order.
    lines = [line.strip() for line in slide.text.splitlines() if line.strip()]

    if not lines:
        return [slide]

    groups = _balance_lines(lines)

    # Only one group means no split required.
    if len(groups) == 1:
        return [slide]

    suffixes = "abcdefghijklmnopqrstuvwxyz"

    result = []

    for i, group in enumerate(groups):

        result.append(
            Slide(
                label=f"{slide.label}{suffixes[i]}",
                kind=slide.kind,
                text="\n".join(group)
            )
        )

    return result


def _balance_lines(lines: list[str]) -> list[list[str]]:
    """
    Split lyric lines into balanced groups.

    We never deliberately create a tiny final group if it can
    be redistributed into earlier groups.
    """

    groups = []
    current = []
    current_chars = 0

    for line in lines:

        length = len(line)

        # Fits comfortably in current group.
        if current and current_chars + length <= MAX_CHARS_PER_SLIDE:

            current.append(line)
            current_chars += length
            continue

        # Start a new group.
        if current:
            groups.append(current)

        current = [line]
        current_chars = length

    if current:
        groups.append(current)

    # Balance very small final groups.
    if len(groups) >= 2:

        last = groups[-1]
        previous = groups[-2]

        while (
            len(last) < len(previous) - 1
            and len(previous) > 2
        ):
            last.insert(0, previous.pop())

    return groups