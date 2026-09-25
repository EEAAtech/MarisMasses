//
// MassCast Builder (Refactored Controller)
//

"use strict";

import { MASS_IMAGE_CONFIG, GITHUB_CONFIG } from './config.js';
import * as API from './api.js';
import * as ImageProc from './imageProcessor.js';
import * as DataMgr from './dataManager.js';
import * as UI from './uiHandlers.js';

//
// Initialization
//
document.addEventListener("DOMContentLoaded", initialise);

async function initialise() {
    console.log("MassCast Builder Initialized");
    
    setupEventListeners();
    
    loadSettings(); 
    await tryLoadLibraryNPkgs();
    checkGithubStatus();
}

function setupEventListeners() {
    const eventMap = [
        ["searchBox", "input", search],
        ["newResponseButton", "click", UI.toggleResponseEditor],
        ["packageSelect", "change", UI.updateLoadPackageButton],
        ["loadPackageButton", "click", loadSelectedPackage],
        ["addResponseButton", "click", addResponse],
        ["buildButton", "click", buildPackage],
        ["massImage", "change", handleMassImageSelect],
        ["newHymnButton", "click", UI.toggleHymnEditor],
        ["newHymnTitle", "input", UI.updatefilePreview],
        ["saveNewHymnButton", "click", saveNewHymn],
        ["githubStatus", "click", openSettings],
        ["closeSettingsButton", "click", closeSettings],
        ["testSaveButton", "click", testConnectionAndSave],
        ["clearSearchButton", "click", UI.clearSearch]
    ];

    eventMap.forEach(([id, event, fn]) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener(event, fn);
    });

    // Specific handling for time input
    document.getElementById("massTime").addEventListener("input", (event) => {
        const timeInput = event.target.value;
        const timeRegex = /^\d{2}:\d{2}$/;
        if (timeRegex.test(timeInput)) {
            renderSequence();
        }
    });
}

//
// Core Data Logic
//
async function tryLoadLibraryNPkgs() {
    try {
        await DataMgr.loadSearchLibrary();
        await loadPackageList();
    } catch (error) {
        console.warn("GitHub data not loaded. A valid PAT is required.", error.message);
    }
}

function checkGithubStatus() {
    const token = localStorage.getItem("githubPAT");
    const searchBox = document.getElementById("searchBox");
    const packageSelect = document.getElementById("packageSelect");

    if (!token) {
        searchBox.disabled = true;
        packageSelect.disabled = true;
        openSettings();
        
        const notice = document.createElement("p");
        notice.className = "pat-notice";
        notice.style.color = "red";
        notice.textContent = "⚠️ Please enter your GitHub Personal Access Token in the Settings dialog to enable search and package loading.";
        
        const srchBoxId = document.getElementById("searchResults");
        if (srchBoxId && !srchBoxId.querySelector('.pat-notice')) {
             srchBoxId.prepend(notice);
        }
    } else {
        searchBox.disabled = false;
        packageSelect.disabled = false;
        const notice = document.querySelector('.pat-notice');
        if (notice) notice.remove();
    }
}

function search(event) {
    const query = event.target.value.trim().toLowerCase();
    const results = document.getElementById("searchResults");
    results.innerHTML = "";

    if (query.length === 0) {
        results.innerHTML = "<p class='placeholder'>Search results will appear here.</p>";
        return;
    }

    const matches = DataMgr.searchLibrary.filter(hymn =>
        hymn.title.toLowerCase().includes(query) ||
        hymn.lyrics.includes(query)
    );

    if (matches.length === 0) {
        results.innerHTML = "<p class='placeholder'>No hymns found.</p>";
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

        row.querySelector(".addButton").addEventListener("click", () => addToSequence(hymn, row));

        const expandButton = row.querySelector(".expandButton");
        const lyricsBox = row.querySelector(".lyricsContainer");

        expandButton.addEventListener("click", () => {
            const isHidden = lyricsBox.classList.contains("hidden");
            if (isHidden) {
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

export function addToSequence(hymn, rowElement) {
    DataMgr.sequence.push({
        type: "hymn",
        folder: hymn.folder,
        file: hymn.file,
        title: hymn.title
    });

    renderSequence();

    if (rowElement) {
        rowElement.classList.add("fade-out");
        rowElement.addEventListener("transitionend", () => {
            rowElement.remove();
        }, { once: true });
    }
}

function renderSequence() {
    const panel = document.getElementById("sequence");
    panel.innerHTML = "";

    if (DataMgr.sequence.length === 0) {
        panel.innerHTML = "<p class='placeholder'>No hymns added.</p>";
        UI.updateBuildButton();
        return;
    }

    DataMgr.sequence.forEach((item, index) => {
        const row = document.createElement("div");
        row.className = "sequenceRow";
        row.innerHTML = `
            <button class="upButton">▲</button>
            <button class="downButton">▼</button>
            <button class="deleteButton">🗑</button>
            <span>
                ${item.type === "response"
                    ? "📖 " + item.title + ": " + item.text
                    : "🎵 " + item.title}
            </span>
        `;

        row.querySelector(".upButton").addEventListener("click", () => {
            if (index === 0) return;
            [DataMgr.sequence[index - 1], DataMgr.sequence[index]] = [DataMgr.sequence[index], DataMgr.sequence[index - 1]];
            renderSequence();
        });

        row.querySelector(".downButton").addEventListener("click", () => {
            if (index === DataMgr.sequence.length - 1) return;
            [DataMgr.sequence[index], DataMgr.sequence[index + 1]] = [DataMgr.sequence[index + 1], DataMgr.sequence[index]];
            renderSequence();
        });

        row.querySelector(".deleteButton").addEventListener("click", () => {
            DataMgr.sequence.splice(index, 1);
            renderSequence();
        });

        panel.appendChild(row);
    });

    UI.updateBuildButton();
}

//
// Data Loading & Package Handling
//
async function loadPackageList() {
    const response = await API.githubRequest(
        `https://api.github.com/repos/${GITHUB_CONFIG.PUBLIC_REPO_OWNER}/${GITHUB_CONFIG.PUBLIC_REPO_NAME}/contents/${GITHUB_CONFIG.PUBLIC_PACKAGE_FOLDER}?ref=${GITHUB_CONFIG.PUBLIC_REPO_BRANCH}`
    );

    if (!response.ok) throw new Error("Unable to list uploaded packages.");

    const files = await response.json();
    const select = document.getElementById("packageSelect");

    files
        .filter(file => file.type === "file" && /^seq.*\.json$/i.test(file.name))
        .sort((a, b) => b.name.localeCompare(a.name))
        .forEach(file => {
            const option = document.createElement("option");
            option.value = file.name;
            option.textContent = file.name;
            select.appendChild(option);
        });

    UI.updateLoadPackageButton();
}

async function loadSelectedPackage() {
    const filename = document.getElementById("packageSelect").value;
    if (!filename) return;

    const button = document.getElementById("loadPackageButton");
    button.disabled = true;

    try {
        const packageObject = await API.loadPublicGitHubJson(
            `${GITHUB_CONFIG.PUBLIC_PACKAGE_FOLDER}/${filename}`
        );

        if (!Array.isArray(packageObject.items)) {
            throw new Error("The selected package has no valid sequence items.");
        }

        DataMgr.sequence.push(
            ...packageObject.items.map(item => {
                if (item.type !== "hymn") return item;
                const hymn = DataMgr.searchLibrary.find(entry =>
                    entry.folder === item.folder &&
                    entry.file === item.file
                );
                return {
                    ...item,
                    title: hymn ? hymn.title : item.file
                };
            })
        );

        renderSequence();
    }
    catch (error) {
        console.error("Package load failed:", error);
        alert("Unable to load the selected package:\n\n" + error.message);
    }
    finally {
        UI.updateLoadPackageButton();
    }
}

function addResponse() {
    const title = document.getElementById("responseTitle").value.trim();
    const text = document.getElementById("responseText").value.trim();

    if (!title || !text) {
        alert("Please enter both Title and Response.");
        return;
    }

    DataMgr.sequence.push({
        type: "response",
        title,
        text
    });

    document.getElementById("responseTitle").value = "";
    document.getElementById("responseText").value = "";
    document.getElementById("responseEditor").classList.add("hidden");

    renderSequence();
}

//
// Build and Upload
//
async function buildPackage() {
    UI.setProcessingState(true);
    const massDate = document.getElementById("massDate").value;
    const massTime = document.getElementById("massTime").value;

    if (!massDate || !massTime) {
        alert("Please select the Mass date and time.");
        UI.setProcessingState(false);
        return;
    }

    const packageObject = {
        massDate: massDate,
        massTime: massTime,
        items: DataMgr.sequence.map(item => {
            if (item.type === "response") {
                return { type: "response", title: item.title, text: item.text };
            }
            const hymn = { type: "hymn", folder: item.folder, file: item.file };
            if (item.folder === "OtherHymns") {
                hymn.lyrics = DataMgr.getLyrics(item.folder, item.file);
            }
            return hymn;
        })
    };

    try {
        await uploadPackage(packageObject);
        alert("Mass sequence uploaded successfully.");
    }
    catch (error) {
        console.error("Upload failed:", error);
        alert("Unable to upload the Mass sequence file:\n\n" + error.message);
    }
    finally {
        UI.setProcessingState(false);
        localStorage.setItem("lastMassTime", massTime);
    }
}

async function uploadPackage(packageObject) {
    const date = packageObject.massDate;
    const time = packageObject.massTime.replace(":", "");
    const filename = `seq${date}_${time}.json`;
    const path = `package/${filename}`;

    await API.uploadTextFile(
        path,
        JSON.stringify(packageObject, null, 4),
        `Mass sequence ${date} ${time}`,
        GITHUB_CONFIG.PUBLIC_REPO_NAME
    );

    if (DataMgr.massImageBuffer) {
        const imageFilename = `holding${date}_${time}.jpg`;
        const imagePath = `package/${imageFilename}`;
        await API.uploadBinaryFile(
            imagePath,
            DataMgr.massImageBuffer,
            `Holding image ${date} ${time}`,
            GITHUB_CONFIG.PUBLIC_REPO_NAME
        );
    }
}

//
// Image Handling
//
async function handleMassImageSelect(event) {
    const file = event.target.files[0];
    const status = document.getElementById("massImageStatus");
    DataMgr.setMassImageBuffer(null);

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
        const info = ImageProc.readJpegInfo(arrayBuffer);

        const targetRatio = MASS_IMAGE_CONFIG.WIDTH / MASS_IMAGE_CONFIG.HEIGHT;
        const actualRatio = info.width && info.height ? info.width / info.height : null;

        if (actualRatio === null || Math.abs(actualRatio - targetRatio) > MASS_IMAGE_CONFIG.RATIO_TOLERANCE) {
            throw new Error(`Image must be in a (16:9) ratio.`);
        }

        if (info.width < MASS_IMAGE_CONFIG.WIDTH || info.height < MASS_IMAGE_CONFIG.HEIGHT) {
            throw new Error(`Image resolution is too low. It must be at least ${MASS_IMAGE_CONFIG.WIDTH}x${MASS_IMAGE_CONFIG.HEIGHT}px.`);
        }

        if (info.width > MASS_IMAGE_CONFIG.MAX_WIDTH || info.height > MASS_IMAGE_CONFIG.MAX_HEIGHT) {
            throw new Error(`Image resolution is too high. It must be no larger than ${MASS_IMAGE_CONFIG.MAX_WIDTH}x${MASS_IMAGE_CONFIG.MAX_HEIGHT}px.`);
        }

        const dpi = info.dpiX || info.dpiY;
        if (dpi !== null && dpi < MASS_IMAGE_CONFIG.MIN_DPI) {
            throw new Error(`Image resolution (${dpi} dpi) is too low. Please provide at least ${MASS_IMAGE_CONFIG.MIN_DPI} dpi.`);
        }

        DataMgr.setMassImageBuffer(
            ImageProc.forceJpegDpi(
                arrayBuffer,
                MASS_IMAGE_CONFIG.TARGET_DPI,
                info.jfifOffset
            )
        );

        status.textContent = `Image ready (${info.width}x${info.height}, ${MASS_IMAGE_CONFIG.TARGET_DPI} dpi).`;
        status.className = "imageOk";
    }
    catch (error) {
        console.error(error);
        alert(error.message);
        event.target.value = "";
        DataMgr.setMassImageBuffer(null);
        status.textContent = "No image selected.";
        status.className = "placeholder";
    }
}

//
// New Hymn Handling
//
async function saveNewHymn() {
    UI.setProcessingState(true);
    const title = document.getElementById("newHymnTitle").value.trim();
    const lyrics = document.getElementById("newHymnLyrics").value.trim();

    if (!title) { alert("Please enter a title."); UI.setProcessingState(false); return; }
    if (!lyrics) { alert("Please paste the hymn lyrics."); UI.setProcessingState(false); return; }

    const file = document.getElementById("filePreview").textContent;
    const duplicate = await DataMgr.hymnAlreadyExists(file);

    if (duplicate) {
        alert(`The hymn "${duplicate.title}" already exists.\n\nfile:\n${duplicate.file}\n\nPlease choose another title or edit the existing hymn.`);
        UI.setProcessingState(false);
        return;
    }

    try {
        await API.uploadTextFile(`OtherHymns/${file}`, lyrics, `Added hymn: ${title}`);
        alert("Hymn uploaded successfully.");

        const entry = { title, folder: "OtherHymns", file, lyrics };
        await DataMgr.addToLocalSearchIndex(entry);

        DataMgr.searchLibrary.push(entry);
        DataMgr.searchLibrary.sort((a, b) => a.title.localeCompare(b.title));

        addToSequence(entry);
        
        document.getElementById("newHymnTitle").value = "";
        document.getElementById("newHymnLyrics").value = "";
        document.getElementById("filePreview").textContent = "—";
        document.getElementById("hymnEditor").classList.add("hidden");
    }
    catch (err) {
        console.error(err);
        alert(err.message);
    }
    finally {
        UI.setProcessingState(false);
    }
}

//
// Settings and Utilities
//
function openSettings() {
    document.getElementById("settingsOverlay").classList.add("show");
}

function closeSettings() {
    document.getElementById("settingsOverlay").classList.remove("show");
}

function loadSettings() {
    const token = localStorage.getItem("githubPAT");
    UI.updateGithubStatus(token ? "saved" : "missing");

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById("massDate").value = tomorrow.toISOString().slice(0, 10);

    const savedTime = localStorage.getItem("lastMassTime");
    if (savedTime) document.getElementById("massTime").value = savedTime;
}

async function testConnectionAndSave() {
    const token = document.getElementById("githubToken").value.trim();
    if (token.length < 40) {
        alert("Please enter a valid GitHub Personal Access Token.");
        return;
    }

    localStorage.setItem("githubPAT", token);

    try {
        const response = await API.githubRequest(
            `https://api.github.com/repos/${GITHUB_CONFIG.OWNER}/${GITHUB_CONFIG.REPO}`
        );

        if (!response.ok) throw new Error("GitHub rejected the token.");

        UI.updateGithubStatus("connected");
        closeSettings();
        checkGithubStatus();
        await tryLoadLibraryNPkgs();
    }
    catch (err) {
        UI.updateGithubStatus("missing");
        alert(err.message);
    }
}
