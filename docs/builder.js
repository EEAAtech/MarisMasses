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

            `https://api.github.com/repos/${GITHUB_OWNER}/${repo}/contents/${path}`,

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

}

