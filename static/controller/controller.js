import {
    nextSlide,
    previousSlide
}
from "/static/common/api.js";


document
    .getElementById("next")
    .onclick = async () => {

        const state =
            await nextSlide();

        console.log(state);

    };


document
    .getElementById("previous")
    .onclick = async () => {

        const state =
            await previousSlide();

        console.log(state);

    };