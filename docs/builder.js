//
// MassCast Builder
//
// Commit B2
//
// Loads the hymn search index and performs
// live case-insensitive searching.
//

"use strict";

const sequence = [];

//
// Holding image required dimensions (pixels) and minimum resolution.
//
const MASS_IMAGE_WIDTH = 640;

const MASS_IMAGE_HEIGHT = 480;

const MASS_IMAGE_MIN_DPI = 72;

const MASS_IMAGE_TARGET_DPI = 72;

// Allowed rounding tolerance when checking the 640:480 (4:3) aspect ratio
const MASS_IMAGE_RATIO_TOLERANCE = 0.01;

//
// Holds the processed (72 dpi) holding image as an ArrayBuffer,
// ready to be uploaded alongside the sequence package.
//
let massImageBuffer = null;

//
// GitHub configuration
//

const GITHUB_OWNER = "EEAAtech";

const GITHUB_REPO = "MarisMassesBuilder";

const GITHUB_BRANCH = "main";

//
// Public MassCast repository.
// This is the repository containing the Controller and Presenter apps.
//
const PUBLIC_REPO_OWNER = GITHUB_OWNER;
const PUBLIC_REPO_NAME = "MarisMasses";
const PUBLIC_REPO_BRANCH = "main";
const PUBLIC_PACKAGE_FOLDER = "package";

//
// Complete hymn search library.
//
// Populated from:
//
//   search-index.json
//   search-index-local.json
//
let searchLibrary = [];

//
// Centralised GitHub API helper.
// Automatically adds the PAT and common headers to every request.
//

async function githubRequest(url, options = {}) {

    const token = localStorage.getItem("githubPAT");

    if (!token) {

        throw new Error("GitHub PAT has not been configured.");

    }

    const headers = {

        Accept: "application/vnd.github+json",

        Authorization: "token " + token,

        ...(options.headers || {})

    };

    return fetch(

        url,

        {

            ...options,

            headers

        }

    );

}

document.addEventListener(
    "DOMContentLoaded",
    initialise
);

async function initialise() {

    console.log("MassCast Builder");


    document
        .getElementById("searchBox")
        .addEventListener("input", search);

    
    document
        .getElementById("newResponseButton")
        .addEventListener(
            "click",
            toggleResponseEditor
        );

    document
        .getElementById("addResponseButton")
        .addEventListener(
            "click",
            addResponse
        );
    
    document
        .getElementById("buildButton")
        .addEventListener(
            "click",
            buildPackage
        );

    document
        .getElementById("massImage")
        .addEventListener(
            "change",
            handleMassImageSelect
        );

    document
        .getElementById("newHymnButton")
        .addEventListener(
            "click",
            toggleHymnEditor
        );

    document
        .getElementById("newHymnTitle")
        .addEventListener(
            "input",
            updatefilePreview
        );

    document
        .getElementById("saveNewHymnButton")
        .addEventListener(
            "click",
            saveNewHymn
        );

    document
    .getElementById("githubStatus")
    .addEventListener(
        "click",
        openSettings
    );

    document
        .getElementById("closeSettingsButton")
        .addEventListener(
            "click",
            closeSettings
        );


    document
        .getElementById("testSaveButton")
        .addEventListener(
            "click",
            testConnectionAndSave
        );

    loadSettings();

    try {
        await loadSearchLibrary();
    } catch (error) {
        console.warn("Search library not loaded. A valid PAT is required.", error.message);
    }
}



function search(event) {

    const query = event.target.value
        .trim()
        .toLowerCase();

    const results = document.getElementById(
        "searchResults"
    );

    results.innerHTML = "";

    if (query.length === 0) {

        results.innerHTML =
            "<p class='placeholder'>Search results will appear here.</p>";

        return;

    }

    const matches = searchLibrary.filter(hymn =>
        hymn.title.toLowerCase().includes(query) ||
        hymn.lyrics.includes(query)
    );

    if (matches.length === 0) {

        results.innerHTML =
            "<p class='placeholder'>No hymns found.</p>";

        return;

    }

    matches.forEach(hymn => {

        const row = document.createElement("div");

        row.className = "resultRow";

        row.innerHTML = `

            <div class="resultHeader">

                <button class="addButton" title="Add to sequence">+</button>

                <button class="expandButton" title="Toggle lyrics">👁️</button>

                <div class="resultText">

                    <strong>${hymn.title}</strong>

                    <span>${hymn.folder}</span>

                </div>

            </div>

            <div class="lyricsContainer hidden"></div>

        `;

        // Add to sequence
        row.querySelector(".addButton")
            .addEventListener(
                "click",
                () => addToSequence(hymn, row)
            );

        // Toggle lyrics visibility instant-style
        const expandButton = row.querySelector(".expandButton");
        const lyricsBox = row.querySelector(".lyricsContainer");

        expandButton.addEventListener("click", () => {

            const isHidden = lyricsBox.classList.contains("hidden");

            if (isHidden) {

                // Populate from memory on first toggle
                if (!lyricsBox.textContent) {

                    lyricsBox.textContent = hymn.lyrics || "No lyrics available.";

                }

                lyricsBox.classList.remove("hidden");

                expandButton.textContent = "🙈";

            } else {

                lyricsBox.classList.add("hidden");

                expandButton.textContent = "👁️";

            }

        });

        results.appendChild(row);

    });

}


function addToSequence(hymn, rowElement) {

    sequence.push({

        type: "hymn",

        folder: hymn.folder,

        file: hymn.file,

        title: hymn.title

    });

    renderSequence();

    // Trigger the exit animation if the row element was passed
    if (rowElement) {
        rowElement.classList.add("fade-out");

        // Remove from DOM once animation finishes
        rowElement.addEventListener("transitionend", () => {
            rowElement.remove();
        }, { once: true });
    }
}


function renderSequence() {

    const panel = document.getElementById("sequence");

    panel.innerHTML = "";

    if (sequence.length === 0) {

        panel.innerHTML =
            "<p class='placeholder'>No hymns added.</p>";

        updateBuildButton();

        return;

    }

    sequence.forEach((item, index) => {

        const row = document.createElement("div");

        row.className = "sequenceRow";

        row.innerHTML = `

            <button class="upButton">▲</button>

            <button class="downButton">▼</button>

            <button class="deleteButton">🗑</button>

            <span>

                ${item.type === "response"
                    ? "📖 " + item.title
                    : "🎵 " + item.title}

            </span>

        `;

        // Move up
        row.querySelector(".upButton")
            .addEventListener("click", () => {

                if (index === 0)
                    return;

                [sequence[index - 1], sequence[index]] =
                    [sequence[index], sequence[index - 1]];

                renderSequence();

            });

        // Move down
        row.querySelector(".downButton")
            .addEventListener("click", () => {

                if (index === sequence.length - 1)
                    return;

                [sequence[index], sequence[index + 1]] =
                    [sequence[index + 1], sequence[index]];

                renderSequence();

            });

        // Delete
        row.querySelector(".deleteButton")
            .addEventListener("click", () => {

                sequence.splice(index, 1);

                renderSequence();

            });

        panel.appendChild(row);

    });

    updateBuildButton();

}

function toggleResponseEditor() {

    document
        .getElementById("responseEditor")
        .classList
        .toggle("hidden");

}


function addResponse() {

    const title = document
        .getElementById("responseTitle")
        .value
        .trim();

    const text = document
        .getElementById("responseText")
        .value
        .trim();

    if (!title || !text) {

        alert("Please enter both Title and Response.");

        return;

    }

    sequence.push({

        type: "response",

        title,

        text

    });

    document
        .getElementById("responseTitle")
        .value = "";

    document
        .getElementById("responseText")
        .value = "";

    document
        .getElementById("responseEditor")
        .classList
        .add("hidden");

    renderSequence();

}


//
// Build the sequence.json file and download it.
//
async function buildPackage() {

    const massDate = document
        .getElementById("massDate")
        .value;

    const massTime = document
        .getElementById("massTime")
        .value;

    if (!massDate || !massTime) {

        alert("Please select the Mass date and time.");

        return;

    }

    const packageObject = {

        massDate: massDate,

        massTime: massTime,

        items: sequence.map(item => {

            if (item.type === "response") {

                return {

                    type: "response",

                    title: item.title,

                    text: item.text

                };

            }

            const hymn = {

                type: "hymn",

                folder: item.folder,

                file: item.file

            };

            if (item.folder === "OtherHymns") {

                hymn.lyrics =

                    getLyrics(

                        item.folder,

                        item.file

                    );

            }

            return hymn;

        })

    };

    try {

        await uploadPackage(packageObject);

        alert(
            "Mass sequence uploaded successfully."
        );

    }
    catch (error) {

        console.error(
            "Upload failed:",
            error
        );

        alert(
            "Unable to upload the Mass sequence file:\n\n" +
            error.message
        );

        return;

    }

    localStorage.setItem(

        "lastMassTime",

        massTime

    );

}


//
// Handle selection of the Mass holding image.
//
// Validates that the file is a JPG of exactly 640x480 pixels and
// at least 72 dpi, then rewrites its density metadata to 72 dpi
// and stores the result for upload in uploadPackage().
//
async function handleMassImageSelect(event) {

    const file = event.target.files[0];

    const status = document.getElementById("massImageStatus");

    massImageBuffer = null;

    if (!file) {

        status.textContent = "No image selected.";
        status.className = "placeholder";

        return;
    }

    if (file.type !== "image/jpeg") {

        alert("Please select a JPG image.");

        event.target.value = "";

        status.textContent = "No image selected.";
        status.className = "placeholder";

        return;
    }

    try {

        const arrayBuffer = await file.arrayBuffer();

        const info = readJpegInfo(arrayBuffer);

        const targetRatio = MASS_IMAGE_WIDTH / MASS_IMAGE_HEIGHT;
        const actualRatio =
            info.width && info.height ? info.width / info.height : null;

        if (
            actualRatio === null ||
            Math.abs(actualRatio - targetRatio) > MASS_IMAGE_RATIO_TOLERANCE
        ) {

            throw new Error(
                `Image must be in a ${MASS_IMAGE_WIDTH}x${MASS_IMAGE_HEIGHT} (4:3) ratio ` +
                `(this image is ${info.width || "?"}x${info.height || "?"}).`
            );

        }

        if (info.width < MASS_IMAGE_WIDTH || info.height < MASS_IMAGE_HEIGHT) {

            throw new Error(
                `Image resolution is too low. It must be at least ` +
                `${MASS_IMAGE_WIDTH}x${MASS_IMAGE_HEIGHT}px ` +
                `(this image is ${info.width}x${info.height}).`
            );

        }

        const dpi = info.dpiX || info.dpiY;

        if (dpi !== null && dpi < MASS_IMAGE_MIN_DPI) {

            throw new Error(
                `Image resolution (${dpi} dpi) is too low. ` +
                `Please provide an image of at least ${MASS_IMAGE_MIN_DPI} dpi.`
            );

        }

        massImageBuffer = forceJpegDpi(
            arrayBuffer,
            MASS_IMAGE_TARGET_DPI,
            info.jfifOffset
        );

        status.textContent =
            `Image ready (${info.width}x${info.height}, ${MASS_IMAGE_TARGET_DPI} dpi).`;
        status.className = "imageOk";

    }
    catch (error) {

        console.error(error);

        alert(error.message);

        event.target.value = "";

        massImageBuffer = null;

        status.textContent = "No image selected.";
        status.className = "placeholder";

    }

}

//
// Parse a JPEG ArrayBuffer for its pixel dimensions and embedded
// DPI (from the JFIF APP0 segment, falling back to EXIF resolution
// tags). Also returns the byte offset of the JFIF segment (if any)
// so it can be rewritten later.
//
function readJpegInfo(arrayBuffer) {

    const view = new DataView(arrayBuffer);

    if (view.getUint16(0) !== 0xFFD8) {

        throw new Error("The selected file is not a valid JPEG image.");

    }

    let offset = 2;

    let width = null;
    let height = null;
    let dpiX = null;
    let dpiY = null;
    let jfifOffset = null;

    while (offset < view.byteLength - 1) {

        if (view.getUint8(offset) !== 0xFF) {

            offset++;
            continue;

        }

        const marker = view.getUint8(offset + 1);

        // Markers with no payload
        if (marker === 0xD8 || marker === 0x01 || (marker >= 0xD0 && marker <= 0xD7)) {

            offset += 2;
            continue;

        }

        // End of image / start of scan - stop parsing headers
        if (marker === 0xD9 || marker === 0xDA) {

            break;

        }

        const length = view.getUint16(offset + 2);

        // JFIF APP0 - density metadata
        if (marker === 0xE0 && length >= 14) {

            const id =
                String.fromCharCode(
                    view.getUint8(offset + 4),
                    view.getUint8(offset + 5),
                    view.getUint8(offset + 6),
                    view.getUint8(offset + 7)
                );

            if (id === "JFIF") {

                jfifOffset = offset;

                const units = view.getUint8(offset + 11);
                const xdensity = view.getUint16(offset + 12);
                const ydensity = view.getUint16(offset + 14);

                if (units === 1) {

                    dpiX = xdensity;
                    dpiY = ydensity;

                } else if (units === 2) {

                    // Density given per cm - convert to per inch
                    dpiX = Math.round(xdensity * 2.54);
                    dpiY = Math.round(ydensity * 2.54);

                }
                // units === 0 means "aspect ratio only" - no real DPI info

            }

        }

        // EXIF APP1 - fallback resolution tags, only used if JFIF gave nothing
        if (marker === 0xE1 && length >= 8 && dpiX === null) {

            const id =
                String.fromCharCode(
                    view.getUint8(offset + 4),
                    view.getUint8(offset + 5),
                    view.getUint8(offset + 6),
                    view.getUint8(offset + 7)
                );

            if (id === "Exif") {

                const exif = readExifResolution(view, offset + 10);

                if (exif) {

                    dpiX = exif.dpiX;
                    dpiY = exif.dpiY;

                }

            }

        }

        // Start Of Frame - pixel dimensions
        if (
            marker >= 0xC0 && marker <= 0xCF &&
            marker !== 0xC4 && marker !== 0xC8 && marker !== 0xCC
        ) {

            height = view.getUint16(offset + 5);
            width = view.getUint16(offset + 7);

        }

        offset += 2 + length;

    }

    return { width, height, dpiX, dpiY, jfifOffset };

}

//
// Read XResolution / YResolution / ResolutionUnit from an EXIF
// (TIFF) block, used as a fallback when no JFIF density is present.
//
function readExifResolution(view, tiffStart) {

    try {

        const byteOrder = view.getUint16(tiffStart);
        const little = byteOrder === 0x4949;

        if (!little && byteOrder !== 0x4D4D) {

            return null;

        }

        const get16 = (o) => view.getUint16(o, little);
        const get32 = (o) => view.getUint32(o, little);

        if (get16(tiffStart + 2) !== 0x002A) {

            return null;

        }

        const ifd0Offset = tiffStart + get32(tiffStart + 4);
        const entryCount = get16(ifd0Offset);

        let xRes = null;
        let yRes = null;
        let resUnit = 2; // default: inches

        for (let i = 0; i < entryCount; i++) {

            const entryOffset = ifd0Offset + 2 + i * 12;
            const tag = get16(entryOffset);
            const valueOffset = entryOffset + 8;

            if (tag === 0x011A || tag === 0x011B) {

                const dataOffset = tiffStart + get32(valueOffset);
                const numerator = get32(dataOffset);
                const denominator = get32(dataOffset + 4);
                const value = denominator ? numerator / denominator : null;

                if (tag === 0x011A) {
                    xRes = value;
                } else {
                    yRes = value;
                }

            }

            if (tag === 0x0128) {

                resUnit = get16(valueOffset); // 2 = inches, 3 = cm

            }

        }

        if (xRes === null && yRes === null) {

            return null;

        }

        const toDpi = (v) => resUnit === 3 ? Math.round(v * 2.54) : Math.round(v);

        return {
            dpiX: xRes !== null ? toDpi(xRes) : null,
            dpiY: yRes !== null ? toDpi(yRes) : null
        };

    }
    catch (error) {

        return null;

    }

}

//
// Build a standalone JFIF APP0 segment declaring the given DPI.
//
function buildJfifSegment(dpi) {

    const length = 16; // includes the 2 length bytes, excludes the marker

    const seg = new Uint8Array(2 + length);

    seg[0] = 0xFF;
    seg[1] = 0xE0;
    seg[2] = (length >> 8) & 0xFF;
    seg[3] = length & 0xFF;
    seg[4] = 0x4A; // J
    seg[5] = 0x46; // F
    seg[6] = 0x49; // I
    seg[7] = 0x46; // F
    seg[8] = 0x00;
    seg[9] = 0x01;  // version major
    seg[10] = 0x01; // version minor
    seg[11] = 0x01; // units = pixels per inch
    seg[12] = (dpi >> 8) & 0xFF;
    seg[13] = dpi & 0xFF;
    seg[14] = (dpi >> 8) & 0xFF;
    seg[15] = dpi & 0xFF;
    seg[16] = 0x00; // x thumbnail
    seg[17] = 0x00; // y thumbnail

    return seg;

}

//
// Return a new JPEG ArrayBuffer with its density forced to the given
// DPI, replacing any existing JFIF segment or inserting a new one
// right after the SOI marker.
//
function forceJpegDpi(arrayBuffer, dpi, jfifOffset) {

    const bytes = new Uint8Array(arrayBuffer);
    const newSegment = buildJfifSegment(dpi);

    if (jfifOffset !== null) {

        const existingLength = 2 + new DataView(arrayBuffer).getUint16(jfifOffset + 2);
        const before = bytes.slice(0, jfifOffset);
        const after = bytes.slice(jfifOffset + existingLength);

        const result = new Uint8Array(before.length + newSegment.length + after.length);

        result.set(before, 0);
        result.set(newSegment, before.length);
        result.set(after, before.length + newSegment.length);

        return result.buffer;

    }

    // No JFIF segment present - insert one immediately after SOI (first 2 bytes)
    const before = bytes.slice(0, 2);
    const after = bytes.slice(2);

    const result = new Uint8Array(before.length + newSegment.length + after.length);

    result.set(before, 0);
    result.set(newSegment, before.length);
    result.set(after, before.length + newSegment.length);

    return result.buffer;

}

//
// Base64-encode a binary ArrayBuffer for the GitHub Contents API.
//
function arrayBufferToBase64(buffer) {

    let binary = "";

    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;

    for (let i = 0; i < bytes.length; i += chunkSize) {

        binary += String.fromCharCode.apply(
            null,
            bytes.subarray(i, i + chunkSize)
        );

    }

    return btoa(binary);

}

function toggleHymnEditor() {

    document
        .getElementById("hymnEditor")
        .classList
        .toggle("hidden");

}

function updatefilePreview() {

    const title = document
        .getElementById("newHymnTitle")
        .value
        .trim();

    const file = title

        .toLowerCase()

        .replace(/[^a-z0-9]+/g, "_")

        .replace(/^_+|_+$/g, "")

        + ".md";

    document
        .getElementById("filePreview")
        .textContent = file;

}

async function saveNewHymn() {

    const title = document
        .getElementById("newHymnTitle")
        .value
        .trim();

    const folder = document
        .getElementById("newHymnFolder")
        .value;

    const lyrics = document
        .getElementById("newHymnLyrics")
        .value
        .trim();

    if (!title) {

        alert("Please enter a title.");

        return;

    }

    if (!lyrics) {

        alert("Please paste the hymn lyrics.");

        return;

    }

    const file =
    document
        .getElementById("filePreview")
        .textContent;


    // Check for duplicate file in the search library
    const duplicate =
        await hymnAlreadyExists(
            file
        );

    if (duplicate) {

        alert(

            `The hymn "${duplicate.title}" already exists.\n\n` +

            `file:\n${duplicate.file}\n\n` +

            `Please choose another title or edit the existing hymn.`

        );

        return;

    }



    // Upload the hymn to GitHub
    try {

        await uploadTextFile(

            `OtherHymns/${file}`,

            lyrics,

            `Added hymn: ${title}`

        );

        alert(

            "Hymn uploaded successfully."

        );

        const entry = {

            title: title,

            folder: "OtherHymns",
            
            file: file,

            lyrics: lyrics

        };

        // Add the new hymn to the local search index
        await addToLocalSearchIndex(
            entry
        );


        //
        // Keep the in-memory library up-to-date.
        //
        searchLibrary.push(entry);

        searchLibrary.sort(

            (a, b) =>

                a.title.localeCompare(b.title)

        );

        // Add the new hymn directly to the sequence list
        addToSequence(entry);
        
        document
            .getElementById("newHymnTitle")
            .value = "";

        document
            .getElementById("newHymnLyrics")
            .value = "";

        document
            .getElementById("filePreview")
            .textContent = "—";

        document
            .getElementById("hymnEditor")
            .classList
            .add("hidden");
    }
    catch (err) {

        console.error(err);

        alert(err.message);

    }

}

function openSettings() {

    document
        .getElementById("settingsOverlay")
        .classList
        .add("show");

}


function closeSettings() {

    document
        .getElementById("settingsOverlay")
        .classList
        .remove("show");

}


function loadSettings() {

    const token =
        localStorage.getItem("githubPAT");

    if (token) {

        updateGithubStatus("saved");

    }
    else {

        updateGithubStatus("missing");

    }

    const tomorrow = new Date();

    tomorrow.setDate(

        tomorrow.getDate() + 1

    );

    document
        .getElementById("massDate")
        .value =
            tomorrow
                .toISOString()
                .slice(0, 10);


    const savedTime =
        localStorage.getItem(

        "lastMassTime"

    );

    if (savedTime) {

        document
            .getElementById("massTime")
            .value = savedTime;

    }
}


async function testConnectionAndSave() {

    const token =
        document
            .getElementById("githubToken")
            .value
            .trim();

    if (token.length < 40) {

        alert(

            "Please enter a valid GitHub Personal Access Token."

        );

        return;

    }

    localStorage.setItem(

        "githubPAT",

        token

    );

    try {

        const response =
            await githubRequest(

                `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`

            );

        if (!response.ok) {

            throw new Error(

                "GitHub rejected the token."

            );

        }

        updateGithubStatus(

            "connected"

        );

        closeSettings();

        // Load search library immediately after token is verified and saved
        await loadSearchLibrary();
    }

    catch (err) {

        updateGithubStatus(

            "missing"

        );

        alert(

            err.message

        );

    }

}

function updateGithubStatus(state) {

    const badge =
        document.getElementById("githubStatus");

    switch (state) {

        case "connected":

            badge.textContent = "🟢";

            break;

        case "saved":

            badge.textContent = "🟢";

            break;

        default:

            badge.textContent = "⚪";

    }

}

function updateBuildButton() {

    const enabled =

        sequence.length > 0 &&

        document
            .getElementById("massDate")
            .value &&

        document
            .getElementById("massTime")
            .value;

    document
        .getElementById("buildButton")
        .disabled = !enabled;

}

//
// Upload a text file to the GitHub repository.
//
//
// Upload or update a text file in GitHub.
//
async function uploadTextFile(
    path,
    contents,
    commitMessage,
    repo = GITHUB_REPO,
    sha = null
) {

    const encoded =
        btoa(
            unescape(
                encodeURIComponent(contents)
            )
        );



    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${repo}/contents/${path}`;

    // If no sha was explicitly provided, check whether the file already
    // exists and, if so, fetch its current sha so we can overwrite it.
    if (!sha) {
        const existing = await githubRequest(
            `${url}?ref=${GITHUB_BRANCH}`,
            { method: "GET" }
        );

        if (existing.ok) {
            const existingData = await existing.json();
            sha = existingData.sha;
        } else if (existing.status !== 404) {
            // Some other error (auth, rate limit, etc.) - surface it
            const error = await existing.json();
            throw new Error(error.message);
        }
        // if 404, file just doesn't exist yet — sha stays null, which is fine
    }   

    const body = {

        message: commitMessage,

        branch: GITHUB_BRANCH,

        content: encoded

    };

    if (sha) {

        body.sha = sha;

    }
    
    const response =
        await githubRequest(

            url,

            {

                method: "PUT",

                headers: {

                    "Content-Type": "application/json"

                },

                body: JSON.stringify(body)

            }

        );

    if (!response.ok) {

        const error =
            await response.json();

        throw new Error(error.message);

    }

    return await response.json();

}

//
// Upload or update a binary file (e.g. a JPG) in GitHub.
//
// Follows exactly the same logic as uploadTextFile: if a file with
// the same path already exists, its sha is fetched first so that it
// is overwritten rather than rejected.
//
async function uploadBinaryFile(
    path,
    arrayBuffer,
    commitMessage,
    repo = GITHUB_REPO,
    sha = null
) {

    const encoded = arrayBufferToBase64(arrayBuffer);

    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${repo}/contents/${path}`;

    if (!sha) {

        const existing = await githubRequest(
            `${url}?ref=${GITHUB_BRANCH}`,
            { method: "GET" }
        );

        if (existing.ok) {
            const existingData = await existing.json();
            sha = existingData.sha;
        } else if (existing.status !== 404) {
            const error = await existing.json();
            throw new Error(error.message);
        }
        // if 404, file just doesn't exist yet — sha stays null, which is fine

    }

    const body = {

        message: commitMessage,

        branch: GITHUB_BRANCH,

        content: encoded

    };

    if (sha) {

        body.sha = sha;

    }

    const response =
        await githubRequest(

            url,

            {

                method: "PUT",

                headers: {

                    "Content-Type": "application/json"

                },

                body: JSON.stringify(body)

            }

        );

    if (!response.ok) {

        const error =
            await response.json();

        throw new Error(error.message);

    }

    return await response.json();

}

async function loadGitHubJson(path) {

    
    const response =
        await githubRequest(

            `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`

        );

    if (!response.ok) {

        throw new Error(

            "Unable to download " + path

        );

    }

    const json =
        await response.json();

    const decoded =
        decodeURIComponent(

            escape(

                atob(

                    json.content.replace(/\n/g, "")

                )

            )

        );

    return {

        sha: json.sha,

        data: JSON.parse(decoded)

    };

}

//
// Load the complete search library.
//
async function loadSearchLibrary() {

    const core =
        await loadGitHubJson(
            "builder/search-index.json"
        );

    const local =
        await loadGitHubJson(
            "builder/search-index-local.json"
        );


    
    
    searchLibrary = [

        ...core.data,

        ...local.data

    ];

    searchLibrary.sort(

        (a, b) =>

            a.title.localeCompare(b.title)

    );


        console.log(`Loaded ${searchLibrary.length} hymns`);

}

async function hymnAlreadyExists(file) {

    return searchLibrary.find(

        h => h.file === file

    );

}

async function addToLocalSearchIndex(entry) {

    const file =
        await loadGitHubJson(
            "builder/search-index-local.json"
        );

    file.data.push(entry);

    file.data.sort(

        (a, b) =>

            a.title.localeCompare(b.title)

    );

    await uploadTextFile(

        "builder/search-index-local.json",

        JSON.stringify(
            file.data,
            null,
            2
        ),

        "Updated search index",

        GITHUB_REPO,

        file.sha

    );

}

//
// Return the lyrics for a hymn.
//
function getLyrics(folder, filename) {

    const hymn =
        searchLibrary.find(

            h =>

                h.folder === folder &&

                h.file === filename

        );

    return hymn
        ? hymn.lyrics
        : null;

}

//
// Upload the package to the Presenter repository.
//
async function uploadPackage(packageObject) {

    const date =

        packageObject.massDate;

    const time =

        packageObject.massTime.replace(":", "");

    const filename =

        `seq${date}_${time}.json`;

    const path =
        `package/` + `${filename}`;

    await uploadTextFile(

        path,

        JSON.stringify(
            packageObject,
            null,
            4
        ),

        `Mass sequence ${date} ${time}`,
        
        PUBLIC_REPO_NAME

    );

    if (massImageBuffer) {

        const imageFilename =

            `holding${date}_${time}.jpg`;

        const imagePath =
            `package/` + `${imageFilename}`;

        await uploadBinaryFile(

            imagePath,

            massImageBuffer,

            `Holding image ${date} ${time}`,

            PUBLIC_REPO_NAME

        );

    }

}