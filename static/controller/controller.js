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

    const currentSlideCount =
        panel.childElementCount;

    const buttonsNeedRebuild =
        currentSlideCount !== slide.slides.length ||
        panel.dataset.title !== slide.title;

    panel.dataset.title =
        slide.title;

    if (buttonsNeedRebuild) {

        panel.innerHTML = "";

        /*
         * Put Dp. and Ch. paragraphs first.
         *
         * All other paragraphs remain in their
         * original order.
         */
        const topSlides =
            slide.slides.filter(
                item => isTopSlide(item)
            );

        const otherSlides =
            slide.slides.filter(
                item => !isTopSlide(item)
            );

        const orderedSlides = [
            ...topSlides,
            ...otherSlides
        ];

        orderedSlides.forEach(item => {

            /*
             * Find the original slide index.
             *
             * The Presenter still expects the
             * original slide index.
             */
            const index =
                slide.slides.indexOf(item);

            const button =
                document.createElement("button");

            /*
             * Use the first few words of the
             * lyrics as the button label.
             */
            button.textContent =
                slideButtonLabel(item);

            /*
             * Remember the original slide index.
             */
            button.dataset.index =
                index;

            /*
             * Determine which paragraph this
             * button belongs to.
             *
             * For example:
             *
             * 1a, 1b, 1c -> group 1
             * 2a, 2b     -> group 2
             * 3          -> group 3
             */
            button.dataset.group =
                getSlideGroup(item);

            button.onclick =
                async () => {

                    console.log(
                        `Button clicked for slide index: ${index}`
                    );

                    await selectSlide(index);

                    await refreshController();

                };

            panel.appendChild(button);

        });

    }

    /*
     * Highlight the currently selected slide.
     *
     * We use the stored original slide index
     * because the buttons may have been reordered.
     */
    [...panel.children].forEach(button => {

        const buttonIndex =
            Number(button.dataset.index);

        button.classList.toggle(
            "selected",
            buttonIndex === slide.currentSlideIndex
        );

    });

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


function slideButtonLabel(slide) {

    const text = (slide.text || "")
        .replace(/\s+/g, " ")
        .trim();

    if (!text) {
        return slide.label;
    }

    const words = text.split(" ");

    const maxWords = 8;

    if (words.length <= maxWords) {
        return words.join(" ");
    }

    return words
        .slice(0, maxWords)
        .join(" ") + "…";
}

function getSlideGroup(slide) {

    const label =
        (slide.label || "").trim();

    /*
     * Dp. and Ch. paragraphs have their own
     * special colour group.
     */
    if (isTopSlide(slide)) {
        return "top";
    }

    /*
     * Split slides such as:
     *
     * 1a
     * 1b
     * 1c
     *
     * all belong to paragraph 1.
     */
    const match =
        label.match(/^(\d+)/);

    if (match) {
        return match[1];
    }

    /*
     * Fallback for an unexpected label.
     */
    return "other";

}

function isTopSlide(slide) {

    const text =
        (slide.text || "").trim();

    return (
        /^Dp\./i.test(text) ||
        /^Ch\./i.test(text)
    );

}