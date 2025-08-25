/**
 * UI Manager
 * Handles user interface operations and updates
 */

import { DOM } from '../core/dom.js';
import { AppState } from '../core/state.js';
import { ArrayUtils, UIUtils, ClipboardUtils } from '../utils/helpers.js';
import { StorageManager } from '../utils/storage-manager.js';

export class UIManager {
    constructor() {
    }

    updateLessonDisplay(exerciseData, progress) {
        if (!exerciseData) {
            DOM.setContent('prompt', 'No exercises loaded.');
            this.setButtonsDisabled(true);
            return;
        }

        this.setButtonsDisabled(false);
        this.showResponseButtons();
        this.updateLessonMascot('normal');

        // Display exercise counter and prompt
        const promptText = `${progress.current}/${progress.total}. Translate this: "${exerciseData.prompt}"`;
        DOM.setContent('prompt', promptText);

        // Create word bank
        const words = [...exerciseData.solutionWords, ...exerciseData.noiseWords];
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

    setButtonsDisabled(disabled) {
        const buttonIds = [
            'submit', 'clear', 'next', 'shuffle', 'translate',
            'vocab1', 'vocab2', 'mistakes', 'saveCurrent', 'share'
        ];
        
        buttonIds.forEach(id => {
            DOM.setEnabled(id, !disabled);
        });
    }

    showResponseButtons() {
        DOM.setVisible('submit', true);
        DOM.setVisible('clear', true);
        DOM.setContent('next', 'Skip');
    }

    hideResponseButtons() {
        DOM.setVisible('submit', false);
        DOM.setVisible('clear', false);
        DOM.setContent('next', 'Next');
    }

    clearWordBank() {
        DOM.clear('wordBankContainer');
    }

    updateVocabButtons(langAB) {
        if (!langAB || langAB.length < 2) return;
        DOM.setHTML('vocab1', `${langAB[0]} → ${langAB[1]} 📖`);
        DOM.setHTML('vocab2', `${langAB[1]} → ${langAB[0]} 📖`);
        DOM.setVisible('vocab1', true);
        DOM.setVisible('vocab2', true);
    }

    initializeVocabularyBox() {
        const vocabContent = DOM.elements.vocabBoxContent;
        const vocabToggle = DOM.elements.vocabToggle;
        
        if (vocabContent && vocabToggle) {
            vocabContent.style.display = 'none';
            vocabToggle.classList.remove('rotated');
        }
    }

    toggleVocabularyBox() {
        const vocabContent = DOM.elements.vocabBoxContent;
        const vocabToggle = DOM.elements.vocabToggle;
        
        if (!vocabContent || !vocabToggle) return;

        const isOpen = this.vocabularyBoxIsOpen();
        
        vocabContent.style.display = isOpen ? 'none' : 'block';

        if (isOpen) {
            vocabToggle.classList.remove('rotated');
        } else {
            vocabToggle.classList.add('rotated');
        }
    }

    vocabularyBoxIsOpen() {
        const vocabContent = DOM.elements.vocabBoxContent;
        return vocabContent && vocabContent.style.display !== 'none';
    }

    createWordBankButton(word) {
        const button = DOM.createElement('button', {
            textContent: word,
            className: 'word-bank-btn',
            onClick: () => { this.handleWordBankClick(word, button); }
        });
        
        return button;
    }

    createResponseButton(word, bankButton) {
        const button = DOM.createElement('button', {
            textContent: word,
            className: 'response-btn',
            onClick: () => { this.handleResponseClick(word, button, bankButton); }
        });
        
        return button;
    }

    handleWordBankClick(word, button) {
        const responseButton = this.createResponseButton(word, button);
        DOM.elements.responseContainer.appendChild(responseButton);
        button.disabled = true;
    }

    handleResponseClick(word, button, bankButton) {
        const responseContainer = DOM.elements.responseContainer;
        if (!responseContainer) return;
        
        responseContainer.removeChild(button);

        bankButton.disabled = false;
    }

    flattenResponse() {
        const responseContainer = DOM.elements.responseContainer;
        if (!responseContainer) return;
        const responseButtons = Array.from(responseContainer.children);
        const responseWords = responseButtons.map(btn => btn.textContent.trim()).filter(Boolean);
        const response = responseWords.join(' ');
        return response;
    }

    swapResponse(response) {
        DOM.setContent('responseContainer', response);
    }

    clearResponse() {
        DOM.setContent('responseContainer', '');
        DOM.elements.wordBankContainer.childNodes.forEach(button => {
            button.disabled = false;
        });
    }

    showFeedback(isCorrect, feedbackText = '') {
        const feedbackElement = DOM.get('feedback');
        if (!feedbackElement) return;
        
        if (isCorrect) {
            this.updateLessonMascot('happy');
            feedbackElement.textContent = 'Correct!';
            feedbackElement.style.color = 'green';
        } else {
            this.updateLessonMascot('lecture');
            feedbackElement.innerHTML = feedbackText;
            feedbackElement.style.color = '';
        }
    }

    updateControlButtons() {
        const hasConfig = AppState.hasExercises();
        DOM.setEnabled('saveCurrent', hasConfig);
        DOM.setEnabled('share', hasConfig);
        DOM.setEnabled('shuffle', hasConfig);
        DOM.setEnabled('mistakes', hasConfig);
    }

    updateTitle(title) {
        DOM.setContent('lesson-title', title);
    }

    updateLessonMascot(state) {
        switch (state) {
            case 'happy':
                DOM.setImage('lesson-mascot', 'images/udo-happy.png');
                break
            case 'lecture':
                DOM.setImage('lesson-mascot', 'images/udo-lecture.png');
                break;
            default:
            case 'normal':
                DOM.setImage('lesson-mascot', 'images/udo-normal.png');
                break;
        }
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

    showConfigModal() {
        DOM.setVisible('configPanel', true);
    }

    hideConfigModal() {
        DOM.setVisible('configPanel', false);
    }

    switchTab(tabName) {
        const tabConfigs = {
            paste: {
                activeTab: 'pasteTab',
                activeBtn: 'pasteTabBtn',
                inactiveTab: 'savedTab',
                inactiveBtn: 'savedTabBtn'
            },
            saved: {
                activeTab: 'savedTab',
                activeBtn: 'savedTabBtn',
                inactiveTab: 'pasteTab',
                inactiveBtn: 'pasteTabBtn',
                callback: () => this.refreshSavedLessonsList()
            }
        };

        const config = tabConfigs[tabName];
        if (!config) return;

        // Set active states
        DOM.get(config.activeTab)?.classList.add('active');
        DOM.get(config.activeBtn)?.classList.add('active');
        
        // Remove active states from inactive elements
        DOM.get(config.inactiveTab)?.classList.remove('active');
        DOM.get(config.inactiveBtn)?.classList.remove('active');

        // Execute callback if available
        if (config.callback) {
            config.callback();
        }
    }

    refreshSavedLessonsList() {
        const savedLessons = StorageManager.getSavedLessons();
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

    createSavedLessonItem(lesson) {
        const item = DOM.createElement('div', {
            className: 'saved-lesson-item'
        });
        
        const info = this._createLessonInfo(lesson);
        const actions = this._createLessonActions(lesson);
        
        item.appendChild(info);
        item.appendChild(actions);
        
        return item;
    }

    _createLessonInfo(lesson) {
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
        
        return info;
    }

    _createLessonActions(lesson) {
        const actions = DOM.createElement('div', {
            className: 'lesson-actions'
        });
        
        const actionButtons = [
            {
                className: 'load-lesson-btn',
                textContent: 'Load',
                onClick: () => this.handleLoadLesson(lesson.id)
            },
            {
                className: 'rename-lesson-btn',
                textContent: 'Rename',
                onClick: () => this.showRenameModal(lesson.id, lesson.title)
            },
            {
                className: 'delete-lesson-btn',
                textContent: 'Delete',
                onClick: () => this.deleteSavedLesson(lesson.id)
            }
        ];

        actionButtons.forEach(buttonConfig => {
            const button = DOM.createElement('button', buttonConfig);
            actions.appendChild(button);
        });
        
        return actions;
    }

    handleLoadLesson(lessonId) {
        import('./config-manager.js').then(({ ConfigManager }) => {
            const configManager = new ConfigManager();
            configManager.loadSavedLesson(lessonId);
        });
    }

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

    hideRenameModal() {
        DOM.setVisible('renameModal', false);
        AppState.currentRenameId = null;
        DOM.setContent('renameInput', '');
    }

    deleteSavedLesson(lessonId) {
        const lesson = StorageManager.getSavedLesson(lessonId);
        if (!lesson) return;

        UIUtils.confirm(
            `Are you sure you want to delete "${lesson.title}"?`,
            () => {
                const success = StorageManager.deleteLesson(lessonId);
                if (success) {
                    this.refreshSavedLessonsList();
                    //If the deleted lesson was the current one, clear the state to allow saving again
                    if (AppState.lessonId === lessonId) {
                        AppState.lessonId = null;
                    }
                } else {
                    UIUtils.showError("Failed to delete lesson. Please try again.");
                }
            }
        );
    }

    /**
     * Show save button when valid config is detected
     */
    showSaveButton(isValid) {
        DOM.setEnabled('loadSaveConfig', isValid);
    }

    updateUI() {
        this.updateControlButtons();
        
        if (AppState.config) {
            this.updateVocabButtons(AppState.config['langA-B']);
        }
    }
}