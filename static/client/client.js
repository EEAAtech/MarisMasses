import {
    getCurrentSlide
}
from "/static/common/api.js";


async function renderSlide() {

    const slide = await getCurrentSlide();

    document
        .getElementById("slide")
        .textContent = slide.text;

    document.title =
        slide.title;
}


// Initial render.
renderSlide();


// Listen for updates from the presenter.
const events = new EventSource("/api/events");

events.onmessage = async () => {

    await renderSlide();

};