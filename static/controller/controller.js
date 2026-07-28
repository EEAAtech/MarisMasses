import {

    getCurrentSlide,

    nextItem,

    previousItem,

    selectSlide,

    showHolding,

    hideHolding


}
from "/static/common/api.js";


let currentSlideIndex = -1;


async function refreshController(){

    const slide =
        await getCurrentSlide();

    document
        .getElementById("title")
        .textContent =
        slide.title;

    const panel =
        document.getElementById("slideButtons");

    if(panel.childElementCount !== slide.slides.length){

        panel.innerHTML="";

        slide.slides.forEach(

            (item,index)=>{

                const button =
                    document.createElement("button");

                button.textContent =
                    item.label;

                button.onclick =
                    async ()=>{

                        await selectSlide(index);

                        await refreshController();

                    };

                panel.appendChild(button);

            }

        );

    }

    [...panel.children].forEach(

        (button,index)=>{

            button.classList.toggle(
                "selected",
                index===slide.currentSlideIndex
            );

        }

    );

    currentSlideIndex =
        slide.currentSlideIndex;

}


document
.getElementById("nextItem")
.onclick =
async()=>{

    const slide =
        await getCurrentSlide();

    if(!slide.holding){

        // First press:
        // Show the holding screen.
        await showHolding();

    }
    else{

        // Second press:
        // Advance to the next hymn.
        await nextItem();

        // Return to verse 1.
        await hideHolding();

    }

    await refreshController();

};


document
.getElementById("previousItem")
.onclick =
async()=>{

    await previousItem();

    await refreshController();

};


refreshController();

const events =
    new EventSource("/api/events");

events.onmessage =
async ()=>{

    await refreshController();

};