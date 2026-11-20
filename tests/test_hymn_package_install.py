"""
Unit tests for hymn file installation during a package download.

When a package is downloaded, hymn files in the package folder on GitHub
(files named ``hymn_[Folder]_[hymn name].json``) are turned into markdown
files in ``package/items/OtherHymns``, the local hymn json copy is deleted,
and the original file on GitHub is moved to ``package/Hymn_Archive``
(versioned if it already exists there).
"""

import base64
import json
import shutil
import tempfile
import unittest
from pathlib import Path

from fastapi import HTTPException

import presenter.api as api
from presenter.api import download_package


def _b64(text: str) -> str:
    """Base64-encode a string the way the GitHub Content API does."""
    return base64.b64encode(text.encode("utf-8")).decode("ascii")


class HymnPackageInstallTests(unittest.IsolatedAsyncioTestCase):

    async def asyncSetUp(self):

        self.tempdir = Path(
            tempfile.mkdtemp(prefix="marismasses_hymn_test_")
        )
        self._orig_package_dir = api.PACKAGE_DIR
        api.PACKAGE_DIR = self.tempdir

        self.put_calls = []
        self.delete_calls = []
        self.file_exists_returns = {}

        async def fake_github_get(path):

            if path == "package":

                return [

                    {
                        "name": "seq2030-01-01_1200.json",
                        "path": "package/seq2030-01-01_1200.json",
                        "sha": "seqsha",
                    },

                    {
                        "name": "hymn_OtherHymns_test_hymn.json",
                        "path": "package/hymn_OtherHymns_test_hymn.json",
                        "sha": "hymnsha",
                    },

                ]

            if path == "package/seq2030-01-01_1200.json":

                package = {

                    "massDate": "2030-01-01",

                    "massTime": "12:00",

                    "items": [],

                }

                return {"content": _b64(json.dumps(package))}

            if path == "package/hymn_OtherHymns_test_hymn.json":

                hymn = {

                    "type": "hymn",

                    "folder": "OtherHymns",

                    "file": "test_hymn.md",

                    "lyrics": "Line one\nLine two\n\nLine three",

                }

                return {"content": _b64(json.dumps(hymn))}

            raise HTTPException(

                status_code=502,

                detail=f"unexpected github_get path {path}",

            )

        async def fake_github_put(path, content, message, is_base64=False):

            self.put_calls.append((path, content, message))

        async def fake_github_delete(path, sha, message):

            self.delete_calls.append((path, sha, message))

        async def fake_github_file_exists(path):

            return self.file_exists_returns.get(path, False)

        api.github_get = fake_github_get
        api.github_put = fake_github_put
        api.github_delete = fake_github_delete
        api.github_file_exists = fake_github_file_exists

    async def asyncTearDown(self):

        api.PACKAGE_DIR = self._orig_package_dir

        shutil.rmtree(self.tempdir, ignore_errors=True)

    async def test_hymn_installed_to_otherhymns(self):

        # Pre-create a stale .md to confirm it gets overwritten.
        otherhymns = self.tempdir / "items" / "OtherHymns"

        otherhymns.mkdir(parents=True, exist_ok=True)

        (otherhymns / "test_hymn.md").write_text(
            "STALE CONTENT", encoding="utf-8"
        )

        # Pre-create a local hymn json copy to confirm it gets deleted.
        (self.tempdir / "hymn_OtherHymns_test_hymn.json").write_text(
            '{"type": "hymn"}', encoding="utf-8"
        )

        result = await download_package()

        self.assertTrue(result["success"])

        md_path = otherhymns / "test_hymn.md"

        self.assertTrue(md_path.exists())

        # The lyrics node content is stored with real newlines
        # (literal \\n sequences converted), on multiple lines.
        self.assertEqual(
            md_path.read_text(encoding="utf-8"),
            "Line one\nLine two\n\nLine three",
        )

        # The local hymn json file is deleted after processing.
        self.assertFalse(
            (self.tempdir / "hymn_OtherHymns_test_hymn.json").exists()
        )

        # The hymn json on GitHub is moved to Hymn_Archive and the
        # original is deleted.
        self.assertTrue(
            any(
                call[0]
                == "package/Hymn_Archive/hymn_OtherHymns_test_hymn.json"
                for call in self.put_calls
            )
        )

        self.assertTrue(
            any(
                call[0] == "package/hymn_OtherHymns_test_hymn.json"
                and call[1] == "hymnsha"
                for call in self.delete_calls
            )
        )

    async def test_hymn_archive_is_versioned_when_it_exists(self):

        # An archived file with the same name already exists, so the
        # new one must be saved as a new version (_v2).
        self.file_exists_returns = {

            "package/Hymn_Archive/hymn_OtherHymns_test_hymn.json": True,

            "package/Hymn_Archive/hymn_OtherHymns_test_hymn_v2.json": False,

        }

        await download_package()

        self.assertTrue(
            any(
                call[0]
                == "package/Hymn_Archive/hymn_OtherHymns_test_hymn_v2.json"
                for call in self.put_calls
            )
        )

        self.assertFalse(
            any(
                call[0]
                == "package/Hymn_Archive/hymn_OtherHymns_test_hymn.json"
                for call in self.put_calls
            )
        )


if __name__ == "__main__":

    unittest.main()
