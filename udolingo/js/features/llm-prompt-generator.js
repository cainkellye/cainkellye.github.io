/**
 * LLM Prompt Generator
 * Handles generation of prompts for AI language models
 */

import { DOM } from '../core/dom.js';
import { ClipboardUtils, UIUtils } from '../utils/helpers.js';

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

        // Difficulty level configurations
        this.difficultyLevels = {
            '1': 'Use simple vocabulary, basic sentence structures, present tense, and common everyday expressions. Avoid complex grammar and idioms.',
            '2': 'Use elementary vocabulary with simple present, past and future tenses. Include basic adjectives and common phrases.',
            '3': 'Use intermediate vocabulary with various tenses, conditional sentences, and some idiomatic expressions.',
            '4': 'Use advanced vocabulary, complex sentence structures, subjunctive mood, and challenging idiomatic expressions.',
            '5': 'Use expert-level vocabulary, complex grammar structures, subtle nuances, literary expressions, and sophisticated language traps.'
        };

        // Noise level configurations
        this.noiseLevels = {
            low: 'Include 2-3 distractor words for each language.',
            average: 'Include 3-4 distractor words for each language.',
            high: 'Include 5-6 distractor words for each language.',
            auto: ''
        };
    }

    init() {
        this.initializeDropdowns();
        this.loadSavedSettings();
        console.log('LLM Prompt Generator initialized');
    }

    initializeDropdowns() {
        this._populateSubjectsList();
        this.initializeLanguageDropdown('langA');
        this.initializeLanguageDropdown('langB');
    }
    
    _populateSubjectsList() {
        const subjectsList = DOM.get('subjects-list');
        if (subjectsList) {
            this.subjects.forEach(subject => {
                const option = document.createElement('option');
                option.value = subject;
                subjectsList.appendChild(option);
            });
        }
    }

    initializeLanguageDropdown(dropdownId) {
        const elements = this._getDropdownElements(dropdownId);
        if (!elements) return;

        const { dropdown, input, options } = elements;

        this._populateDropdownOptions(dropdownId, options);
        this._setupDropdownEvents(dropdownId, input, dropdown);
    }

    _getDropdownElements(dropdownId) {
        const dropdown = DOM.get(`${dropdownId}-dropdown`);
        const input = DOM.get(`${dropdownId}-input`);
        const options = DOM.get(`${dropdownId}-options`);
        
        if (!dropdown || !input || !options) {
            console.warn(`Language dropdown elements not found for ${dropdownId}`);
            return null;
        }

        return { dropdown, input, options };
    }

    _populateDropdownOptions(dropdownId, options) {
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
    }

    _setupDropdownEvents(dropdownId, input, dropdown) {
        // Toggle dropdown on click
        input.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleDropdown(dropdownId);
        });

        // Keyboard navigation
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

    handleKeyboardNavigation(dropdownId, e) {
        const dropdown = DOM.get(`${dropdownId}-dropdown`);
        const options = DOM.get(`${dropdownId}-options`);
        const isOpen = dropdown?.classList.contains('open');

        if (!dropdown || !options) return;

        // Handle different key events
        if (!isOpen && this._isLetterKey(e.key)) {
            this._openAndJumpToLetter(dropdownId, e);
        } else if (isOpen) {
            this._handleOpenDropdownKeys(dropdownId, e, options);
        }
    }

    _isLetterKey(key) {
        return key.length === 1 && key.match(/[a-zA-Z]/);
    }

    _openAndJumpToLetter(dropdownId, e) {
        e.preventDefault();
        this.toggleDropdown(dropdownId);
        setTimeout(() => {
            this.jumpToLetter(dropdownId, e.key.toLowerCase());
        }, 10);
    }

    _handleOpenDropdownKeys(dropdownId, e, options) {
        const keyActions = {
            'Escape': () => this.closeDropdown(dropdownId),
            'ArrowDown': () => this.navigateOptions(dropdownId, 1),
            'ArrowUp': () => this.navigateOptions(dropdownId, -1),
            'Enter': () => this._selectHighlightedOption(options)
        };

        const action = keyActions[e.key];
        if (action) {
            e.preventDefault();
            action();
        } else if (this._isLetterKey(e.key)) {
            e.preventDefault();
            this.jumpToLetter(dropdownId, e.key.toLowerCase());
        }
    }

    _selectHighlightedOption(options) {
        const highlighted = options.querySelector('.dropdown-option.highlighted');
        if (highlighted) {
            const langCode = highlighted.dataset.code;
            const language = this.languages.find(l => l.code === langCode);
            if (language) {
                const dropdownId = highlighted.closest('.custom-dropdown').id.replace('-dropdown', '');
                this.selectLanguage(dropdownId, language);
            }
        }
    }

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

    closeAllDropdowns() {
        document.querySelectorAll('.custom-dropdown').forEach(dropdown => {
            dropdown.classList.remove('open');
            dropdown.querySelectorAll('.dropdown-option').forEach(opt => {
                opt.classList.remove('highlighted');
            });
        });
    }

    selectLanguage(dropdownId, language) {
        this._updateLanguageInput(dropdownId, language);
        this._updateDropdownSelection(dropdownId, language);
        this.closeDropdown(dropdownId);
        this.saveCurrentSettings();
        this.generatePrompt();
    }

    _updateLanguageInput(dropdownId, language) {
        const input = DOM.get(`${dropdownId}-input`);
        if (input) {
            input.value = language.name;
            input.dataset.code = language.code;
        }
    }

    _updateDropdownSelection(dropdownId, language) {
        const options = DOM.get(`${dropdownId}-options`);
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

    getLanguageCode(dropdownId) {
        const input = DOM.get(`${dropdownId}-input`);
        return input?.dataset.code || 'en';
    }

    getLanguageName(code) {
        const lang = this.languages.find(l => l.code === code);
        return lang ? lang.name : code;
    }

    saveCurrentSettings() {
        try {
            const settings = this._gatherCurrentSettings();
            this._saveSettingsToStorage(settings);
            console.log('?? LLM generator settings saved');
        } catch (error) {
            console.error('Error saving LLM generator settings:', error);
        }
    }

    _gatherCurrentSettings() {
        return {
            langA: this.getLanguageCode('langA'),
            langB: this.getLanguageCode('langB'),
            exerciseCount: DOM.get('exercisesCount')?.value || '20',
            difficulty: document.querySelector('input[name="difficulty"]:checked')?.value || '3',
            subject: DOM.get('subjectInput')?.value || 'general conversation',
            noise: document.querySelector('input[name="noise"]:checked')?.value || 'auto'
        };
    }

    _saveSettingsToStorage(settings) {
        Object.keys(settings).forEach(key => {
            localStorage.setItem(this.storageKeys[key], settings[key]);
        });
    }

    loadSavedSettings() {
        try {
            this._loadLanguageSettings();
            this._loadOtherSettings();
            console.log('LLM generator settings loaded');
        } catch (error) {
            console.error('Error loading LLM generator settings:', error);
        }
    }

    _loadLanguageSettings() {
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
    }

    _loadOtherSettings() {
        const settingsMap = [
            { key: 'exerciseCount', elementId: 'exercisesCount', type: 'input' },
            { key: 'subject', elementId: 'subjectInput', type: 'input' },
            { key: 'difficulty', selector: 'input[name="difficulty"]', type: 'radio' },
            { key: 'noise', selector: 'input[name="noise"]', type: 'radio' }
        ];

        settingsMap.forEach(setting => {
            const value = localStorage.getItem(this.storageKeys[setting.key]);
            if (value) {
                this._applySetting(setting, value);
            }
        });
    }

    _applySetting(setting, value) {
        if (setting.type === 'input' && setting.elementId) {
            const input = DOM.get(setting.elementId);
            if (input) input.value = value;
        } else if (setting.type === 'radio' && setting.selector) {
            const radio = document.querySelector(`${setting.selector}[value="${value}"]`);
            if (radio) radio.checked = true;
        }
    }

    selectLanguageWithoutSave(dropdownId, language) {
        this._updateLanguageInput(dropdownId, language);
        this._updateDropdownSelection(dropdownId, language);
    }

    getDifficultyInstructions(level) {
        return this.difficultyLevels[level] || this.difficultyLevels['3'];
    }

    getNoiseInstructions(noiseLevel) {
        if (noiseLevel === 'auto') {
            return '';
        }
        
        const general = `
- Noise: distractors should fit phonetically or semantically, but not contain words from the actual sentence/translation. `;
        const specific = this.noiseLevels[noiseLevel] || this.noiseLevels['average'];
        return `${general}${specific}`;
    }

    generatePrompt() {
        const promptData = this._gatherPromptData();
        const prompt = this._buildPromptText(promptData);
        
        const generatedPrompt = DOM.get('generatedPrompt');
        if (generatedPrompt) {
            generatedPrompt.value = prompt;
        }
    }

    _gatherPromptData() {
        const langACode = this.getLanguageCode('langA');
        const langBCode = this.getLanguageCode('langB');
        
        return {
            langACode,
            langBCode,
            langAName: this.getLanguageName(langACode),
            langBName: this.getLanguageName(langBCode),
            exerciseCount: DOM.get('exercisesCount')?.value || '20',
            subject: DOM.get('subjectInput')?.value || 'general conversation',
            difficultyLevel: document.querySelector('input[name="difficulty"]:checked')?.value || '3',
            noiseLevel: document.querySelector('input[name="noise"]:checked')?.value || 'average'
        };
    }

    _buildPromptText(data) {
        const difficultyInstructions = this.getDifficultyInstructions(data.difficultyLevel);
        const noiseInstructions = this.getNoiseInstructions(data.noiseLevel);
        const noiseFormat = data.noiseLevel === 'auto' ? '' : `,
      "noiseA": <space-separated distractor words for ${data.langAName}>,
      "noiseB": <space-separated distractor words for ${data.langBName}>`;

        return `Generate a JSON object for a bilingual language lesson in the following format:

{
  "title": <string>,
  "langA-B": ["${data.langACode}", "${data.langBCode}"],
  "exercises": [
    {
      "A": <sentence in ${data.langAName}>,
      "B": <exact translation in ${data.langBName}>${noiseFormat}
    },
    // ...more exercises
  ]
}

Instructions:
- Generate ${data.exerciseCount} exercises total.
- Theme/Subject: ${data.subject}.
- Difficulty Level: ${data.difficultyLevel}/5 - ${difficultyInstructions}${noiseInstructions}
- For some exercises, fields A and B may be multiple shorter sentences, if the full content remains natural and boundaries are preserved.
- Translations must be accurate and straightforward in both directions.
- Create a short, descriptive title that reflects the theme and difficulty level.
- Output valid JSON in the format above.`;
    }

    showModal() {
        DOM.setVisible('llmPromptModal', true);
        this.generatePrompt();
    }

    hideModal() {
        DOM.setVisible('llmPromptModal', false);
    }

    async copyToClipboard() {
        const prompt = DOM.get('generatedPrompt')?.value;
        if (!prompt) {
            alert('No prompt to copy. Please generate a prompt first.');
            return;
        }

        try {
            await ClipboardUtils.copyText(prompt, 'LLM prompt copied to clipboard!');
        } catch (error) {
            console.error('Failed to copy LLM prompt to clipboard:', error);
            UIUtils.showError('Failed to copy prompt to clipboard');
        }
    }
}