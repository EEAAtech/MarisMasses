from presenter.models import PresenterState


class StateManager:

    def __init__(self):

        self._state = PresenterState()

    def get_state(self):

        return self._state

    def next_slide(self):

        self._state.currentSlideIndex += 1

    def previous_slide(self):

        if self._state.currentSlideIndex > 0:
            self._state.currentSlideIndex -= 1


state_manager = StateManager()