document.addEventListener('DOMContentLoaded', () => {
    // --- Mobile Sidebar Management ---
    const SidebarManager = {
        init() {
            const sidebar = document.getElementById('sidebar');
            const sidebarHeader = document.getElementById('sidebar-header');
            const sidebarToggle = document.getElementById('sidebar-toggle');
            
            // Initially collapse sidebar on mobile
            if (window.innerWidth <= 768) {
                sidebar.classList.add('collapsed');
            }
            
            // Toggle sidebar when header is clicked on mobile
            sidebarHeader.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    this.toggleSidebar();
                }
            });
            
            // Handle window resize
            window.addEventListener('resize', () => {
                const sidebar = document.getElementById('sidebar');
                if (window.innerWidth > 768) {
                    // Remove collapsed class on desktop
                    sidebar.classList.remove('collapsed');
                } else if (!sidebar.classList.contains('collapsed')) {
                    // Auto-collapse on mobile if not already collapsed
                    sidebar.classList.add('collapsed');
                }
            });
        },
        
        toggleSidebar() {
            const sidebar = document.getElementById('sidebar');
            sidebar.classList.toggle('collapsed');
        },
        
        collapseSidebar() {
            const sidebar = document.getElementById('sidebar');
            if (window.innerWidth <= 768) {
                sidebar.classList.add('collapsed');
            }
        },
        
        expandSidebar() {
            const sidebar = document.getElementById('sidebar');
            sidebar.classList.remove('collapsed');
        }
    };

    // --- URL Parameter Handling ---
    const URLHandler = {
        // Get query parameter value
        getQueryParam(name) {
            const urlParams = new URLSearchParams(window.location.search);
            return urlParams.get(name);
        },

        // Load config from URL parameter
        loadConfigFromURL() {
            const compressedConfig = this.getQueryParam('c');
            if (compressedConfig) {
                try {
                    const decompressed = LZString144.decompressFromEncodedURIComponent(compressedConfig);
                    if (decompressed) {
                        const config = JSON.parse(decompressed);
                        if (config && config.exercises) {
                            console.log('Loading config from URL parameter...');
                            ConfigManager.loadConfiguration(config);
                            return true;
                        }
                    }
                } catch (error) {
                    console.error('Error loading config from URL:', error);
                }
            }
            return false;
        },

        // Remove the 'c' parameter from the current URL
        removeConfigParam() {
            try {
                const url = new URL(window.location.href);
                if (url.searchParams.has('c')) {
                    url.searchParams.delete('c');
                    const newUrl = url.toString();
                    window.history.replaceState({}, '', newUrl);
                    console.log('Removed c parameter from URL');
                }
            } catch (error) {
                console.error('Error removing config parameter from URL:', error);
            }
        },

        // Generate shareable URL for current config
        generateShareURL(config) {
            try {
                const configJSON = JSON.stringify(config);
                const compressed = LZString144.compressToEncodedURIComponent(configJSON);
                const baseURL = window.location.origin + window.location.pathname;
                return `${baseURL}?c=${compressed}`;
            } catch (error) {
                console.error('Error generating share URL:', error);
                return null;
            }
        }
    };

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
        shuffle: document.getElementById('shuffle-exercises-btn'),
        vocab1: document.getElementById('vocab1-btn'),
        vocab2: document.getElementById('vocab2-btn'),
        mistakes: document.getElementById('mistakes-btn'),
        saveCurrent: document.getElementById('save-current-btn'),
        share: document.getElementById('share-btn'),
        currentConfig: document.getElementById('current-config-btn'),
        
        // Config panel
        openConfigPanel: document.getElementById('open-config-panel-btn'),
        configPanel: document.getElementById('config-panel'),
        configInput: document.getElementById('config-input'),
        loadFromClipboard: document.getElementById('load-from-clipboard-btn'),
        loadSaveConfig: document.getElementById('load-save-config-btn'),
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
        closeMistakes: document.getElementById('close-mistakes-btn'),
        
        // LLM Prompt Generator modal
        generatePromptBtn: document.getElementById('generate-prompt-btn'),
        llmPromptModal: document.getElementById('llm-prompt-modal'),
        langAInput: document.getElementById('langA-input'),
        langBInput: document.getElementById('langB-input'),
        exercisesCount: document.getElementById('exercises-count'),
        subjectInput: document.getElementById('subject-input'),
        generatedPrompt: document.getElementById('generated-prompt'),
        copyPromptBtn: document.getElementById('copy-prompt-btn'),
        closeLlmPromptBtn: document.getElementById('close-llm-prompt-btn')
    };

    // --- Application State ---
    const state = {
        currentTaskIndex: 0,
        exercises: [],
        config: null,
        prevResponses: [],
        promptLang: '',
        solutionLang: '',
        exerciseDirections: [], // Array to track direction for each exercise
        currentCycle: 0, // Track which cycle we're on (0: first direction, 1: second direction)
        currentRenameId: null, // Track which lesson is being renamed
        mistakes: [] // Track user mistakes
    };

    // --- Storage Management ---
    const StorageManager = {
        // Save a lesson configuration to localStorage with compression
        saveLesson(config) {
            const savedLessons = this.getSavedLessons();
            const lessonId = Date.now().toString();
            console.log('Saving lesson with ID:', lessonId);
            
            // Ensure we're using the new format before saving
            let configToSave = { ...config };
            if (configToSave.lessons && !configToSave.exercises) {
                console.log('Converting legacy "lessons" to "exercises" before saving');
                configToSave.exercises = configToSave.lessons;
                delete configToSave.lessons;
            }
            
            // Create a saveable lesson object
            const lessonToSave = {
                id: lessonId,
                title: configToSave.title || 'Untitled Lesson',
                langCode: configToSave["langA-B"] ? configToSave["langA-B"].join('-') : 'unknown',
                languages: configToSave["langA-B"] || ['?', '?'],
                config: configToSave,
                dateAdded: new Date().toISOString(),
                exerciseCount: configToSave.exercises ? configToSave.exercises.length : 0
            };
            
            try {
                // Compress the lesson data
                const compressed = this.compressData(lessonToSave);
                if (!compressed) {
                    console.error('Failed to compress lesson data');
                    return null;
                }
                
                // Store the compressed lesson data in localStorage
                const success = this.setStorageItem(`udolingo_lesson_${lessonId}`, compressed);
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
                    exerciseCount: lessonToSave.exerciseCount
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

        // Compress data using LZ-String
        compressData(data) {
            try {
                const json = JSON.stringify(data);
                return LZString144.compressToBase64(json);
            } catch (error) {
                console.error('Error compressing data:', error);
                return null;
            }
        },

        // Decompress data using LZ-String
        decompressData(compressedData) {
            try {
                // Handle both compressed and uncompressed data for backward compatibility
                if (typeof compressedData === 'string' && !compressedData.startsWith('{')) {
                    // Looks like compressed data
                    const decompressed = LZString144.decompressFromBase64(compressedData);
                    return decompressed ? JSON.parse(decompressed) : null;
                } else {
                    // Looks like uncompressed JSON or already parsed object
                    return typeof compressedData === 'string' ? JSON.parse(compressedData) : compressedData;
                }
            } catch (error) {
                console.error('Error decompressing data:', error);
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
                const compressedData = this.getStorageItem(`udolingo_lesson_${id}`);
                if (!compressedData) {
                    console.log(`Lesson ${id} not found`);
                    return null;
                }
                
                const lessonData = this.decompressData(compressedData);
                if (!lessonData) {
                    console.error(`Failed to decompress lesson ${id}`);
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
                const compressed = this.compressData(lessonData);
                if (!compressed) {
                    console.error(`Failed to compress updated lesson data for ${id}`);
                    return false;
                }
                
                const dataSuccess = this.setStorageItem(`udolingo_lesson_${id}`, compressed);
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
                const dataToStore = typeof value === 'string' ? value : JSON.stringify(value);
                localStorage.setItem(key, dataToStore);
                console.log(`Stored ${key} with size: ${dataToStore.length} bytes`);
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
                
                // Try to parse as JSON, but return raw string if parsing fails
                try {
                    return JSON.parse(item);
                } catch {
                    return item; // Return as string (might be compressed data)
                }
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
                        const dataSize = typeof lessonData === 'string' ? lessonData.length : JSON.stringify(lessonData).length;
                        totalSize += dataSize;
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
        // Initialize randomized directions for all exercises
        initializeDirections() {
            if (state.exercises.length === 0) return;
            
            // Create array with half AtoB and half BtoA, then shuffle
            const directions = [];
            const halfLength = Math.floor(state.exercises.length / 2);
            
            // Add AtoB directions
            for (let i = 0; i < halfLength; i++) {
                directions.push('AtoB');
            }
            
            // Add BtoA for the rest
            for (let i = halfLength; i < state.exercises.length; i++) {
                directions.push('BtoA');
            }
            
            // Shuffle the directions
            Utils.shuffleArray(directions);
            state.exerciseDirections = directions;
            state.currentCycle = 0;
        },

        // Get current direction for an exercise
        getCurrentDirection(exerciseIndex) {
            if (state.exerciseDirections.length === 0) {
                this.initializeDirections();
            }
            
            // In the second cycle, flip the direction
            const baseDirection = state.exerciseDirections[exerciseIndex];
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
            const buttonIds = ['submit', 'clear', 'next', 'shuffle', 'back', 'translate', 'vocab1', 'vocab2', 'mistakes', 'saveCurrent', 'share'];
            buttonIds.forEach(id => {
                if (elements[id]) {
                    elements[id].disabled = disabled;
                }
            });
        },

        showResponseButtons() {
            elements.submit.style.display = '';
            elements.clear.style.display = '';
            elements.back.style.display = '';
            elements.next.textContent = "Skip";
        },

        hideResponseButtons() {
            elements.submit.style.display = 'none';
            elements.clear.style.display = 'none';
            elements.back.style.display = 'none';
            elements.next.textContent = "Next";
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

        // Enable/disable control buttons based on loaded config
        updateControlButtons() {
            const hasConfig = state.config && state.exercises && state.exercises.length > 0;
            elements.saveCurrent.disabled = !hasConfig;
            elements.share.disabled = !hasConfig;
        },

        // Auto-collapse sidebar on mobile when performing actions
        autoCollapseSidebarOnMobile() {
            if (window.innerWidth <= 768) {
                SidebarManager.collapseSidebar();
            }
        },

        showConfigModal() {
            elements.configPanel.style.display = 'flex';
        },

        hideConfigModal() {
            elements.configPanel.style.display = 'none';
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
            details.textContent = `${lesson.languages[0]} ↔ ${lesson.languages[1]} • ${lesson.exerciseCount} exercises • ${dateAdded}`;
            
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
            if (configData && configData.exercises && configData.exercises.length > 0) {
                elements.loadSaveConfig.disabled = false;
            } else {
                elements.loadSaveConfig.disabled = true;
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

    // --- Exercise Management ---
    const ExerciseManager = {
        getCurrentExerciseData(exercise, direction) {
            if (direction === 'AtoB') {
                return {
                    prompt: exercise.A,
                    solution: exercise.B,
                    noise: exercise.noiseB || this.generateNoise('B', 5, exercise.B),
                    promptLang: state.config["langA-B"] ? state.config["langA-B"][0] : '',
                    solutionLang: state.config["langA-B"] ? state.config["langA-B"][1] : ''
                };
            } else {
                return {
                    prompt: exercise.B,
                    solution: exercise.A,
                    noise: exercise.noiseA || this.generateNoise('A', 5, exercise.A),
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
            if (!state.exercises || state.exercises.length === 0) {
                elements.prompt.textContent = "No exercises loaded.";
                UI.setButtonsDisabled(true);
                return;
            }

            UI.setButtonsDisabled(false);
            UI.showResponseButtons();
            const exercise = state.exercises[index];
            const currentDirection = DirectionManager.getCurrentDirection(index);
            const exerciseData = this.getCurrentExerciseData(exercise, currentDirection);
            
            state.promptLang = exerciseData.promptLang;
            state.solutionLang = exerciseData.solutionLang;

            // Display exercise counter and prompt
            const exerciseNumber = index + 1;
            const totalExercises = state.exercises.length;
            elements.prompt.textContent = `${exerciseNumber}/${totalExercises}. Translate this: "${exerciseData.prompt}"`;

            // Create word bank
            const words = Utils.removeDuplicates(Utils.splitSentenceWithoutPunctuation(exerciseData.solution + ' ' + exerciseData.noise));
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
            const exerciseData = ExerciseManager.getCurrentExerciseData(state.exercises[state.currentTaskIndex], currentDirection);
            const solution = Utils.removePunctuation(exerciseData.solution);
            
            UI.clearWordBank();
            UI.hideResponseButtons();

            if (userResponse === solution) {
                UI.showFeedback(true);
                return;
            }

            // Record the mistake
            MistakesManager.recordMistake(
                exerciseData.prompt,
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
            state.exercises.forEach(exercise => {
                const sentence = lang === 'A' ? exercise.A : exercise.B;
                if (sentence) {
                    const exerciseWords = Utils.splitSentenceWithoutPunctuation(sentence);
                    if (limit == 0) {
                        words.push(...exerciseWords);
                    } else {
                        exerciseWords.forEach(word => {
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
            const exerciseData = ExerciseManager.getCurrentExerciseData(state.exercises[state.currentTaskIndex], currentDirection);
            const encodedPrompt = encodeURIComponent(exerciseData.prompt);
            
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
        recordMistake(prompt, solution, userResponse, exerciseIndex, direction) {
            const mistake = {
                id: Date.now(),
                prompt: prompt,
                solution: solution,
                userResponse: userResponse,
                exerciseIndex: exerciseIndex,
                direction: direction,
            };
            
            state.mistakes.push(mistake);
            console.log('Mistake recorded:', mistake);
            // TODO Show number of mistakes on button
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
            
            // Group mistakes by exercise and direction for better organization
            const groupedMistakes = this.groupMistakesByExercise();
            
            Object.keys(groupedMistakes).forEach(key => {
                const mistakes = groupedMistakes[key];
                const [exerciseIndex, direction] = key.split('_');
                
                // Create a section for this exercise/direction
                const sectionHeader = document.createElement('div');
                sectionHeader.className = 'mistake-section-header';
                sectionHeader.innerHTML = `<h4>Exercise ${parseInt(exerciseIndex) + 1} (${direction === 'AtoB' ? state.config["langA-B"][0] + ' → ' + state.config["langA-B"][1] : state.config["langA-B"][1] + ' → ' + state.config["langA-B"][0]})</h4>`;
                elements.mistakesList.appendChild(sectionHeader);
                
                mistakes.forEach(mistake => {
                    const mistakeItem = this.createMistakeItem(mistake);
                    elements.mistakesList.appendChild(mistakeItem);
                });
            });
        },
        
        // Group mistakes by exercise and direction
        groupMistakesByExercise() {
            const grouped = {};
            state.mistakes.forEach(mistake => {
                const key = `${mistake.exerciseIndex}_${mistake.direction}`;
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
            
            let text = `Please help me learn from my language learning mistakes. I'm studying ${state.config["langA-B"][0]} ↔ ${state.config["langA-B"][1]} with the lesson "${state.config.title}".\n\n`;
            text += `Here are my ${state.mistakes.length} mistakes:\n\n`;
            
            state.mistakes.forEach((mistake, index) => {
                const directionText = mistake.direction === 'AtoB' 
                    ? `${state.config["langA-B"][0]} → ${state.config["langA-B"][1]}`
                    : `${state.config["langA-B"][1]} → ${state.config["langA-B"][0]}`;
                
                text += `${index + 1}. [${directionText}] Exercise ${mistake.exerciseIndex + 1}\n`;
                text += `   Prompt: "${mistake.prompt}"\n`;
                text += `   Correct: "${mistake.solution}"\n`;
                text += `   My answer: "${mistake.userResponse}"\n\n`;
            });
            
            text += 'Please briefly explain what I did wrong in each case and provide tips to avoid similar mistakes in the future.';
            
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
            // Handle backward compatibility: convert "lessons" to "exercises"
            if (configData.lessons && !configData.exercises) {
                console.log('Converting legacy "lessons" format to "exercises"');
                configData.exercises = configData.lessons;
                delete configData.lessons;
            }
            
            state.config = configData;
            state.exercises = configData.exercises;
            state.currentTaskIndex = 0;
            DirectionManager.initializeDirections();
            ExerciseManager.loadTask(state.currentTaskIndex);
            UI.updateVocabButtons(state.config["langA-B"]);
            UI.updateControlButtons();
            MistakesManager.clearAllMistakes();
            
            // Auto-collapse sidebar on mobile after loading
            UI.autoCollapseSidebarOnMobile();
        },

        loadFromText() {
            const configText = elements.configInput.value;
            if (!configText) {
                alert("The text area is empty. Please paste your lesson configuration.");
                return;
            }
            
            try {
                const newConfig = JSON.parse(configText);
                if (newConfig && newConfig.exercises) {
                    this.loadConfiguration(newConfig);
                    elements.configInput.value = '';
                    UI.hideConfigModal();
                    URLHandler.removeConfigParam();
                    UI.autoCollapseSidebarOnMobile();
                } else {
                    alert("Invalid configuration format. Make sure it has an 'exercises' property.");
                }
            } catch (error) {
                alert(`Error parsing JSON: ${error.message}`);
            }
        },

        loadSavedLesson(lessonId) {
            const lesson = StorageManager.getSavedLesson(lessonId);
            if (lesson) {
                this.loadConfiguration(lesson.config);
                UI.hideConfigModal();
                URLHandler.removeConfigParam();
                UI.autoCollapseSidebarOnMobile();
            } else {
                alert("Lesson not found.");
            }
        },

        async pasteConfigFromClipboard() {
            try {
                const clipboard = await navigator.clipboard.readText();
                const newConfig = JSON.parse(clipboard);
                if (newConfig && newConfig.exercises && newConfig.exercises.length > 0) {
                    console.log(`Load from clipboard. Config title: ${newConfig.title}`);
                    this.loadConfiguration(newConfig);
                    elements.configInput.value = '';
                    UI.hideConfigModal();
                    URLHandler.removeConfigParam();
                    UI.autoCollapseSidebarOnMobile();
                } else {
                    alert("The clipboard does not contain a valid Udolingo lesson.");
                }
            } catch (err) {
                alert("The clipboard does not contain a valid Udolingo lesson.");
            }
        },

        // Save current configuration to localStorage
        savePastedConfig() {
            const configText = elements.configInput.value;
            if (!configText) {
                alert("No configuration to save.");
                return;
            }
            
            try {
                const configData = JSON.parse(configText);
                // Handle backward compatibility
                if (configData && configData.lessons && !configData.exercises) {
                    configData.exercises = configData.lessons;
                    delete configData.lessons;
                }
                if (configData && configData.exercises) {
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
                    alert("Invalid configuration format. Make sure it has an 'exercises' property.");
                }
            } catch (error) {
                alert(`Error parsing JSON: ${error.message}`);
            }
        },

        // Save currently loaded config
        saveCurrentLoadedConfig() {
            if (!state.config || !state.exercises || state.exercises.length === 0) {
                alert("No configuration is currently loaded to save.");
                return;
            }
            
            try {
                // Check storage health before saving
                if (!StorageManager.checkStorageHealth()) {
                    alert("Storage appears to be having issues. Please try again or check your browser settings.");
                    return;
                }
                
                const lessonId = StorageManager.saveLesson(state.config);
                if (lessonId) {
                    alert(`Lesson "${state.config.title}" saved successfully!`);
                    console.log(`Lesson saved successfully! Id=${lessonId}`);
                } else {
                    alert("Failed to save lesson. Please try again or check if you have enough storage space.");
                }
            } catch (error) {
                console.error('Error saving current config:', error);
                alert(`Error saving lesson: ${error.message}`);
            }
        },

        // Share current config via URL
        shareCurrentConfig() {
            if (!state.config || !state.exercises || state.exercises.length === 0) {
                alert("No configuration is currently loaded to share.");
                return;
            }
            
            try {
                const shareURL = URLHandler.generateShareURL(state.config);
                if (shareURL) {
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(shareURL).then(() => {
                            alert('Share link copied to clipboard! You can now share this link with others.');
                        }).catch(err => {
                            console.error('Failed to copy to clipboard:', err);
                            this.fallbackShareMethod(shareURL);
                        });
                    } else {
                        this.fallbackShareMethod(shareURL);
                    }
                } else {
                    alert("Failed to generate share URL. The configuration might be too large.");
                }
            } catch (error) {
                console.error('Error sharing config:', error);
                alert(`Error generating share link: ${error.message}`);
            }
        },

        showCurrentConfig() {
            const configStr = JSON.stringify(state.config, null, 2); // Pretty-print JSON
            const newTab = window.open('', '_blank');
            if (newTab) {
                newTab.document.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>${state.config.title}</title>
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
        },

        // Fallback share method for older browsers
        fallbackShareMethod(shareURL) {
            const textArea = document.createElement('textarea');
            textArea.value = shareURL;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
                document.execCommand('copy');
                alert('Share link copied to clipboard! You can now share this link with others.');
            } catch (err) {
                console.error('Fallback copy failed:', err);
                prompt('Copy this link to share the lesson:', shareURL);
            }
            
            document.body.removeChild(textArea);
        },

        loadSavedLesson(lessonId) {
            const lesson = StorageManager.getSavedLesson(lessonId);
            if (lesson) {
                this.loadConfiguration(lesson.config);
                UI.hideConfigModal();
                URLHandler.removeConfigParam();
                UI.autoCollapseSidebarOnMobile();
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

    const LLMPromptGenerator = {
        // Language codes compatible with Google Translate
        languages: [
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
        ],

        // Common subjects/themes for language learning
        subjects: [
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
        ],

        // Storage keys for saving settings
        storageKeys: {
            langA: 'udolingo_llm_langA',
            langB: 'udolingo_llm_langB',
            exerciseCount: 'udolingo_llm_exerciseCount',
            difficulty: 'udolingo_llm_difficulty',
            subject: 'udolingo_llm_subject',
            noise: 'udolingo_llm_noise'
        },

        // Initialize the language and subject dropdowns
        initializeDropdowns() {
            // Populate subject datalist
            const subjectsList = document.getElementById('subjects-list');
            this.subjects.forEach(subject => {
                const option = document.createElement('option');
                option.value = subject;
                subjectsList.appendChild(option);
            });

            // Initialize custom language dropdowns
            this.initializeLanguageDropdown('langA');
            this.initializeLanguageDropdown('langB');
            
            // Load saved settings
            this.loadSavedSettings();
        },

        // Initialize a custom language dropdown
        initializeLanguageDropdown(dropdownId) {
            const dropdown = document.getElementById(`${dropdownId}-dropdown`);
            const input = document.getElementById(`${dropdownId}-input`);
            const options = document.getElementById(`${dropdownId}-options`);
            
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
        },

        // Handle keyboard navigation in dropdowns
        handleKeyboardNavigation(dropdownId, e) {
            const dropdown = document.getElementById(`${dropdownId}-dropdown`);
            const options = document.getElementById(`${dropdownId}-options`);
            const isOpen = dropdown.classList.contains('open');

            // If dropdown is closed and user presses a letter, open it and jump to that letter
            if (!isOpen && e.key.length === 1 && e.key.match(/[a-zA-Z]/)) {
                e.preventDefault();
                this.toggleDropdown(dropdownId);
                // Small delay to ensure dropdown is open before jumping
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
                        // Handle letter key presses
                        if (e.key.length === 1 && e.key.match(/[a-zA-Z]/)) {
                            e.preventDefault();
                            this.jumpToLetter(dropdownId, e.key.toLowerCase());
                        }
                        break;
                }
            }
        },

        // Jump to first language starting with the given letter
        jumpToLetter(dropdownId, letter) {
            const options = document.getElementById(`${dropdownId}-options`);
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
        },

        // Navigate through options with arrow keys
        navigateOptions(dropdownId, direction) {
            const options = document.getElementById(`${dropdownId}-options`);
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
        },

        // Toggle dropdown open/close
        toggleDropdown(dropdownId) {
            const dropdown = document.getElementById(`${dropdownId}-dropdown`);
            const isOpen = dropdown.classList.contains('open');
            
            // Close all dropdowns first
            this.closeAllDropdowns();
            
            if (!isOpen) {
                dropdown.classList.add('open');
                // Focus the input for keyboard navigation
                const input = document.getElementById(`${dropdownId}-input`);
                input.focus();
            }
        },

        // Close a specific dropdown
        closeDropdown(dropdownId) {
            const dropdown = document.getElementById(`${dropdownId}-dropdown`);
            dropdown.classList.remove('open');
            
            // Clear any highlighted options
            const options = document.getElementById(`${dropdownId}-options`);
            options.querySelectorAll('.dropdown-option').forEach(opt => {
                opt.classList.remove('highlighted');
            });
        },

        // Close all dropdowns
        closeAllDropdowns() {
            document.querySelectorAll('.custom-dropdown').forEach(dropdown => {
                dropdown.classList.remove('open');
                // Clear highlights in all dropdowns
                dropdown.querySelectorAll('.dropdown-option').forEach(opt => {
                    opt.classList.remove('highlighted');
                });
            });
        },

        // Select a language in a dropdown
        selectLanguage(dropdownId, language) {
            const input = document.getElementById(`${dropdownId}-input`);
            const options = document.getElementById(`${dropdownId}-options`);
            
            input.value = language.name;
            input.dataset.code = language.code;
            
            // Update selected option styling
            options.querySelectorAll('.dropdown-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            const selectedOption = options.querySelector(`[data-code="${language.code}"]`);
            if (selectedOption) {
                selectedOption.classList.add('selected');
            }
            
            this.closeDropdown(dropdownId);
            this.saveCurrentSettings();
            this.generatePrompt();
        },

        // Get language name from code
        getLanguageName(code) {
            const lang = this.languages.find(l => l.code === code);
            return lang ? lang.name : code;
        },

        // Get language code from input
        getLanguageCode(dropdownId) {
            const input = document.getElementById(`${dropdownId}-input`);
            return input.dataset.code || 'en';
        },

        // Save current settings to localStorage
        saveCurrentSettings() {
            try {
                const settings = {
                    langA: this.getLanguageCode('langA'),
                    langB: this.getLanguageCode('langB'),
                    exerciseCount: elements.exercisesCount.value,
                    difficulty: document.querySelector('input[name="difficulty"]:checked')?.value || '3',
                    subject: elements.subjectInput.value,
                    noise: document.querySelector('input[name="noise"]:checked')?.value || 'auto'
                };

                Object.keys(settings).forEach(key => {
                    localStorage.setItem(this.storageKeys[key], settings[key]);
                });

                console.log('LLM generator settings saved:', settings);
            } catch (error) {
                console.error('Error saving LLM generator settings:', error);
            }
        },

        // Clear all settings from localStorage
        clearSavedSettings() {
            Object.values(this.storageKeys).forEach(key => {
                localStorage.removeItem(key);
            });
            console.log('LLM generator settings cleared');
        },

        // Load saved settings from localStorage
        loadSavedSettings() {
            try {
                // Load language A
                const langACode = localStorage.getItem(this.storageKeys.langA) || 'en';
                const langA = this.languages.find(l => l.code === langACode);
                if (langA) {
                    // Don't trigger save during initial load
                    this.selectLanguageWithoutSave('langA', langA);
                }

                // Load language B
                const langBCode = localStorage.getItem(this.storageKeys.langB) || 'es';
                const langB = this.languages.find(l => l.code === langBCode);
                if (langB) {
                    // Don't trigger save during initial load
                    this.selectLanguageWithoutSave('langB', langB);
                }

                // Load exercise count
                const exerciseCount = localStorage.getItem(this.storageKeys.exerciseCount);
                if (exerciseCount) {
                    elements.exercisesCount.value = exerciseCount;
                }

                // Load difficulty
                const difficulty = localStorage.getItem(this.storageKeys.difficulty);
                if (difficulty) {
                    const difficultyRadio = document.querySelector(`input[name="difficulty"][value="${difficulty}"]`);
                    if (difficultyRadio) {
                        difficultyRadio.checked = true;
                    }
                }

                // Load subject
                const subject = localStorage.getItem(this.storageKeys.subject);
                if (subject) {
                    elements.subjectInput.value = subject;
                }

                // Load noise level
                const noise = localStorage.getItem(this.storageKeys.noise);
                if (noise) {
                    const noiseRadio = document.querySelector(`input[name="noise"][value="${noise}"]`);
                    if (noiseRadio) {
                        noiseRadio.checked = true;
                    }
                }

                console.log('LLM generator settings loaded from localStorage');
            } catch (error) {
                console.error('Error loading LLM generator settings:', error);
            }
        },

        // Select language without triggering save (used during initial load)
        selectLanguageWithoutSave(dropdownId, language) {
            const input = document.getElementById(`${dropdownId}-input`);
            const options = document.getElementById(`${dropdownId}-options`);
            
            input.value = language.name;
            input.dataset.code = language.code;
            
            // Update selected option styling
            options.querySelectorAll('.dropdown-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            const selectedOption = options.querySelector(`[data-code="${language.code}"]`);
            if (selectedOption) {
                selectedOption.classList.add('selected');
            }
        },

        // Generate difficulty-specific instructions
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
        },

        // Generate noise instructions
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
        },

        // Generate the complete LLM prompt
        generatePrompt() {
            const langACode = this.getLanguageCode('langA');
            const langBCode = this.getLanguageCode('langB');
            const langAName = this.getLanguageName(langACode);
            const langBName = this.getLanguageName(langBCode);
            const exerciseCount = elements.exercisesCount.value || '20';
            const subject = elements.subjectInput.value || 'general conversation';

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
- For some excercises, fields A and B may be multiple shorter sentences, if the full content remains natural and boundaries are preserved.
- Translations must be accurate and straightforward in both directions.
- Create a short, descriptive title that reflects the theme and difficulty level.
- Output valid JSON in the format above.`;

            elements.generatedPrompt.value = prompt;
        },

        // Show the LLM prompt modal
        showModal() {
            elements.llmPromptModal.style.display = 'flex';
            this.generatePrompt(); // Generate initial prompt
        },

        // Hide the LLM prompt modal
        hideModal() {
            elements.llmPromptModal.style.display = 'none';
        },

        // Copy prompt to clipboard
        copyToClipboard() {
            const prompt = elements.generatedPrompt.value;
            if (!prompt) {
                alert('No prompt to copy. Please generate a prompt first.');
                return;
            }

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(prompt).then(() => {
                    alert('LLM prompt copied to clipboard!');
                }).catch(err => {
                    console.error('Failed to copy to clipboard:', err);
                    this.fallbackCopyToClipboard(prompt);
                });
            } else {
                this.fallbackCopyToClipboard(prompt);
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
                alert('LLM prompt copied to clipboard!');
            } catch (err) {
                console.error('Fallback copy failed:', err);
                alert('Copy failed. Please manually copy the text from the prompt area.');
            }

            document.body.removeChild(textArea);
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
                state.currentTaskIndex = (state.currentTaskIndex + 1) % state.exercises.length;
                
                // Check if we need to advance to the next cycle
                if (state.currentTaskIndex === 0) {
                    DirectionManager.checkAndAdvanceCycle();
                }
                
                ExerciseManager.loadTask(state.currentTaskIndex);
            });

            elements.shuffle.addEventListener('click', () => {
                if (state.mistakes.length == 0 || confirm('This will clear the mistakes list. Are you sure you want to shuffle exercises?')) {
                    Utils.shuffleArray(state.exercises);
                    DirectionManager.shuffleDirections();
                    state.currentTaskIndex = 0;
                    ExerciseManager.loadTask(state.currentTaskIndex);
                    MistakesManager.clearAllMistakes();
                }
            });

            // Translation and vocabulary
            elements.translate.addEventListener('click', () => {
                TranslationManager.openTranslation();
            });

            elements.vocab1.addEventListener('click', () => {
                VocabularyManager.openVocabularyTranslation(state.config["langA-B"][0], state.config["langA-B"][1]);
            });

            elements.vocab2.addEventListener('click', () => {
                VocabularyManager.openVocabularyTranslation(state.config["langA-B"][1], state.config["langA-B"][0]);
            });

            elements.mistakes.addEventListener('click', () => {
                MistakesManager.showMistakesModal();
            });

            elements.saveCurrent.addEventListener('click', () => {
                ConfigManager.saveCurrentLoadedConfig();
            });

            elements.share.addEventListener('click', () => {
                ConfigManager.shareCurrentConfig();
            });

            elements.currentConfig.addEventListener('click', () => {
                ConfigManager.showCurrentConfig();
            });

            // Configuration panel
            elements.openConfigPanel.addEventListener('click', () => {
                UI.switchTab('paste');
                UI.showConfigModal();
            });

            elements.cancelConfig.addEventListener('click', () => {
                UI.hideConfigModal();
                elements.configInput.value = '';
                UI.showSaveButton(null);
            });

            elements.cancelSaved.addEventListener('click', () => {
                UI.hideConfigModal();
            });

            elements.loadFromClipboard.addEventListener('click', () => {
                ConfigManager.pasteConfigFromClipboard();
            });

            elements.loadSaveConfig.addEventListener('click', () => {
                ConfigManager.savePastedConfig();
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

            // LLM Prompt Generator event handlers
            elements.generatePromptBtn.addEventListener('click', () => {
                LLMPromptGenerator.showModal();
            });

            elements.closeLlmPromptBtn.addEventListener('click', () => {
                LLMPromptGenerator.hideModal();
            });

            elements.copyPromptBtn.addEventListener('click', () => {
                LLMPromptGenerator.copyToClipboard();
            });

            // Auto-generate prompt when inputs change
            const promptInputs = [
                elements.exercisesCount,
                elements.subjectInput
            ];

            promptInputs.forEach(input => {
                input.addEventListener('input', () => {
                    LLMPromptGenerator.saveCurrentSettings();
                    LLMPromptGenerator.generatePrompt();
                });
            });

            // Auto-generate prompt when radio buttons change
            document.addEventListener('change', (e) => {
                if (e.target.type === 'radio' && (e.target.name === 'difficulty' || e.target.name === 'noise')) {
                    LLMPromptGenerator.saveCurrentSettings();
                    LLMPromptGenerator.generatePrompt();
                }
            });

            // Add event listeners that should auto-collapse sidebar on mobile
            const actionsRequiringCollapse = [
                elements.openConfigPanel,
                elements.generatePromptBtn,
                elements.mistakes
            ];

            actionsRequiringCollapse.forEach(element => {
                if (element) {
                    element.addEventListener('click', () => {
                        // Small delay to allow modal to open first
                        setTimeout(() => {
                            UI.autoCollapseSidebarOnMobile();
                        }, 100);
                    });
                }
            });
        }
    };

    // --- Application Initialization ---
    function initialize() {
        SidebarManager.init();
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
            },
            generateShareURL: (config) => {
                return URLHandler.generateShareURL(config || state.config);
            },
            clearGeneratorSettings: () => {
                LLMPromptGenerator.clearSavedSettings();
            }
        };
        
        console.log('Debug functions available: udolingoDebug.clearAllLessons(), udolingoDebug.showStorageInfo(), udolingoDebug.getSavedLessons(), udolingoDebug.generateShareURL(), udolingoDebug.clearGeneratorSettings()');
        
        // Check for config in URL parameters first
        if (URLHandler.loadConfigFromURL()) {
            console.log('Config loaded from URL parameter');
            return;
        }
        
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

        LLMPromptGenerator.initializeDropdowns();
    }

    // Start the application
    initialize();
});
