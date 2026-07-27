"""
Maintains the current runtime presentation state.
"""

from presenter.models import PresenterState


class StateManager:
    """
   Stores the current presenter state.

    There is exactly one StateManager shared by all
    connected browsers.
    """

    def __init__(self):

        self._state = PresenterState()

    @property
    def state(self):
        return self._state

    def get_state(self):
        return self._state

    def set_slide(self, index: int):
        """
        Select the requested slide.
        """

        self._state.currentSlideIndex = index

    def next_item(self):

        self._state.currentItemIndex += 1
        self._state.currentSlideIndex = 0

    def previous_item(self):

        if self._state.currentItemIndex > 0:
            self._state.currentItemIndex -= 1

        self._state.currentSlideIndex = 0


state_manager = StateManager()