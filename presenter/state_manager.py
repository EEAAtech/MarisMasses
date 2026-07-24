"""
Maintains the current runtime presentation state.
"""

from presenter.models import PresenterState


class StateManager:

    def __init__(self):

        self._state = PresenterState()

    @property
    def state(self):
        return self._state

    def get_state(self):
        return self._state

    def next_slide(self):

        self._state.currentSlideIndex += 1

    def previous_slide(self):

        if self._state.currentSlideIndex > 0:
            self._state.currentSlideIndex -= 1

    def reset_slide(self):

        self._state.currentSlideIndex = 0


state_manager = StateManager()