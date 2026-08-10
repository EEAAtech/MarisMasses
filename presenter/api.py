import base64
import json
import re
from datetime import datetime
from pathlib import Path

import httpx

from presenter.config import (
    PACKAGE_DIR,
    GITHUB_OWNER,
    GITHUB_REPO,
    GITHUB_BRANCH,
    GITHUB_PACKAGE_PATH,
    GITHUB_TOKEN
)
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from presenter.events import event_manager
from presenter.hymn_repository import hymn_repository
from presenter.state_manager import state_manager
from presenter.sequence_repository import sequence_repository

router = APIRouter(prefix="/api")


DEFAULT_HYMN = "go_tell_everyone.md"
SEQUENCE_FILENAME_PATTERN = re.compile(
    r"^seq(\d{4}-\d{2}-\d{2})_(\d{4})\.json$"
)

GITHUB_API_BASE = (
    f"https://api.github.com/repos/"
    f"{GITHUB_OWNER}/{GITHUB_REPO}"
)

#
# GitHub Helper functions
#
async def github_get(path: str):

    url = f"{GITHUB_API_BASE}/contents/{path}"

    headers = {
        "Accept": "application/vnd.github+json"
    }

    async with httpx.AsyncClient() as client:

        response = await client.get(
            url,
            headers=headers,
            params={
                "ref": GITHUB_BRANCH
            }
        )

    if response.status_code != 200:

        raise HTTPException(
            status_code=502,
            detail=(
                "GitHub request failed: "
                f"{response.status_code}"
            )
        )

    return response.json()


async def github_put(
    path: str,
    content: str,
    message: str
):

    if not GITHUB_TOKEN:

        raise HTTPException(
            status_code=500,
            detail=(
                "MASSCAST_GITHUB_TOKEN is not "
                "configured on the Pi."
            )
        )

    url = f"{GITHUB_API_BASE}/contents/{path}"

    encoded = base64.b64encode(
        content.encode("utf-8")
    ).decode("ascii")

    headers = {
        "Accept": "application/vnd.github+json",
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "Content-Type": "application/json"
    }

    body = {
        "message": message,
        "content": encoded,
        "branch": GITHUB_BRANCH
    }

    async with httpx.AsyncClient() as client:

        response = await client.put(
            url,
            headers=headers,
            json=body
        )

    if response.status_code not in (200, 201):

        raise HTTPException(
            status_code=502,
            detail=(
                "GitHub upload failed: "
                f"{response.status_code}"
            )
        )

    return response.json()


async def github_delete(
    path: str,
    sha: str,
    message: str
):

    if not GITHUB_TOKEN:

        raise HTTPException(
            status_code=500,
            detail=(
                "MASSCAST_GITHUB_TOKEN is not "
                "configured on the Pi."
            )
        )

    url = f"{GITHUB_API_BASE}/contents/{path}"

    headers = {
        "Accept": "application/vnd.github+json",
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "Content-Type": "application/json"
    }

    body = {
        "message": message,
        "sha": sha,
        "branch": GITHUB_BRANCH
    }

    async with httpx.AsyncClient() as client:

        response = await client.request(
            "DELETE",
            url,
            headers=headers,
            json=body
        )

    if response.status_code != 200:

        raise HTTPException(
            status_code=502,
            detail=(
                "GitHub delete failed: "
                f"{response.status_code}"
            )
        )

#
# API Endpoints
#

@router.get("/state")
async def get_state():
    return state_manager.get_state().to_dict()


@router.get("/slide")
async def get_slide():
    """
    Return the currently selected slide.
    """

    sequence = sequence_repository.load()

    if not sequence:

        raise HTTPException(
            status_code=404,
            detail="Sequence is empty."
        )

    state = state_manager.state

    if state.currentItemIndex >= len(sequence):
        state.currentItemIndex = len(sequence) - 1

    item = sequence[state.currentItemIndex]

    # Inline response
    if item["type"] == "response":

        # If we're between presentation items, show the holding image.
        if state.holdingScreen:

            return {

                "holding": True,

                "image": "/static/images/holding.jpg",

                "title": item["title"],

                "currentSlideIndex": 0,

                "slides": [
                    {
                        "label": "1",
                        "kind": "response"
                    }
                ]
            }

        # Otherwise display the response text.
        return {

            "holding": False,

            "title": item["title"],

            "currentSlideIndex": 0,

            "slides": [
                {
                    "label": "1",
                    "kind": "response"
                }
            ],

            "label": "1",

            "kind": "response",

            "text": item["text"],

            "slideCount": 1
        }

    # Markdown hymn
    filename = item["file"]

    hymn = hymn_repository.load(filename)

    if hymn.slide_count() == 0:

        raise HTTPException(
            status_code=500,
            detail="Hymn contains no slides."
        )

    if state.currentSlideIndex >= hymn.slide_count():
        state.currentSlideIndex = hymn.slide_count() - 1

    slide = hymn.slides[state.currentSlideIndex]


    # Even while the holding screen is displayed, return the
    # complete controller state so the controller can continue
    # to render the hymn title, verse buttons and active verse.
    if state.holdingScreen:
        return {

            "holding": True,

            "image": "/static/images/holding.jpg",

            "title": hymn.title,

            "currentSlideIndex": state.currentSlideIndex,

            "slides": [
                {
                    "label": s.label,
                    "kind": s.kind
                }
                for s in hymn.slides
            ]
        }

    return {
        "holding": False,
        "title": hymn.title,
        "currentSlideIndex": state.currentSlideIndex,
        "slides": [
        {
            "label": slide.label,
            "kind": slide.kind
        }
        for slide in hymn.slides
        ],
        "label": slide.label,
        "kind": slide.kind,
        "text": slide.text,
        "slideCount": hymn.slide_count()
        
    }

@router.post("/slide/{index}")
async def select_slide(index: int):
    """
    Select a slide directly.
    """

    item = sequence_repository.load()[
    state_manager.state.currentItemIndex
]

    # Responses have only one slide.
    if item["type"] == "response":

        state_manager.set_slide(0)

        await event_manager.broadcast()

        return state_manager.state.to_dict()

    hymn = hymn_repository.load(item["file"])

    if index < 0:
        index = 0

    if index >= hymn.slide_count():
        index = hymn.slide_count() - 1

    state_manager.set_slide(index)

    await event_manager.broadcast()

    return state_manager.state.to_dict()

@router.post("/next")
async def next_slide():

    state_manager.next_slide()

    await event_manager.broadcast()

    return state_manager.get_state().to_dict()


@router.post("/previous")
async def previous_slide():

    state_manager.previous_slide()

    await event_manager.broadcast()

    return state_manager.get_state().to_dict()

@router.post("/nextItem")
async def next_item():
    """
    Advance to the next hymn/response.
    """

    sequence = sequence_repository.load()

    state = state_manager.state

    if state.currentItemIndex < len(sequence) - 1:
        state_manager.next_item()

    await event_manager.broadcast()

    return state.to_dict()


@router.post("/previousItem")
async def previous_item():
    """
    Return to the previous hymn/response.
    """

    state_manager.previous_item()

    await event_manager.broadcast()

    return state_manager.state.to_dict()

@router.get("/events")
async def events():

    async def stream():

        async for message in event_manager.subscribe():
            yield f"data: {message}\n\n"

    return StreamingResponse(
        stream(),
        media_type="text/event-stream"
    )

@router.post("/holding")
async def holding():

    state_manager.show_holding()

    await event_manager.broadcast()

    return state_manager.state.to_dict()

@router.post("/hideHolding")
async def hide_holding():

    state_manager.hide_holding()

    await event_manager.broadcast()

    return state_manager.state.to_dict()

@router.post("/download")
async def download_package():

    #
    # 1. Get the current Pi time.
    #
    now = datetime.now()

    #
    # 2. Ask GitHub for the package directory.
    #
    package_files = await github_get(
        GITHUB_PACKAGE_PATH
    )

    sequence_files = []

    for file in package_files:

        name = file.get("name", "")

        match = SEQUENCE_FILENAME_PATTERN.match(
            name
        )

        if not match:
            continue

        date_part = match.group(1)
        time_part = match.group(2)

        mass_datetime = datetime.strptime(
            f"{date_part}_{time_part}",
            "%Y-%m-%d_%H%M"
        )

        sequence_files.append(
            {
                "name": name,
                "path": file["path"],
                "sha": file["sha"],
                "datetime": mass_datetime
            }
        )

    #
    # 3. Find expired packages.
    #
    expired = [

        item

        for item in sequence_files

        if item["datetime"] < now

    ]

    #
    # 4. Move expired packages into Archive.
    #
    for item in expired:

        archive_path = (
            f"{GITHUB_PACKAGE_PATH}/Archive/"
            f"{item['name']}"
        )

        file_data = await github_get(
            item["path"]
        )

        content = base64.b64decode(
            file_data["content"]
                .replace("\n", "")
        ).decode("utf-8")

        await github_put(

            archive_path,

            content,

            f"Archive expired package {item['name']}"

        )

        await github_delete(

            item["path"],

            item["sha"],

            f"Archive expired package {item['name']}"

        )

    #
    # 5. Keep only packages that are still in the future.
    #
    future = [

        item

        for item in sequence_files

        if item["datetime"] >= now

    ]

    if not future:

        raise HTTPException(

            status_code=404,

            detail=(
                "No future Mass package is "
                "available on GitHub."
            )

        )

    #
    # 6. Select the nearest future Mass.
    #
    selected = min(

        future,

        key=lambda item:
            item["datetime"]

    )

    #
    # 7. Download the selected JSON.
    #
    package_data = await github_get(
        selected["path"]
    )

    package_json = base64.b64decode(

        package_data["content"]
            .replace("\n", "")

    ).decode("utf-8")

    package = json.loads(package_json)

    #
    # 8. Install OtherHymns embedded in the package.
    #
    items_dir = PACKAGE_DIR / "items"

    items_dir.mkdir(
        parents=True,
        exist_ok=True
    )

    for item in package["items"]:

        if item.get("type") != "hymn":
            continue

        if item.get("folder") != "OtherHymns":
            continue

        lyrics = item.get("lyrics")

        if lyrics is None:
            raise HTTPException(

                status_code=500,

                detail=(
                    f"OtherHymns item "
                    f"{item['file']} has no lyrics."
                )

            )

        hymn_path = (
            items_dir /
            item["file"]
        )

        hymn_path.write_text(
            lyrics,
            encoding="utf-8"
        )

    #
    # 9. Install sequence.json locally.
    #
    sequence_path = (
        PACKAGE_DIR / "sequence.json"
    )

    sequence_path.write_text(

        json.dumps(
            package,
            indent=4,
            ensure_ascii=False
        ),

        encoding="utf-8"

    )

    #
    # 10. Reset presentation state.
    #
    state_manager.state.currentItemIndex = 0
    state_manager.state.currentSlideIndex = 0
    state_manager.state.holdingScreen = True

    await event_manager.broadcast()

    return {

        "success": True,

        "package": selected["name"],

        "massDate":
            package.get("massDate"),

        "massTime":
            package.get("massTime"),

        "archived":
            [
                item["name"]
                for item in expired
            ]

    }