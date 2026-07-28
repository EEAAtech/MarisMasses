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

    def set_slide(self, index: int):

        self._state.currentSlideIndex = index

    def show_holding(self):

        self._state.holdingScreen = True

    def hide_holding(self):

        self._state.holdingScreen = False

    def next_item(self):

        self._state.currentItemIndex += 1
        self._state.currentSlideIndex = 0
        self._state.holdingScreen = False

    def previous_item(self):

        if self._state.currentItemIndex > 0:
            self._state.currentItemIndex -= 1

        self._state.currentSlideIndex = 0
        self._state.holdingScreen = False

    def is_holding(self):
        """
        True if the holding screen is currently displayed.
        """

        return self._state.holdingScreen

state_manager = StateManager()