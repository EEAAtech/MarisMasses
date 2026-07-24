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