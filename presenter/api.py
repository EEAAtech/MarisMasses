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

    filename = sequence[state.currentItemIndex]

    hymn = hymn_repository.load(filename)

    if hymn.slide_count() == 0:

        raise HTTPException(
            status_code=500,
            detail="Hymn contains no slides."
        )

    if state.currentSlideIndex >= hymn.slide_count():
        state.currentSlideIndex = hymn.slide_count() - 1

    slide = hymn.slides[state.currentSlideIndex]

    return {
        "title": hymn.title,
        "label": slide.label,
        "kind": slide.kind,
        "text": slide.text,
        "slideCount": hymn.slide_count()
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