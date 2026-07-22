from fastapi import APIRouter

from presenter.state_manager import state_manager

router = APIRouter(prefix="/api")


@router.get("/state")
async def get_state():

    return state_manager.get_state().to_dict()


@router.post("/next")
async def next_slide():

    state_manager.next_slide()

    return state_manager.get_state().to_dict()


@router.post("/previous")
async def previous_slide():

    state_manager.previous_slide()

    return state_manager.get_state().to_dict()