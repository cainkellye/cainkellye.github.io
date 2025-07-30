/**
 * LLM Prompt Generator
 * Handles generation of prompts for AI language models
 */

import { DOM } from '../core/dom.js';
import { PlatformUtils } from '../utils/helpers.js';

export class LLMPromptGenerator {
    constructor() {
        this.storageKeys = {
            langA: 'udolingo_llm_langA',
            langB: 'udolingo_llm_langB',
            exerciseCount: 'udolingo_llm_exerciseCount',
            difficulty: 'udolingo_llm_difficulty',
            subject: 'udolingo_llm_subject',
            noise: 'udolingo_llm_noise'
        };

        // Language codes compatible with Google Translate
        this.languages = [
            { code: 'af', name: 'Afrikaans' },
            { code: 'sq', name: 'Albanian' },
            { code: 'am', name: 'Amharic' },
            { code: 'ar', name: 'Arabic' },
            { code: 'hy', name: 'Armenian' },
            { code: 'az', name: 'Azerbaijani' },
            { code: 'eu', name: 'Basque' },
            { code: 'be', name: 'Belarusian' },
            { code: 'bn', name: 'Bengali' },
            { code: 'bs', name: 'Bosnian' },
            { code: 'bg', name: 'Bulgarian' },
            { code: 'ca', name: 'Catalan' },
            { code: 'ceb', name: 'Cebuano' },
            { code: 'zh', name: 'Chinese (Simplified)' },
            { code: 'zh-TW', name: 'Chinese (Traditional)' },
            { code: 'co', name: 'Corsican' },
            { code: 'hr', name: 'Croatian' },
            { code: 'cs', name: 'Czech' },
            { code: 'da', name: 'Danish' },
            { code: 'nl', name: 'Dutch' },
            { code: 'en', name: 'English' },
            { code: 'eo', name: 'Esperanto' },
            { code: 'et', name: 'Estonian' },
            { code: 'fi', name: 'Finnish' },
            { code: 'fr', name: 'French' },
            { code: 'fy', name: 'Frisian' },
            { code: 'gl', name: 'Galician' },
            { code: 'ka', name: 'Georgian' },
            { code: 'de', name: 'German' },
            { code: 'el', name: 'Greek' },
            { code: 'gu', name: 'Gujarati' },
            { code: 'ht', name: 'Haitian Creole' },
            { code: 'ha', name: 'Hausa' },
            { code: 'haw', name: 'Hawaiian' },
            { code: 'he', name: 'Hebrew' },
            { code: 'hi', name: 'Hindi' },
            { code: 'hmn', name: 'Hmong' },
            { code: 'hu', name: 'Hungarian' },
            { code: 'is', name: 'Icelandic' },
            { code: 'ig', name: 'Igbo' },
            { code: 'id', name: 'Indonesian' },
            { code: 'ga', name: 'Irish' },
            { code: 'it', name: 'Italian' },
            { code: 'ja', name: 'Japanese' },
            { code: 'jv', name: 'Javanese' },
            { code: 'kn', name: 'Kannada' },
            { code: 'kk', name: 'Kazakh' },
            { code: 'km', name: 'Khmer' },
            { code: 'rw', name: 'Kinyarwanda' },
            { code: 'ko', name: 'Korean' },
            { code: 'ku', name: 'Kurdish' },
            { code: 'ky', name: 'Kyrgyz' },
            { code: 'lo', name: 'Lao' },
            { code: 'la', name: 'Latin' },
            { code: 'lv', name: 'Latvian' },
            { code: 'lt', name: 'Lithuanian' },
            { code: 'lb', name: 'Luxembourgish' },
            { code: 'mk', name: 'Macedonian' },
            { code: 'mg', name: 'Malagasy' },
            { code: 'ms', name: 'Malay' },
            { code: 'ml', name: 'Malayalam' },
            { code: 'mt', name: 'Maltese' },
            { code: 'mi', name: 'Maori' },
            { code: 'mr', name: 'Marathi' },
            { code: 'mn', name: 'Mongolian' },
            { code: 'my', name: 'Myanmar (Burmese)' },
            { code: 'ne', name: 'Nepali' },
            { code: 'no', name: 'Norwegian' },
            { code: 'ny', name: 'Nyanja (Chichewa)' },
            { code: 'or', name: 'Odia (Oriya)' },
            { code: 'ps', name: 'Pashto' },
            { code: 'fa', name: 'Persian' },
            { code: 'pl', name: 'Polish' },
            { code: 'pt', name: 'Portuguese (Brazilian)' },
            { code: 'pt-PT', name: 'Portuguese (European)' },
            { code: 'pa', name: 'Punjabi' },
            { code: 'ro', name: 'Romanian' },
            { code: 'ru', name: 'Russian' },
            { code: 'sm', name: 'Samoan' },
            { code: 'gd', name: 'Scots Gaelic' },
            { code: 'sr', name: 'Serbian' },
            { code: 'st', name: 'Sesotho' },
            { code: 'sn', name: 'Shona' },
            { code: 'sd', name: 'Sindhi' },
            { code: 'si', name: 'Sinhala (Sinhalese)' },
            { code: 'sk', name: 'Slovak' },
            { code: 'sl', name: 'Slovenian' },
            { code: 'so', name: 'Somali' },
            { code: 'es', name: 'Spanish' },
            { code: 'su', name: 'Sundanese' },
            { code: 'sw', name: 'Swahili' },
            { code: 'sv', name: 'Swedish' },
            { code: 'tl', name: 'Tagalog (Filipino)' },
            { code: 'tg', name: 'Tajik' },
            { code: 'ta', name: 'Tamil' },
            { code: 'tt', name: 'Tatar' },
            { code: 'te', name: 'Telugu' },
            { code: 'th', name: 'Thai' },
            { code: 'tr', name: 'Turkish' },
            { code: 'tk', name: 'Turkmen' },
            { code: 'uk', name: 'Ukrainian' },
            { code: 'ur', name: 'Urdu' },
            { code: 'ug', name: 'Uyghur' },
            { code: 'uz', name: 'Uzbek' },
            { code: 'vi', name: 'Vietnamese' },
            { code: 'cy', name: 'Welsh' },
            { code: 'xh', name: 'Xhosa' },
            { code: 'yi', name: 'Yiddish' },
            { code: 'yo', name: 'Yoruba' },
            { code: 'zu', name: 'Zulu' }
        ];

        // Common subjects/themes for language learning
        this.subjects = [
            'general conversation',
            'office and workplace',
            'farm and agriculture',
            'shopping and retail',
            'groceries and food',
            'parties and celebrations',
            'vacation and travel',
            'sports and fitness',
            'family and relationships',
            'health and medicine',
            'education and school',
            'technology and computers',
            'restaurants and dining',
            'transportation',
            'weather and seasons',
            'hobbies and leisure',
            'business and finance',
            'home and household',
            'clothing and fashion',
            'nature and environment',
            'culture and arts',
            'news and current events',
            'science and research',
            'law and government',
            'religion and philosophy'
        ];
    }

    /**
     * Initialize the LLM prompt generator
     */
    init() {
        this.initializeDropdowns();
        this.loadSavedSettings();
        console.log('LLM Prompt Generator initialized');
    }

    /**
     * Initialize language and subject dropdowns
     */
    initializeDropdowns() {
        // Populate subject datalist
        const subjectsList = DOM.get('subjects-list');
        if (subjectsList) {
            this.subjects.forEach(subject => {
                const option = document.createElement('option');
                option.value = subject;
                subjectsList.appendChild(option);
            });
        }

        // Initialize custom language dropdowns
        this.initializeLanguageDropdown('langA');
        this.initializeLanguageDropdown('langB');
    }

    /**
     * Initialize a custom language dropdown
     */
    initializeLanguageDropdown(dropdownId) {
        const dropdown = DOM.get(`${dropdownId}-dropdown`);
        const input = DOM.get(`${dropdownId}-input`);
        const options = DOM.get(`${dropdownId}-options`);
        
        if (!dropdown || !input || !options) {
            console.warn(`Language dropdown elements not found for ${dropdownId}`);
            return;
        }

        // Populate options
        options.innerHTML = '';
        this.languages.forEach(lang => {
            const option = document.createElement('div');
            option.className = 'dropdown-option';
            option.textContent = lang.name;
            option.dataset.code = lang.code;
            option.addEventListener('click', () => {
                this.selectLanguage(dropdownId, lang);
            });
            options.appendChild(option);
        });

        // Add click event to input to toggle dropdown
        input.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleDropdown(dropdownId);
        });

        // Add keyboard navigation
        input.addEventListener('keydown', (e) => {
            this.handleKeyboardNavigation(dropdownId, e);
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target)) {
                this.closeDropdown(dropdownId);
            }
        });
    }

    /**
     * Handle keyboard navigation in dropdowns
     */
    handleKeyboardNavigation(dropdownId, e) {
        const dropdown = DOM.get(`${dropdownId}-dropdown`);
        const options = DOM.get(`${dropdownId}-options`);
        const isOpen = dropdown?.classList.contains('open');

        if (!dropdown || !options) return;

        // If dropdown is closed and user presses a letter, open it and jump to that letter
        if (!isOpen && e.key.length === 1 && e.key.match(/[a-zA-Z]/)) {
            e.preventDefault();
            this.toggleDropdown(dropdownId);
            setTimeout(() => {
                this.jumpToLetter(dropdownId, e.key.toLowerCase());
            }, 10);
            return;
        }

        // If dropdown is open, handle navigation
        if (isOpen) {
            switch (e.key) {
                case 'Escape':
                    e.preventDefault();
                    this.closeDropdown(dropdownId);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.navigateOptions(dropdownId, 1);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.navigateOptions(dropdownId, -1);
                    break;
                case 'Enter':
                    e.preventDefault();
                    const highlighted = options.querySelector('.dropdown-option.highlighted');
                    if (highlighted) {
                        const langCode = highlighted.dataset.code;
                        const language = this.languages.find(l => l.code === langCode);
                        if (language) {
                            this.selectLanguage(dropdownId, language);
                        }
                    }
                    break;
                default:
                    if (e.key.length === 1 && e.key.match(/[a-zA-Z]/)) {
                        e.preventDefault();
                        this.jumpToLetter(dropdownId, e.key.toLowerCase());
                    }
                    break;
            }
        }
    }

    /**
     * Jump to first language starting with the given letter
     */
    jumpToLetter(dropdownId, letter) {
        const options = DOM.get(`${dropdownId}-options`);
        if (!options) return;

        const allOptions = options.querySelectorAll('.dropdown-option');
        
        // Clear previous highlights
        allOptions.forEach(opt => opt.classList.remove('highlighted'));
        
        // Find first language starting with the letter
        for (let option of allOptions) {
            const languageName = option.textContent.toLowerCase();
            if (languageName.startsWith(letter)) {
                option.classList.add('highlighted');
                option.scrollIntoView({ block: 'nearest' });
                break;
            }
        }
    }

    /**
     * Navigate through options with arrow keys
     */
    navigateOptions(dropdownId, direction) {
        const options = DOM.get(`${dropdownId}-options`);
        if (!options) return;

        const allOptions = Array.from(options.querySelectorAll('.dropdown-option'));
        const currentHighlighted = options.querySelector('.dropdown-option.highlighted');
        
        let newIndex = 0;
        if (currentHighlighted) {
            const currentIndex = allOptions.indexOf(currentHighlighted);
            newIndex = currentIndex + direction;
            currentHighlighted.classList.remove('highlighted');
        }
        
        // Wrap around
        if (newIndex < 0) newIndex = allOptions.length - 1;
        if (newIndex >= allOptions.length) newIndex = 0;
        
        if (allOptions[newIndex]) {
            allOptions[newIndex].classList.add('highlighted');
            allOptions[newIndex].scrollIntoView({ block: 'nearest' });
        }
    }

    /**
     * Toggle dropdown open/close
     */
    toggleDropdown(dropdownId) {
        const dropdown = DOM.get(`${dropdownId}-dropdown`);
        if (!dropdown) return;

        const isOpen = dropdown.classList.contains('open');
        
        // Close all dropdowns first
        this.closeAllDropdowns();
        
        if (!isOpen) {
            dropdown.classList.add('open');
            const input = DOM.get(`${dropdownId}-input`);
            if (input) input.focus();
        }
    }

    /**
     * Close a specific dropdown
     */
    closeDropdown(dropdownId) {
        const dropdown = DOM.get(`${dropdownId}-dropdown`);
        if (dropdown) {
            dropdown.classList.remove('open');
            
            const options = DOM.get(`${dropdownId}-options`);
            if (options) {
                options.querySelectorAll('.dropdown-option').forEach(opt => {
                    opt.classList.remove('highlighted');
                });
            }
        }
    }

    /**
     * Close all dropdowns
     */
    closeAllDropdowns() {
        document.querySelectorAll('.custom-dropdown').forEach(dropdown => {
            dropdown.classList.remove('open');
            dropdown.querySelectorAll('.dropdown-option').forEach(opt => {
                opt.classList.remove('highlighted');
            });
        });
    }

    /**
     * Select a language in a dropdown
     */
    selectLanguage(dropdownId, language) {
        const input = DOM.get(`${dropdownId}-input`);
        const options = DOM.get(`${dropdownId}-options`);
        
        if (input) {
            input.value = language.name;
            input.dataset.code = language.code;
        }
        
        // Update selected option styling
        if (options) {
            options.querySelectorAll('.dropdown-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            const selectedOption = options.querySelector(`[data-code="${language.code}"]`);
            if (selectedOption) {
                selectedOption.classList.add('selected');
            }
        }
        
        this.closeDropdown(dropdownId);
        this.saveCurrentSettings();
        this.generatePrompt();
    }

    /**
     * Get language code from input
     */
    getLanguageCode(dropdownId) {
        const input = DOM.get(`${dropdownId}-input`);
        return input?.dataset.code || 'en';
    }

    /**
     * Get language name from code
     */
    getLanguageName(code) {
        const lang = this.languages.find(l => l.code === code);
        return lang ? lang.name : code;
    }

    /**
     * Save current settings to localStorage
     */
    saveCurrentSettings() {
        try {
            const settings = {
                langA: this.getLanguageCode('langA'),
                langB: this.getLanguageCode('langB'),
                exerciseCount: DOM.get('exercisesCount')?.value || '20',
                difficulty: document.querySelector('input[name="difficulty"]:checked')?.value || '3',
                subject: DOM.get('subjectInput')?.value || 'general conversation',
                noise: document.querySelector('input[name="noise"]:checked')?.value || 'auto'
            };

            Object.keys(settings).forEach(key => {
                localStorage.setItem(this.storageKeys[key], settings[key]);
            });

            console.log('?? LLM generator settings saved');
        } catch (error) {
            console.error('Error saving LLM generator settings:', error);
        }
    }

    /**
     * Load saved settings from localStorage
     */
    loadSavedSettings() {
        try {
            // Load language A
            const langACode = localStorage.getItem(this.storageKeys.langA) || 'en';
            const langA = this.languages.find(l => l.code === langACode);
            if (langA) {
                this.selectLanguageWithoutSave('langA', langA);
            }

            // Load language B
            const langBCode = localStorage.getItem(this.storageKeys.langB) || 'es';
            const langB = this.languages.find(l => l.code === langBCode);
            if (langB) {
                this.selectLanguageWithoutSave('langB', langB);
            }

            // Load other settings
            const exerciseCount = localStorage.getItem(this.storageKeys.exerciseCount);
            if (exerciseCount) {
                const input = DOM.get('exercisesCount');
                if (input) input.value = exerciseCount;
            }

            const difficulty = localStorage.getItem(this.storageKeys.difficulty);
            if (difficulty) {
                const radio = document.querySelector(`input[name="difficulty"][value="${difficulty}"]`);
                if (radio) radio.checked = true;
            }

            const subject = localStorage.getItem(this.storageKeys.subject);
            if (subject) {
                const input = DOM.get('subjectInput');
                if (input) input.value = subject;
            }

            const noise = localStorage.getItem(this.storageKeys.noise);
            if (noise) {
                const radio = document.querySelector(`input[name="noise"][value="${noise}"]`);
                if (radio) radio.checked = true;
            }

            console.log('LLM generator settings loaded');
        } catch (error) {
            console.error('Error loading LLM generator settings:', error);
        }
    }

    /**
     * Select language without triggering save (used during initial load)
     */
    selectLanguageWithoutSave(dropdownId, language) {
        const input = DOM.get(`${dropdownId}-input`);
        const options = DOM.get(`${dropdownId}-options`);
        
        if (input) {
            input.value = language.name;
            input.dataset.code = language.code;
        }
        
        if (options) {
            options.querySelectorAll('.dropdown-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            const selectedOption = options.querySelector(`[data-code="${language.code}"]`);
            if (selectedOption) {
                selectedOption.classList.add('selected');
            }
        }
    }

    /**
     * Generate difficulty-specific instructions
     */
    getDifficultyInstructions(level) {
        switch (level) {
            case '1':
                return 'Use simple vocabulary, basic sentence structures, present tense, and common everyday expressions. Avoid complex grammar and idioms.';
            case '2':
                return 'Use elementary vocabulary with simple present, past and future tenses. Include basic adjectives and common phrases.';
            case '3':
                return 'Use intermediate vocabulary with various tenses, conditional sentences, and some idiomatic expressions.';
            case '4':
                return 'Use advanced vocabulary, complex sentence structures, subjunctive mood, and challenging idiomatic expressions.';
            case '5':
                return 'Use expert-level vocabulary, complex grammar structures, subtle nuances, literary expressions, and sophisticated language traps.';
            default:
                return 'Use intermediate level vocabulary and grammar.';
        }
    }

    /**
     * Generate noise instructions
     */
    getNoiseInstructions(noiseLevel) {
        const general = `
- Noise: distractors should fit phonetically or semantically, but not contain words from the actual sentence/translation. `;
        switch (noiseLevel) {
            case 'low':
                return `${general}Include 2-3 distractor words for each language.`;
            case 'average':
                return `${general}Include 3-4 distractor words for each language.`;
            case 'high':
                return `${general}Include 5-6 distractor words for each language.`;
            case 'auto':
            default:
                return '';
        }
    }

    /**
     * Generate the complete LLM prompt
     */
    generatePrompt() {
        const langACode = this.getLanguageCode('langA');
        const langBCode = this.getLanguageCode('langB');
        const langAName = this.getLanguageName(langACode);
        const langBName = this.getLanguageName(langBCode);
        const exerciseCount = DOM.get('exercisesCount')?.value || '20';
        const subject = DOM.get('subjectInput')?.value || 'general conversation';

        const difficultyLevel = document.querySelector('input[name="difficulty"]:checked')?.value || '3';
        const noiseLevel = document.querySelector('input[name="noise"]:checked')?.value || 'average';

        const difficultyInstructions = this.getDifficultyInstructions(difficultyLevel);
        const noiseInstructions = this.getNoiseInstructions(noiseLevel);

        const noiseFormat = noiseLevel === 'auto' ? '' : `,
      "noiseA": <space-separated distractor words for ${langAName}>,
      "noiseB": <space-separated distractor words for ${langBName}>`;

        const prompt = `Generate a JSON object for a bilingual language lesson in the following format:

{
  "title": <string>,
  "langA-B": ["${langACode}", "${langBCode}"],
  "exercises": [
    {
      "A": <sentence in ${langAName}>,
      "B": <exact translation in ${langBName}>${noiseFormat}
    },
    // ...more exercises
  ]
}

Instructions:
- Generate ${exerciseCount} exercises total.
- Theme/Subject: ${subject}.
- Difficulty Level: ${difficultyLevel}/5 - ${difficultyInstructions}${noiseInstructions}
- For some exercises, fields A and B may be multiple shorter sentences, if the full content remains natural and boundaries are preserved.
- Translations must be accurate and straightforward in both directions.
- Create a short, descriptive title that reflects the theme and difficulty level.
- Output valid JSON in the format above.`;

        const generatedPrompt = DOM.get('generatedPrompt');
        if (generatedPrompt) {
            generatedPrompt.value = prompt;
        }
    }

    /**
     * Show the LLM prompt modal
     */
    showModal() {
        DOM.setVisible('llmPromptModal', true);
        this.generatePrompt();
    }

    /**
     * Hide the LLM prompt modal
     */
    hideModal() {
        DOM.setVisible('llmPromptModal', false);
    }

    /**
     * Copy prompt to clipboard
     */
    async copyToClipboard() {
        const prompt = DOM.get('generatedPrompt')?.value;
        if (!prompt) {
            alert('No prompt to copy. Please generate a prompt first.');
            return;
        }

        try {
            if (PlatformUtils.hasClipboardAPI()) {
                await navigator.clipboard.writeText(prompt);
                alert('LLM prompt copied to clipboard!');
            } else {
                PlatformUtils.fallbackCopyToClipboard(prompt);
            }
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            PlatformUtils.fallbackCopyToClipboard(prompt);
        }
    }
}