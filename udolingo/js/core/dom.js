/**
 * DOM Elements Management
 * Centralized access to DOM elements with error handling
 */
export class DOMElements {
    constructor() {
        this.elements = null;
        this.init();
    }

    init() {
        this.elements = {
            // Main lesson elements
            prompt: this.getElement('prompt'),
            responseContainer: this.getElement('response-container'),
            wordBankContainer: this.getElement('word-bank-container'),
            feedback: this.getElement('feedback'),
            
            // Action buttons
            submit: this.getElement('submit-btn'),
            clear: this.getElement('clear-btn'),
            next: this.getElement('next-btn'),
            translate: this.getElement('translate-btn'),
            
            // Control buttons
            shuffle: this.getElement('shuffle-exercises-btn'),
            vocab1: this.getElement('vocab1-btn'),
            vocab2: this.getElement('vocab2-btn'),
            mistakes: this.getElement('mistakes-btn'),
            saveCurrent: this.getElement('save-current-btn'),
            share: this.getElement('share-btn'),
            currentConfig: this.getElement('current-config-btn'),
            
            // Config panel elements
            openConfigPanel: this.getElement('open-config-panel-btn'),
            configPanel: this.getElement('config-panel'),
            configInput: this.getElement('config-input'),
            loadFromClipboard: this.getElement('load-from-clipboard-btn'),
            loadSaveConfig: this.getElement('load-save-config-btn'),
            cancelConfig: this.getElement('cancel-config-btn'),
            
            // Tab elements
            pasteTab: this.getElement('paste-tab'),
            savedTab: this.getElement('saved-tab'),
            pasteTabBtn: this.getElement('paste-tab-btn'),
            savedTabBtn: this.getElement('saved-tab-btn'),
            
            // Saved lessons elements
            savedLessonsContainer: this.getElement('saved-lessons-container'),
            savedLessonsList: this.getElement('saved-lessons-list'),
            noSavedLessonsMsg: this.getElement('no-saved-lessons-msg'),
            cancelSaved: this.getElement('cancel-saved-btn'),
            
            // Rename modal elements
            renameModal: this.getElement('rename-modal'),
            renameInput: this.getElement('rename-input'),
            confirmRename: this.getElement('confirm-rename-btn'),
            cancelRename: this.getElement('cancel-rename-btn'),
            
            // Mistakes modal elements
            mistakesModal: this.getElement('mistakes-modal'),
            mistakesContent: this.getElement('mistakes-content'),
            mistakesList: this.getElement('mistakes-list'),
            noMistakesMsg: this.getElement('no-mistakes-msg'),
            copyMistakes: this.getElement('copy-mistakes-btn'),
            clearMistakes: this.getElement('clear-mistakes-btn'),
            closeMistakes: this.getElement('close-mistakes-btn'),
            
            // LLM Prompt Generator elements
            generatePromptBtn: this.getElement('generate-prompt-btn'),
            llmPromptModal: this.getElement('llm-prompt-modal'),
            langAInput: this.getElement('langA-input'),
            langBInput: this.getElement('langB-input'),
            exercisesCount: this.getElement('exercises-count'),
            subjectInput: this.getElement('subject-input'),
            generatedPrompt: this.getElement('generated-prompt'),
            copyPromptBtn: this.getElement('copy-prompt-btn'),
            closeLlmPromptBtn: this.getElement('close-llm-prompt-btn'),
            
            // Sidebar elements
            sidebar: this.getElement('sidebar'),
            sidebarHeader: this.getElement('sidebar-header'),
            sidebarToggle: this.getElement('sidebar-toggle')
        };
    }

    getElement(id) {
        const element = document.getElementById(id);
        if (!element) {
            console.warn(`Element with ID '${id}' not found`);
        }
        return element;
    }

    get(id) {
        return this.elements[id] || this.getElement(id);
    }

    addEventListener(elementId, event, handler) {
        const element = this.get(elementId);
        if (element) {
            element.addEventListener(event, handler);
        } else {
            console.warn(`Cannot add event listener: element '${elementId}' not found`);
        }
    }

    setContent(elementId, content) {
        const element = this.get(elementId);
        if (element) {
            if (typeof content === 'string') {
                element.textContent = content;
            } else {
                element.innerHTML = content;
            }
        }
    }

    setHTML(elementId, html) {
        const element = this.get(elementId);
        if (element) {
            element.innerHTML = html;
        }
    }

    setImage(elementId, src) {
        const element = this.get(elementId);
        if (element && element.tagName === 'IMG') {
            element.src = src;
        }
    }

    setVisible(elementId, visible) {
        const element = this.get(elementId);
        if (element) {
            element.style.display = visible ? '' : 'none';
        }
    }

    setEnabled(elementId, enabled) {
        const element = this.get(elementId);
        if (element) {
            element.disabled = !enabled;
        }
    }

    clear(elementId) {
        const element = this.get(elementId);
        if (element) {
            element.innerHTML = '';
        }
    }

    createElement(tag, options = {}) {
        const element = document.createElement(tag);
        
        if (options.className) {
            element.className = options.className;
        }
        
        if (options.textContent) {
            element.textContent = options.textContent;
        }
        
        if (options.innerHTML) {
            element.innerHTML = options.innerHTML;
        }
        
        if (options.attributes) {
            Object.entries(options.attributes).forEach(([key, value]) => {
                element.setAttribute(key, value);
            });
        }
        
        if (options.style) {
            Object.assign(element.style, options.style);
        }
        
        if (options.onClick) {
            element.addEventListener('click', options.onClick);
        }
        
        return element;
    }
}

// Export singleton instance
export const DOM = new DOMElements();