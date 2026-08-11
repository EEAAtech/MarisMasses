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


async function refreshController() {

    const slide =
        await getCurrentSlide();

    document
        .getElementById("title")
        .textContent =
        slide.title;

    const panel =
        document.getElementById("slideButtons");

    if (panel.childElementCount !== slide.slides.length) {

        panel.innerHTML = "";

        slide.slides.forEach(

            (item, index) => {

                const button =
                    document.createElement("button");

                button.textContent =
                    item.label;

                button.onclick =
                    async () => {

                        await selectSlide(index);

                        await refreshController();

                    };

                panel.appendChild(button);

            }

        );

    }

    [...panel.children].forEach(

        (button, index) => {

            button.classList.toggle(
                "selected",
                index === slide.currentSlideIndex
            );

        }

    );

    currentSlideIndex =
        slide.currentSlideIndex;

}


document
    .getElementById("nextItem")
    .onclick =
    async () => {

        const slide =
            await getCurrentSlide();

        if (!slide.holding) {

            // First press:
            // Show the holding screen.
            await showHolding();

        }
        else {

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
    async () => {

        await previousItem();

        await refreshController();

    };

document
    .getElementById("downloadPackage")
    .addEventListener(
        "click",
        downloadPackage
    );


refreshController();

const events =
    new EventSource("/api/events");

events.onmessage =
    async () => {

        await refreshController();

    };



async function downloadPackage() {

    const button =
        document.getElementById(
            "downloadPackage"
        );


    button.disabled = true;

    const originalText =
        button.textContent;

    button.textContent =
        "Downloading...";

    try {

        const response =
            await fetch(
                "/api/download",
                {
                    method: "POST"
                }
            );

        const responseText =
            await response.text();

        let data = {};

        try {

            data = JSON.parse(responseText);

        }
        catch {

            throw new Error(
                `Download failed: HTTP ${response.status} ` +
                `(${response.statusText})`
            );

        }

        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Unable to download package."
            );

        }

        alert(
            `Downloaded ${data.package}`
        );

        //
        // Reload the Controller state so the
        // newly installed Mass appears immediately.
        //
        await refreshController();

    }

    catch (error) {

        console.error(
            "Package download failed:",
            error
        );

        alert(
            error.message
        );

    }

    finally {

        button.disabled = false;

        button.textContent =
            originalText;

    }

}