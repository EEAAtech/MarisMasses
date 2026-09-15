import { getCurrentSlide } from "/static/common/api.js";

const container = document.getElementById("slide");

// Keep this in sync with the transition duration in the CSS.
const TRANSITION_MS = 800;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function resetHoldingStyles() {
    container.style.position = "";
    container.style.top = "";
    container.style.left = "";
    container.style.width = "";
    container.style.height = "";
    container.style.display = "";
    container.style.alignItems = "";
    container.style.justifyContent = "";
    container.style.background = "";
}

async function renderSlide() {
    const slide = await getCurrentSlide();

    // Start the fade/scale-out.
    container.classList.remove("visible");

    // Wait for the fade-out transition to actually finish before
    // swapping content, so the fade-in doesn't cut it short.
    await sleep(TRANSITION_MS);

    if (slide.holding) {
        container.style.position = "fixed";
        container.style.top = "0";
        container.style.left = "0";
        container.style.width = "100vw";
        container.style.height = "100vh";
        container.style.display = "flex";
        container.style.alignItems = "center";
        container.style.justifyContent = "center";
        container.style.background = "#000";
        container.innerHTML = `
            <img
                src="${slide.image}"
                style="
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                ">`;
        // Replace this with the content you want during holding mode.
        // container.textContent = "";
    } else {
        resetHoldingStyles();
        container.textContent = slide.text ?? "";
    }

    // Force a reflow so the browser registers the "invisible" state
    // before we flip the class, otherwise it may skip the transition.
    void container.offsetHeight;

    // Start the fade/scale-in.
    container.classList.add("visible");
}

// Initial render.
renderSlide();

// Render whenever the FastAPI SSE endpoint sends an event.
const events = new EventSource("/api/events");

events.onmessage = () => {
    renderSlide().catch(error => {
        console.error("Unable to render slide:", error);
    });
};

events.onerror = error => {
    console.error("SSE connection error:", error);
};