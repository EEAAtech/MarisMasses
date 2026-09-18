import { GITHUB_CONFIG } from './config.js';

export async function githubRequest(url, options = {}) {
    const token = localStorage.getItem("githubPAT");
    if (!token) throw new Error("GitHub PAT has not been configured.");

    const headers = {
        Accept: "application/vnd.github+json",
        Authorization: "token " + token,
        ...(options.headers || {})
    };

    return fetch(url, { ...options, headers });
}

export async function uploadTextFile(path, contents, commitMessage, repo = GITHUB_CONFIG.REPO, sha = null) {
    const encoded = btoa(unescape(encodeURIComponent(contents)));
    const url = `https://api.github.com/repos/${GITHUB_CONFIG.OWNER}/${repo}/contents/${path}`;

    let currentSha = sha;
    if (!currentSha) {
        const existing = await githubRequest(`${url}?ref=${GITHUB_CONFIG.BRANCH}`, { method: "GET" });
        if (existing.ok) {
            const existingData = await existing.json();
            currentSha = existingData.sha;
        }
    }

    const body = { message: commitMessage, branch: GITHUB_CONFIG.BRANCH, content: encoded, sha: currentSha };
    const response = await githubRequest(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

    if (!response.ok) throw new Error((await response.json()).message);
    return await response.json();
}

export async function uploadBinaryFile(path, arrayBuffer, commitMessage, repo = GITHUB_CONFIG.REPO, sha = null) {
    const encoded = arrayBufferToBase64(arrayBuffer);
    const url = `https://api.github.com/repos/${GITHUB_CONFIG.OWNER}/${repo}/contents/${path}`;

    let currentSha = sha;
    if (!currentSha) {
        const existing = await githubRequest(`${url}?ref=${GITHUB_CONFIG.BRANCH}`, { method: "GET" });
        if (existing.ok) {
            const existingData = await existing.json();
            currentSha = existingData.sha;
        }
    }

    const body = { message: commitMessage, branch: GITHUB_CONFIG.BRANCH, content: encoded, sha: currentSha };
    const response = await githubRequest(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

    if (!response.ok) throw new Error((await response.json()).message);
    return await response.json();
}

export async function loadPublicGitHubJson(path) {
    const response = await githubRequest(
        `https://api.github.com/repos/${GITHUB_CONFIG.PUBLIC_REPO_OWNER}/${GITHUB_CONFIG.PUBLIC_REPO_NAME}/contents/${path}?ref=${GITHUB_CONFIG.PUBLIC_REPO_BRANCH}`
    );
    if (!response.ok) throw new Error("Unable to download " + path);
    const json = await response.json();
    const decoded = decodeURIComponent(escape(atob(json.content.replace(/\n/g, ""))));
    return JSON.parse(decoded);
}

export async function loadGitHubJson(path) {
    const response = await githubRequest(
        `https://api.github.com/repos/${GITHUB_CONFIG.OWNER}/${GITHUB_CONFIG.REPO}/contents/${path}`
    );
    if (!response.ok) throw new Error("Unable to download " + path);
    const json = await response.json();
    const decoded = decodeURIComponent(escape(atob(json.content.replace(/\n/g, ""))));
    return { sha: json.sha, data: JSON.parse(decoded) };
}

export function arrayBufferToBase64(buffer) {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
}
