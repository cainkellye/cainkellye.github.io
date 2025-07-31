/**
 * Exercise Manager
 * Handles exercise loading and word bank generation
 */

import { AppState } from '../core/state.js';
import { DirectionManager } from './direction-manager.js';
import { UIManager } from '../managers/ui-manager.js';
import { ArrayUtils, StringUtils } from '../utils/helpers.js';

export class ExerciseManager {
    constructor() {
        this.directionManager = new DirectionManager();
        this.uiManager = new UIManager();
    }

    getCurrentExerciseData(exercise, direction) {
        if (!exercise || !AppState.config) {
            return null;
        }

        const languages = AppState.config['langA-B'] || ['?', '?'];

        if (direction === 'AtoB') {
            return {
                prompt: exercise.A,
                solution: exercise.B,
                noise: exercise.noiseB || this.generateNoise('B', 5, exercise.B),
                promptLang: languages[0],
                solutionLang: languages[1],
                solutionWords: StringUtils.splitSentenceClean(exercise.B),
                noiseWords: this.parseNoiseWords(exercise.noiseB)
            };
        } else {
            return {
                prompt: exercise.B,
                solution: exercise.A,
                noise: exercise.noiseA || this.generateNoise('A', 5, exercise.A),
                promptLang: languages[1],
                solutionLang: languages[0],
                solutionWords: StringUtils.splitSentenceClean(exercise.A),
                noiseWords: this.parseNoiseWords(exercise.noiseA)
            };
        }
    }

    parseNoiseWords(noiseString) {
        if (!noiseString) return [];
        return StringUtils.splitSentenceClean(noiseString);
    }

    generateNoise(lang, count, solution) {
        const words = this.generateVocabulary(lang, 0);

        const solutionWords = StringUtils.splitSentenceClean(solution).map(w => w.toLowerCase());
        const filteredWords = words.filter(word => !solutionWords.includes(word.toLowerCase()));

        ArrayUtils.shuffle(filteredWords);
        return ArrayUtils.removeDuplicates(filteredWords, false).slice(0, count).join(' ');
    }

    generateVocabulary(lang, minLength = 0) {
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

    loadExercise(index) {
        if (!AppState.hasExercises()) {
            this.uiManager.setButtonsDisabled(true);
            this.showNoExercisesMessage();
            return;
        }

        const exercise = AppState.exercises[index];
        if (!exercise) {
            console.error('Exercise not found at index:', index);
            return;
        }

        const currentDirection = this.directionManager.getCurrentDirection(index);
        const exerciseData = this.getCurrentExerciseData(exercise, currentDirection);
        
        if (!exerciseData) {
            console.error('Failed to get exercise data');
            return;
        }

        AppState.promptLang = exerciseData.promptLang;
        AppState.solutionLang = exerciseData.solutionLang;

        const progress = AppState.getProgress();

        this.uiManager.updateLessonDisplay(exerciseData, progress);

        console.log(`Loaded exercise ${progress.current}/${progress.total} (${currentDirection})`);
    }

    showNoExercisesMessage() {
        const prompt = document.getElementById('prompt');
        const responseContainer = document.getElementById('response-container');
        const wordBankContainer = document.getElementById('word-bank-container');
        const feedback = document.getElementById('feedback');

        if (prompt) prompt.textContent = "No exercises loaded.";
        if (responseContainer) responseContainer.textContent = "";
        if (wordBankContainer) wordBankContainer.innerHTML = "";
        if (feedback) feedback.textContent = "";
    }

    getCurrentExerciseForValidation() {
        if (!AppState.hasExercises()) {
            return null;
        }

        const exercise = AppState.getCurrentExercise();
        const direction = this.directionManager.getCurrentDirection(AppState.currentTaskIndex);
        return this.getCurrentExerciseData(exercise, direction);
    }
}