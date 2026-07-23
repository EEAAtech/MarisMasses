from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from presenter.state_manager import state_manager
from presenter.events import event_manager

router = APIRouter(prefix="/api")


@router.get("/state")
async def get_state():

    return state_manager.get_state().to_dict()


@router.post("/next")
async def next_slide():

    state_manager.next_slide()

    # Notify every connected TV that the presentation state changed.
    await event_manager.broadcast()

    return state_manager.get_state().to_dict()


@router.post("/previous")
async def previous_slide():

    state_manager.previous_slide()

    # Notify every connected TV that the presentation state changed.
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