/**
 * Vocabulary Manager
 * Handles vocabulary extraction, central vocabulary storage, and translation links
 */

import { AppState } from '../core/state.js';
import { DOM } from '../core/dom.js';
import { StringUtils, ArrayUtils, ClipboardUtils } from '../utils/helpers.js';
import { StorageManager } from '../utils/storage-manager.js';

export class VocabularyManager {
    constructor() {
        this.storageManager = new StorageManager();
        this.centralVocab = this.loadCentralVocabulary();
    }

    /**
     * Load central vocabulary from storage
     */
    loadCentralVocabulary() {
        return this.storageManager.getCentralVocabulary() || {};
    }

    /**
     * Save central vocabulary to storage
     */
    saveCentralVocabulary() {
        this.storageManager.setCentralVocabulary(this.centralVocab);
    }

    /**
     * Extract words from the current exercise prompt
     */
    extractWordsFromPrompt() {
        const currentExercise = AppState.getCurrentExercise();
        if (!currentExercise || !AppState.config) return [];

        const promptKey = AppState.promptLang === AppState.config['langA-B'][0] ? 'A' : 'B';
        const prompt = currentExercise[promptKey];
        
        if (!prompt) return [];

        // Extract meaningful words (filter out common short words, punctuation)
        const words = prompt.split(/[\s.,;:!?()[\]{}""'']+/)
            .map(word => word.trim().toLowerCase())
            .filter(word => word.length >= 2 && !this.isCommonWord(word))
            .filter((word, index, arr) => arr.indexOf(word) === index); // Remove duplicates

        return words;
    }

    /**
     * Check if a word is a common word that should be filtered out
     */
    isCommonWord(word) {
        const commonWords = [
            // English
            'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us',
            // Spanish
            'el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'ser', 'se', 'no', 'te', 'lo', 'le', 'da', 'su', 'por', 'son', 'con', 'para', 'al', 'me', 'una', 'todo', 'pero', 'más', 'hacer', 'o', 'poder', 'decir', 'este', 'ir', 'otro', 'ese', 'la', 'si', 'ya', 'estar', 'todo', 'le', 'bien', 'puede', 'tú',
            // French  
            'le', 'de', 'et', 'à', 'un', 'il', 'être', 'et', 'en', 'avoir', 'que', 'pour', 'dans', 'ce', 'son', 'une', 'sur', 'avec', 'ne', 'se', 'pas', 'tout', 'plus', 'par', 'grand', 'en', 'me', 'bien', 'te', 'si', 'dans'
        ];
        return commonWords.includes(word);
    }

    /**
     * Update vocabulary box with words from current prompt
     */
    updateVocabularyBox() {
        const wordsFromPrompt = this.extractWordsFromPrompt();
        const vocabContainer = DOM.get('vocabContainer');
        
        if (!vocabContainer || wordsFromPrompt.length === 0) {
            if (vocabContainer) {
                vocabContainer.innerHTML = '<p>No vocabulary words found in current exercise.</p>';
            }
            return;
        }

        // Clear existing content
        vocabContainer.innerHTML = '';

        // Create vocabulary grid
        const vocabGrid = DOM.createElement('div', {
            className: 'vocab-grid'
        });

        wordsFromPrompt.forEach((word, index) => {
            const wordRow = this.createVocabularyRow(word, index);
            vocabGrid.appendChild(wordRow);
        });

        vocabContainer.appendChild(vocabGrid);
        
        // Enable vocabulary buttons
        DOM.setEnabled('wordsFromClipboardBtn', true);
        DOM.setEnabled('saveWordsBtn', true);
        DOM.setEnabled('verifyWordsBtn', wordsFromPrompt.length > 0);
    }

    /**
     * Create a vocabulary row (word + translation input)
     */
    createVocabularyRow(word, index) {
        const row = DOM.createElement('div', {
            className: 'vocab-row'
        });

        // Source word (editable)
        const sourceInput = DOM.createElement('input', {
            type: 'text',
            className: 'vocab-source-input',
            value: word,
            placeholder: 'Word/phrase...',
            'data-index': index
        });

        // Translation (editable, with lookup from central vocab)
        const existingTranslation = this.centralVocab[word] || '';
        const translationInput = DOM.createElement('input', {
            type: 'text',
            className: 'vocab-translation-input',
            value: existingTranslation,
            placeholder: 'Translation...',
            'data-index': index
        });

        row.appendChild(sourceInput);
        row.appendChild(translationInput);

        return row;
    }

    /**
     * Load vocabulary from clipboard (expects word pairs)
     */
    async loadVocabularyFromClipboard() {
        try {
            const clipboardText = await ClipboardUtils.read();
            if (!clipboardText) {
                alert('No text found in clipboard.');
                return;
            }

            this.parseAndLoadVocabulary(clipboardText);
        } catch (error) {
            console.error('Error loading vocabulary from clipboard:', error);
            alert('Error reading from clipboard. Please try again.');
        }
    }

    /**
     * Parse vocabulary text and update the vocabulary box
     */
    parseAndLoadVocabulary(text) {
        const lines = text.split('\n').filter(line => line.trim());
        const vocabContainer = DOM.get('vocabContainer');
        
        if (!vocabContainer) return;

        // Clear existing content
        vocabContainer.innerHTML = '';

        // Create vocabulary grid
        const vocabGrid = DOM.createElement('div', {
            className: 'vocab-grid'
        });

        lines.forEach((line, index) => {
            // Try to split by common separators: tab, |, →, ->, =, :
            const separators = ['\t', '|', '→', '->', '=', ':'];
            let source = '';
            let translation = '';

            for (const sep of separators) {
                if (line.includes(sep)) {
                    const parts = line.split(sep, 2);
                    source = parts[0].trim();
                    translation = parts[1] ? parts[1].trim() : '';
                    break;
                }
            }

            // If no separator found, treat the whole line as source word
            if (!source) {
                source = line.trim();
            }

            if (source) {
                const wordRow = this.createVocabularyRowFromData(source, translation, index);
                vocabGrid.appendChild(wordRow);
            }
        });

        vocabContainer.appendChild(vocabGrid);
        
        // Enable buttons
        DOM.setEnabled('verifyWordsBtn', lines.length > 0);
        DOM.setEnabled('saveWordsBtn', true);
    }

    /**
     * Create vocabulary row from provided data
     */
    createVocabularyRowFromData(source, translation, index) {
        const row = DOM.createElement('div', {
            className: 'vocab-row'
        });

        const sourceInput = DOM.createElement('input', {
            type: 'text',
            className: 'vocab-source-input',
            value: source,
            placeholder: 'Word/phrase...',
            'data-index': index
        });

        const translationInput = DOM.createElement('input', {
            type: 'text',
            className: 'vocab-translation-input',
            value: translation,
            placeholder: 'Translation...',
            'data-index': index
        });

        row.appendChild(sourceInput);
        row.appendChild(translationInput);

        return row;
    }

    /**
     * Save current vocabulary to central vocabulary
     */
    saveVocabulary() {
        const sourceInputs = document.querySelectorAll('.vocab-source-input');
        const translationInputs = document.querySelectorAll('.vocab-translation-input');
        
        let savedCount = 0;

        sourceInputs.forEach((sourceInput, index) => {
            const source = sourceInput.value.trim().toLowerCase();
            const translation = translationInputs[index]?.value.trim();
            
            if (source && translation) {
                this.centralVocab[source] = translation;
                savedCount++;
            }
        });

        if (savedCount > 0) {
            this.saveCentralVocabulary();
            alert(`Saved ${savedCount} vocabulary entries to your central vocabulary.`);
        } else {
            alert('No valid word-translation pairs found to save.');
        }
    }

    /**
     * Toggle vocabulary box visibility
     */
    toggleVocabularyBox() {
        const vocabContent = DOM.get('vocabBoxContent');
        const vocabToggle = DOM.get('vocabToggle');
        
        if (!vocabContent || !vocabToggle) return;

        const isCollapsed = vocabContent.style.display === 'none';
        
        vocabContent.style.display = isCollapsed ? 'block' : 'none';
        vocabToggle.textContent = isCollapsed ? '▲' : '▼';
    }

    /**
     * Initialize vocabulary box as collapsed
     */
    initializeVocabularyBox() {
        const vocabContent = DOM.get('vocabBoxContent');
        const vocabToggle = DOM.get('vocabToggle');
        
        if (vocabContent && vocabToggle) {
            vocabContent.style.display = 'none';
            vocabToggle.textContent = '▼';
        }
    }

    /**
     * Generate prompt for LLM to verify/improve vocabulary
     */
    generateVerificationPrompt() {
        const sourceInputs = document.querySelectorAll('.vocab-source-input');
        const translationInputs = document.querySelectorAll('.vocab-translation-input');
        
        const wordPairs = [];
        
        sourceInputs.forEach((sourceInput, index) => {
            const source = sourceInput.value.trim();
            const translation = translationInputs[index]?.value.trim();
            
            if (source) {
                wordPairs.push({
                    source: source,
                    translation: translation || '[missing]'
                });
            }
        });

        if (wordPairs.length === 0) {
            alert('No vocabulary words to verify.');
            return;
        }

        const languages = AppState.config?.['langA-B'] || ['Language A', 'Language B'];
        const sourceLang = AppState.promptLang === languages[0] ? languages[0] : languages[1];
        const targetLang = AppState.promptLang === languages[0] ? languages[1] : languages[0];

        const prompt = `Please verify and improve these ${sourceLang} to ${targetLang} vocabulary translations:

${wordPairs.map((pair, index) => `${index + 1}. ${pair.source} → ${pair.translation}`).join('\n')}

For each word/phrase:
- Verify the translation is accurate
- Suggest better translations if needed
- Add context notes if the word has multiple meanings
- Format as: "word → translation (notes if any)"

Please provide the corrected vocabulary list.`;

        ClipboardUtils.write(prompt).then(() => {
            alert('Vocabulary verification prompt copied to clipboard! Paste it into your AI assistant.');
        }).catch(error => {
            console.error('Error copying to clipboard:', error);
            // Fallback: show prompt in modal or alert
            alert('Copy this prompt to your AI assistant:\n\n' + prompt);
        });
    }

    /**
     * Open vocabulary in Google Translate
     */
    openVocabularyTranslation(sourceLang, targetLang) {
        if (!AppState.config || !AppState.config['langA-B']) {
            console.error('No language configuration available');
            return;
        }

        const languages = AppState.config['langA-B'];
        const lang = sourceLang === languages[0] ? 'A' : 'B';
        const vocab = AppState.vocab[lang].filter(word => word.length >= 3);
        vocab.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
        
        if (vocab.length === 0) {
            alert('No vocabulary words found for this lesson.');
            return;
        }

        const encodedPrompt = encodeURIComponent(vocab.join('.\t'));
        const translateUrl = `https://translate.google.com/?sl=${sourceLang}&tl=${targetLang}&text=${encodedPrompt}`;
        
        window.open(translateUrl, '_blank');
        console.log(`Opened vocabulary (${sourceLang} → ${targetLang}) with ${vocab.length} words`);
    }
}