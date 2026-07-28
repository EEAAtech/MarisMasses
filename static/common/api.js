export async function getState() {

    const response = await fetch("/api/state");

    return await response.json();
}


export async function getCurrentSlide() {

    const response = await fetch("/api/slide");

    return await response.json();
}


export async function nextSlide() {

    const response = await fetch("/api/next", {
        method: "POST"
    });

    return await response.json();
}


export async function previousSlide() {

    const response = await fetch("/api/previous", {
        method: "POST"
    });

    return await response.json();
}


export async function nextItem() {

    const response = await fetch("/api/nextItem", {
        method: "POST"
    });

    return await response.json();
}


export async function previousItem() {

    const response = await fetch("/api/previousItem", {
        method: "POST"
    });

    return await response.json();
}

export async function selectSlide(index){

    const response =
        await fetch(`/api/slide/${index}`,{

            method:"POST"

        });

    return await response.json();

}

export async function showHolding(){

    await fetch("/api/holding",{

        method:"POST"

    });

}

export async function hideHolding(){

    const response =
        await fetch("/api/hideHolding",{

            method:"POST"

        });

    return await response.json();

}