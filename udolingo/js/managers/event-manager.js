/**
 * Event Manager
 * Centralized event handling for the application
 */

import { DOM } from '../core/dom.js';
import { AppState } from '../core/state.js';
import { UIManager } from './ui-manager.js';
import { ConfigManager } from './config-manager.js';
import { ExerciseManager } from '../features/exercise-manager.js';
import { DirectionManager } from '../features/direction-manager.js';
import { AnswerValidator } from '../features/answer-validator.js';
import { VocabularyManager } from '../features/vocabulary-manager.js';
import { TranslationManager } from '../features/translation-manager.js';
import { MistakesManager } from '../features/mistakes-manager.js';
import { LLMPromptGenerator } from '../features/llm-prompt-generator.js';
import { ArrayUtils } from '../utils/helpers.js';

export class EventManager {
    constructor() {
        this.uiManager = new UIManager();
        this.configManager = new ConfigManager();
        this.exerciseManager = new ExerciseManager();
        this.directionManager = new DirectionManager();
        this.answerValidator = new AnswerValidator();
        this.vocabularyManager = new VocabularyManager();
        this.translationManager = new TranslationManager();
        this.mistakesManager = new MistakesManager();
        this.llmGenerator = new LLMPromptGenerator();
    }

    /**
     * Initialize all event listeners
     */
    init() {
        this.setupAnswerSubmissionEvents();
        this.setupResponseManagementEvents();
        this.setupNavigationEvents();
        this.setupTranslationEvents();
        this.setupVocabularyEvents();
        this.setupConfigPanelEvents();
        this.setupTabSwitchingEvents();
        this.setupRenameModalEvents();
        this.setupMistakesModalEvents();
        this.setupLLMPromptEvents();
        this.setupMiscellaneousEvents();
        
        console.log('Event manager initialized');
    }

    /**
     * Answer submission events
     */
    setupAnswerSubmissionEvents() {
        DOM.addEventListener('submit', 'click', async () => {
            const userResponse = this.uiManager.flattenResponse();
            try {
                await this.answerValidator.validateAnswer(userResponse);
            } catch (error) {
                console.error('Error validating answer:', error);
                // Show user-friendly error message
                const feedback = DOM.get('feedback');
                if (feedback) {
                    feedback.textContent = 'Error validating answer. Please try again.';
                    feedback.style.color = 'red';
                }
            }
        });
    }

    /**
     * Response management events
     */
    setupResponseManagementEvents() {
        DOM.addEventListener('clear', 'click', () => {
            this.uiManager.clearResponse();
        });
    }

    /**
     * Navigation events
     */
    setupNavigationEvents() {
        DOM.addEventListener('next', 'click', () => {
            const cycleCompleted = AppState.nextExercise();
            
            // Check if we need to advance to the next cycle
            if (cycleCompleted) {
                this.directionManager.checkAndAdvanceCycle();
            }

            this.exerciseManager.loadExercise(AppState.currentTaskIndex);
        });

        DOM.addEventListener('shuffle', 'click', () => {
            if (AppState.mistakes.length === 0 || 
                confirm('This will clear the mistakes list. Are you sure you want to shuffle exercises?')) {
                
                ArrayUtils.shuffle(AppState.exercises);
                this.directionManager.shuffleDirections();
                AppState.currentTaskIndex = 0;
                this.exerciseManager.loadExercise(AppState.currentTaskIndex);
                AppState.clearMistakes();
            }
        });
    }

    /**
     * Translation and vocabulary events
     */
    setupTranslationEvents() {
        DOM.addEventListener('translate', 'click', () => {
            this.translationManager.openTranslation();
        });

        DOM.addEventListener('vocab1', 'click', () => {
            if (AppState.config && AppState.config['langA-B']) {
                const [langA, langB] = AppState.config['langA-B'];
                this.vocabularyManager.openVocabularyTranslation(langA, langB);
            }
        });

        DOM.addEventListener('vocab2', 'click', () => {
            if (AppState.config && AppState.config['langA-B']) {
                const [langA, langB] = AppState.config['langA-B'];
                this.vocabularyManager.openVocabularyTranslation(langB, langA);
            }
        });
    }

    /**
     * Vocabulary box events
     */
    setupVocabularyEvents() {
        // Toggle vocabulary box
        DOM.addEventListener('vocabBoxHeader', 'click', () => {
            this.uiManager.toggleVocabularyBox();
        });

        // Load vocabulary from clipboard
        DOM.addEventListener('wordsFromClipboardBtn', 'click', () => {
            this.vocabularyManager.loadVocabularyFromClipboard();
        });

        // Save vocabulary
        DOM.addEventListener('saveWordsBtn', 'click', () => {
            this.vocabularyManager.saveVocabulary();
        });

        // Verify vocabulary with LLM
        DOM.addEventListener('verifyWordsBtn', 'click', () => {
            this.vocabularyManager.generateVerificationPrompt();
        });
    }

    /**
     * Configuration panel events
     */
    setupConfigPanelEvents() {
        DOM.addEventListener('openConfigPanel', 'click', () => {
            this.uiManager.switchTab('paste');
            this.uiManager.showConfigModal();
        });

        DOM.addEventListener('cancelConfig', 'click', () => {
            this.uiManager.hideConfigModal();
            DOM.setContent('configInput', '');
            this.uiManager.showSaveButton(null);
        });

        DOM.addEventListener('cancelSaved', 'click', () => {
            this.uiManager.hideConfigModal();
        });

        DOM.addEventListener('loadFromClipboard', 'click', () => {
            this.configManager.loadConfigFromClipboard();
        });

        DOM.addEventListener('loadSaveConfig', 'click', () => {
            this.configManager.loadFromText();
        });

        // Config input change detection for save button
        const configInput = DOM.get('configInput');
        if (configInput) {
            configInput.addEventListener('input', () => {
                const configText = configInput.value.trim();
                if (configText) {
                    try {
                        const configData = JSON.parse(configText);
                        this.uiManager.showSaveButton(configData);
                    } catch (error) {
                        this.uiManager.showSaveButton(null);
                    }
                } else {
                    this.uiManager.showSaveButton(null);
                }
            });
        }
    }

    /**
     * Tab switching events
     */
    setupTabSwitchingEvents() {
        DOM.addEventListener('pasteTabBtn', 'click', () => {
            this.uiManager.switchTab('paste');
        });

        DOM.addEventListener('savedTabBtn', 'click', () => {
            this.uiManager.switchTab('saved');
        });
    }

    /**
     * Rename modal events
     */
    setupRenameModalEvents() {
        DOM.addEventListener('confirmRename', 'click', () => {
            const renameInput = DOM.get('renameInput');
            if (renameInput && AppState.currentRenameId) {
                const newTitle = renameInput.value.trim();
                if (newTitle) {
                    const success = this.configManager.renameLesson(
                        AppState.currentRenameId, 
                        newTitle
                    );
                    if (success) {
                        if (AppState.lessonId === AppState.currentRenameId) {
                            this.uiManager.updateTitle(newTitle);
                        }
                        this.uiManager.hideRenameModal();
                        this.uiManager.refreshSavedLessonsList();
                    } else {
                        alert("Failed to rename lesson. Please try again.");
                    }
                } else {
                    alert("Please enter a valid title.");
                }
            }
        });

        DOM.addEventListener('cancelRename', 'click', () => {
            this.uiManager.hideRenameModal();
        });

        // Rename input Enter key
        const renameInput = DOM.get('renameInput');
        if (renameInput) {
            renameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    DOM.get('confirmRename')?.click();
                }
            });
        }
    }

    /**
     * Mistakes modal events
     */
    setupMistakesModalEvents() {
        DOM.addEventListener('mistakes', 'click', () => {
            this.mistakesManager.showMistakesModal();
        });

        DOM.addEventListener('closeMistakes', 'click', () => {
            this.mistakesManager.hideMistakesModal();
        });

        DOM.addEventListener('copyMistakes', 'click', () => {
            this.mistakesManager.copyMistakesToClipboard();
        });

        DOM.addEventListener('clearMistakes', 'click', () => {
            if (confirm('Are you sure you want to clear all recorded mistakes? This cannot be undone.')) {
                this.mistakesManager.clearAllMistakes();
                this.mistakesManager.refreshMistakesList();
            }
        });
    }

    /**
     * LLM Prompt Generator events
     */
    setupLLMPromptEvents() {
        DOM.addEventListener('generatePromptBtn', 'click', () => {
            this.llmGenerator.showModal();
        });

        DOM.addEventListener('closeLlmPromptBtn', 'click', () => {
            this.llmGenerator.hideModal();
        });

        DOM.addEventListener('copyPromptBtn', 'click', () => {
            this.llmGenerator.copyToClipboard();
        });

        // Auto-generate prompt when inputs change
        const promptInputs = ['exercisesCount', 'subjectInput'];
        promptInputs.forEach(inputId => {
            const input = DOM.get(inputId);
            if (input) {
                input.addEventListener('input', () => {
                    this.llmGenerator.saveCurrentSettings();
                    this.llmGenerator.generatePrompt();
                });
            }
        });

        // Auto-generate prompt when radio buttons change
        document.addEventListener('change', (e) => {
            if (e.target.type === 'radio' && 
                (e.target.name === 'difficulty' || e.target.name === 'noise')) {
                this.llmGenerator.saveCurrentSettings();
                this.llmGenerator.generatePrompt();
            }
        });
    }

    /**
     * Miscellaneous events
     */
    setupMiscellaneousEvents() {
        DOM.addEventListener('saveCurrent', 'click', () => {
            this.configManager.saveCurrentLoadedConfig();
        });

        DOM.addEventListener('share', 'click', () => {
            this.configManager.shareCurrentConfig();
        });

        DOM.addEventListener('currentConfig', 'click', () => {
            this.configManager.showCurrentConfig();
        });

        // Add auto-collapse sidebar events for mobile
        const actionsRequiringCollapse = [
            'openConfigPanel', 'generatePromptBtn', 'mistakes'
        ];

        actionsRequiringCollapse.forEach(elementId => {
            DOM.addEventListener(elementId, 'click', () => {
                // Small delay to allow modal to open first
                setTimeout(() => {
                    this.uiManager.autoCollapseSidebarOnMobile();
                }, 100);
            });
        });
    }
}