import asyncio
from typing import Set


class EventManager:

    def __init__(self):

        self._listeners: Set[asyncio.Queue] = set()

    async def subscribe(self):

        queue = asyncio.Queue()

        self._listeners.add(queue)

        try:
            while True:
                message = await queue.get()
                yield message
        finally:
            self._listeners.remove(queue)

    async def broadcast(self):

        for queue in list(self._listeners):

            await queue.put("update")


event_manager = EventManager()