/**
 * Vocabulary Box
 * Handles the vocabulary box functionality on the main exercise page
 */

import { AppState } from '../core/state.js';
import { DOM } from '../core/dom.js';
import { ClipboardUtils } from '../utils/helpers.js';
import { VocabularyRenderer } from '../utils/vocabulary-renderer.js';
import { VocabularyStorage } from './vocabulary-storage.js';

export class VocabularyBox {
    constructor() {
        this.vocabularyStorage = new VocabularyStorage();
    }

    updateVocabularyBox() {
        const prompt = AppState.getCurrentPrompt();
        const vocabularyEntries = this.vocabularyStorage.extractVocabularyEntriesFromPrompt(
            prompt, 
            AppState.promptLang, 
            AppState.config['langA-B']
        );
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
            const existingTranslation = this.vocabularyStorage.lookupTranslation(
                entry.toLowerCase(), 
                AppState.promptLang, 
                AppState.config['langA-B']
            );
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
            const vocabContainer = DOM.elements.vocabContainer;
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
                    translation = this.vocabularyStorage.lookupTranslation(
                        source, 
                        AppState.promptLang, 
                        AppState.config['langA-B']
                    );
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
            this.vocabularyStorage.removeVocabularyPairsForSourceWord(
                source, 
                sourceLang, 
                AppState.config['langA-B']
            );
            
            // Then add the new translations (if any)
            if (translation) {
                const translations = translation
                    .split(',')
                    .map(t => t.trim())
                    .filter(t => t.length > 0);
                
                translations.forEach(trans => {
                    this.vocabularyStorage.saveVocabularyPair(
                        source, 
                        sourceLang, 
                        trans, 
                        targetLang, 
                        AppState.config['langA-B']
                    );
                    savedCount++;
                });
            }
        });

        if (savedCount > 0) {
            this.vocabularyStorage.saveCurrentLanguagePairVocab(AppState.config['langA-B']);
            alert(`Saved ${savedCount} vocabulary pairs (${sourceLang} ↔ ${targetLang}) to your central vocabulary.`);
        } else {
            this.vocabularyStorage.saveCurrentLanguagePairVocab(AppState.config['langA-B']); // Still save to persist deletions
            alert('Vocabulary updated. Removed translations have been deleted.');
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