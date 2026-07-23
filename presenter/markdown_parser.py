"""
Markdown parser for MassCast.

Rules:

1. First paragraph = hymn title
2. Remaining paragraphs = slides
3. Paragraph beginning with "Ch:" (case-insensitive)
   becomes a chorus.
4. Everything else becomes a verse.

The parser deliberately supports the existing hymn library
without requiring any changes.
"""

from pathlib import Path
import re

from presenter.models import Hymn
from presenter.models import Slide


class MarkdownParser:
    """
    Parses a Markdown hymn into a Hymn object.
    """

    # Matches:
    #
    # Ch:
    # CH:
    # Ch :
    # CH :
    #
    CHORUS_PATTERN = re.compile(
        r"^\s*ch\s*:",
        re.IGNORECASE
    )

    def parse(self, filename: Path) -> Hymn:
        """
        Parse a markdown hymn file.
        """

        text = filename.read_text(
            encoding="utf-8"
        )

        return self.parse_text(text)

    def parse_text(self, text: str) -> Hymn:
        """
        Parse markdown supplied as a string.

        This method is used by both the application
        and the unit tests.
        """

        # Support Windows line endings.
        text = text.replace("\r\n", "\n")

        # Split into paragraphs.
        paragraphs = [

            p.strip()

            for p in text.split("\n\n")

            if p.strip()

        ]

        if not paragraphs:
            return Hymn(
                title="",
                slides=[]
            )

        title = paragraphs[0]

        hymn = Hymn(title=title)

        verse_number = 1

        for paragraph in paragraphs[1:]:

            if self.CHORUS_PATTERN.match(paragraph):

                cleaned = self.CHORUS_PATTERN.sub(
                    "",
                    paragraph,
                    count=1
                ).strip()

                hymn.slides.append(

                    Slide(
                        label="Ch",
                        kind="chorus",
                        text=cleaned
                    )

                )

            else:

                hymn.slides.append(

                    Slide(
                        label=str(verse_number),
                        kind="verse",
                        text=paragraph
                    )

                )

                verse_number += 1

        return hymn