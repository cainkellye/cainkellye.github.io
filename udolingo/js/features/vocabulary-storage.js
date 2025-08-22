/**
 * Vocabulary Storage
 * Handles vocabulary data storage, retrieval, and filtering operations
 */

import { StorageManager } from '../utils/storage-manager.js';
import { ArrayUtils, StringUtils } from '../utils/helpers.js';

export class VocabularyStorage {
    static currentLanguagePairKey = null; // lazy initialization
    static currentLanguagePairVocab = null; // lazy initialization

    constructor() {
        // Allow dependency injection for standalone use
        this.languagePair = null;
        this.currentLang = null;
        this.vocabularyData = null;
    }

    /**
     * Configure the vocabulary storage for standalone use
     * @param {string} languagePairKey - Language pair key (e.g., "en:hu")
     * @param {string} currentLang - Current source language
     * @param {Array} vocabularyData - Vocabulary data array
     */
    configureStandalone(languagePairKey, currentLang, vocabularyData) {
        this.languagePair = languagePairKey.split(':');
        this.currentLang = currentLang;
        this.vocabularyData = vocabularyData;
        console.log('VocabularyStorage configured for standalone mode:', {
            languagePair: this.languagePair,
            currentLang: this.currentLang,
            vocabularyCount: vocabularyData.length
        });
    }

    getCentralVocabulary() {
        return StorageManager.getCentralVocabulary() || {};
    }

    saveCurrentLanguagePairVocab(languagePairArray) {
        // Get the language pair key
        const pairKey = this.getLanguagePairKey(languagePairArray);
        
        if (!VocabularyStorage.currentLanguagePairKey || !VocabularyStorage.currentLanguagePairVocab) {
            console.error('Current language pair key or current vocabulary not initialized');
            return;
        }
        const centralVocab = this.getCentralVocabulary();
        const compressedLanguagePairVocab = StorageManager.compressData(VocabularyStorage.currentLanguagePairVocab);
        centralVocab[VocabularyStorage.currentLanguagePairKey] = compressedLanguagePairVocab;
        StorageManager.setCentralVocabulary(centralVocab);
    }

    getLanguageOrder(languagePairArray) {
        return (languagePairArray || this.getLanguagePairArray()).sort();
    }

    getLanguagePairKey(languagePairArray) {
        // Create consistent key regardless of lesson order (alphabetical)
        return this.getLanguageOrder(languagePairArray).join(':').toLowerCase();
    }

    getCurrentLanguagePairVocab(languagePairArray) {
        const pairKey = this.getLanguagePairKey(languagePairArray);
        if (VocabularyStorage.currentLanguagePairKey !== pairKey) {
            this._updateCurrentLanguagePairVocab(pairKey);
        }
        return VocabularyStorage.currentLanguagePairVocab;
    }

    _updateCurrentLanguagePairVocab(pairKey) {
        console.log(`Updating current language pair vocabulary for key: ${pairKey}`);
        VocabularyStorage.currentLanguagePairKey = pairKey;
        const centralVocab = this.getCentralVocabulary();
        if (!centralVocab[pairKey]) {
            centralVocab[pairKey] = [];
        }
        const decompressed = StorageManager.decompressData(centralVocab[pairKey]);
        console.log(`Loaded ${decompressed.length} entries for language pair: ${pairKey}`);
        VocabularyStorage.currentLanguagePairVocab = decompressed;
    }

    getVocabularyData(languagePairArray) {
        if (this.vocabularyData) {
            // Standalone mode
            return this.vocabularyData;
        }
        
        // AppState mode
        return this.getCurrentLanguagePairVocab(languagePairArray);
    }

    getCurrentLanguage() {
        if (this.currentLang) {
            // Standalone mode
            return this.currentLang;
        }
        
        // AppState mode - will be overridden by caller
        throw new Error('No current language available. Either configure standalone mode or pass current language.');
    }

    getLanguagePairArray() {
        if (this.languagePair) {
            // Standalone mode
            return this.languagePair;
        }
        
        // AppState mode - will be overridden by caller
        throw new Error('No language pair available. Either configure standalone mode or pass language pair.');
    }

    extractVocabularyEntriesFromPrompt(prompt, currentLang, languagePairArray) {
        // Use provided parameters or fall back to configured ones
        const lang = currentLang || this.getCurrentLanguage();
        this._tempLanguagePair = languagePairArray || this.getLanguagePairArray();

        const wordsFromPrompt = StringUtils.splitSentenceClean(prompt);
        const wordsFromPromptLower = wordsFromPrompt.map(w => w.toLowerCase());
        const vocabularyEntries = []; // Keeping the order of entries

        for (let i = 0; i < wordsFromPrompt.length; i++) {
            console.log(`Processing word ${i + 1}/${wordsFromPrompt.length}: "${wordsFromPrompt[i]}"`);
            const exactTranslations = this.lookupTranslation(wordsFromPromptLower[i], lang, languagePairArray);
            const strikedOut = exactTranslations === '---';
            let relatedPhrases = this.findRelatedPhrases(wordsFromPromptLower[i], lang, languagePairArray);
            
            if (relatedPhrases.length > 0) {
                let longestMatchingPhraseWords = 0;
                const longestMatchingPhrase = relatedPhrases.find(phrase => {
                    const phraseWordsLower = StringUtils.splitSentenceLower(phrase);
                    // Check if phrase words match the prompt words starting at index i
                    let j = 0;
                    for (; j < phraseWordsLower.length; j++) {
                        if (wordsFromPrompt.length <= i + j || phraseWordsLower[j] !== wordsFromPromptLower[i + j]) {
                            return false;
                        }
                    }
                    longestMatchingPhraseWords = j;
                    return true;
                });

                if (longestMatchingPhraseWords > 0) {
                    console.log(`Phrase matching prompt for ${i + 1}. word "${wordsFromPrompt[i]}":`, longestMatchingPhrase);
                    vocabularyEntries.push(longestMatchingPhrase);
                    i += longestMatchingPhraseWords - 1; // Skip ahead in the prompt
                    continue
                } else {
                    console.log(`No related phrases match prompt for ${i + 1}. word "${wordsFromPrompt[i]}"`);
                    // Add the word itself, as it appears in the prompt
                    if (!strikedOut) {
                        vocabularyEntries.push(wordsFromPrompt[i]);
                    }

                    if (exactTranslations || wordsFromPrompt[i].length < 3) {
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
                    vocabularyEntries.push(wordsFromPrompt[i]);
                }

                if (strikedOut || !exactTranslations || exactTranslations.length === 0) {
                    // Fetch related entries based on chopped prefix
                    const relatedEntriesByChop = this.findRelatedEntriesByChop(wordsFromPromptLower[i], lang, languagePairArray);

                    // Add all related entries
                    for (const relatedEntry of relatedEntriesByChop) {
                        vocabularyEntries.push(relatedEntry);
                    }
                }
            }
        }

        return ArrayUtils.removeDuplicates(vocabularyEntries);
    }

    lookupTranslation(word, currentLang, languagePairArray) {
        const pairVocab = this.getVocabularyData(languagePairArray);
        const [primaryLang, secondaryLang] = (languagePairArray || this.getLanguagePairArray()).sort();
        const foundTranslations = [];
        
        // Search through the vocabulary array for exact matches
        for (const pair of pairVocab) {
            const [primaryWord, secondaryWord] = pair;
            
            // Check if current word matches either position
            if (currentLang === primaryLang && primaryWord.toLowerCase() === word) {
                if (secondaryWord === '---') return '---'; // Striked out word
                foundTranslations.push(secondaryWord);
            } else if (currentLang === secondaryLang && secondaryWord.toLowerCase() === word) {
                if (primaryWord === '---') return '---'; // Striked out word
                foundTranslations.push(primaryWord);
            }
        }

        return foundTranslations.length > 0 ? foundTranslations.join(', ') : '';
    }

    findRelatedPhrases(word, currentLang, languagePairArray) {
        const pairVocab = this.getVocabularyData(languagePairArray);
        const [primaryLang, secondaryLang] = (languagePairArray || this.getLanguagePairArray()).sort();
        const relatedPhrases = [];
        
        // Search for entries that contain the word as a standalone word
        for (const pair of pairVocab) {
            const [primaryWord, secondaryWord] = pair;
            
            // Check if the word is contained in a larger phrase in the source language
            const entry = currentLang === primaryLang ? primaryWord : secondaryWord;
            const translation = currentLang === primaryLang ? secondaryWord : primaryWord;
            if (translation === '---') continue; // Skip striked out words

            if (this.containsStandaloneWord(entry, word)) {
                relatedPhrases.push(entry);
            }
        }

        return relatedPhrases;
    }
    
    containsStandaloneWord(phrase, word) {
        const len = word.length;
        if (len >= phrase.length) return false;

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

    findRelatedEntriesByChop(word, currentLang, languagePairArray) {
        if (word.length < 4) {
            // Skip very short words, as they are unlikely to have related phrases
            return [];
        }
        word = word.toLowerCase();
        const pairVocab = this.getVocabularyData(languagePairArray);
        const [primaryLang, secondaryLang] = (languagePairArray || this.getLanguagePairArray()).sort();
        const relatedEntries = [];

        const qPrefix = word.length > 5 ? this.choppedPrefix(word) : word;

        for (const pair of pairVocab) {
            const [primaryWord, secondaryWord] = pair;
            const entry = currentLang === primaryLang ? primaryWord : secondaryWord;
            if (entry.length < 4) { continue; } // Skip very short entries
            if (entry.indexOf(' ') !== -1) { continue; } // Skip multi-word phrases
            const translation = currentLang === primaryLang ? secondaryWord : primaryWord;
            if (translation === '---') continue; // Skip striked out words

            if (typeof entry !== "string") continue;

            const wPrefix = entry.length > 5 ? this.choppedPrefix(entry) : entry;

            // Symmetric chopped-prefix match
            if (
                (entry.toLowerCase().startsWith(qPrefix) || word.startsWith(wPrefix))) {
                relatedEntries.push(entry);
                console.log(`Found related entry by chop: "${entry}" for word "${word}"`);
            }
        }

        return relatedEntries;
    }
 
    choppedPrefix(str) {
        const len = str.length;
        const chopLen = Math.floor(len * 0.46);
        return str.slice(0, len - chopLen).toLowerCase();
    }

    saveVocabularyPair(sourceWord, sourceLang, targetWord, targetLang, languagePairArray) {
        const pairVocab = this.getCurrentLanguagePairVocab(languagePairArray);
        const [primaryLang, secondaryLang] = (languagePairArray || this.getLanguagePairArray()).sort();
        
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

    removeVocabularyPairsForSourceWord(sourceWord, sourceLang, languagePairArray) {
        const pairVocab = this.getCurrentLanguagePairVocab(languagePairArray);
        const [primaryLang, secondaryLang] = (languagePairArray || this.getLanguagePairArray()).sort();
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
}