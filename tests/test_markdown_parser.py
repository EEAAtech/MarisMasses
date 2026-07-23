"""
Unit tests for the MassCast Markdown parser.
"""

import unittest

from presenter.markdown_parser import MarkdownParser


class MarkdownParserTests(unittest.TestCase):

    def setUp(self):
        self.parser = MarkdownParser()

    def test_empty_document(self):
        hymn = self.parser.parse_text("")

        self.assertEqual(hymn.title, "")
        self.assertEqual(hymn.slide_count(), 0)

    def test_title_only(self):

        hymn = self.parser.parse_text(
            "Amazing Grace"
        )

        self.assertEqual(
            hymn.title,
            "Amazing Grace"
        )

        self.assertEqual(
            hymn.slide_count(),
            0
        )

    def test_single_verse(self):

        markdown = """
Amazing Grace

Amazing grace how sweet the sound
That saved a wretch like me
"""

        hymn = self.parser.parse_text(markdown)

        self.assertEqual(hymn.title, "Amazing Grace")

        self.assertEqual(hymn.slide_count(), 1)

        self.assertEqual(
            hymn.slides[0].label,
            "1"
        )

        self.assertEqual(
            hymn.slides[0].kind,
            "verse"
        )

    def test_chorus_detection(self):

        markdown = """
My Hymn

Verse One

Ch: Praise the Lord

Verse Two
"""

        hymn = self.parser.parse_text(markdown)

        self.assertEqual(
            hymn.slide_count(),
            3
        )

        self.assertEqual(
            hymn.slides[0].label,
            "1"
        )

        self.assertEqual(
            hymn.slides[1].label,
            "Ch"
        )

        self.assertEqual(
            hymn.slides[2].label,
            "2"
        )

        self.assertEqual(
            hymn.slides[1].kind,
            "chorus"
        )

        self.assertEqual(
            hymn.slides[2].kind,
            "verse"
        )

    def test_chorus_text_prefix_removed(self):

        markdown = """
Title

CH: Sing to the Lord
"""

        hymn = self.parser.parse_text(markdown)

        self.assertEqual(
            hymn.slides[0].text,
            "Sing to the Lord"
        )

    def test_windows_line_endings(self):

        markdown = (
            "Title\r\n"
            "\r\n"
            "Verse One\r\n"
            "\r\n"
            "Verse Two"
        )

        hymn = self.parser.parse_text(markdown)

        self.assertEqual(
            hymn.slide_count(),
            2
        )

    def test_multiple_choruses(self):

        markdown = """
Title

Verse

Ch: Chorus

Verse

CH: Chorus Again
"""

        hymn = self.parser.parse_text(markdown)

        chorus_count = sum(
            1
            for slide in hymn.slides
            if slide.kind == "chorus"
        )

        self.assertEqual(
            chorus_count,
            2
        )

    def test_has_chorus(self):

        markdown = """
Title

Verse

Ch: Chorus
"""

        hymn = self.parser.parse_text(markdown)

        self.assertTrue(
            hymn.has_chorus()
        )


if __name__ == "__main__":
    unittest.main()