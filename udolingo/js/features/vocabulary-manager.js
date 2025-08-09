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
        this.centralVocab = this.loadCentralVocabulary();
    }

    loadCentralVocabulary() {
        let vocab = StorageManager.getCentralVocabulary() || {};
        return vocab;
    }

    saveCentralVocabulary() {
        StorageManager.setCentralVocabulary(this.centralVocab);
    }

    getLanguagePairKey() {
        // Create consistent key regardless of lesson order (alphabetical)
        return this.getLanguageOrder().join('-').toLowerCase();
    }

    getCurrentLanguagePairVocab() {
        const pairKey = this.getLanguagePairKey();
        if (!this.centralVocab[pairKey]) {
            this.centralVocab[pairKey] = [];
        }
        return this.centralVocab[pairKey];
    }

    getLanguageOrder() {
        return AppState.config['langA-B'].sort();
    }

    findRelatedPhrases(word, currentLang) {
        const pairVocab = this.getCurrentLanguagePairVocab();
        const normalizedWord = word.toLowerCase();
        const [primaryLang, secondaryLang] = this.getLanguageOrder();
        const relatedPhrases = new Set();
        
        // Search for entries that contain the word as a standalone word
        for (const pair of pairVocab) {
            if (!Array.isArray(pair) || pair.length !== 2) continue;
            
            const [primaryWord, secondaryWord] = pair;
            
            // Check if the word is contained in a larger phrase in the source language
            const normalizedEntry = currentLang === primaryLang ? primaryWord.toLowerCase() : secondaryWord.toLowerCase();
            if (this.containsStandaloneWord(normalizedEntry, normalizedWord)) {
                relatedPhrases.add(normalizedEntry);
            }
        }
        
        return Array.from(relatedPhrases);
    }

    containsStandaloneWord(text, word) {
        // Check if the word appears as a standalone word (not part of another word)
        // Uses word boundaries to ensure it's not part of another word
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        return regex.test(text);
    }

    extractWordsFromPrompt() {
        const currentExercise = AppState.getCurrentExercise();
        if (!currentExercise || !AppState.config) return [];

        const promptKey = AppState.promptLang === AppState.config['langA-B'][0] ? 'A' : 'B';
        const prompt = currentExercise[promptKey];
        
        if (!prompt) return [];

        const words = ArrayUtils.removeDuplicates(StringUtils.splitSentenceClean(prompt))
            .map(word => word.toLowerCase())
            .filter(word => word.length >= 3)

        return words;
    }

    extractVocabularyEntriesFromPrompt() {
        const wordsFromPrompt = this.extractWordsFromPrompt();
        const vocabularyEntries = [];
        const addedEntries = new Set(); // Track what we've already added
        
        for (const word of wordsFromPrompt) {
            // Find all related phrases for this word
            const relatedPhrases = this.findRelatedPhrases(word, AppState.promptLang);
            
            if (relatedPhrases.length > 0) {
                // Add all related phrases as separate entries
                for (const phrase of relatedPhrases) {
                    const normalizedPhrase = phrase.toLowerCase();
                    if (!addedEntries.has(normalizedPhrase)) {
                        vocabularyEntries.push(phrase);
                        addedEntries.add(normalizedPhrase);
                    }
                }
            } else {
                // No related phrases found, add the word itself if it has translations
                const exactTranslations = this.lookupTranslation(word, AppState.promptLang);
                if (exactTranslations) {
                    const normalizedWord = word.toLowerCase();
                    if (!addedEntries.has(normalizedWord)) {
                        vocabularyEntries.push(word);
                        addedEntries.add(normalizedWord);
                    }
                } else {
                    // No exact translation either, still add the word for manual entry
                    const normalizedWord = word.toLowerCase();
                    if (!addedEntries.has(normalizedWord)) {
                        vocabularyEntries.push(word);
                        addedEntries.add(normalizedWord);
                    }
                }
            }
        }

        return vocabularyEntries;
    }

    lookupTranslation(word, currentLang) {
        const pairVocab = this.getCurrentLanguagePairVocab();
        const normalizedWord = word.toLowerCase();
        const [primaryLang, secondaryLang] = this.getLanguageOrder();
        const foundTranslations = new Set();
        
        // Search through the vocabulary array for exact matches
        for (const pair of pairVocab) {
            if (!Array.isArray(pair) || pair.length !== 2) continue;
            
            const [primaryWord, secondaryWord] = pair;
            
            // Check if current word matches either position
            if (currentLang === primaryLang && primaryWord.toLowerCase() === normalizedWord) {
                foundTranslations.add(secondaryWord);
            } else if (currentLang === secondaryLang && secondaryWord.toLowerCase() === normalizedWord) {
                foundTranslations.add(primaryWord);
            }
        }
        
        return foundTranslations.size > 0 ? Array.from(foundTranslations).join(', ') : '';
    }

    saveVocabularyPair(sourceWord, sourceLang, targetWord, targetLang) {
        const pairVocab = this.getCurrentLanguagePairVocab();
        const [primaryLang, secondaryLang] = this.getLanguageOrder();
        
        // Determine correct order based on language alphabetical order
        let primaryWord, secondaryWord;
        if (sourceLang === primaryLang) {
            primaryWord = sourceWord;
            secondaryWord = targetWord;
        } else {
            primaryWord = targetWord;
            secondaryWord = sourceWord;
        }
        
        // Check if this pair already exists (avoid duplicates)
        const normalizedPrimary = primaryWord.toLowerCase();
        const normalizedSecondary = secondaryWord.toLowerCase();
        
        const existingIndex = pairVocab.findIndex(pair => 
            Array.isArray(pair) && pair.length === 2 &&
            pair[0].toLowerCase() === normalizedPrimary &&
            pair[1].toLowerCase() === normalizedSecondary
        );
        
        if (existingIndex === -1) {
            // Add new pair
            pairVocab.push([primaryWord, secondaryWord]);
        } else {
            // Update existing pair (in case of capitalization changes)
            pairVocab[existingIndex] = [primaryWord, secondaryWord];
        }
    }

    updateVocabularyBox() {
        const vocabularyEntries = this.extractVocabularyEntriesFromPrompt();
        const vocabContainer = DOM.get('vocabContainer');
        
        if (!vocabContainer || vocabularyEntries.length === 0) {
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

        vocabularyEntries.forEach((entry, index) => {
            const wordRow = this.createVocabularyRow(entry, index);
            vocabGrid.appendChild(wordRow);
        });

        vocabContainer.appendChild(vocabGrid);
        
        // Enable vocabulary buttons
        DOM.setEnabled('wordsFromClipboardBtn', true);
        DOM.setEnabled('saveWordsBtn', true);
        DOM.setEnabled('verifyWordsBtn', vocabularyEntries.length > 0);
    }

    createVocabularyRow(word, index) {
        const row = DOM.createElement('div', {
            className: 'vocab-row'
        });

        // Source word (editable)
        const sourceInput = DOM.createElement('input', {
            type: 'text',
            className: 'vocab-source-input',
            value: word,
            placeholder: 'word/phrase...',
            'data-index': index
        });

        // Translation (editable, with lookup from central vocab)
        const existingTranslation = this.lookupTranslation(word, AppState.promptLang);
        const translationInput = DOM.createElement('input', {
            type: 'text',
            className: 'vocab-translation-input',
            value: existingTranslation,
            placeholder: 'add translation...',
            'data-index': index
        });

        row.appendChild(sourceInput);
        row.appendChild(translationInput);

        return row;
    }

    async loadVocabularyFromClipboard() {
        try {
            const clipboardText = await ClipboardUtils.readText();
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

    createVocabularyRowFromData(source, translation, index) {
        const row = DOM.createElement('div', {
            className: 'vocab-row'
        });

        const sourceInput = DOM.createElement('input', {
            type: 'text',
            className: 'vocab-source-input',
            value: source,
            placeholder: 'word/phrase...',
            'data-index': index
        });

        // Look up existing translation if not provided
        if (!translation && AppState.promptLang) {
            translation = this.lookupTranslation(source, AppState.promptLang);
        }

        const translationInput = DOM.createElement('input', {
            type: 'text',
            className: 'vocab-translation-input',
            value: translation,
            placeholder: 'add translation...',
            'data-index': index
        });

        row.appendChild(sourceInput);
        row.appendChild(translationInput);

        return row;
    }

    saveVocabulary() {
        const sourceInputs = document.querySelectorAll('.vocab-source-input');
        const translationInputs = document.querySelectorAll('.vocab-translation-input');
        
        if (!AppState.config || !AppState.config['langA-B']) {
            alert('No language configuration available.');
            return;
        }

        const [langA, langB] = AppState.config['langA-B'];
        const sourceLang = AppState.promptLang;
        const targetLang = sourceLang === langA ? langB : langA;
        
        let savedCount = 0;

        sourceInputs.forEach((sourceInput, index) => {
            const source = sourceInput.value.trim();
            const translationsText = translationInputs[index]?.value.trim();
            
            if (source) {
                // First, remove all existing pairs for this source word
                this.removeVocabularyPairsForSourceWord(source, sourceLang);
                
                // Then add the new translations (if any)
                if (translationsText) {
                    const translations = translationsText
                        .split(',')
                        .map(t => t.trim())
                        .filter(t => t.length > 0);
                    
                    translations.forEach(translation => {
                        this.saveVocabularyPair(source, sourceLang, translation, targetLang);
                        savedCount++;
                    });
                }
            }
        });

        if (savedCount > 0) {
            this.saveCentralVocabulary();
            alert(`Saved ${savedCount} vocabulary pairs (${sourceLang} ↔ ${targetLang}) to your central vocabulary.`);
        } else {
            this.saveCentralVocabulary(); // Still save to persist deletions
            alert('Vocabulary updated. Removed translations have been deleted.');
        }
    }

    removeVocabularyPairsForSourceWord(sourceWord, sourceLang) {
        const pairVocab = this.getCurrentLanguagePairVocab();
        const [primaryLang, secondaryLang] = this.getLanguageOrder();
        const normalizedSourceWord = sourceWord.toLowerCase();
        
        // Determine which position the source word should be in based on language order
        let sourceIsInPrimaryPosition = sourceLang === primaryLang;
        
        // Remove all pairs that have this source word
        for (let i = pairVocab.length - 1; i >= 0; i--) {
            const pair = pairVocab[i];
            if (!Array.isArray(pair) || pair.length !== 2) continue;
            
            const [primaryWord, secondaryWord] = pair;
            
            if (sourceIsInPrimaryPosition && primaryWord.toLowerCase() === normalizedSourceWord) {
                pairVocab.splice(i, 1);
            } else if (!sourceIsInPrimaryPosition && secondaryWord.toLowerCase() === normalizedSourceWord) {
                pairVocab.splice(i, 1);
            }
        }
    }

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

        const currentExercise = AppState.getCurrentExercise();
        const promptKey = AppState.promptLang === languages[0] ? 'A' : 'B';
        const currentPrompt = currentExercise[promptKey];

        const prompt = `Please verify these ${sourceLang} to ${targetLang} vocabulary translations in the context of "${currentPrompt}":

${wordPairs.map((pair, index) => `${pair.source} → ${pair.translation}`).join('\n')}

Output only the correct vocabulary list, formatted as "word → translation" or "word → translation1, translation2, ..." if necessary. Each on a separete line.`;

        ClipboardUtils.copyText(prompt, 'Vocabulary verification prompt copied to clipboard! Paste it into your AI assistant.');
    }

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