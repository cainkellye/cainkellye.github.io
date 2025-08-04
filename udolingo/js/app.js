/**
 * Udolingo - AI-powered Language Learning App
 * Main application entry point
 * 
 * @version 1.0.0
 * @author László Lenkei (CainKellye)
 */

import { AppState } from './core/state.js';
import { UIManager } from './managers/ui-manager.js';
import { SidebarManager } from './managers/sidebar-manager.js';
import { ConfigManager } from './managers/config-manager.js';
import { EventManager } from './managers/event-manager.js';
import { URLHandler } from './utils/url-handler.js';
import { StorageManager } from './utils/storage-manager.js';
import { LLMPromptGenerator } from './features/llm-prompt-generator.js';
import { DebugUtils } from './utils/debug-utils.js';

/**
 * Main Application class
 */
class UdolingoApp {
    constructor() {
        this.state = AppState;
        this.managers = {
            ui: new UIManager(),
            sidebar: new SidebarManager(),
            config: new ConfigManager(),
            events: new EventManager()
        };
        this.urlHandler = new URLHandler();
        this.storageManager = new StorageManager();
        this.llmGenerator = new LLMPromptGenerator();
    }

    async init() {
        try {
            console.log('Initializing Udolingo...');
            
            // Initialize managers
            this.managers.sidebar.init();
            this.managers.events.init();
            this.llmGenerator.init();
            
            // Setup debug utilities
            DebugUtils.setupGlobalDebugFunctions();
            
            // Display storage info
            this.displayStorageInfo();
            
            // Load initial configuration
            await this.loadInitialConfig();
            
            console.log('Udolingo initialized successfully!');
        } catch (error) {
            console.error('Failed to initialize Udolingo:', error);
            this.handleInitializationError(error);
        }
    }

    displayStorageInfo() {
        const storageInfo = this.storageManager.getStorageInfo();
        console.log('Storage info on startup:', storageInfo);
        
        if (!storageInfo.isAvailable) {
            console.warn('localStorage is not available');
        }
    }

    /**
     * Load initial configuration based on priority:
     * 1. URL parameter
     * 2. Latest saved lesson
     * 3. Default config file
     */
    async loadInitialConfig() {
        // Check for config in URL parameters first
        if (this.urlHandler.loadConfigFromURL()) {
            console.log('Config loaded from URL parameter');
            return;
        }
        
        // Auto-load the latest saved lesson if any exist
        const latestLesson = this.getLatestSavedLesson();
        if (latestLesson) {
            console.log('Auto-loading latest saved lesson:', latestLesson.title);
            this.managers.config.loadSavedLesson(latestLesson.id);
            return;
        }
        
        // Fallback to default config file
        await this.managers.config.loadFromFile();
    }

    getLatestSavedLesson() {
        const savedLessons = this.storageManager.getSavedLessons();
        const lessonIds = Object.keys(savedLessons);
        
        if (lessonIds.length === 0) {
            return null;
        }
        
        // Find the lesson with the latest dateAdded
        let latestId = lessonIds[0];
        let latestDate = new Date(savedLessons[latestId].dateAdded).getTime();
        
        lessonIds.forEach(id => {
            const lessonDate = new Date(savedLessons[id].dateAdded).getTime();
            if (lessonDate > latestDate) {
                latestDate = lessonDate;
                latestId = id;
            }
        });
        
        return { id: latestId, ...savedLessons[latestId] };
    }

    handleInitializationError(error) {
        const errorMessage = `
            Failed to initialize Udolingo: ${error.message}
            
            Please try refreshing the page. If the problem persists, 
            check the browser console for more details.
        `;
        
        // Show error to user
        alert(errorMessage);
        
        // Try to initialize UI in a degraded mode
        try {
            this.managers.ui.setButtonsDisabled(true);
            document.getElementById('prompt').textContent = 
                'Application failed to initialize. Please refresh the page.';
        } catch (uiError) {
            console.error('Failed to show error in UI:', uiError);
        }
    }
}

/**
 * Initialize the application when DOM is ready
 */
document.addEventListener('DOMContentLoaded', async () => {
    const app = new UdolingoApp();
    await app.init();
    
    // Make app globally available for debugging
    window.udolingoApp = app;
});