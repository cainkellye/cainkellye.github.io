/**
 * Answer Validator
 * Handles answer validation and feedback generation
 */

import { AppState } from '../core/state.js';
import { StringUtils } from '../utils/helpers.js';

export class AnswerValidator {
    constructor() {
        // Avoid circular dependency by importing managers on demand
    }

    async validateAnswer(userResponse) {
        const exerciseData = await this.getCurrentExerciseForValidation();
        if (!exerciseData) {
            console.error('No exercise data available for validation');
            return;
        }

        // Check if we have valid data
        if (!exerciseData.solution || !exerciseData.prompt) {
            console.error('Invalid exercise data - missing solution or prompt:', exerciseData);
            return;
        }

        const solution = StringUtils.removePunctuation(exerciseData.solution);
        
        // Clear word bank and hide response buttons
        await this.clearWordBankAndButtons();

        // Check if answer is correct
        if (userResponse === solution) {
            await this.showFeedback(true);
            console.log('Answer correct!');
            return;
        }

        // Record the mistake
        await this.recordMistake({
            prompt: exerciseData.prompt,
            solution: exerciseData.solution,
            userResponse: userResponse,
            exerciseIndex: AppState.currentTaskIndex,
            direction: await this.getCurrentDirection(),
            promptLang: exerciseData.promptLang,
            solutionLang: exerciseData.solutionLang
        });

        // Generate detailed feedback
        const feedbackHtml = this.generateDetailedFeedback(userResponse, solution);
        await this.showFeedback(false, feedbackHtml);
        
        console.log('Answer incorrect');
    }

    async getCurrentExerciseForValidation() {
        if (!AppState.hasExercises()) {
            console.warn('No exercises available in AppState');
            return null;
        }

        try {
            // Import and use ExerciseManager on demand to avoid circular dependency
            const { ExerciseManager } = await import('./exercise-manager.js');
            const exerciseManager = new ExerciseManager();
            const exerciseData = exerciseManager.getCurrentExerciseForValidation();
            
            if (!exerciseData) {
                console.error('ExerciseManager returned null exercise data');
                return null;
            }

            // Validate the exercise data structure
            if (!exerciseData.prompt || !exerciseData.solution) {
                console.error('Exercise data is missing required fields:', {
                    hasPrompt: !!exerciseData.prompt,
                    hasSolution: !!exerciseData.solution,
                    promptValue: exerciseData.prompt,
                    solutionValue: exerciseData.solution,
                    fullData: exerciseData
                });
                return null;
            }

            return exerciseData;
        } catch (error) {
            console.error('Error getting current exercise for validation:', error);
            return null;
        }
    }

    async getCurrentDirection() {
        try {
            // Import DirectionManager on demand to avoid circular dependency
            const { DirectionManager } = await import('./direction-manager.js');
            const directionManager = new DirectionManager();
            return directionManager.getCurrentDirection(AppState.currentTaskIndex);
        } catch (error) {
            console.error('Error getting current direction:', error);
            return 'AtoB'; // Default fallback
        }
    }

    async clearWordBankAndButtons() {
        try {
            // Import UIManager on demand
            const { UIManager } = await import('../managers/ui-manager.js');
            const uiManager = new UIManager();
            uiManager.clearWordBank();
            uiManager.hideResponseButtons();
        } catch (error) {
            console.error('Error clearing word bank and buttons:', error);
        }
    }

    async showFeedback(isCorrect, feedbackText = '') {
        try {
            // Import UIManager on demand
            const { UIManager } = await import('../managers/ui-manager.js');
            const uiManager = new UIManager();
            uiManager.showFeedback(isCorrect, feedbackText);
        } catch (error) {
            console.error('Error showing feedback:', error);
        }
    }

    async recordMistake(mistakeData) {
        try {
            // Validate mistake data before recording
            if (!mistakeData.prompt || !mistakeData.solution) {
                console.error('Cannot record mistake - invalid data:', mistakeData);
                return;
            }

            AppState.addMistake(mistakeData);
            console.log('Mistake recorded:', mistakeData);
        } catch (error) {
            console.error('Error recording mistake:', error);
        }
    }

    generateDetailedFeedback(userResponse, solution) {
        try {
            const userWords = StringUtils.splitSentenceClean(userResponse);
            const solWords = StringUtils.splitSentenceClean(solution);
            const solWordsOriginal = StringUtils.splitSentence(solution);

            // Find common prefix
            let prefixCount = 0;
            while (
                prefixCount < userWords.length &&
                prefixCount < solWords.length &&
                userWords[prefixCount] === solWords[prefixCount]
            ) {
                prefixCount++;
            }

            // Find common suffix
            let suffixCount = 0;
            while (
                suffixCount < (solWords.length - prefixCount) &&
                suffixCount < (userWords.length - prefixCount) &&
                userWords[userWords.length - 1 - suffixCount] === solWords[solWords.length - 1 - suffixCount]
            ) {
                suffixCount++;
            }

            // Generate highlighted feedback
            const prefixText = solWordsOriginal.slice(0, prefixCount).join(' ');
            const mismatchText = solWordsOriginal.slice(prefixCount, solWords.length - suffixCount).join(' ');
            const suffixText = solWordsOriginal.slice(solWords.length - suffixCount).join(' ');

            return 'Incorrect. The correct answer is: "' + 
                (prefixText ? '<span style="color:black;">' + prefixText + '</span> ' : '') +
                (mismatchText ? '<span style="color:red;">' + mismatchText + '</span>' : '') +
                (suffixText ? '<span style="color:black;"> ' + suffixText + '</span>"' : '"');
        } catch (error) {
            console.error('Error generating detailed feedback:', error);
            return `Incorrect. The correct answer is: "${solution}"`;
        }
    }
}