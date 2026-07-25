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

    def next_slide(self):
        """Advance to the next slide."""

        self._state.currentSlideIndex += 1

    def previous_slide(self):
        """Return to the previous slide."""

        if self._state.currentSlideIndex > 0:
            self._state.currentSlideIndex -= 1

    def next_item(self):
        """
        Move to the next presentation item.

        Always starts at the first slide.
        """

        self._state.currentItemIndex += 1
        self._state.currentSlideIndex = 0

    def previous_item(self):
        """
        Move to the previous presentation item.

        Always starts at the first slide.
        """

        if self._state.currentItemIndex > 0:
            self._state.currentItemIndex -= 1

        self._state.currentSlideIndex = 0


state_manager = StateManager()