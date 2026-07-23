import {
    getState
}
from "/static/common/api.js";


async function updateScreen() {

    const state =
        await getState();

    document
        .getElementById("status")
        .innerHTML =
            `Current Slide : ${state.currentSlideIndex}`;
}


updateScreen();

const events =
    new EventSource("/api/events");


events.onmessage = async () => {

    console.log("State changed");

    await updateScreen();

};


events.onerror = () => {

    console.log("SSE disconnected");

};