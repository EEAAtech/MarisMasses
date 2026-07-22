from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from presenter.api import router as api_router
from presenter.config import STATIC_DIR
from presenter.routes import register_routes

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

    register_routes(app)
    app.include_router(api_router)

    @app.get("/")
    async def root():

        return {
            "application": APP_NAME,
            "version": APP_VERSION,
            "status": "Running"
        }

    return app