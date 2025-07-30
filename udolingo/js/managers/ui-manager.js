/**
 * UI Manager
 * Handles user interface operations and updates
 */

import { DOM } from '../core/dom.js';
import { AppState } from '../core/state.js';
import { ArrayUtils, DOMUtils } from '../utils/helpers.js';
import { StorageManager } from '../utils/storage-manager.js';

export class UIManager {
    constructor() {
        this.storageManager = new StorageManager();
    }

    /**
     * Set buttons enabled/disabled state
     */
    setButtonsDisabled(disabled) {
        const buttonIds = [
            'submit', 'clear', 'next', 'shuffle', 'back', 'translate',
            'vocab1', 'vocab2', 'mistakes', 'saveCurrent', 'share'
        ];
        
        buttonIds.forEach(id => {
            DOM.setEnabled(id, !disabled);
        });
    }

    /**
     * Show response input buttons
     */
    showResponseButtons() {
        DOM.setVisible('submit', true);
        DOM.setVisible('clear', true);
        DOM.setVisible('back', true);
        DOM.setContent('next', 'Skip');
    }

    /**
     * Hide response input buttons
     */
    hideResponseButtons() {
        DOM.setVisible('submit', false);
        DOM.setVisible('clear', false);
        DOM.setVisible('back', false);
        DOM.setContent('next', 'Next');
    }

    /**
     * Clear word bank container
     */
    clearWordBank() {
        DOM.clear('wordBankContainer');
    }

    /**
     * Update vocabulary buttons with language labels
     */
    updateVocabButtons(langAB) {
        if (!langAB || langAB.length < 2) return;
        DOM.setHTML('vocab1', `${langAB[0]} → ${langAB[1]} 📖`);
        DOM.setHTML('vocab2', `${langAB[1]} → ${langAB[0]} 📖`);
        DOM.setVisible('vocab1', true);
        DOM.setVisible('vocab2', true);
    }

    /**
     * Create a word bank button
     */
    createWordBankButton(word) {
        const button = DOM.createElement('button', {
            textContent: word,
            className: 'word-bank-btn',
            onClick: () => this.handleWordBankClick(word)
        });
        
        return button;
    }

    /**
     * Handle word bank button click
     */
    handleWordBankClick(word) {
        const responseContainer = DOM.get('responseContainer');
        if (!responseContainer) return;
        
        const currentResponse = responseContainer.textContent;
        AppState.prevResponses.push(currentResponse);
        
        const newResponse = currentResponse ? `${currentResponse} ${word}` : word;
        responseContainer.textContent = newResponse;
    }

    /**
     * Show feedback message
     */
    showFeedback(isCorrect, feedbackText = '') {
        const feedbackElement = DOM.get('feedback');
        if (!feedbackElement) return;
        
        if (isCorrect) {
            feedbackElement.textContent = 'Correct!';
            feedbackElement.style.color = 'green';
        } else {
            feedbackElement.innerHTML = feedbackText;
            feedbackElement.style.color = '';
        }
    }

    /**
     * Update control buttons based on loaded config
     */
    updateControlButtons() {
        const hasConfig = AppState.hasExercises();
        DOM.setEnabled('saveCurrent', hasConfig);
        DOM.setEnabled('share', hasConfig);
        DOM.setEnabled('shuffle', hasConfig);
        DOM.setEnabled('mistakes', hasConfig);
    }

    /**
     * Auto-collapse sidebar on mobile when performing actions
     */
    autoCollapseSidebarOnMobile() {
        if (window.innerWidth <= 768) {
            // Import SidebarManager if needed
            import('./sidebar-manager.js').then(({ SidebarManager }) => {
                const sidebarManager = new SidebarManager();
                sidebarManager.collapseSidebar();
            });
        }
    }

    /**
     * Show configuration modal
     */
    showConfigModal() {
        DOM.setVisible('configPanel', true);
    }

    /**
     * Hide configuration modal
     */
    hideConfigModal() {
        DOM.setVisible('configPanel', false);
    }

    /**
     * Switch between modal tabs
     */
    switchTab(tabName) {
        if (tabName === 'paste') {
            DOM.get('pasteTab')?.classList.add('active');
            DOM.get('savedTab')?.classList.remove('active');
            DOM.get('pasteTabBtn')?.classList.add('active');
            DOM.get('savedTabBtn')?.classList.remove('active');
        } else if (tabName === 'saved') {
            DOM.get('pasteTab')?.classList.remove('active');
            DOM.get('savedTab')?.classList.add('active');
            DOM.get('pasteTabBtn')?.classList.remove('active');
            DOM.get('savedTabBtn')?.classList.add('active');
            this.refreshSavedLessonsList();
        }
    }

    /**
     * Refresh the saved lessons list
     */
    refreshSavedLessonsList() {
        const savedLessons = this.storageManager.getSavedLessons();
        const lessonIds = Object.keys(savedLessons);
        
        DOM.clear('savedLessonsList');
        
        if (lessonIds.length === 0) {
            DOM.setVisible('noSavedLessonsMsg', true);
            return;
        }
        
        DOM.setVisible('noSavedLessonsMsg', false);
        
        lessonIds.forEach(id => {
            const lesson = savedLessons[id];
            const lessonItem = this.createSavedLessonItem(lesson);
            DOM.get('savedLessonsList')?.appendChild(lessonItem);
        });
    }

    /**
     * Create a saved lesson item element
     */
    createSavedLessonItem(lesson) {
        const item = DOM.createElement('div', {
            className: 'saved-lesson-item'
        });
        
        const info = DOM.createElement('div', {
            className: 'lesson-info'
        });
        
        const title = DOM.createElement('div', {
            className: 'lesson-title',
            textContent: lesson.title
        });
        
        const details = DOM.createElement('div', {
            className: 'lesson-details'
        });
        
        const dateAdded = new Date(lesson.dateAdded).toLocaleDateString();
        details.textContent = `${lesson.languages[0]} ↔ ${lesson.languages[1]} • ${lesson.exerciseCount} exercises • ${dateAdded}`;
        
        info.appendChild(title);
        info.appendChild(details);
        
        const actions = DOM.createElement('div', {
            className: 'lesson-actions'
        });
        
        const loadBtn = DOM.createElement('button', {
            className: 'load-lesson-btn',
            textContent: 'Load',
            onClick: () => this.handleLoadLesson(lesson.id)
        });
        
        const renameBtn = DOM.createElement('button', {
            className: 'rename-lesson-btn',
            textContent: 'Rename',
            onClick: () => this.showRenameModal(lesson.id, lesson.title)
        });
        
        const deleteBtn = DOM.createElement('button', {
            className: 'delete-lesson-btn',
            textContent: 'Delete',
            onClick: () => this.deleteSavedLesson(lesson.id)
        });
        
        actions.appendChild(loadBtn);
        actions.appendChild(renameBtn);
        actions.appendChild(deleteBtn);
        
        item.appendChild(info);
        item.appendChild(actions);
        
        return item;
    }

    /**
     * Handle loading a saved lesson
     */
    handleLoadLesson(lessonId) {
        import('./config-manager.js').then(({ ConfigManager }) => {
            const configManager = new ConfigManager();
            configManager.loadSavedLesson(lessonId);
        });
    }

    /**
     * Show rename modal
     */
    showRenameModal(lessonId, currentTitle) {
        AppState.currentRenameId = lessonId;
        
        const renameInput = DOM.get('renameInput');
        if (renameInput) {
            renameInput.value = currentTitle;
            renameInput.focus();
            renameInput.select();
        }
        
        DOM.setVisible('renameModal', true);
    }

    /**
     * Hide rename modal
     */
    hideRenameModal() {
        DOM.setVisible('renameModal', false);
        AppState.currentRenameId = null;
        DOM.setContent('renameInput', '');
    }

    /**
     * Delete saved lesson with confirmation
     */
    deleteSavedLesson(lessonId) {
        const lesson = this.storageManager.getSavedLesson(lessonId);
        if (lesson && confirm(`Are you sure you want to delete "${lesson.title}"?`)) {
            const success = this.storageManager.deleteLesson(lessonId);
            if (success) {
                this.refreshSavedLessonsList();
            } else {
                alert("Failed to delete lesson. Please try again.");
            }
        }
    }

    /**
     * Show save button when valid config is detected
     */
    showSaveButton(configData) {
        const isValid = configData && configData.exercises && configData.exercises.length > 0;
        DOM.setEnabled('loadSaveConfig', isValid);
    }

    /**
     * Update the main lesson display
     */
    updateLessonDisplay(exerciseData, progress) {
        if (!exerciseData) {
            DOM.setContent('prompt', 'No exercises loaded.');
            this.setButtonsDisabled(true);
            return;
        }

        this.setButtonsDisabled(false);
        this.showResponseButtons();

        // Display exercise counter and prompt
        const promptText = `${progress.current}/${progress.total}. Translate this: "${exerciseData.prompt}"`;
        DOM.setContent('prompt', promptText);

        // Create word bank
        const words = ArrayUtils.removeDuplicates(
            [...exerciseData.solutionWords, ...exerciseData.noiseWords]
        );
        ArrayUtils.shuffle(words);

        this.clearWordBank();
        const wordBankContainer = DOM.get('wordBankContainer');
        if (wordBankContainer) {
            words.forEach(word => {
                const button = this.createWordBankButton(word);
                wordBankContainer.appendChild(button);
            });
        }

        // Reset response state
        DOM.setContent('responseContainer', '');
        DOM.setContent('feedback', '');
        AppState.prevResponses = [];
    }

    /**
     * Show storage info modal (for debugging)
     */
    showStorageInfo() {
        const info = this.storageManager.getStorageInfo();
        const message = `Storage Info:
        
Available: ${info.isAvailable ? 'Yes' : 'No'}
Saved Lessons: ${info.lessonCount}
Udolingo Storage: ${info.formattedSize}
Total localStorage: ${info.formattedTotalSize}
Estimated Quota: ${info.estimatedQuota}`;
        
        alert(message);
    }

    /**
     * Update progress indicator if available
     */
    updateProgress(progress) {
        // This can be extended to show a progress bar or other indicators
        console.log(`Progress: ${progress.current}/${progress.total} (${progress.percentage}%)`);
    }

    /**
     * Show error message to user
     */
    showError(message, details = '') {
        console.error('UI Error:', message, details);
        
        // Show user-friendly error
        const userMessage = typeof message === 'string' ? message : 
            'An error occurred. Please check the console for details.';
        alert(userMessage);
    }

    /**
     * Show success message to user
     */
    showSuccess(message) {
        console.log('Success:', message);
        // Could be enhanced with toast notifications
        alert(message);
    }

    /**
     * Update the entire UI based on current state
     */
    updateUI() {
        this.updateControlButtons();
        this.updateProgress(AppState.getProgress());
        
        if (AppState.config) {
            this.updateVocabButtons(AppState.config['langA-B']);
        }
    }
}