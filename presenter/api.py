from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from presenter.events import event_manager
from presenter.hymn_repository import hymn_repository
from presenter.state_manager import state_manager

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

    hymn = hymn_repository.load(DEFAULT_HYMN)

    index = state_manager.state.currentSlideIndex

    if index >= hymn.slide_count():
        index = hymn.slide_count() - 1
        state_manager.state.currentSlideIndex = index

    if index < 0:
        index = 0

    slide = hymn.slides[index]

    return {
        "title": hymn.title,
        "label": slide.label,
        "kind": slide.kind,
        "text": slide.text
    }


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


@router.get("/events")
async def events():

    async def stream():

        async for message in event_manager.subscribe():
            yield f"data: {message}\n\n"

    return StreamingResponse(
        stream(),
        media_type="text/event-stream"
    )