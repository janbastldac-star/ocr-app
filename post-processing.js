// ===========================
// POSTPROCESSING.JS - Automatic OCR Repair
// ===========================

/**
 * Regex patterns to detect potential OCR mistakes:
 * - Lines starting with numbers (1., 2., etc.)
 * - Words with Czech letters (diacritics)
 * - Valid punctuation and numbers
 */
const czechChars = "A-Za-zÁČĎÉĚÍŇÓŘŠŤÚŮÝŽáčďéěíňóřšťúůýž";
const numberPattern = /^\d+\./; // e.g., "1."
const validLinePattern = new RegExp(`^[\\d\\.\\s${czechChars},:;!?()\\[\\]/\\\\"'<>@#$%^&*_+=~\`|{}-]+$`);

/**
 * Detects if a line contains suspicious characters
 */
function lineHasErrors(line) {
    return !validLinePattern.test(line) || line.includes('??') || line.match(/[^\x00-\xFF]/g) === null;
}

/**
 * Automatic repair function for OCR text
 * - Corrects diacritics
 * - Fixes character confusions
 * - Removes gibberish
 * - Preserves line numbers
 */
function autoRepairOCR(rawText) {
    if (!rawText) return "";

    const lines = rawText.split('\n');
    const repairedLines = lines.map(line => {
        let l = line.trim();
        if (l.length === 0) return "";

        // Only repair lines that appear to have mistakes
        if (lineHasErrors(l)) {
            // Fix common diacritics
            l = l
                .replace(/Á/g, 'Á').replace(/Č/g, 'Č').replace(/Ď/g, 'Ď')
                .replace(/É/g, 'É').replace(/Ě/g, 'Ě').replace(/Í/g, 'Í')
                .replace(/Ň/g, 'Ň').replace(/Ó/g, 'Ó').replace(/Ř/g, 'Ř')
                .replace(/Š/g, 'Š').replace(/Ť/g, 'Ť').replace(/Ú/g, 'Ú')
                .replace(/Ů/g, 'Ů').replace(/Ý/g, 'Ý').replace(/Ž/g, 'Ž')
                .replace(/á/g, 'á').replace(/č/g, 'č').replace(/ď/g, 'ď')
                .replace(/é/g, 'é').replace(/ě/g, 'ě').replace(/í/g, 'í')
                .replace(/ň/g, 'ň').replace(/ó/g, 'ó').replace(/ř/g, 'ř')
                .replace(/š/g, 'š').replace(/ť/g, 'ť').replace(/ú/g, 'ú')
                .replace(/ů/g, 'ů').replace(/ý/g, 'ý').replace(/ž/g, 'ž');

            // Fix common OCR confusions
            l = l.replace(/\|/g, 'I').replace(/0/g, '0').replace(/1/g, '1').replace(/l/g, 'l').replace(/O/g, 'O');

            // Remove random gibberish patterns
            l = l.replace(/\b[b-df-hj-np-tv-z]{4,}\b/gi, '');

            // Normalize spaces
            l = l.replace(/\s{2,}/g, ' ').trim();
        }

        return l;
    });

    return repairedLines.filter(line => line.length > 0).join('\n');
}

/**
 * Automatically run repair if mistakes are detected
 */
function autoRepairIfNeeded() {
    const textarea = document.getElementById("extractedText");
    if (!textarea || textarea.value.length === 0) return;

    const rawText = textarea.value;
    const lines = rawText.split('\n');
    let needsRepair = false;

    // Check if any line has mistakes
    for (const line of lines) {
        if (lineHasErrors(line)) {
            needsRepair = true;
            break;
        }
    }

    if (needsRepair) {
        const repaired = autoRepairOCR(rawText);
        textarea.value = repaired;

        if (window.lastExtractedText !== undefined) {
            window.lastExtractedText = repaired;
            saveLastText(repaired);
        }

        showNotification("Automatic post-processing applied to fix OCR errors!");
    }
}

// Export globally
window.autoRepairOCR = autoRepairOCR;
window.autoRepairIfNeeded = autoRepairIfNeeded;
