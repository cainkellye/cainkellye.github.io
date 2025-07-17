document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const elements = {
        // Main elements
        prompt: document.getElementById('prompt'),
        responseContainer: document.getElementById('response-container'),
        wordBankContainer: document.getElementById('word-bank-container'),
        feedback: document.getElementById('feedback'),
        
        // Buttons
        submit: document.getElementById('submit-btn'),
        clear: document.getElementById('clear-btn'),
        back: document.getElementById('back-btn'),
        next: document.getElementById('next-btn'),
        translate: document.getElementById('translate-btn'),
        shuffle: document.getElementById('shuffle-lessons-btn'),
        vocab1: document.getElementById('vocab1-btn'),
        vocab2: document.getElementById('vocab2-btn'),
        
        // Config panel
        openConfigPanel: document.getElementById('open-config-panel-btn'),
        configPanel: document.getElementById('config-panel'),
        configInput: document.getElementById('config-input'),
        loadConfig: document.getElementById('load-config-btn'),
        cancelConfig: document.getElementById('cancel-config-btn')
    };

    // --- Application State ---
    const state = {
        currentTaskIndex: 0,
        lessons: [],
        config: null,
        prevResponses: [],
        promptLang: '',
        solutionLang: '',
        lessonDirections: [], // Array to track direction for each lesson
        currentCycle: 0 // Track which cycle we're on (0: first direction, 1: second direction)
    };

    // --- Direction Management ---
    const DirectionManager = {
        // Initialize randomized directions for all lessons
        initializeDirections() {
            if (state.lessons.length === 0) return;
            
            // Create array with half AtoB and half BtoA, then shuffle
            const directions = [];
            const halfLength = Math.floor(state.lessons.length / 2);
            
            // Add AtoB directions
            for (let i = 0; i < halfLength; i++) {
                directions.push('AtoB');
            }
            
            // Add BtoA directions for the rest
            for (let i = halfLength; i < state.lessons.length; i++) {
                directions.push('BtoA');
            }
            
            // Shuffle the directions
            Utils.shuffleArray(directions);
            state.lessonDirections = directions;
            state.currentCycle = 0;
        },

        // Get current direction for a lesson
        getCurrentDirection(lessonIndex) {
            if (state.lessonDirections.length === 0) {
                this.initializeDirections();
            }
            
            // In the second cycle, flip the direction
            const baseDirection = state.lessonDirections[lessonIndex];
            if (state.currentCycle === 1) {
                return baseDirection === 'AtoB' ? 'BtoA' : 'AtoB';
            }
            return baseDirection;
        },

        // Check if we need to advance to the next cycle
        checkAndAdvanceCycle() {
            if (state.currentTaskIndex === 0 && state.currentCycle === 0) {
                // We've completed the first cycle, move to second cycle
                state.currentCycle = 1;
                return true;
            }
            return false;
        },

        // Shuffle directions (called when shuffle button is pressed)
        shuffleDirections() {
            this.initializeDirections();
        }
    };

    // --- Utility Functions ---
    const Utils = {
        shuffleArray(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
        },

        removePunctuation(sentence) {
            return sentence.replace(/[.,!?¿¡—–\()"]/g, '');
        },

        splitSentence(sentence) {
            return sentence.split(/\s+/).filter(Boolean);
        },

        splitSentenceWithoutPunctuation(sentence) {
            return this.splitSentence(this.removePunctuation(sentence));
        },

        removeDuplicates(words, caseSensitive = true) {
            const seen = new Set();
            return words.filter(word => {
                const normalizedWord = caseSensitive ? word : word.toLowerCase();
                if (seen.has(normalizedWord)) {
                    return false;
                }
                seen.add(normalizedWord);
                return true;
            });
        }
    };

    // --- UI Management ---
    const UI = {
        setButtonsDisabled(disabled) {
            const buttonIds = ['submit', 'clear', 'next', 'shuffle', 'back', 'translate', 'vocab1', 'vocab2'];
            buttonIds.forEach(id => {
                elements[id].disabled = disabled;
            });
        },

        setResponseButtonsDisabled(disabled) {
            elements.submit.disabled = disabled;
            elements.clear.disabled = disabled;
            elements.back.disabled = disabled;
        },

        clearWordBank() {
            elements.wordBankContainer.innerHTML = '';
        },

        updateVocabButtons(langAB) {
            elements.vocab1.innerHTML = `${langAB[0]} → ${langAB[1]} 📖`;
            elements.vocab2.innerHTML = `${langAB[1]} → ${langAB[0]} 📖`;
            elements.vocab1.style.display = '';
            elements.vocab2.style.display = '';
        },

        createWordBankButton(word) {
            const button = document.createElement('button');
            button.textContent = word;
            button.classList.add('word-bank-btn');
            button.addEventListener('click', () => {
                const currentResponse = elements.responseContainer.textContent;
                state.prevResponses.push(currentResponse);
                elements.responseContainer.textContent = currentResponse ? `${currentResponse} ${word}` : word;
            });
            return button;
        },

        showFeedback(isCorrect, feedbackText) {
            elements.feedback.textContent = isCorrect ? 'Correct!' : '';
            elements.feedback.innerHTML = isCorrect ? 'Correct!' : feedbackText;
            elements.feedback.style.color = isCorrect ? 'green' : '';
        }
    };

    // --- Lesson Management ---
    const LessonManager = {
        getCurrentLessonData(lesson, direction) {
            if (direction === 'AtoB') {
                return {
                    prompt: lesson.A,
                    solution: lesson.B,
                    noise: lesson.noiseB || this.generateNoise('B', 6, lesson.B),
                    promptLang: state.config["langA-B"] ? state.config["langA-B"][0] : '',
                    solutionLang: state.config["langA-B"] ? state.config["langA-B"][1] : ''
                };
            } else {
                return {
                    prompt: lesson.B,
                    solution: lesson.A,
                    noise: lesson.noiseA || this.generateNoise('A', 6, lesson.A),
                    promptLang: state.config["langA-B"] ? state.config["langA-B"][1] : '',
                    solutionLang: state.config["langA-B"] ? state.config["langA-B"][0] : ''
                };
            }
        },

        generateNoise(lang, count, solution) {
            const words = VocabularyManager.generateVocabulary(lang, 0);

            // Remove words found in solutionWords (case-insensitive)
            const solutionWords = Utils.splitSentenceWithoutPunctuation(solution).map(w => w.toLowerCase());
            const filteredWords = words.filter(word => !solutionWords.includes(word.toLowerCase()));

            Utils.shuffleArray(filteredWords);
            return Utils.removeDuplicates(filteredWords, false).slice(0, count).join(' ');
        },

        loadTask(index) {
            if (!state.lessons || state.lessons.length === 0) {
                elements.prompt.textContent = "No lessons loaded.";
                UI.setButtonsDisabled(true);
                return;
            }

            UI.setButtonsDisabled(false);
            const lesson = state.lessons[index];
            const currentDirection = DirectionManager.getCurrentDirection(index);
            const lessonData = this.getCurrentLessonData(lesson, currentDirection);
            
            state.promptLang = lessonData.promptLang;
            state.solutionLang = lessonData.solutionLang;

            // Display lesson counter and prompt
            const lessonNumber = index + 1;
            const totalLessons = state.lessons.length;
            elements.prompt.textContent = `${lessonNumber}/${totalLessons}. Translate this: "${lessonData.prompt}"`;

            // Create word bank
            const words = Utils.removeDuplicates(Utils.splitSentenceWithoutPunctuation(lessonData.solution + ' ' + lessonData.noise));
            Utils.shuffleArray(words);

            UI.clearWordBank();
            words.forEach(word => {
                const button = UI.createWordBankButton(word);
                elements.wordBankContainer.appendChild(button);
            });

            // Reset response state
            elements.responseContainer.textContent = '';
            elements.feedback.textContent = '';
            state.prevResponses = [];
        }
    };

    // --- Answer Validation ---
    const AnswerValidator = {
        validateAnswer(userResponse) {
            const currentDirection = DirectionManager.getCurrentDirection(state.currentTaskIndex);
            const lessonData = LessonManager.getCurrentLessonData(state.lessons[state.currentTaskIndex], currentDirection);
            const solution = Utils.removePunctuation(lessonData.solution);
            
            UI.clearWordBank();
            UI.setResponseButtonsDisabled(true);

            if (userResponse === solution) {
                UI.showFeedback(true);
                return;
            }

            // Generate detailed feedback
            const feedbackHtml = this.generateDetailedFeedback(userResponse, solution);
            UI.showFeedback(false, feedbackHtml);
        },

        generateDetailedFeedback(userResponse, solution) {
            const userWords = Utils.splitSentenceWithoutPunctuation(userResponse);
            const solWords = Utils.splitSentenceWithoutPunctuation(solution);
            const solWordsOriginal = Utils.splitSentence(solution);

            // Find common prefix
            let prefixCount = 0;
            while (
                prefixCount < userWords.length &&
                prefixCount < solWords.length &&
                userWords[prefixCount] === solWords[prefixCount]
            ) {
                prefixCount++;
            }

            // Find common suffix
            let suffixCount = 0;
            while (
                suffixCount < (solWords.length - prefixCount) &&
                suffixCount < (userWords.length - prefixCount) &&
                userWords[userWords.length - 1 - suffixCount] === solWords[solWords.length - 1 - suffixCount]
            ) {
                suffixCount++;
            }

            const prefixText = solWordsOriginal.slice(0, prefixCount).join(' ');
            const mismatchText = solWordsOriginal.slice(prefixCount, solWords.length - suffixCount).join(' ');
            const suffixText = solWordsOriginal.slice(solWords.length - suffixCount).join(' ');

            return 'Incorrect. The correct answer is: "' + 
                (prefixText ? '<span style="color:black;">' + prefixText + '</span> ' : '') +
                (mismatchText ? '<span style="color:red;">' + mismatchText + '</span>' : '') +
                (suffixText ? '<span style="color:black;"> ' + suffixText + '</span>"' : '"');
        }
    };

    // --- Vocabulary Management ---
    const VocabularyManager = {
        generateVocabulary(lang, limit) { // lang = 'A' or 'B'
            const words = [];
            state.lessons.forEach(lesson => {
                const sentence = lang === 'A' ? lesson.A : lesson.B;
                if (sentence) {
                    const lessonWords = Utils.splitSentenceWithoutPunctuation(sentence);
                    if (limit == 0) {
                        words.push(...lessonWords);
                    } else {
                        lessonWords.forEach(word => {
                            if (word.length >= limit) {
                                words.push(word);
                            }});
                    }
                }
            });

            return Utils.removeDuplicates(words, false);
        },

        openVocabularyTranslation(sourceLang, targetLang) {
            lang = sourceLang === state.config["langA-B"][0] ? 'A' : 'B';
            const vocab = this.generateVocabulary(lang, 4);
            const encodedPrompt = encodeURIComponent(vocab.join(';\n'));
            const translateUrl = `https://translate.google.com/?sl=${sourceLang}&tl=${targetLang}&text=${encodedPrompt}`;
            window.open(translateUrl, '_blank');
        }
    };

    // --- Translation Management ---
    const TranslationManager = {
        openTranslation() {
            const currentDirection = DirectionManager.getCurrentDirection(state.currentTaskIndex);
            const lessonData = LessonManager.getCurrentLessonData(state.lessons[state.currentTaskIndex], currentDirection);
            const encodedPrompt = encodeURIComponent(lessonData.prompt);
            
            let translateUrl;
            if (!state.promptLang || !state.solutionLang) {
                translateUrl = `https://translate.google.com/?sl=auto&text=${encodedPrompt}`;
            } else {
                translateUrl = `https://translate.google.com/?sl=${state.promptLang}&tl=${state.solutionLang}&text=${encodedPrompt}`;
            }
            
            window.open(translateUrl, '_blank');
        }
    };

    // --- Configuration Management ---
    const ConfigManager = {
        loadConfiguration(configData) {
            state.config = configData;
            state.lessons = configData.lessons;
            state.currentTaskIndex = 0;
            DirectionManager.initializeDirections();
            LessonManager.loadTask(state.currentTaskIndex);
            UI.updateVocabButtons(state.config["langA-B"]);
        },

        loadFromText() {
            const configText = elements.configInput.value;
            if (!configText) {
                alert("The text area is empty. Please paste your lesson configuration.");
                return;
            }
            
            try {
                const newConfig = JSON.parse(configText);
                if (newConfig && newConfig.lessons) {
                    this.loadConfiguration(newConfig);
                    elements.configInput.value = '';
                    elements.configPanel.style.display = 'none';
                } else {
                    alert("Invalid configuration format. Make sure it has a 'lessons' property.");
                }
            } catch (error) {
                alert(`Error parsing JSON: ${error.message}`);
            }
        },

        loadFromFile() {
            fetch('config.json')
                .then(response => {
                    if (!response.ok) {
                        throw new Error("config.json not found.");
                    }
                    return response.json();
                })
                .then(config => {
                    this.loadConfiguration(config);
                })
                .catch(error => {
                    console.warn("Could not load default config.json. Use 'Load from Text' to begin.", error);
                    UI.setButtonsDisabled(true);
                });
        }
    };

    // --- Event Handlers ---
    const EventHandlers = {
        setupEventListeners() {
            // Answer submission
            elements.submit.addEventListener('click', () => {
                const userResponse = elements.responseContainer.textContent.trim();
                AnswerValidator.validateAnswer(userResponse);
            });

            // Response management
            elements.clear.addEventListener('click', () => {
                elements.responseContainer.textContent = '';
                state.prevResponses = [];
            });

            elements.back.addEventListener('click', () => {
                if (state.prevResponses.length > 0) {
                    elements.responseContainer.textContent = state.prevResponses.pop();
                } else {
                    elements.responseContainer.textContent = '';
                }
            });

            // Navigation
            elements.next.addEventListener('click', () => {
                state.currentTaskIndex = (state.currentTaskIndex + 1) % state.lessons.length;
                
                // Check if we need to advance to the next cycle
                if (state.currentTaskIndex === 0) {
                    DirectionManager.checkAndAdvanceCycle();
                }
                
                LessonManager.loadTask(state.currentTaskIndex);
            });

            elements.shuffle.addEventListener('click', () => {
                Utils.shuffleArray(state.lessons);
                DirectionManager.shuffleDirections();
                state.currentTaskIndex = 0;
                LessonManager.loadTask(state.currentTaskIndex);
            });

            // Translation and vocabulary
            elements.translate.addEventListener('click', () => {
                TranslationManager.openTranslation();
            });

            elements.vocab1.addEventListener('click', () => {
                VocabularyManager.openVocabularyTranslation(state.promptLang, state.solutionLang);
            });

            elements.vocab2.addEventListener('click', () => {
                VocabularyManager.openVocabularyTranslation(state.solutionLang, state.promptLang);
            });

            // Configuration panel
            elements.openConfigPanel.addEventListener('click', () => {
                elements.configPanel.style.display = 'flex';
            });

            elements.cancelConfig.addEventListener('click', () => {
                elements.configPanel.style.display = 'none';
            });

            elements.loadConfig.addEventListener('click', () => {
                ConfigManager.loadFromText();
            });
        }
    };

    // --- Application Initialization ---
    function initialize() {
        EventHandlers.setupEventListeners();
        ConfigManager.loadFromFile();
    }

    // Start the application
    initialize();
});
