/**
 * Translation Manager
 * Handles opening Google Translate for current exercises
 */

import { AppState } from '../core/state.js';
import { DirectionManager } from './direction-manager.js';
import { ExerciseManager } from './exercise-manager.js';

export class TranslationManager {
    constructor() {
        this.directionManager = new DirectionManager();
        this.exerciseManager = new ExerciseManager();
    }

    /**
     * Open current exercise in Google Translate
     */
    openTranslation() {
        if (!AppState.hasExercises()) {
            console.warn('No exercises available for translation');
            return;
        }

        const exercise = AppState.getCurrentExercise();
        if (!exercise) {
            console.error('Current exercise not found');
            return;
        }

        const currentDirection = this.directionManager.getCurrentDirection(AppState.currentTaskIndex);
        const exerciseData = this.exerciseManager.getCurrentExerciseData(exercise, currentDirection);
        
        if (!exerciseData) {
            console.error('Exercise data not available');
            return;
        }

        const encodedPrompt = encodeURIComponent(exerciseData.prompt);
        
        let translateUrl;
        if (!exerciseData.promptLang || !exerciseData.solutionLang) {
            // Use auto-detect if language codes are not available
            translateUrl = `https://translate.google.com/?sl=auto&text=${encodedPrompt}`;
        } else {
            translateUrl = `https://translate.google.com/?sl=${exerciseData.promptLang}&tl=${exerciseData.solutionLang}&text=${encodedPrompt}`;
        }
        
        window.open(translateUrl, '_blank');
        console.log(`?? Opened translation: ${exerciseData.promptLang} ? ${exerciseData.solutionLang}`);
    }

    /**
     * Open arbitrary text in Google Translate
     */
    openTextTranslation(text, sourceLang = 'auto', targetLang = 'en') {
        const encodedText = encodeURIComponent(text);
        const translateUrl = `https://translate.google.com/?sl=${sourceLang}&tl=${targetLang}&text=${encodedText}`;
        window.open(translateUrl, '_blank');
    }

    /**
     * Generate Google Translate URL
     */
    generateTranslateURL(text, sourceLang = 'auto', targetLang = 'en') {
        const encodedText = encodeURIComponent(text);
        return `https://translate.google.com/?sl=${sourceLang}&tl=${targetLang}&text=${encodedText}`;
    }
}