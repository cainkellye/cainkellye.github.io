/**
 * Utility Functions
 * Common helper functions used throughout the application
 */

/**
 * Array and collection utilities
 */
export const ArrayUtils = {
    /**
     * Shuffle array in-place using Fisher-Yates algorithm
     */
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

    /**
     * Remove duplicates from array
     */
    removeDuplicates(array, caseSensitive = true) {
        if (!Array.isArray(array)) {
            console.warn('ArrayUtils.removeDuplicates: Input is not an array');
            return [];
        }
        
        const seen = new Set();
        return array.filter(item => {
            if (item == null) return false; // Skip null/undefined items
            
            const normalizedItem = caseSensitive ? item : item.toString().toLowerCase();
            if (seen.has(normalizedItem)) {
                return false;
            }
            seen.add(normalizedItem);
            return true;
        });
    },

    /**
     * Get random item from array
     */
    getRandomItem(array) {
        if (!Array.isArray(array) || array.length === 0) {
            console.warn('ArrayUtils.getRandomItem: Invalid or empty array');
            return null;
        }
        return array[Math.floor(Math.random() * array.length)];
    },

    /**
     * Get random items from array
     */
    getRandomItems(array, count) {
        if (!Array.isArray(array)) {
            console.warn('ArrayUtils.getRandomItems: Input is not an array');
            return [];
        }
        
        const shuffled = [...array];
        this.shuffle(shuffled);
        return shuffled.slice(0, Math.max(0, count));
    }
};

/**
 * String utilities
 */
export const StringUtils = {
    /**
     * Remove punctuation from a sentence
     */
    removePunctuation(sentence) {
        if (sentence == null) {
            console.warn('StringUtils.removePunctuation: Input is null or undefined');
            return '';
        }
        
        if (typeof sentence !== 'string') {
            console.warn('StringUtils.removePunctuation: Input is not a string, converting...');
            sentence = String(sentence);
        }
        
        return sentence.replace(/[.,!?¿¡—–\()"]/g, '');
    },

    /**
     * Split sentence into words
     */
    splitSentence(sentence) {
        if (sentence == null) {
            console.warn('StringUtils.splitSentence: Input is null or undefined');
            return [];
        }
        
        if (typeof sentence !== 'string') {
            console.warn('StringUtils.splitSentence: Input is not a string, converting...');
            sentence = String(sentence);
        }
        
        return sentence.split(/\s+/).filter(Boolean);
    },

    /**
     * Split sentence and remove punctuation
     */
    splitSentenceClean(sentence) {
        if (sentence == null) {
            console.warn('StringUtils.splitSentenceClean: Input is null or undefined');
            return [];
        }
        
        return this.splitSentence(this.removePunctuation(sentence));
    },

    /**
     * Capitalize first letter
     */
    capitalize(str) {
        if (str == null) {
            console.warn('StringUtils.capitalize: Input is null or undefined');
            return '';
        }
        
        if (typeof str !== 'string') {
            str = String(str);
        }
        
        if (str.length === 0) return str;
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    /**
     * Truncate string with ellipsis
     */
    truncate(str, maxLength) {
        if (str == null) {
            console.warn('StringUtils.truncate: Input is null or undefined');
            return '';
        }
        
        if (typeof str !== 'string') {
            str = String(str);
        }
        
        if (typeof maxLength !== 'number' || maxLength < 0) {
            console.warn('StringUtils.truncate: Invalid maxLength');
            return str;
        }
        
        if (str.length <= maxLength) {
            return str;
        }
        return str.slice(0, Math.max(0, maxLength - 3)) + '...';
    },

    /**
     * Format bytes for display
     */
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

/**
 * DOM utilities
 */
export const DOMUtils = {
    /**
     * Create element with options
     */
    createElement(tag, options = {}) {
        if (!tag || typeof tag !== 'string') {
            console.error('DOMUtils.createElement: Invalid tag name');
            return null;
        }
        
        try {
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
            
            return element;
        } catch (error) {
            console.error('DOMUtils.createElement: Failed to create element', error);
            return null;
        }
    },

    /**
     * Add event listener with error handling
     */
    addEventListener(element, event, handler) {
        if (!element || typeof element.addEventListener !== 'function') {
            console.warn('DOMUtils.addEventListener: Invalid element');
            return false;
        }
        
        if (!event || typeof event !== 'string') {
            console.warn('DOMUtils.addEventListener: Invalid event type');
            return false;
        }
        
        if (typeof handler !== 'function') {
            console.warn('DOMUtils.addEventListener: Invalid handler function');
            return false;
        }
        
        try {
            element.addEventListener(event, handler);
            return true;
        } catch (error) {
            console.error('DOMUtils.addEventListener: Failed to add event listener', error);
            return false;
        }
    },

    /**
     * Remove all child elements
     */
    clearElement(element) {
        if (!element) {
            console.warn('DOMUtils.clearElement: Invalid element');
            return false;
        }
        
        try {
            element.innerHTML = '';
            return true;
        } catch (error) {
            console.error('DOMUtils.clearElement: Failed to clear element', error);
            return false;
        }
    },

    /**
     * Check if element is visible
     */
    isVisible(element) {
        if (!element) {
            return false;
        }
        
        try {
            return element.style.display !== 'none' && element.offsetParent !== null;
        } catch (error) {
            console.error('DOMUtils.isVisible: Error checking visibility', error);
            return false;
        }
    }
};

/**
 * Validation utilities
 */
export const ValidationUtils = {
    /**
     * Check if value is a valid JSON string
     */
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

    /**
     * Validate lesson configuration structure
     */
    isValidLessonConfig(config) {
        if (!config || typeof config !== 'object') {
            return false;
        }

        // Check for required properties
        if (!config.exercises || !Array.isArray(config.exercises)) {
            return false;
        }

        if (!config['langA-B'] || !Array.isArray(config['langA-B']) || 
            config['langA-B'].length !== 2) {
            return false;
        }

        // Check exercises structure
        return config.exercises.every(exercise => 
            exercise && typeof exercise === 'object' &&
            typeof exercise.A === 'string' &&
            typeof exercise.B === 'string'
        );
    },

    /**
     * Check if string is empty or whitespace
     */
    isEmpty(str) {
        if (str == null) return true;
        if (typeof str !== 'string') str = String(str);
        return str.trim().length === 0;
    },

    /**
     * Validate email format
     */
    isValidEmail(email) {
        if (typeof email !== 'string') {
            return false;
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
};

/**
 * Performance utilities
 */
export const PerformanceUtils = {
    /**
     * Debounce function calls
     */
    debounce(func, wait) {
        if (typeof func !== 'function') {
            console.error('PerformanceUtils.debounce: First argument must be a function');
            return func;
        }
        
        if (typeof wait !== 'number' || wait < 0) {
            console.warn('PerformanceUtils.debounce: Invalid wait time, using default 250ms');
            wait = 250;
        }
        
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Throttle function calls
     */
    throttle(func, limit) {
        if (typeof func !== 'function') {
            console.error('PerformanceUtils.throttle: First argument must be a function');
            return func;
        }
        
        if (typeof limit !== 'number' || limit < 0) {
            console.warn('PerformanceUtils.throttle: Invalid limit, using default 250ms');
            limit = 250;
        }
        
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * Measure execution time
     */
    measureTime(func, label = 'Function') {
        if (typeof func !== 'function') {
            console.error('PerformanceUtils.measureTime: First argument must be a function');
            return null;
        }
        
        const start = performance.now();
        let result;
        
        try {
            result = func();
        } catch (error) {
            console.error(`${label} execution failed:`, error);
            throw error;
        } finally {
            const end = performance.now();
            console.log(`${label} took ${end - start} milliseconds`);
        }
        
        return result;
    }
};

/**
 * Platform detection utilities
 */
export const PlatformUtils = {
    /**
     * Check if running on mobile device
     */
    isMobile() {
        try {
            return window.innerWidth <= 768;
        } catch (error) {
            console.warn('PlatformUtils.isMobile: Error checking window size', error);
            return false;
        }
    },

    /**
     * Check if touch device
     */
    isTouchDevice() {
        try {
            return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        } catch (error) {
            console.warn('PlatformUtils.isTouchDevice: Error checking touch support', error);
            return false;
        }
    },

    /**
     * Check if localStorage is available
     */
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

    /**
     * Check if clipboard API is available
     */
    hasClipboardAPI() {
        try {
            return navigator.clipboard && typeof navigator.clipboard.writeText === 'function';
        } catch (error) {
            console.warn('PlatformUtils.hasClipboardAPI: Error checking clipboard API', error);
            return false;
        }
    },

    /**
     * Fallback copy method for older browsers
     */
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