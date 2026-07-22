import {
    getState
}
from "/static/common/api.js";


async function loadState() {

    const state =
        await getState();

    document
        .getElementById("status")
        .innerHTML =
            `Current Slide : ${state.currentSlideIndex}`;
}


loadState();