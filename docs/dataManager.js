import { loadGitHubJson, uploadTextFile } from './api.js';

export let searchLibrary = [];
export let sequence = [];
// dataManager.js
export let massImageBuffer = null;

export function setMassImageBuffer(value) {
    massImageBuffer = value;
}

export async function loadSearchLibrary() {
    const core = await loadGitHubJson("builder/search-index.json");
    const local = await loadGitHubJson("builder/search-index-local.json");
    searchLibrary = [...core.data, ...local.data];
    searchLibrary.sort((a, b) => a.title.localeCompare(b.title));
    console.log(`Loaded ${searchLibrary.length} hymns`);
}

export async function addToLocalSearchIndex(entry) {
    const file = await loadGitHubJson("builder/search-index-local.json");
    file.data.push(entry);
    file.data.sort((a, b) => a.title.localeCompare(b.title));
    await uploadTextFile("builder/search-index-local.json", JSON.stringify(file.data, null, 2), "Updated search index");
}

export function getLyrics(folder, filename) {
    const hymn = searchLibrary.find(h => h.folder === folder && h.file === filename);
    return hymn ? hymn.lyrics : null;
}

export async function updateHymnLyrics(hymn, newLyrics) {
    // Hymns in the OtherHymns folder are persisted to the local search index;
    // every other folder is persisted to the core search index.
    const targetFile = hymn.folder === "OtherHymns"
        ? "builder/search-index-local.json"
        : "builder/search-index.json";

    const index = await loadGitHubJson(targetFile);
    const entry = index.data.find(e => e.folder === hymn.folder && e.file === hymn.file);
    if (!entry) {
        throw new Error(`Hymn "${hymn.title}" not found in ${targetFile}.`);
    }

    entry.lyrics = newLyrics;

    await uploadTextFile(
        targetFile,
        JSON.stringify(index.data, null, 2),
        `Updated lyrics: ${hymn.title}`
    );

    // Keep the in-memory search library in sync
    const libEntry = searchLibrary.find(h => h.folder === hymn.folder && h.file === hymn.file);
    if (libEntry) libEntry.lyrics = newLyrics;

    return entry;
}

export function hymnAlreadyExists(file) {
    return searchLibrary.find(h => h.file === file);
}
