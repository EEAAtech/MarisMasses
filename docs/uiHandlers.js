import { sequence, searchLibrary } from './dataManager.js';
import { addToSequence } from './builder.js'; // Circular ref handled by moving logic

export function setProcessingState(isProcessing) {
    const controls = document.querySelectorAll(
        'button:not(.addButton):not(.expandButton):not(.upButton):not(.downButton):not(.deleteButton), #newHymnButton, #saveNewHymnButton, #buildButton'
    );
    controls.forEach(button => button.disabled = isProcessing);
    document.getElementById("searchBox").disabled = isProcessing;
    document.getElementById("packageSelect").disabled = isProcessing;
    
    const progressIndicator = document.getElementById("processingIndicator");
    if (progressIndicator) progressIndicator.style.display = isProcessing ? 'block' : 'none';
    document.body.classList.toggle('processing-overlay', isProcessing);
}

export function toggleResponseEditor() {
    document.getElementById("responseEditor").classList.toggle("hidden");
}

export function toggleHymnEditor() {
    document.getElementById("hymnEditor").classList.toggle("hidden");
}

export function updatefilePreview() {
    const title = document.getElementById("newHymnTitle").value.trim();
    const file = title.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") + ".md";
    document.getElementById("filePreview").textContent = file;
}

export function updateBuildButton() {
    const enabled = sequence.length > 0 && 
                     document.getElementById("massDate").value && 
                     document.getElementById("massTime").value;
    document.getElementById("buildButton").disabled = !enabled;
}

export function clearSearch() {
    document.getElementById("searchBox").value = "";
    document.getElementById("searchResults").innerHTML = "<p class='placeholder'>Search results will appear here.</p>";
}

export function updateLoadPackageButton() {
    document.getElementById("loadPackageButton").disabled = !document.getElementById("packageSelect").value;
}

export function updateGithubStatus(state) {
    const badge = document.getElementById("githubStatus");
    badge.textContent = (state === "connected" || state === "saved") ? "🟢" : "⚪";
}
