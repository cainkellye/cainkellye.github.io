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
        mistakes: document.getElementById('mistakes-btn'),
        
        // Config panel
        openConfigPanel: document.getElementById('open-config-panel-btn'),
        configPanel: document.getElementById('config-panel'),
        configInput: document.getElementById('config-input'),
        loadConfig: document.getElementById('load-config-btn'),
        saveConfig: document.getElementById('save-config-btn'),
        cancelConfig: document.getElementById('cancel-config-btn'),
        
        // Tabs
        pasteTab: document.getElementById('paste-tab'),
        savedTab: document.getElementById('saved-tab'),
        pasteTabBtn: document.getElementById('paste-tab-btn'),
        savedTabBtn: document.getElementById('saved-tab-btn'),
        
        // Saved lessons
        savedLessonsContainer: document.getElementById('saved-lessons-container'),
        savedLessonsList: document.getElementById('saved-lessons-list'),
        noSavedLessonsMsg: document.getElementById('no-saved-lessons-msg'),
        cancelSaved: document.getElementById('cancel-saved-btn'),
        
        // Rename modal
        renameModal: document.getElementById('rename-modal'),
        renameInput: document.getElementById('rename-input'),
        confirmRename: document.getElementById('confirm-rename-btn'),
        cancelRename: document.getElementById('cancel-rename-btn'),
        
        // Mistakes modal
        mistakesModal: document.getElementById('mistakes-modal'),
        mistakesContent: document.getElementById('mistakes-content'),
        mistakesList: document.getElementById('mistakes-list'),
        noMistakesMsg: document.getElementById('no-mistakes-msg'),
        copyMistakes: document.getElementById('copy-mistakes-btn'),
        clearMistakes: document.getElementById('clear-mistakes-btn'),
        closeMistakes: document.getElementById('close-mistakes-btn')
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
        currentCycle: 0, // Track which cycle we're on (0: first direction, 1: second direction)
        currentRenameId: null, // Track which lesson is being renamed
        mistakes: [] // Track user mistakes
    };

    // --- Storage Management ---
    const StorageManager = {
        // Save a lesson configuration to localStorage
        saveLesson(config) {
            const savedLessons = this.getSavedLessons();
            //console.log('Current saved lessons:', savedLessons);
            const lessonId = Date.now().toString();
            console.log('Saving lesson with ID:', lessonId);
            
            // Create a saveable lesson object
            const lessonToSave = {
                id: lessonId,
                title: config.title || 'Untitled Lesson',
                langCode: config["langA-B"] ? config["langA-B"].join('-') : 'unknown',
                languages: config["langA-B"] || ['?', '?'],
                config: config,
                dateAdded: new Date().toISOString(),
                lessonCount: config.lessons ? config.lessons.length : 0
            };
            
            try {
                // Store the full lesson data in localStorage
                const success = this.setStorageItem(`udolingo_lesson_${lessonId}`, lessonToSave);
                if (!success) {
                    console.error('Failed to save lesson data');
                    return null;
                }
                
                // Update the lessons index
                savedLessons[lessonId] = {
                    id: lessonId,
                    title: lessonToSave.title,
                    langCode: lessonToSave.langCode,
                    languages: lessonToSave.languages,
                    dateAdded: lessonToSave.dateAdded,
                    lessonCount: lessonToSave.lessonCount
                };
                
                const indexSuccess = this.setSavedLessonsIndex(savedLessons);
                if (!indexSuccess) {
                    // Clean up the lesson data if index update failed
                    this.removeStorageItem(`udolingo_lesson_${lessonId}`);
                    console.error('Failed to update lessons index');
                    return null;
                }
                
                console.log('Lesson saved successfully');
                return lessonId;
            } catch (error) {
                console.error('Error saving lesson:', error);
                return null;
            }
        },
        
        // Get all saved lessons metadata
        getSavedLessons() {
            try {
                const indexData = this.getStorageItem('udolingo_lessons_index');
                if (!indexData) {
                    console.log("No saved lessons index found");
                    return {};
                }
                
                console.log("Lessons index found:", Object.keys(indexData).length, "lessons");
                return indexData;
            } catch (error) {
                console.error('Error getting saved lessons:', error);
                return {};
            }
        },
        
        // Set the lessons index (metadata only)
        setSavedLessonsIndex(lessonsIndex) {
            try {
                return this.setStorageItem('udolingo_lessons_index', lessonsIndex);
            } catch (error) {
                console.error('Error setting lessons index:', error);
                return false;
            }
        },
        
        // Get a specific saved lesson by ID (full data)
        getSavedLesson(id) {
            try {
                const lessonData = this.getStorageItem(`udolingo_lesson_${id}`);
                if (!lessonData) {
                    console.log(`Lesson ${id} not found`);
                    return null;
                }
                
                console.log(`Lesson ${id} loaded successfully`);
                return lessonData;
            } catch (error) {
                console.error(`Error getting lesson ${id}:`, error);
                return null;
            }
        },
        
        // Delete a saved lesson by ID
        deleteLesson(id) {
            try {
                // Remove the lesson data
                const dataRemoved = this.removeStorageItem(`udolingo_lesson_${id}`);
                if (!dataRemoved) {
                    console.error(`Failed to remove lesson data for ${id}`);
                    return false;
                }
                
                // Update the index
                const savedLessons = this.getSavedLessons();
                if (savedLessons[id]) {
                    delete savedLessons[id];
                    const indexSuccess = this.setSavedLessonsIndex(savedLessons);
                    if (!indexSuccess) {
                        console.error('Failed to update lessons index after deletion');
                        return false;
                    }
                    
                    console.log(`Lesson ${id} deleted successfully`);
                    return true;
                } else {
                    console.log(`Lesson ${id} not found in index`);
                    return false;
                }
            } catch (error) {
                console.error(`Error deleting lesson ${id}:`, error);
                return false;
            }
        },
        
        // Rename a saved lesson
        renameLesson(id, newTitle) {
            try {
                // Update the full lesson data
                const lessonData = this.getSavedLesson(id);
                if (!lessonData) {
                    console.log(`Lesson ${id} not found for renaming`);
                    return false;
                }
                
                lessonData.title = newTitle;
                const dataSuccess = this.setStorageItem(`udolingo_lesson_${id}`, lessonData);
                if (!dataSuccess) {
                    console.error(`Failed to update lesson data for ${id}`);
                    return false;
                }
                
                // Update the index
                const savedLessons = this.getSavedLessons();
                if (savedLessons[id]) {
                    savedLessons[id].title = newTitle;
                    const indexSuccess = this.setSavedLessonsIndex(savedLessons);
                    if (!indexSuccess) {
                        console.error('Failed to update lessons index after rename');
                        return false;
                    }
                    
                    console.log(`Lesson ${id} renamed successfully`);
                    return true;
                } else {
                    console.log(`Lesson ${id} not found in index`);
                    return false;
                }
            } catch (error) {
                console.error(`Error renaming lesson ${id}:`, error);
                return false;
            }
        },
        
        // localStorage utility functions
        setStorageItem(key, value) {
            try {
                const json = JSON.stringify(value);
                localStorage.setItem(key, json);
                console.log(`Stored ${key} with size: ${json.length} bytes`);
                return true;
            } catch (error) {
                if (error.name === 'QuotaExceededError') {
                    console.error('localStorage quota exceeded');
                    alert('Storage quota exceeded. Please delete some saved lessons to free up space.');
                } else {
                    console.error('Error saving to localStorage:', error);
                }
                return false;
            }
        },
        
        getStorageItem(key) {
            try {
                const item = localStorage.getItem(key);
                if (item === null) {
                    return null;
                }
                return JSON.parse(item);
            } catch (error) {
                console.error(`Error parsing localStorage item ${key}:`, error);
                return null;
            }
        },
        
        removeStorageItem(key) {
            try {
                localStorage.removeItem(key);
                console.log(`Removed ${key} from localStorage`);
                return true;
            } catch (error) {
                console.error(`Error removing ${key} from localStorage:`, error);
                return false;
            }
        },
        
        // Check localStorage availability and health
        checkStorageHealth() {
            try {
                const testKey = 'udolingo_test';
                const testData = { test: 'data', timestamp: Date.now() };
                
                // Test write
                const writeSuccess = this.setStorageItem(testKey, testData);
                if (!writeSuccess) {
                    return false;
                }
                
                // Test read
                const retrieved = this.getStorageItem(testKey);
                if (!retrieved || retrieved.test !== 'data') {
                    return false;
                }
                
                // Clean up
                this.removeStorageItem(testKey);
                
                console.log('localStorage health check passed');
                return true;
            } catch (error) {
                console.error('localStorage health check failed:', error);
                return false;
            }
        },
        
        // Clear all saved lessons (emergency cleanup)
        clearAllSavedLessons() {
            try {
                const savedLessons = this.getSavedLessons();
                
                // Remove all lesson data
                Object.keys(savedLessons).forEach(id => {
                    this.removeStorageItem(`udolingo_lesson_${id}`);
                });
                
                // Clear the index
                this.removeStorageItem('udolingo_lessons_index');
                
                console.log('All saved lessons cleared');
                return true;
            } catch (error) {
                console.error('Error clearing saved lessons:', error);
                return false;
            }
        },
        
        // Get storage usage info
        getStorageInfo() {
            try {
                const savedLessons = this.getSavedLessons();
                const lessonCount = Object.keys(savedLessons).length;
                
                // Calculate total storage usage
                let totalSize = 0;
                const indexSize = JSON.stringify(savedLessons).length;
                totalSize += indexSize;
                
                Object.keys(savedLessons).forEach(id => {
                    const lessonData = this.getStorageItem(`udolingo_lesson_${id}`);
                    if (lessonData) {
                        totalSize += JSON.stringify(lessonData).length;
                    }
                });
                
                // Estimate total localStorage usage
                let totalLocalStorageSize = 0;
                for (let key in localStorage) {
                    if (localStorage.hasOwnProperty(key)) {
                        totalLocalStorageSize += localStorage[key].length + key.length;
                    }
                }
                
                return {
                    isAvailable: typeof(Storage) !== "undefined",
                    lessonCount: lessonCount,
                    udolingoStorageSize: totalSize,
                    totalLocalStorageSize: totalLocalStorageSize,
                    formattedSize: this.formatBytes(totalSize),
                    formattedTotalSize: this.formatBytes(totalLocalStorageSize),
                    estimatedQuota: '5-10MB (varies by browser)'
                };
            } catch (error) {
                console.error('Error getting storage info:', error);
                return {
                    isAvailable: false,
                    lessonCount: 0,
                    udolingoStorageSize: 0,
                    totalLocalStorageSize: 0,
                    formattedSize: '0 bytes',
                    formattedTotalSize: '0 bytes',
                    estimatedQuota: 'Unknown'
                };
            }
        },
        
        // Format bytes for display
        formatBytes(bytes, decimals = 2) {
            if (bytes === 0) return '0 bytes';
            
            const k = 1024;
            const dm = decimals < 0 ? 0 : decimals;
            const sizes = ['bytes', 'KB', 'MB', 'GB'];
            
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            
            return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
        }
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
            
            // Add BtoA for the rest
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
            if (state.currentCycle === 0) {
                // We've completed the first cycle, move to second cycle
                state.currentCycle = 1;
            } else if (state.currentCycle === 1) {
                this.initializeDirections();
            }
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
            const buttonIds = ['submit', 'clear', 'next', 'shuffle', 'back', 'translate', 'vocab1', 'vocab2', 'mistakes'];
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
        },

        // Tab management
        switchTab(tabName) {
            if (tabName === 'paste') {
                elements.pasteTab.classList.add('active');
                elements.savedTab.classList.remove('active');
                elements.pasteTabBtn.classList.add('active');
                elements.savedTabBtn.classList.remove('active');
            } else if (tabName === 'saved') {
                elements.pasteTab.classList.remove('active');
                elements.savedTab.classList.add('active');
                elements.pasteTabBtn.classList.remove('active');
                elements.savedTabBtn.classList.add('active');
                this.refreshSavedLessonsList();
            }
        },

        // Refresh the saved lessons list
        refreshSavedLessonsList() {
            const savedLessons = StorageManager.getSavedLessons();
            const lessonIds = Object.keys(savedLessons);
            
            elements.savedLessonsList.innerHTML = '';
            
            if (lessonIds.length === 0) {
                elements.noSavedLessonsMsg.style.display = 'block';
                return;
            }
            
            elements.noSavedLessonsMsg.style.display = 'none';
            
            lessonIds.forEach(id => {
                const lesson = savedLessons[id];
                const lessonItem = this.createSavedLessonItem(lesson);
                elements.savedLessonsList.appendChild(lessonItem);
            });
        },

        // Create a saved lesson item element
        createSavedLessonItem(lesson) {
            const item = document.createElement('div');
            item.className = 'saved-lesson-item';
            
            const info = document.createElement('div');
            info.className = 'lesson-info';
            
            const title = document.createElement('div');
            title.className = 'lesson-title';
            title.textContent = lesson.title;
            
            const details = document.createElement('div');
            details.className = 'lesson-details';
            const dateAdded = new Date(lesson.dateAdded).toLocaleDateString();
            details.textContent = `${lesson.languages[0]} ↔ ${lesson.languages[1]} • ${lesson.lessonCount} lessons • ${dateAdded}`;
            
            info.appendChild(title);
            info.appendChild(details);
            
            const actions = document.createElement('div');
            actions.className = 'lesson-actions';
            
            const loadBtn = document.createElement('button');
            loadBtn.className = 'load-lesson-btn';
            loadBtn.textContent = 'Load';
            loadBtn.addEventListener('click', () => {
                ConfigManager.loadSavedLesson(lesson.id);
            });
            
            const renameBtn = document.createElement('button');
            renameBtn.className = 'rename-lesson-btn';
            renameBtn.textContent = 'Rename';
            renameBtn.addEventListener('click', () => {
                this.showRenameModal(lesson.id, lesson.title);
            });
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-lesson-btn';
            deleteBtn.textContent = 'Delete';
            deleteBtn.addEventListener('click', () => {
                this.deleteSavedLesson(lesson.id);
            });
            
            actions.appendChild(loadBtn);
            actions.appendChild(renameBtn);
            actions.appendChild(deleteBtn);
            
            item.appendChild(info);
            item.appendChild(actions);
            
            return item;
        },

        // Show rename modal
        showRenameModal(lessonId, currentTitle) {
            state.currentRenameId = lessonId;
            elements.renameInput.value = currentTitle;
            elements.renameModal.style.display = 'flex';
            elements.renameInput.focus();
            elements.renameInput.select();
        },

        // Hide rename modal
        hideRenameModal() {
            elements.renameModal.style.display = 'none';
            state.currentRenameId = null;
            elements.renameInput.value = '';
        },

        // Delete saved lesson with confirmation
        deleteSavedLesson(lessonId) {
            const lesson = StorageManager.getSavedLesson(lessonId);
            if (lesson && confirm(`Are you sure you want to delete "${lesson.title}"?`)) {
                const success = StorageManager.deleteLesson(lessonId);
                if (success) {
                    this.refreshSavedLessonsList();
                } else {
                    alert("Failed to delete lesson. Please try again.");
                }
            }
        },

        // Show save button when valid config is detected
        showSaveButton(configData) {
            if (configData && configData.lessons && configData.lessons.length > 0) {
                elements.saveConfig.style.display = 'inline-block';
            } else {
                elements.saveConfig.style.display = 'none';
            }
        },
        
        // Show storage info (for debugging)
        showStorageInfo() {
            const info = StorageManager.getStorageInfo();
            const message = `Storage Info:
            
Available: ${info.isAvailable ? 'Yes' : 'No'}
Saved Lessons: ${info.lessonCount}
Udolingo Storage: ${info.formattedSize}
Total localStorage: ${info.formattedTotalSize}
Estimated Quota: ${info.estimatedQuota}`;
            
            alert(message);
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

            // Record the mistake
            MistakesManager.recordMistake(
                lessonData.prompt,
                solution,
                userResponse,
                state.currentTaskIndex,
                currentDirection
            );

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

    // --- Mistakes Management ---
    const MistakesManager = {
        recordMistake(prompt, solution, userResponse, lessonIndex, direction) {
            const mistake = {
                id: Date.now(),
                prompt: prompt,
                solution: solution,
                userResponse: userResponse,
                lessonIndex: lessonIndex,
                direction: direction,
            };
            
            state.mistakes.push(mistake);
            console.log('Mistake recorded:', mistake);
        },
        
        clearAllMistakes() {
            state.mistakes = [];
            console.log('All mistakes cleared');
        },
        
        showMistakesModal() {
            this.refreshMistakesList();
            elements.mistakesModal.style.display = 'flex';
        },
        
        hideMistakesModal() {
            elements.mistakesModal.style.display = 'none';
        },
        
        refreshMistakesList() {
            elements.mistakesList.innerHTML = '';
            
            if (state.mistakes.length === 0) {
                elements.noMistakesMsg.style.display = 'block';
                elements.copyMistakes.style.display = 'none';
                elements.clearMistakes.style.display = 'none';
                return;
            }
            
            elements.noMistakesMsg.style.display = 'none';
            elements.copyMistakes.style.display = 'inline-block';
            elements.clearMistakes.style.display = 'inline-block';
            
            // Group mistakes by lesson and direction for better organization
            const groupedMistakes = this.groupMistakesByLesson();
            
            Object.keys(groupedMistakes).forEach(key => {
                const mistakes = groupedMistakes[key];
                const [lessonIndex, direction] = key.split('_');
                
                // Create a section for this lesson/direction
                const sectionHeader = document.createElement('div');
                sectionHeader.className = 'mistake-section-header';
                sectionHeader.innerHTML = `<h4>Lesson ${parseInt(lessonIndex) + 1} (${direction === 'AtoB' ? state.config["langA-B"][0] + ' → ' + state.config["langA-B"][1] : state.config["langA-B"][1] + ' → ' + state.config["langA-B"][0]})</h4>`;
                elements.mistakesList.appendChild(sectionHeader);
                
                mistakes.forEach(mistake => {
                    const mistakeItem = this.createMistakeItem(mistake);
                    elements.mistakesList.appendChild(mistakeItem);
                });
            });
        },
        
        // Group mistakes by lesson and direction
        groupMistakesByLesson() {
            const grouped = {};
            state.mistakes.forEach(mistake => {
                const key = `${mistake.lessonIndex}_${mistake.direction}`;
                if (!grouped[key]) {
                    grouped[key] = [];
                }
                grouped[key].push(mistake);
            });
            return grouped;
        },
        
        createMistakeItem(mistake) {
            const item = document.createElement('div');
            item.className = 'mistake-item';
            
            const prompt = document.createElement('div');
            prompt.className = 'mistake-prompt';
            prompt.textContent = `Prompt: "${mistake.prompt}"`;
            
            const solution = document.createElement('div');
            solution.className = 'mistake-solution';
            solution.textContent = `Correct: "${mistake.solution}"`;
            
            const response = document.createElement('div');
            response.className = 'mistake-response';
            response.textContent = `Your answer: "${mistake.userResponse}"`;
            
            item.appendChild(prompt);
            item.appendChild(solution);
            item.appendChild(response);
            
            return item;
        },
        
        // Generate LLM-friendly text for copying
        generateLLMText() {
            if (state.mistakes.length === 0) {
                return 'No mistakes to analyze.';
            }
            
            let text = `Please help me understand my language learning mistakes. I'm studying ${state.config["langA-B"][0]} ↔ ${state.config["langA-B"][1]} with the lesson "${state.config.title}".\n\n`;
            text += `Here are my ${state.mistakes.length} mistakes:\n\n`;
            
            state.mistakes.forEach((mistake, index) => {
                const directionText = mistake.direction === 'AtoB' 
                    ? `${state.config["langA-B"][0]} → ${state.config["langA-B"][1]}`
                    : `${state.config["langA-B"][1]} → ${state.config["langA-B"][0]}`;
                
                text += `${index + 1}. [${directionText}] Lesson ${mistake.lessonIndex + 1}\n`;
                text += `   Prompt: "${mistake.prompt}"\n`;
                text += `   Correct: "${mistake.solution}"\n`;
                text += `   My answer: "${mistake.userResponse}"\n\n`;
            });
            
            text += 'Please explain what I did wrong in each case and provide tips to avoid similar mistakes in the future.';
            
            return text;
        },
        
        copyMistakesToClipboard() {
            const text = this.generateLLMText();
            
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(() => {
                    alert('Mistakes copied to clipboard! You can now paste this into an LLM for analysis.');
                }).catch(err => {
                    console.error('Failed to copy to clipboard:', err);
                    this.fallbackCopyToClipboard(text);
                });
            } else {
                this.fallbackCopyToClipboard(text);
            }
        },
        
        // Fallback copy method for older browsers
        fallbackCopyToClipboard(text) {
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
                alert('Mistakes copied to clipboard! You can now paste this into an LLM for analysis.');
            } catch (err) {
                console.error('Fallback copy failed:', err);
                alert('Copy failed. Please manually copy the text from the console.');
                console.log('Mistakes text for LLM:', text);
            }
            
            document.body.removeChild(textArea);
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
            MistakesManager.clearAllMistakes();
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
                    UI.showSaveButton(newConfig);
                    elements.configInput.value = '';
                    elements.configPanel.style.display = 'none';
                } else {
                    alert("Invalid configuration format. Make sure it has a 'lessons' property.");
                }
            } catch (error) {
                alert(`Error parsing JSON: ${error.message}`);
            }
        },

        saveCurrentConfig() {
            const configText = elements.configInput.value;
            if (!configText) {
                alert("No configuration to save.");
                return;
            }
            
            try {
                const configData = JSON.parse(configText);
                if (configData && configData.lessons) {
                    // Check storage health before saving
                    if (!StorageManager.checkStorageHealth()) {
                        alert("Storage appears to be having issues. Please try again or check your browser settings.");
                        return;
                    }
                    
                    const lessonId = StorageManager.saveLesson(configData);
                    if (lessonId) {
                        console.log(`Lesson saved successfully! Id=${lessonId}`);
                    } else {
                        alert("Failed to save lesson. Please try again or check if you have enough storage space.");
                    }
                } else {
                    alert("Invalid configuration format. Make sure it has a 'lessons' property.");
                }
            } catch (error) {
                alert(`Error parsing JSON: ${error.message}`);
            }
        },

        loadSavedLesson(lessonId) {
            const lesson = StorageManager.getSavedLesson(lessonId);
            if (lesson) {
                this.loadConfiguration(lesson.config);
                elements.configPanel.style.display = 'none';
            } else {
                alert("Lesson not found.");
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
                if (state.mistakes.length == 0 || confirm('This will clear the mistakes list. Are you sure you want to shuffle lessons?')) {
                    Utils.shuffleArray(state.lessons);
                    DirectionManager.shuffleDirections();
                    state.currentTaskIndex = 0;
                    LessonManager.loadTask(state.currentTaskIndex);
                    MistakesManager.clearAllMistakes();
                }
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

            // Mistakes functionality
            elements.mistakes.addEventListener('click', () => {
                MistakesManager.showMistakesModal();
            });

            // Configuration panel
            elements.openConfigPanel.addEventListener('click', () => {
                elements.configPanel.style.display = 'flex';
                UI.switchTab('paste');
            });

            elements.cancelConfig.addEventListener('click', () => {
                elements.configPanel.style.display = 'none';
                elements.configInput.value = '';
                UI.showSaveButton(null);
            });

            elements.cancelSaved.addEventListener('click', () => {
                elements.configPanel.style.display = 'none';
            });

            elements.loadConfig.addEventListener('click', () => {
                ConfigManager.loadFromText();
            });

            elements.saveConfig.addEventListener('click', () => {
                ConfigManager.saveCurrentConfig();
                ConfigManager.loadFromText();
            });

            // Tab switching
            elements.pasteTabBtn.addEventListener('click', () => {
                UI.switchTab('paste');
            });

            elements.savedTabBtn.addEventListener('click', () => {
                UI.switchTab('saved');
            });

            // Rename modal
            elements.confirmRename.addEventListener('click', () => {
                const newTitle = elements.renameInput.value.trim();
                if (newTitle && state.currentRenameId) {
                    const success = StorageManager.renameLesson(state.currentRenameId, newTitle);
                    if (success) {
                        UI.hideRenameModal();
                        UI.refreshSavedLessonsList();
                    } else {
                        alert("Failed to rename lesson. Please try again.");
                    }
                } else {
                    alert("Please enter a valid title.");
                }
            });

            elements.cancelRename.addEventListener('click', () => {
                UI.hideRenameModal();
            });

            // Rename input Enter key
            elements.renameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    elements.confirmRename.click();
                }
            });

            // Config input change detection for save button
            elements.configInput.addEventListener('input', () => {
                const configText = elements.configInput.value.trim();
                if (configText) {
                    try {
                        const configData = JSON.parse(configText);
                        UI.showSaveButton(configData);
                    } catch (error) {
                        UI.showSaveButton(null);
                    }
                } else {
                    UI.showSaveButton(null);
                }
            });

            // Mistakes modal event handlers
            elements.closeMistakes.addEventListener('click', () => {
                MistakesManager.hideMistakesModal();
            });

            elements.copyMistakes.addEventListener('click', () => {
                MistakesManager.copyMistakesToClipboard();
            });

            elements.clearMistakes.addEventListener('click', () => {
                if (confirm('Are you sure you want to clear all recorded mistakes? This cannot be undone.')) {
                    MistakesManager.clearAllMistakes();
                    MistakesManager.refreshMistakesList();
                }
            });
        }
    };

    // --- Application Initialization ---
    function initialize() {
        EventHandlers.setupEventListeners();
        
        // Debug storage info on startup
        const storageInfo = StorageManager.getStorageInfo();
        console.log('Storage info on startup:', storageInfo);
        
        if (!storageInfo.isAvailable) {
            console.warn('localStorage is not available');
        }
        
        // Add global debug functions for console access
        window.udolingoDebug = {
            clearAllLessons: () => {
                if (confirm('Are you sure you want to delete ALL saved lessons? This cannot be undone.')) {
                    const success = StorageManager.clearAllSavedLessons();
                    if (success) {
                        console.log('All lessons cleared');
                        UI.refreshSavedLessonsList();
                    } else {
                        console.error('Failed to clear lessons');
                    }
                }
            },
            showStorageInfo: () => {
                console.log('Storage Info:', StorageManager.getStorageInfo());
            },
            getSavedLessons: () => {
                return StorageManager.getSavedLessons();
            }
        };
        
        console.log('Debug functions available: udolingoDebug.clearAllLessons(), udolingoDebug.showStorageInfo(), udolingoDebug.getSavedLessons()');
        
        // Auto-load the latest saved lesson if any exist
        const savedLessons = StorageManager.getSavedLessons();
        const lessonIds = Object.keys(savedLessons);
        if (lessonIds.length > 0) {
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
            console.log('Auto-loading latest saved lesson:', savedLessons[latestId].title);
            ConfigManager.loadSavedLesson(latestId);
        } else {
            ConfigManager.loadFromFile();
        }
    }

    // Start the application
    initialize();
});
