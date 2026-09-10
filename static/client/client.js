import {
    getCurrentSlide
}
from "/static/common/api.js";


async function renderSlide() {
    const slide = await getCurrentSlide();
    const container = document.getElementById("slide");

    if (slide.holding) {
        // Make the container fill the viewport
        container.style.position = "fixed";
        container.style.top = "0";
        container.style.left = "0";
        container.style.width = "100vw";
        container.style.height = "100vh";
        container.style.display = "flex";
        container.style.alignItems = "center";
        container.style.justifyContent = "center";
        container.style.background = "#000"; // optional, for letterboxing

        container.innerHTML = `
            <img
                src="${slide.image}"
                style="
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                "
            >
        `;

        return;
    }

    // Reset any inline styles when not holding
    container.style.position = "";
    container.style.top = "";
    container.style.left = "";
    container.style.width = "";
    container.style.height = "";
    container.style.display = "";
    container.style.alignItems = "";
    container.style.justifyContent = "";
    container.style.background = "";

    container.textContent = slide.text;
}


renderSlide();

const events =
    new EventSource("/api/events");

events.onmessage =
async ()=>{

    await renderSlide();

};