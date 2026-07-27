import {

    getCurrentSlide,

    nextItem,

    previousItem,

    selectSlide

}
from "/static/common/api.js";


async function refreshController(){

    const slide =
        await getCurrentSlide();

    document
        .getElementById("title")
        .textContent =
        slide.title;

    const panel =
        document.getElementById("slideButtons");

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

                };

            panel.appendChild(button);

        }

    );

}


document
.getElementById("nextItem")
.onclick =
async()=>{

    await nextItem();

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