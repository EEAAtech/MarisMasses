from dataclasses import dataclass, asdict


@dataclass
class PresenterState:

    currentItemId: str = ""

    currentSlideIndex: int = 0

    fontSize: int = 75

    def to_dict(self):

        return asdict(self)