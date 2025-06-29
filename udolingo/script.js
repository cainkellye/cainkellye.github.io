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
    const shuffleBtn = document.getElementById('shuffle-lessons-btn');

    // Config panel elements
    const openConfigPanelBtn = document.getElementById('open-config-panel-btn');
    const configPanel = document.getElementById('config-panel');
    const configInput = document.getElementById('config-input');
    const loadConfigBtn = document.getElementById('load-config-btn');
    const cancelConfigBtn = document.getElementById('cancel-config-btn');


    let currentTaskIndex = 0;
    let lessons = [];
    let prevResponses = [];

    // --- Utility Functions ---
    function setButtonsDisabled(disabled) {
        submitBtn.disabled = disabled;
        clearBtn.disabled = disabled;
        nextBtn.disabled = disabled;
        shuffleBtn.disabled = disabled;
        backBtn.disabled = disabled;
    }

    //google.hu/?sl=en&tl=pt&op=translate&text=

    // --- Core Application Logic ---
    function loadTask(index) {
        if (!lessons || lessons.length === 0) {
            promptEl.textContent = "No lessons loaded.";
            setButtonsDisabled(true);
            return;
        }

        setButtonsDisabled(false);
        const task = lessons[index];
        promptEl.textContent = `Translate this: "${task.prompt}"`;

        const words = removeExactDuplicates(splitSentence(task.solution + ' ' + task.distractors));
        shuffleArray(words);

        wordBankContainerEl.innerHTML = '';
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

    function splitSentence(sentence) {
        return removePunctuation(sentence)
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

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // --- Event Listeners ---
    submitBtn.addEventListener('click', () => {
        const userResponse = responseContainerEl.textContent.trim();
        const solution = removePunctuation(lessons[currentTaskIndex].solution);

        if (userResponse === solution) {
            feedbackEl.textContent = 'Correct!';
            feedbackEl.style.color = 'green';
        } else {
            feedbackEl.textContent = 'Incorrect. The correct answer is: "' + solution + '"';
            feedbackEl.style.color = 'red';
        }
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

    shuffleBtn.addEventListener('click', () => {
        shuffleArray(lessons)
        loadTask(0);
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
