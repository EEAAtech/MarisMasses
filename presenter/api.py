from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from presenter.events import event_manager
from presenter.hymn_repository import hymn_repository
from presenter.state_manager import state_manager
from presenter.sequence_repository import sequence_repository

router = APIRouter(prefix="/api")


DEFAULT_HYMN = "go_tell_everyone.md"


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