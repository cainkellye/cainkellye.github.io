/**
 * Mistakes Manager
 * Handles mistake tracking and analysis
 */

import { AppState } from '../core/state.js';
import { DOM } from '../core/dom.js';
import { ClipboardUtils, UIUtils } from '../utils/helpers.js';

export class MistakesManager {
    recordMistake(mistakeData) {
        AppState.addMistake(mistakeData);
        console.log('Mistake recorded:', mistakeData);
    }

    clearAllMistakes() {
        AppState.clearMistakes();
        console.log('All mistakes cleared');
    }

    showMistakesModal() {
        this.refreshMistakesList();
        DOM.setVisible('mistakesModal', true);
    }

    hideMistakesModal() {
        DOM.setVisible('mistakesModal', false);
    }

    refreshMistakesList() {
        DOM.clear('mistakesList');
        
        if (AppState.mistakes.length === 0) {
            this._showEmptyState();
            return;
        }
        
        this._showMistakesContent();
        
        // Group mistakes by exercise and direction
        const groupedMistakes = this.groupMistakesByExercise();
        
        Object.keys(groupedMistakes).forEach(key => {
            const mistakes = groupedMistakes[key];
            const [exerciseIndex, direction] = key.split('_');
            
            this._addMistakeSection(parseInt(exerciseIndex), direction, mistakes);
        });
    }

    _showEmptyState() {
        DOM.setVisible('noMistakesMsg', true);
        DOM.setVisible('copyMistakes', false);
        DOM.setVisible('clearMistakes', false);
    }

    _showMistakesContent() {
        DOM.setVisible('noMistakesMsg', false);
        DOM.setVisible('copyMistakes', true);
        DOM.setVisible('clearMistakes', true);
    }

    _addMistakeSection(exerciseIndex, direction, mistakes) {
        // Create section header
        const sectionHeader = DOM.createElement('div', {
            className: 'mistake-section-header',
            innerHTML: `<h4>Exercise ${exerciseIndex + 1} (${this.getDirectionLabel(direction)})</h4>`
        });
        
        DOM.get('mistakesList')?.appendChild(sectionHeader);
        
        mistakes.forEach(mistake => {
            const mistakeItem = this.createMistakeItem(mistake);
            DOM.get('mistakesList')?.appendChild(mistakeItem);
        });
    }

    /**
     * Group mistakes by exercise and direction
     */
    groupMistakesByExercise() {
        const grouped = {};
        AppState.mistakes.forEach(mistake => {
            const key = `${mistake.exerciseIndex}_${mistake.direction}`;
            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(mistake);
        });
        return grouped;
    }

    getDirectionLabel(direction) {
        if (!AppState.config || !AppState.config['langA-B']) {
            return direction;
        }
        
        const [langA, langB] = AppState.config['langA-B'];
        return direction === 'AtoB' ? `${langA} → ${langB}` : `${langB} → ${langA}`;
    }

    createMistakeItem(mistake) {
        const item = DOM.createElement('div', {
            className: 'mistake-item'
        });
        
        const mistakeFields = [
            { label: 'Prompt', value: mistake.prompt, className: 'mistake-prompt' },
            { label: 'Correct', value: mistake.solution, className: 'mistake-solution' },
            { label: 'Your answer', value: mistake.userResponse, className: 'mistake-response' }
        ];

        mistakeFields.forEach(field => {
            const fieldElement = DOM.createElement('div', {
                className: field.className,
                textContent: `${field.label}: "${field.value}"`
            });
            item.appendChild(fieldElement);
        });
        
        return item;
    }

    /**
     * Generate LLM-friendly text for analysis
     */
    generateLLMText() {
        if (AppState.mistakes.length === 0) {
            return 'No mistakes to analyze.';
        }
        
        const config = AppState.config;
        const languages = config['langA-B'] || ['Language A', 'Language B'];
        
        let text = `Please help me learn from my language learning mistakes. I'm studying ${languages[0]} ↔ ${languages[1]} with the lesson "${config.title}".\n\n`;
        text += `Here are my ${AppState.mistakes.length} mistakes:\n\n`;
        
        AppState.mistakes.forEach((mistake, index) => {
            const directionText = this.getDirectionLabel(mistake.direction);
            
            text += `${index + 1}. [${directionText}] Exercise ${mistake.exerciseIndex + 1}\n`;
            text += `   Prompt: "${mistake.prompt}"\n`;
            text += `   Correct: "${mistake.solution}"\n`;
            text += `   My answer: "${mistake.userResponse}"\n\n`;
        });
        
        text += 'Please briefly explain what I did wrong in each case and provide tips to avoid similar mistakes in the future.';
        
        return text;
    }

    /**
     * Copy mistakes to clipboard for LLM analysis
     */
    async copyMistakesToClipboard() {
        const text = this.generateLLMText();
        const successMessage = 'Mistakes copied to clipboard! You can now paste this into an LLM for analysis.';
        
        try {
            await ClipboardUtils.copyText(text, successMessage);
        } catch (error) {
            console.error('Failed to copy mistakes to clipboard:', error);
            UIUtils.showError('Failed to copy mistakes to clipboard');
        }
    }
}