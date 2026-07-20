from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from presenter.config import STATIC_DIR

APP_NAME = "MassCast"

APP_VERSION = "0.1.0"


def create_app() -> FastAPI:

    app = FastAPI(
        title=APP_NAME,
        version=APP_VERSION
    )

    app.mount(
        "/static",
        StaticFiles(directory=STATIC_DIR),
        name="static"
    )

    @app.get("/")
    async def root():

        return {
            "application": APP_NAME,
            "version": APP_VERSION,
            "status": "Running"
        }

    return app