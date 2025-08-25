/**
 * URL Handler
 * Manages URL parameters for sharing and deep linking
 */

import { ValidationUtils } from './helpers.js';
import { LZString } from './lz-string.js';

export class URLHandler {
    constructor() {
        this.configParam = 'c';
    }

    getQueryParam(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }

    loadConfigFromURL() {
        const compressedConfig = this.getQueryParam(this.configParam);
        if (!compressedConfig) {
            return false;
        }

        try {
            const decompressed = LZString.decompressFromEncodedURIComponent(compressedConfig);
            if (!decompressed) {
                console.warn('Failed to decompress URL config');
                return false;
            }

            const config = JSON.parse(decompressed);
            if (!ValidationUtils.isValidLessonConfig(config)) {
                console.warn('Invalid lesson config in URL');
                return false;
            }

            console.log('Loading config from URL parameter...');
            
            // Import and use ConfigManager
            import('../managers/config-manager.js').then(({ ConfigManager }) => {
                const configManager = new ConfigManager();
                configManager.loadConfiguration(config);
            });

            return true;
        } catch (error) {
            console.error('Error loading config from URL:', error);
            return false;
        }
    }

    removeConfigParam() {
        try {
            const url = new URL(window.location.href);
            if (url.searchParams.has(this.configParam)) {
                url.searchParams.delete(this.configParam);
                const newUrl = url.toString();
                window.history.replaceState({}, '', newUrl);
                console.log('Removed config parameter from URL');
            }
        } catch (error) {
            console.error('Error removing config parameter from URL:', error);
        }
    }

    generateShareURL(config) {
        if (!config) {
            throw new Error('No configuration provided');
        }

        try {
            const configJSON = JSON.stringify(config);
            const compressed = LZString.compressToEncodedURIComponent(configJSON);
            
            if (!compressed) {
                throw new Error('Failed to compress configuration');
            }

            const baseURL = window.location.origin + window.location.pathname;
            const shareURL = `${baseURL}?${this.configParam}=${compressed}`;

            // Check URL length (some browsers have limits)
            if (shareURL.length > 8000) {
                console.warn('Generated URL is very long and might not work in all browsers');
            }

            return shareURL;
        } catch (error) {
            console.error('Error generating share URL:', error);
            throw error;
        }
    }

    parseURL(url) {
        try {
            return new URL(url);
        } catch {
            return null;
        }
    }

    hasConfigParam() {
        return this.getQueryParam(this.configParam) !== null;
    }

    getAllParams() {
        const params = {};
        const urlParams = new URLSearchParams(window.location.search);
        for (const [key, value] of urlParams) {
            params[key] = value;
        }
        return params;
    }

    updateURL(params, replaceState = true) {
        try {
            const url = new URL(window.location.href);
            
            Object.entries(params).forEach(([key, value]) => {
                if (value === null || value === undefined) {
                    url.searchParams.delete(key);
                } else {
                    url.searchParams.set(key, value);
                }
            });

            const newUrl = url.toString();
            
            if (replaceState) {
                window.history.replaceState({}, '', newUrl);
            } else {
                window.history.pushState({}, '', newUrl);
            }
            
            return newUrl;
        } catch (error) {
            console.error('Error updating URL:', error);
            return null;
        }
    }

    extractConfigFromURL(urlString) {
        try {
            const url = new URL(urlString);
            const compressedConfig = url.searchParams.get(this.configParam);
            
            if (!compressedConfig) {
                return null;
            }

            const decompressed = LZString.decompressFromEncodedURIComponent(compressedConfig);
            if (!decompressed) {
                throw new Error('Failed to decompress URL config');
            }

            const config = JSON.parse(decompressed);
            if (!ValidationUtils.isValidLessonConfig(config)) {
                throw new Error('Invalid lesson config in URL');
            }

            return config;
        } catch (error) {
            console.error('Error extracting config from URL:', error);
            throw error;
        }
    }

    isShareURL(urlString) {
        try {
            const url = new URL(urlString);
            return url.searchParams.has(this.configParam);
        } catch {
            return false;
        }
    }
}