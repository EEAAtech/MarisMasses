import {
    getCurrentSlide
}
from "/static/common/api.js";


async function renderSlide() {

    const slide = await getCurrentSlide();

    document
        .getElementById("slide")
        .textContent = slide.text;
}


// Initial display
renderSlide();


// Listen for presenter updates
const events = new EventSource("/api/events");

events.onmessage = async () => {

    await renderSlide();

};