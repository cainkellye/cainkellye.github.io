/**
 * Vocabulary Manager
 * Handles vocabulary extraction, central vocabulary storage, and translation links
 */

import { AppState } from '../core/state.js';
import { DOM } from '../core/dom.js';
import { StringUtils, ArrayUtils, ClipboardUtils } from '../utils/helpers.js';
import { StorageManager } from '../utils/storage-manager.js';
import { VocabularyRenderer } from '../utils/vocabulary-renderer.js';

export class VocabularyManager {
    static currentLanguagePairKey = null; // lazy initialization
    static currentLanguagePairVocab = null; // lazy initialization

    constructor() {
        // Allow dependency injection for standalone use
        this.languagePair = null;
        this.currentLang = null;
        this.vocabularyData = null;
    }

    getCentralVocabulary() {
        return StorageManager.getCentralVocabulary() || {};
    }

    saveCurrentLanguagePairVocab() {
        if (!VocabularyManager.currentLanguagePairKey || !VocabularyManager.currentLanguagePairVocab) {
            console.error('Current language pair key or current vocabulary not initialized');
            return;
        }
        const centralVocab = this.getCentralVocabulary();
        const compressedLanguagePairVocab = StorageManager.compressData(VocabularyManager.currentLanguagePairVocab);
        centralVocab[VocabularyManager.currentLanguagePairKey] = compressedLanguagePairVocab;
        StorageManager.setCentralVocabulary(centralVocab);
    }

    getLanguageOrder() {
        return this.getLanguagePairArray().sort();
    }

    getLanguagePairKey() {
        // Create consistent key regardless of lesson order (alphabetical)
        return this.getLanguageOrder().join(':').toLowerCase();
    }

    getCurrentLanguagePairVocab() {
        const pairKey = this.getLanguagePairKey();
        if (VocabularyManager.currentLanguagePairKey !== pairKey) {
            this._updateCurrentLanguagePairVocab(pairKey);
        }
        return VocabularyManager.currentLanguagePairVocab;
    }

    _updateCurrentLanguagePairVocab(pairKey) {
        console.log(`Updating current language pair vocabulary for key: ${pairKey}`);
        VocabularyManager.currentLanguagePairKey = pairKey;
        const centralVocab = this.getCentralVocabulary();
        if (!centralVocab[pairKey]) {
            centralVocab[pairKey] = [];
        }
        const decompressed = StorageManager.decompressData(centralVocab[pairKey]);
        console.log(`Loaded ${decompressed.length} entries for language pair: ${pairKey}`);
        VocabularyManager.currentLanguagePairVocab = decompressed;
    }

    /**
     * Configure the vocabulary manager for standalone use
     * @param {string} languagePairKey - Language pair key (e.g., "en:hu")
     * @param {string} currentLang - Current source language
     * @param {Array} vocabularyData - Vocabulary data array
     */
    configureStandalone(languagePairKey, currentLang, vocabularyData) {
        this.languagePair = languagePairKey.split(':');
        this.currentLang = currentLang;
        this.vocabularyData = vocabularyData;
        console.log('VocabularyManager configured for standalone mode:', {
            languagePair: this.languagePair,
            currentLang: this.currentLang,
            vocabularyCount: vocabularyData.length
        });
    }

    getVocabularyData() {
        if (this.vocabularyData) {
            // Standalone mode
            return this.vocabularyData;
        }
        
        // AppState mode
        return this.getCurrentLanguagePairVocab();
    }

    getCurrentLanguage() {
        if (this.currentLang) {
            // Standalone mode
            return this.currentLang;
        }
        
        // AppState mode
        if (AppState.promptLang) {
            return AppState.promptLang;
        }
        
        throw new Error('No current language available. Either configure standalone mode or ensure AppState.promptLang is set.');
    }

    getLanguagePairArray() {
        if (this.languagePair) {
            // Standalone mode
            return this.languagePair;
        }
        
        // AppState mode
        if (AppState.config && AppState.config['langA-B']) {
            return AppState.config['langA-B'];
        }
        
        throw new Error('No language pair available. Either configure standalone mode or ensure AppState.config is set.');
    }

    extractWordsFromPrompt(prompt) {
        if (!prompt) return [];

        const words = ArrayUtils.removeDuplicates(StringUtils.splitSentenceClean(prompt))
        return words;
    }

    extractVocabularyEntriesFromPrompt(prompt) {
        const wordsFromPrompt = this.extractWordsFromPrompt(prompt);
        const vocabularyEntries = [];
        const currentLang = this.getCurrentLanguage();
        
        for (const word of wordsFromPrompt) {
            const exactTranslations = this.lookupTranslation(word, currentLang);
            const strikedOut = exactTranslations === '---';
            let relatedPhrases = this.findRelatedPhrases(word, currentLang);
            
            if (relatedPhrases.length > 0) {
                const phrasesInPrompt = relatedPhrases.filter(phrase => prompt.toLowerCase().includes(phrase.toLowerCase()));
                if (phrasesInPrompt.length > 0) {
                    // If some related phrases are in the prompt, filter to only those
                    relatedPhrases = phrasesInPrompt;
                } else {
                    // Add the word itself, as it appears in the prompt
                    if (!strikedOut) {
                        vocabularyEntries.push(word);
                    }

                    if (exactTranslations || word.length < 3) {
                        // Skip if we have exact translations or if the word is too short
                        continue;
                    }
                } 

                // Add all related phrases as separate entries
                for (const phrase of relatedPhrases) {
                    vocabularyEntries.push(phrase);
                }
            } else {
                // No related phrases found, add the word itself
                if (!strikedOut) {
                    vocabularyEntries.push(word);
                }

                if (strikedOut || !exactTranslations || exactTranslations.length === 0) {
                    // Fetch related entries based on chopped prefix
                    const relatedEntriesByChop = this.findRelatedEntriesByChop(word, currentLang);

                    // Add all related entries
                    for (const relatedEntry of relatedEntriesByChop) {
                        vocabularyEntries.push(relatedEntry);
                    }
                }
            }
        }

        return ArrayUtils.removeDuplicates(vocabularyEntries);
    }

    lookupTranslation(word, currentLang) {
        const pairVocab = this.getVocabularyData();
        const normalizedWord = word.toLowerCase();
        const [primaryLang, secondaryLang] = this.getLanguageOrder();
        const foundTranslations = new Set();
        
        // Search through the vocabulary array for exact matches
        for (const pair of pairVocab) {
            if (!Array.isArray(pair) || pair.length !== 2) continue;
            
            const [primaryWord, secondaryWord] = pair;
            
            // Check if current word matches either position
            if (currentLang === primaryLang && primaryWord.toLowerCase() === normalizedWord) {
                if (secondaryWord === '---') return '---'; // Striked out word
                foundTranslations.add(secondaryWord);
            } else if (currentLang === secondaryLang && secondaryWord.toLowerCase() === normalizedWord) {
                if (primaryWord === '---') return '---'; // Striked out word
                foundTranslations.add(primaryWord);
            }
        }
        
        return foundTranslations.size > 0 ? Array.from(foundTranslations).join(', ') : '';
    }

    findRelatedPhrases(word, currentLang) {
        const pairVocab = this.getVocabularyData();
        const [primaryLang, secondaryLang] = this.getLanguageOrder();
        const relatedPhrases = new Set();
        word = word.toLowerCase();
        
        // Search for entries that contain the word as a standalone word
        for (const pair of pairVocab) {
            const [primaryWord, secondaryWord] = pair;
            
            // Check if the word is contained in a larger phrase in the source language
            const entry = currentLang === primaryLang ? primaryWord : secondaryWord;
            const translation = currentLang === primaryLang ? secondaryWord : primaryWord;
            if (translation === '---') continue; // Skip striked out words

            if (this.containsStandaloneWord(entry, word)) {
                relatedPhrases.add(entry);
                console.log(`Found related phrase: "${entry}" for word "${word}"`);
            }
        }

        // TODO return translations too, as we already have them

        console.log("Related phrases found:", relatedPhrases);
        relatedPhrases.delete(word); // Remove the exact word itself if present
        console.log("Removed exact match, remaining related phrases:", relatedPhrases);
        return Array.from(relatedPhrases);
    }
    
     containsStandaloneWord(phrase, word) {
        const len = word.length;
        phrase = phrase.toLowerCase();
        let index = phrase.indexOf(word);

        while (index !== -1) {
            const before = index === 0 ? '' : phrase[index - 1];
            const after = index + len >= phrase.length ? '' : phrase[index + len];

            const isBeforeValid = before === '' || !this.isAlpha(before);
            const isAfterValid = after === '' || !this.isAlpha(after);

            if (isBeforeValid && isAfterValid) {
                return true;
            }

            index = phrase.indexOf(word, index + len);
        }

        return false;
    }

     isAlpha(char) {
        const code = char.codePointAt(0);
        return (code >= 65 && code <= 90) || (code >= 97 && code <= 122) || (code >= 192 && code <= 687);
    }

    findRelatedEntriesByChop(word, currentLang) {
        if (word.length < 4) {
            // Skip very short words, as they are unlikely to have related phrases
            return [];
        }
        const pairVocab = this.getVocabularyData();
        const [primaryLang, secondaryLang] = this.getLanguageOrder();
        const relatedPhrases = new Set();

        const qPrefix = word.length > 5 ? this.choppedPrefix(word) : word;

        for (const pair of pairVocab) {
            const [primaryWord, secondaryWord] = pair;
            const entry = currentLang === primaryLang ? primaryWord : secondaryWord;
            if (entry.indexOf(' ') !== -1) { continue; } // Skip multi-word phrases
            const translation = currentLang === primaryLang ? secondaryWord : primaryWord;
            if (translation === '---') continue; // Skip striked out words

            if (typeof entry !== "string") continue;

            const wPrefix = entry.length > 5 ? this.choppedPrefix(entry) : entry;

            // Symmetric chopped-prefix match
            if (
                (entry.startsWith(qPrefix) || word.startsWith(wPrefix))) {
                relatedPhrases.add(entry);
                console.log(`Found related entry by chop: "${entry}" for word "${word}"`);
            }
        }

        relatedPhrases.delete(word); // Remove exact match
        return Array.from(relatedPhrases);
    }
 
    choppedPrefix(str) {
        const len = str.length;
        const chopLen = Math.floor(len * 0.46);
        return str.slice(0, len - chopLen);
    }

    updateVocabularyBox() {
        const prompt = AppState.getCurrentPrompt();
        const vocabularyEntries = this.extractVocabularyEntriesFromPrompt(prompt);
        const vocabContainer = DOM.elements.vocabContainer;
        
        if (!vocabContainer || vocabularyEntries.length === 0) {
            if (vocabContainer) {
                vocabContainer.innerHTML = '<p>No vocabulary words found in current exercise.</p>';
            }
            return;
        }

        // Clear existing content
        vocabContainer.innerHTML = '';

        // Create vocabulary grid
        const vocabGrid = VocabularyRenderer.createVocabularyGrid();

        vocabularyEntries.forEach((entry, index) => {
            const existingTranslation = this.lookupTranslation(entry, AppState.promptLang);
            VocabularyRenderer.createVocabularyRow(entry, existingTranslation, vocabGrid, index);
        });

        // Insert the add empty row button
        VocabularyRenderer.addGridAddButton(vocabGrid, () => {
            this.addNewVocabularyEntry(vocabGrid);
        });

        vocabContainer.appendChild(vocabGrid);
        
        // Enable vocabulary buttons
        DOM.setEnabled('wordsFromClipboardBtn', true);
        DOM.setEnabled('saveWordsBtn', true);
        DOM.setEnabled('verifyWordsBtn', vocabularyEntries.length > 0);
    }

    addNewVocabularyEntry(vocabGrid) {
        if (!vocabGrid) {
            // Create new grid if none exists
            vocabGrid = VocabularyRenderer.createVocabularyGrid();
            vocabContainer.innerHTML = '';
            vocabContainer.appendChild(vocabGrid);
        }

        // Add new empty row
        VocabularyRenderer.createVocabularyRow('', '', vocabGrid);
        
        // Re-add the grid add button
        VocabularyRenderer.addGridAddButton(vocabGrid, () => {
            this.addNewVocabularyEntry(vocabGrid);
        });
        
        // Focus on the new input
        VocabularyRenderer.focusLastSourceInput(vocabGrid);
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
        const vocabContainer = DOM.elements.vocabContainer;
        
        if (!vocabContainer) return;

        // Clear existing content
        vocabContainer.innerHTML = '';

        // Create vocabulary grid
        const vocabGrid = VocabularyRenderer.createVocabularyGrid();

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

            if (source) {
                // Look up existing translation if not provided
                if (!translation && AppState.promptLang) {
                    translation = this.lookupTranslation(source, AppState.promptLang);
                }
                VocabularyRenderer.createVocabularyRow(source, translation, vocabGrid, index);
            }
        });

        // Insert the add empty row button
        VocabularyRenderer.addGridAddButton(vocabGrid, () => {
            this.addNewVocabularyEntry(vocabGrid);
        });

        vocabContainer.appendChild(vocabGrid);
        
        // Enable buttons
        DOM.setEnabled('verifyWordsBtn', lines.length > 0);
        DOM.setEnabled('saveWordsBtn', true);
    }

    saveVocabulary() {
        if (!AppState.config || !AppState.config['langA-B']) {
            alert('No language configuration available.');
            return;
        }

        const [langA, langB] = AppState.config['langA-B'];
        const sourceLang = AppState.promptLang;
        const targetLang = sourceLang === langA ? langB : langA;
        
        const entries = VocabularyRenderer.getVocabularyInputs();
        let savedCount = 0;

        entries.forEach(entry => {
            const { source, translation } = entry;
            
            // First, remove all existing pairs for this source word
            this.removeVocabularyPairsForSourceWord(source, sourceLang);
            
            // Then add the new translations (if any)
            if (translation) {
                const translations = translation
                    .split(',')
                    .map(t => t.trim())
                    .filter(t => t.length > 0);
                
                translations.forEach(trans => {
                    this.saveVocabularyPair(source, sourceLang, trans, targetLang);
                    savedCount++;
                });
            }
        });

        if (savedCount > 0) {
            this.saveCurrentLanguagePairVocab();
            alert(`Saved ${savedCount} vocabulary pairs (${sourceLang} ↔ ${targetLang}) to your central vocabulary.`);
        } else {
            this.saveCurrentLanguagePairVocab(); // Still save to persist deletions
            alert('Vocabulary updated. Removed translations have been deleted.');
        }
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
        
        pairVocab.push([primaryWord, secondaryWord]);
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
        const entries = VocabularyRenderer.getVocabularyInputs();

        if (entries.length === 0) {
            alert('No vocabulary words to verify.');
            return;
        }

        const languages = AppState.config?.['langA-B'] || ['Language A', 'Language B'];
        const sourceLang = AppState.promptLang === languages[0] ? languages[0] : languages[1];
        const targetLang = AppState.promptLang === languages[0] ? languages[1] : languages[0];

        const currentExercise = AppState.getCurrentExercise();
        const promptKey = AppState.promptLang === languages[0] ? 'A' : 'B';
        const currentPrompt = currentExercise[promptKey];

        const prompt = `Please correct this list of ${sourceLang} → ${targetLang} vocabulary translations, focusing on the sentence "${currentPrompt}":

${entries.map(entry => `${entry.source} → ${entry.translation || '[missing]'}`).join('\n')}

Only output the correct vocabulary list, in a copyable code block.
Format as "expression → translation1, translation2, ...", each on a separete line.
Add phrases, if the word-for-word translation is not accurate.
You may add or remove lines.`;

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