document.addEventListener('DOMContentLoaded', () => {
    // Main application elements
    const promptEl = document.getElementById('prompt');
    const responseContainerEl = document.getElementById('response-container');
    const wordBankContainerEl = document.getElementById('word-bank-container');
    const submitBtn = document.getElementById('submit-btn');
    const clearBtn = document.getElementById('clear-btn');
    const backBtn = document.getElementById('back-btn');
    const feedbackEl = document.getElementById('feedback');
    const nextBtn = document.getElementById('next-btn');
    const translateBtn = document.getElementById('translate-btn');
    const shuffleBtn = document.getElementById('shuffle-lessons-btn');
    const vocab1Btn = document.getElementById('vocab1-btn');
    const vocab2Btn = document.getElementById('vocab2-btn');

    // Config panel elements
    const openConfigPanelBtn = document.getElementById('open-config-panel-btn');
    const configPanel = document.getElementById('config-panel');
    const configInput = document.getElementById('config-input');
    const loadConfigBtn = document.getElementById('load-config-btn');
    const cancelConfigBtn = document.getElementById('cancel-config-btn');


    let currentTaskIndex = 0;
    let lessons = [];
    let prevResponses = [];
    let promptLang = '';
    let solutionLang = '';

    // --- Utility Functions ---
    function setButtonsDisabled(disabled) {
        submitBtn.disabled = disabled;
        clearBtn.disabled = disabled;
        nextBtn.disabled = disabled;
        shuffleBtn.disabled = disabled;
        backBtn.disabled = disabled;
        translateBtn.disabled = disabled;
        vocab1Btn.disabled = disabled;
        vocab2Btn.disabled = disabled;
    }

    function setResponseButtonsDisabled(disabled) {
        submitBtn.disabled = disabled;
        clearBtn.disabled = disabled;
        backBtn.disabled = disabled;
    }

    // --- Core Application Logic ---
    function loadTask(index) {
        if (!lessons || lessons.length === 0) {
            promptEl.textContent = "No lessons loaded.";
            setButtonsDisabled(true);
            return;
        }

        setButtonsDisabled(false);
        const lesson = lessons[index];
        if (lesson.lang) {
            const langParts = lesson.lang.split(';');
            if (langParts.length == 2) {
                promptLang = langParts[0].trim();
                solutionLang = langParts[1].trim();
                vocab1Btn.innerHTML = `${promptLang} 📖`;
                vocab2Btn.innerHTML = `${solutionLang} 📖`;
                vocab1Btn.style.display = '';
                vocab2Btn.style.display = '';
            } else {
                promptLang = '';
                solutionLang = '';
                vocab1Btn.style.display = 'none';
                vocab2Btn.style.display = 'none';
            }
        } else {
            vocab1Btn.style.display = 'none';
            vocab2Btn.style.display = 'none';
        }


        promptEl.textContent = `Translate this: "${lesson.prompt}"`;

        const words = removeExactDuplicates(splitSentenceWithoutPunctuation(lesson.solution + ' ' + lesson.distractors));
        shuffleArray(words);

        clearWordBank();
        words.forEach(word => {
            const button = document.createElement('button');
            button.textContent = word;
            button.classList.add('word-bank-btn');
            button.addEventListener('click', () => {
                const currentResponse = responseContainerEl.textContent;
                prevResponses.push(currentResponse);
                responseContainerEl.textContent = currentResponse ? `${currentResponse} ${word}` : word;
            });
            wordBankContainerEl.appendChild(button);
        });

        responseContainerEl.textContent = '';
        feedbackEl.textContent = '';
        prevResponses = [];
    }

    function removePunctuation(sentence) {
        return sentence
            .replace(/[.,!?¿¡—–\()"“”‘’]/g, '')
    }

    function splitSentenceWithoutPunctuation(sentence) {
        return splitSentence(removePunctuation(sentence));
    }

    function splitSentence(sentence) {
        return sentence
            .split(/\s+/)
            .filter(Boolean); // remove empty strings
    }

    function removeExactDuplicates(words) {
        const seen = new Set();
        return words.filter(word => {
            if (seen.has(word)) {
                return false;
            }
            seen.add(word);
            return true;
        });
    }

    function clearWordBank() {
        wordBankContainerEl.innerHTML = '';
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function generateVocabulary(langcode, limit) {
        const vocab = [];
        lessons.forEach(lesson => {
            if (!lesson.lang) return;
            const parts = lesson.lang.split(';');
            if (parts.length < 2) return;

            let sentence = "";
            if (parts[0] === langcode) {
                sentence = lesson.prompt;
            } else if (parts[parts.length - 1] === langcode) {
                sentence = lesson.solution;
            }

            if (sentence) {
                const words = splitSentenceWithoutPunctuation(sentence);
                words.forEach(word => {
                    if (word.length >= limit) {
                        vocab.push(word);
                    }
                });
            }
        });
        return removeExactDuplicates(vocab);
    }

    // --- Event Listeners ---
    submitBtn.addEventListener('click', () => {
        const userResponse = responseContainerEl.textContent.trim();
        const solution = removePunctuation(lessons[currentTaskIndex].solution);
        clearWordBank();
        setResponseButtonsDisabled(true); // Disable buttons after submission

        // If the user response exactly matches the solution, mark as correct.
        if (userResponse === solution) {
            feedbackEl.textContent = 'Correct!';
            feedbackEl.style.color = 'green';
            return;
        }

        // Use splitSentence to compare word by word
        const userWords = splitSentenceWithoutPunctuation(userResponse);
        const solWords = splitSentenceWithoutPunctuation(solution);
        const solWordsOriginal = splitSentence(solution);

        // Find the common prefix.
        let prefixCount = 0;
        while (
            prefixCount < userWords.length &&
            prefixCount < solWords.length &&
            userWords[prefixCount] === solWords[prefixCount]
        ) {
            prefixCount++;
        }

        // Find the common suffix.
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

        // Build the feedback with inline spans.
        feedbackEl.innerHTML = 'Incorrect. The correct answer is: "' + 
            (prefixText ? '<span style="color:black;">' + prefixText + '</span> ' : '') +
            (mismatchText ? '<span style="color:red;">' + mismatchText + '</span>' : '') +
            (suffixText ? '<span style="color:black;"> ' + suffixText + '</span>"' : '"');
    });

    clearBtn.addEventListener('click', () => {
        responseContainerEl.textContent = '';
        prevResponses = [];
    });

    backBtn.addEventListener('click', () => {
        if (prevResponses.length > 0) {
            responseContainerEl.textContent = prevResponses.pop();
        } else {
            responseContainerEl.textContent = '';
        }
    });

    nextBtn.addEventListener('click', () => {
        currentTaskIndex = (currentTaskIndex + 1) % lessons.length;
        loadTask(currentTaskIndex);
    });

    translateBtn.addEventListener('click', () => {
        const prompt = lessons[currentTaskIndex].prompt;
        // open https://translate.google.com/?sl=auto&text=
        const encodedPrompt = encodeURIComponent(prompt);
        if (!promptLang || !solutionLang) {
            const translateUrl = `https://translate.google.com/?sl=auto&text=${encodedPrompt}`;
            window.open(translateUrl, '_blank');
        } else {
            const translateUrl = `https://translate.google.com/?sl=${promptLang}&tl=${solutionLang}&text=${encodedPrompt}`;
            window.open(translateUrl, '_blank');
        }
    });

    vocab1Btn.addEventListener('click', () => {
        const vocab = generateVocabulary(promptLang, 4);
        const encodedPrompt = encodeURIComponent(vocab.join(';\n'));
        const translateUrl = `https://translate.google.com/?sl=${promptLang}&tl=${solutionLang}&text=${encodedPrompt}`;
        window.open(translateUrl, '_blank');
    });

    vocab2Btn.addEventListener('click', () => {
        const vocab = generateVocabulary(solutionLang, 4);
        const encodedPrompt = encodeURIComponent(vocab.join(';\n'));
        const translateUrl = `https://translate.google.com/?sl=${solutionLang}&tl=${promptLang}&text=${encodedPrompt}`;
        window.open(translateUrl, '_blank');
    });

    shuffleBtn.addEventListener('click', () => {
        shuffleArray(lessons)
        currentTaskIndex = 0; // Reset to first task after shuffling
        loadTask(currentTaskIndex);
    });

    // --- Config Panel Logic ---
    openConfigPanelBtn.addEventListener('click', () => {
        configPanel.style.display = 'flex';
    });

    cancelConfigBtn.addEventListener('click', () => {
        configPanel.style.display = 'none';
    });

    loadConfigBtn.addEventListener('click', () => {
        const configText = configInput.value;
        if (!configText) {
            alert("The text area is empty. Please paste your lesson configuration.");
            return;
        }
        try {
            const newConfig = JSON.parse(configText);
            if (newConfig && newConfig.lessons) {
                lessons = newConfig.lessons;
                currentTaskIndex = 0;
                loadTask(currentTaskIndex);
                configInput.value = ''; // Clear the textarea
                configPanel.style.display = 'none'; // Close the panel
            } else {
                alert("Invalid configuration format. Make sure it has a 'lessons' property.");
            }
        } catch (error) {
            alert(`Error parsing JSON: ${error.message}`);
        }
    });

    // --- Initial State ---
    // Fetch lessons from the default JSON file initially
    fetch('config.json')
        .then(response => {
            if (!response.ok) {
                throw new Error("config.json not found.");
            }
            return response.json();
        })
        .then(data => {
            lessons = data.lessons;
            loadTask(currentTaskIndex);
        })
        .catch(error => {
            console.warn("Could not load default config.json. Use 'Load from Text' to begin.", error);
            setButtonsDisabled(true);
        });
});
