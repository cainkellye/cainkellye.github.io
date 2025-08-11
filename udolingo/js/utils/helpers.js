/**
 * Utility Functions
 */

export const ArrayUtils = {
    shuffle(array) {
        if (!Array.isArray(array)) {
            console.warn('ArrayUtils.shuffle: Input is not an array');
            return array;
        }
        
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    },

    removeDuplicates(array, caseSensitive = true) {
        if (!Array.isArray(array)) {
            console.warn('ArrayUtils.removeDuplicates: Input is not an array');
            return [];
        }
        
        const seen = new Set();
        return array.filter(item => {
            if (item == null) return false;
            
            const normalizedItem = caseSensitive ? item : item.toString().toLowerCase();
            if (seen.has(normalizedItem)) {
                return false;
            }
            seen.add(normalizedItem);
            return true;
        });
    }
};

export const StringUtils = {
    removePunctuation(sentence) {
        return this.clean(sentence).replace(/[.,!?¿¡—–\()"]/g, '');
    },

    clean(sentence) {
        if (sentence) {
            return sentence
                .trim()
                .replace(/[\u2018\u2019]/g, "'") // Replace smart quotes with standard quotes
                .replace(/[\u201C\u201D]/g, '"');
        }
        return sentence;
    },

    splitSentence(sentence) {
        return sentence.split(/\s+/).filter(Boolean);
    },

    splitSentenceClean(sentence) {
        return this.splitSentence(this.removePunctuation(sentence));
    },

    formatBytes(bytes, decimals = 2) {
        if (typeof bytes !== 'number' || isNaN(bytes)) {
            console.warn('StringUtils.formatBytes: Invalid input, expected number');
            return '0 bytes';
        }
        
        if (bytes === 0) return '0 bytes';
        
        const k = 1024;
        const dm = Math.max(0, decimals);
        const sizes = ['bytes', 'KB', 'MB', 'GB'];
        
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        const sizeIndex = Math.min(i, sizes.length - 1);
        
        return parseFloat((bytes / Math.pow(k, sizeIndex)).toFixed(dm)) + ' ' + sizes[sizeIndex];
    }
};

export const ValidationUtils = {
    isValidJSON(str) {
        if (typeof str !== 'string') {
            return false;
        }
        
        try {
            JSON.parse(str);
            return true;
        } catch {
            return false;
        }
    },

    isValidLessonConfig(config) {
        if (!config || typeof config !== 'object') {
            return false;
        }

        if (!config.exercises || !Array.isArray(config.exercises)) {
            return false;
        }

        if (!config['langA-B'] || !Array.isArray(config['langA-B']) || 
            config['langA-B'].length !== 2) {
            return false;
        }

        return config.exercises.every(exercise => 
            exercise && typeof exercise === 'object' &&
            typeof exercise.A === 'string' &&
            typeof exercise.B === 'string'
        );
    }
};

export const PlatformUtils = {
    isMobile() {
        try {
            return window.innerWidth <= 768;
        } catch (error) {
            console.warn('PlatformUtils.isMobile: Error checking window size', error);
            return false;
        }
    },

    hasLocalStorage() {
        try {
            const test = '__test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch {
            return false;
        }
    },

    hasClipboardAPI() {
        try {
            return navigator.clipboard && typeof navigator.clipboard.writeText === 'function';
        } catch (error) {
            console.warn('PlatformUtils.hasClipboardAPI: Error checking clipboard API', error);
            return false;
        }
    }
};

export const ClipboardUtils = {
    async copyText(text, successMessage = 'Text copied to clipboard!') {
        try {
            if (PlatformUtils.hasClipboardAPI()) {
                await navigator.clipboard.writeText(text);
                if (successMessage) {
                    UIUtils.showSuccess(successMessage);
                }
                return true;
            } else {
                return this.fallbackCopyToClipboard(text, successMessage);
            }
        } catch (error) {
            console.error('Clipboard copy failed:', error);
            return this.fallbackCopyToClipboard(text, successMessage);
        }
    },

    async readText() {
        try {
            if (PlatformUtils.hasClipboardAPI()) {
                return await navigator.clipboard.readText();
            } else {
                throw new Error('Clipboard API not available');
            }
        } catch (error) {
            console.error('Clipboard read failed:', error);
            throw error;
        }
    },

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
            const successful = document.execCommand('copy');
            if (successful && successMessage) {
                UIUtils.showSuccess(successMessage);
            }
            return successful;
        } catch (err) {
            console.error('Fallback copy failed:', err);
            this.showFallbackMessage(text);
            return false;
        } finally {
            document.body.removeChild(textArea);
        }
    },

    showFallbackMessage(text) {
        alert('Copy failed. Please manually copy the text from the console.');
        console.log('Text to copy:', text);
    }
};

export const UIUtils = {
    showError(message, details = '') {
        console.error('UI Error:', message, details);
        
        const userMessage = typeof message === 'string' ? message : 
            'An error occurred. Please check the console for details.';
        alert(userMessage);
    },

    showSuccess(message) {
        console.log('Success:', message);
        alert(message);
    },

    confirm(message, onConfirm, onCancel) {
        if (window.confirm(message)) {
            if (typeof onConfirm === 'function') {
                onConfirm();
            }
        } else {
            if (typeof onCancel === 'function') {
                onCancel();
            }
        }
    }
};
