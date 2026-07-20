from pathlib import Path

from fastapi.responses import FileResponse

from presenter.config import STATIC_DIR


CLIENT_PAGE = STATIC_DIR / "client" / "index.html"
CONTROLLER_PAGE = STATIC_DIR / "controller" / "index.html"


def register_routes(app):

    @app.get("/client", include_in_schema=False)
    async def client():

        return FileResponse(CLIENT_PAGE)

    @app.get("/controller", include_in_schema=False)
    async def controller():

        return FileResponse(CONTROLLER_PAGE)