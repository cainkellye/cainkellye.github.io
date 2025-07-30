/**
 * Mistakes Manager
 * Handles mistake tracking and analysis
 */

import { AppState } from '../core/state.js';
import { DOM } from '../core/dom.js';
import { PlatformUtils } from '../utils/helpers.js';

export class MistakesManager {
    /**
     * Record a mistake
     */
    recordMistake(mistakeData) {
        AppState.addMistake(mistakeData);
        console.log('Mistake recorded:', mistakeData);
    }

    /**
     * Clear all mistakes
     */
    clearAllMistakes() {
        AppState.clearMistakes();
        console.log('All mistakes cleared');
    }

    /**
     * Show mistakes modal
     */
    showMistakesModal() {
        this.refreshMistakesList();
        DOM.setVisible('mistakesModal', true);
    }

    /**
     * Hide mistakes modal
     */
    hideMistakesModal() {
        DOM.setVisible('mistakesModal', false);
    }

    /**
     * Refresh mistakes list in modal
     */
    refreshMistakesList() {
        DOM.clear('mistakesList');
        
        if (AppState.mistakes.length === 0) {
            DOM.setVisible('noMistakesMsg', true);
            DOM.setVisible('copyMistakes', false);
            DOM.setVisible('clearMistakes', false);
            return;
        }
        
        DOM.setVisible('noMistakesMsg', false);
        DOM.setVisible('copyMistakes', true);
        DOM.setVisible('clearMistakes', true);
        
        // Group mistakes by exercise and direction
        const groupedMistakes = this.groupMistakesByExercise();
        
        Object.keys(groupedMistakes).forEach(key => {
            const mistakes = groupedMistakes[key];
            const [exerciseIndex, direction] = key.split('_');
            
            // Create section header
            const sectionHeader = DOM.createElement('div', {
                className: 'mistake-section-header',
                innerHTML: `<h4>Exercise ${parseInt(exerciseIndex) + 1} (${this.getDirectionLabel(direction)})</h4>`
            });
            
            DOM.get('mistakesList')?.appendChild(sectionHeader);
            
            mistakes.forEach(mistake => {
                const mistakeItem = this.createMistakeItem(mistake);
                DOM.get('mistakesList')?.appendChild(mistakeItem);
            });
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

    /**
     * Get direction label for display
     */
    getDirectionLabel(direction) {
        if (!AppState.config || !AppState.config['langA-B']) {
            return direction;
        }
        
        const [langA, langB] = AppState.config['langA-B'];
        return direction === 'AtoB' ? `${langA} → ${langB}` : `${langB} → ${langA}`;
    }

    /**
     * Create mistake item element
     */
    createMistakeItem(mistake) {
        const item = DOM.createElement('div', {
            className: 'mistake-item'
        });
        
        const prompt = DOM.createElement('div', {
            className: 'mistake-prompt',
            textContent: `Prompt: "${mistake.prompt}"`
        });
        
        const solution = DOM.createElement('div', {
            className: 'mistake-solution',
            textContent: `Correct: "${mistake.solution}"`
        });
        
        const response = DOM.createElement('div', {
            className: 'mistake-response',
            textContent: `Your answer: "${mistake.userResponse}"`
        });
        
        item.appendChild(prompt);
        item.appendChild(solution);
        item.appendChild(response);
        
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
        
        try {
            if (PlatformUtils.hasClipboardAPI()) {
                await navigator.clipboard.writeText(text);
                alert('Mistakes copied to clipboard! You can now paste this into an LLM for analysis.');
            } else {
                PlatformUtils.fallbackCopyToClipboard(text);
            }
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            PlatformUtils.fallbackCopyToClipboard(text);
        }
    }
}