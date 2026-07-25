import {
    nextSlide,
    previousSlide,
    nextItem,
    previousItem
}
from "/static/common/api.js";


// Previous Verse
document
    .getElementById("previous")
    .onclick = async () => {

        await previousSlide();

    };


// Next Verse
document
    .getElementById("next")
    .onclick = async () => {

        await nextSlide();

    };


// Previous Hymn
document
    .getElementById("previousItem")
    .onclick = async () => {

        await previousItem();

    };


// Next Hymn
document
    .getElementById("nextItem")
    .onclick = async () => {

        await nextItem();

    };