import {
    getCurrentSlide
}
from "/static/common/api.js";


async function renderSlide(){

    const slide =
        await getCurrentSlide();

    const container =
        document.getElementById("slide");

    if(slide.holding){

        container.innerHTML =
            `<img
                src="${slide.image}"
                style="
                    width:100%;
                    height:auto;
                    object-fit:contain;
                ">`;

        return;

    }

    container.textContent =
        slide.text;

}


renderSlide();

const events =
    new EventSource("/api/events");

events.onmessage =
async ()=>{

    await renderSlide();

};