/**
 * Configuration Manager
 * Handles lesson configuration loading, saving, and validation
 */

import { AppState } from '../core/state.js';
import { DOM } from '../core/dom.js';
import { ValidationUtils, PlatformUtils } from '../utils/helpers.js';
import { StorageManager } from '../utils/storage-manager.js';
import { URLHandler } from '../utils/url-handler.js';
import { DirectionManager } from '../features/direction-manager.js';
import { ExerciseManager } from '../features/exercise-manager.js';
import { UIManager } from './ui-manager.js';

export class ConfigManager {
    constructor() {
        this.storageManager = new StorageManager();
        this.urlHandler = new URLHandler();
        this.uiManager = new UIManager();
    }

    /**
     * Load lesson configuration
     */
    loadConfiguration(configData) {
        try {
            // Handle backward compatibility: convert "lessons" to "exercises"
            if (configData.lessons && !configData.exercises) {
                console.log('Converting legacy "lessons" format to "exercises"');
                configData.exercises = configData.lessons;
                delete configData.lessons;
            }

            // Validate configuration
            if (!ValidationUtils.isValidLessonConfig(configData)) {
                throw new Error('Invalid lesson configuration format');
            }

            // Update application state
            AppState.updateConfig(configData);

            // Initialize exercise directions
            const directionManager = new DirectionManager();
            directionManager.initializeDirections();

            // Load first exercise
            const exerciseManager = new ExerciseManager();
            exerciseManager.loadExercise(0);

            // Update UI
            this.uiManager.updateVocabButtons(configData['langA-B']);
            this.uiManager.updateControlButtons();

            // Clear mistakes for new lesson
            AppState.clearMistakes();

            // Auto-collapse sidebar on mobile after loading
            this.uiManager.autoCollapseSidebarOnMobile();

            console.log(`✅ Lesson "${configData.title}" loaded successfully`);
        } catch (error) {
            console.error('❌ Failed to load configuration:', error);
            this.uiManager.showError('Failed to load lesson configuration', error.message);
        }
    }

    /**
     * Load configuration from text input
     */
    loadFromText() {
        const configInput = DOM.get('configInput');
        if (!configInput) {
            this.uiManager.showError('Configuration input not found');
            return;
        }

        const configText = configInput.value.trim();
        if (!configText) {
            alert("The text area is empty. Please paste your lesson configuration.");
            return;
        }

        try {
            const newConfig = JSON.parse(configText);
            this.loadConfiguration(newConfig);
            this.saveCurrentLoadedConfig(true);
            
            configInput.value = '';
            this.uiManager.hideConfigModal();
            this.urlHandler.removeConfigParam();
        } catch (error) {
            alert(`Error parsing JSON: ${error.message}`);
        }
    }

    /**
     * Load saved lesson by ID
     */
    loadSavedLesson(lessonId) {
        const lesson = this.storageManager.getSavedLesson(lessonId);
        if (lesson) {
            this.loadConfiguration(lesson.config);
            this.uiManager.hideConfigModal();
            this.urlHandler.removeConfigParam();
        } else {
            this.uiManager.showError("Lesson not found.");
        }
    }

    /**
     * Load configuration from clipboard
     */
    async loadConfigFromClipboard() {
        try {
            if (!PlatformUtils.hasClipboardAPI()) {
                throw new Error('Clipboard API not available');
            }

            const clipboard = await navigator.clipboard.readText();
            const newConfig = JSON.parse(clipboard);
            
            if (!ValidationUtils.isValidLessonConfig(newConfig)) {
                throw new Error('Invalid lesson format');
            }

            console.log(`Load from clipboard. Config title: ${newConfig.title}`);
            this.loadConfiguration(newConfig);
            this.saveCurrentLoadedConfig(true);
            
            DOM.setContent('configInput', '');
            this.uiManager.hideConfigModal();
            this.urlHandler.removeConfigParam();
        } catch (error) {
            console.error('Clipboard load failed:', error);
            alert("The clipboard does not contain a valid Udolingo lesson.");
        }
    }

    /**
     * Save currently loaded configuration
     */
    saveCurrentLoadedConfig(silent = false) {
        if (!AppState.hasExercises()) {
            alert("No configuration is currently loaded to save.");
            return;
        }

        try {
            // Check storage health before saving
            if (!silent && !this.storageManager.checkStorageHealth()) {
                alert("Storage appears to be having issues. Please try again or check your browser settings.");
                return;
            }

            const lessonId = this.storageManager.saveLesson(AppState.config);
            if (lessonId) {
                if (!silent) {
                    this.uiManager.showSuccess(`Lesson "${AppState.config.title}" saved successfully!`);
                }
                console.log(`💾 Lesson saved successfully! Id=${lessonId}`);
            } else if (!silent) {
                alert("Failed to save lesson. Please try again or check if you have enough storage space.");
            }
        } catch (error) {
            console.error('Error saving current config:', error);
            if (!silent) {
                alert(`Error saving lesson: ${error.message}`);
            }
        }
    }

    /**
     * Share current configuration via URL
     */
    shareCurrentConfig() {
        if (!AppState.hasExercises()) {
            alert("No configuration is currently loaded to share.");
            return;
        }

        try {
            const shareURL = this.urlHandler.generateShareURL(AppState.config);
            if (shareURL) {
                this.copyToClipboard(shareURL, 'Share link copied to clipboard! You can now share this link with others.');
            } else {
                alert("Failed to generate share URL. The configuration might be too large.");
            }
        } catch (error) {
            console.error('Error sharing config:', error);
            alert(`Error generating share link: ${error.message}`);
        }
    }

    /**
     * Show current configuration in new tab
     */
    showCurrentConfig() {
        if (!AppState.config) {
            alert("No configuration is currently loaded.");
            return;
        }

        const configStr = JSON.stringify(AppState.config, null, 2);
        const newTab = window.open('', '_blank');
        
        if (newTab) {
            newTab.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>${AppState.config.title}</title>
                    <link rel="stylesheet" href="config-style.css">
                </head>
                <body>
                    <h1>Udolingo Configuration</h1>
                    <textarea spellcheck="false">${configStr}</textarea>
                </body>
                </html>
            `);
            newTab.document.close();
        } else {
            alert('Unable to open a new tab. Please check your popup blocker settings.');
        }
    }

    /**
     * Load configuration from file (fallback)
     */
    async loadFromFile() {
        try {
            const response = await fetch('config.json');
            if (!response.ok) {
                throw new Error("config.json not found.");
            }
            
            const config = await response.json();
            this.loadConfiguration(config);
        } catch (error) {
            console.warn("Could not load default config.json. Use 'Load from Text' to begin.", error);
            this.uiManager.setButtonsDisabled(true);
            DOM.setContent('prompt', 'Load a lesson to begin.');
        }
    }

    /**
     * Copy text to clipboard with fallback
     */
    async copyToClipboard(text, successMessage) {
        try {
            if (PlatformUtils.hasClipboardAPI()) {
                await navigator.clipboard.writeText(text);
                alert(successMessage);
            } else {
                this.fallbackCopyToClipboard(text, successMessage);
            }
        } catch (error) {
            console.error('Clipboard copy failed:', error);
            this.fallbackCopyToClipboard(text, successMessage);
        }
    }

    /**
     * Fallback copy method for older browsers
     */
    fallbackCopyToClipboard(text, successMessage) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            document.execCommand('copy');
            alert(successMessage);
        } catch (err) {
            console.error('Fallback copy failed:', err);
            prompt('Copy this text manually:', text);
        }

        document.body.removeChild(textArea);
    }
}