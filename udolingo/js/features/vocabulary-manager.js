/**
 * Vocabulary Manager
 * Handles vocabulary extraction and translation links
 */

import { AppState } from '../core/state.js';
import { StringUtils, ArrayUtils } from '../utils/helpers.js';

export class VocabularyManager {
    /**
     * Generate vocabulary list from exercises
     */
    generateVocabulary(lang, minLength = 4) {
        const words = [];
        
        AppState.exercises.forEach(exercise => {
            const sentence = lang === 'A' ? exercise.A : exercise.B;
            if (sentence) {
                const exerciseWords = StringUtils.splitSentenceClean(sentence);
                if (minLength === 0) {
                    words.push(...exerciseWords);
                } else {
                    exerciseWords.forEach(word => {
                        if (word.length >= minLength) {
                            words.push(word);
                        }
                    });
                }
            }
        });

        return ArrayUtils.removeDuplicates(words, false);
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
        const vocab = this.generateVocabulary(lang, 4);
        
        if (vocab.length === 0) {
            alert('No vocabulary words found for this lesson.');
            return;
        }

        const encodedPrompt = encodeURIComponent(vocab.join(';\n'));
        const translateUrl = `https://translate.google.com/?sl=${sourceLang}&tl=${targetLang}&text=${encodedPrompt}`;
        
        window.open(translateUrl, '_blank');
        console.log(`?? Opened vocabulary (${sourceLang} ? ${targetLang}) with ${vocab.length} words`);
    }

    /**
     * Get vocabulary statistics
     */
    getVocabularyStats() {
        if (!AppState.config || !AppState.exercises.length) {
            return { langA: 0, langB: 0, unique: 0, total: 0 };
        }

        const vocabA = this.generateVocabulary('A', 0);
        const vocabB = this.generateVocabulary('B', 0);
        const allWords = [...vocabA, ...vocabB];
        const uniqueWords = ArrayUtils.removeDuplicates(allWords, false);

        return {
            langA: vocabA.length,
            langB: vocabB.length,
            unique: uniqueWords.length,
            total: allWords.length
        };
    }

    /**
     * Export vocabulary as text
     */
    exportVocabulary(format = 'simple') {
        if (!AppState.config) {
            return '';
        }

        const languages = AppState.config['langA-B'];
        const vocabA = this.generateVocabulary('A', 0);
        const vocabB = this.generateVocabulary('B', 0);

        switch (format) {
            case 'simple':
                return `${languages[0]} words:\n${vocabA.join(', ')}\n\n${languages[1]} words:\n${vocabB.join(', ')}`;
            
            case 'csv':
                const maxLength = Math.max(vocabA.length, vocabB.length);
                let csv = `${languages[0]},${languages[1]}\n`;
                for (let i = 0; i < maxLength; i++) {
                    csv += `${vocabA[i] || ''},${vocabB[i] || ''}\n`;
                }
                return csv;
            
            case 'json':
                return JSON.stringify({
                    lesson: AppState.config.title,
                    languages: languages,
                    vocabulary: {
                        [languages[0]]: vocabA,
                        [languages[1]]: vocabB
                    }
                }, null, 2);
            
            default:
                return this.exportVocabulary('simple');
        }
    }
}