/**
 * Storage Manager
 * Handles localStorage operations with compression and error handling
 */

import { StringUtils, ValidationUtils } from './helpers.js';
import { LZString } from './lz-string.js';

export class StorageManager {
    constructor() {
        this.prefix = 'udolingo_';
        this.lessonPrefix = `${this.prefix}lesson_`;
        this.indexKey = `${this.prefix}lessons_index`;
    }

    /**
     * Save a lesson configuration to localStorage with compression
     */
    saveLesson(config) {
        if (!config || !ValidationUtils.isValidLessonConfig(config)) {
            console.error('Invalid lesson configuration');
            return null;
        }

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
            const success = this.setItem(`${this.lessonPrefix}${lessonId}`, compressed);
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
                this.removeItem(`${this.lessonPrefix}${lessonId}`);
                console.error('Failed to update lessons index');
                return null;
            }
            
            console.log('Lesson saved successfully');
            return lessonId;
        } catch (error) {
            console.error('Error saving lesson:', error);
            return null;
        }
    }

    /**
     * Compress data using LZ-String
     */
    compressData(data) {
        try {
            const json = JSON.stringify(data);
            return LZString.compressToBase64(json);
        } catch (error) {
            console.error('Error compressing data:', error);
            return null;
        }
    }

    /**
     * Decompress data using LZ-String
     */
    decompressData(compressedData) {
        try {
            // Handle both compressed and uncompressed data for backward compatibility
            if (typeof compressedData === 'string' && !compressedData.startsWith('{')) {
                // Looks like compressed data
                const decompressed = LZString.decompressFromBase64(compressedData);
                return decompressed ? JSON.parse(decompressed) : null;
            } else {
                // Looks like uncompressed JSON or already parsed object
                return typeof compressedData === 'string' ? 
                    JSON.parse(compressedData) : compressedData;
            }
        } catch (error) {
            console.error('Error decompressing data:', error);
            return null;
        }
    }
    
    /**
     * Get all saved lessons metadata
     */
    getSavedLessons() {
        try {
            const indexData = this.getItem(this.indexKey);
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
    }
    
    /**
     * Set the lessons index (metadata only)
     */
    setSavedLessonsIndex(lessonsIndex) {
        try {
            return this.setItem(this.indexKey, lessonsIndex);
        } catch (error) {
            console.error('Error setting lessons index:', error);
            return false;
        }
    }
    
    /**
     * Get a specific saved lesson by ID (full data)
     */
    getSavedLesson(id) {
        try {
            const compressedData = this.getItem(`${this.lessonPrefix}${id}`);
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
    }
    
    /**
     * Delete a saved lesson by ID
     */
    deleteLesson(id) {
        try {
            // Remove the lesson data
            const dataRemoved = this.removeItem(`${this.lessonPrefix}${id}`);
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
    }
    
    /**
     * Rename a saved lesson
     */
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
            
            const dataSuccess = this.setItem(`${this.lessonPrefix}${id}`, compressed);
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
    }
    
    /**
     * localStorage utility functions
     */
    setItem(key, value) {
        try {
            const dataToStore = typeof value === 'string' ? value : JSON.stringify(value);
            localStorage.setItem(key, dataToStore);
            console.log(`Stored ${key} with size: ${dataToStore.length} bytes`);
            return true;
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                console.error('localStorage quota exceeded');
                this.handleQuotaExceeded();
            } else {
                console.error('Error saving to localStorage:', error);
            }
            return false;
        }
    }
    
    getItem(key) {
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
    }
    
    removeItem(key) {
        try {
            localStorage.removeItem(key);
            console.log(`Removed ${key} from localStorage`);
            return true;
        } catch (error) {
            console.error(`Error removing ${key} from localStorage:`, error);
            return false;
        }
    }

    /**
     * Handle storage quota exceeded
     */
    handleQuotaExceeded() {
        alert('Storage quota exceeded. Please delete some saved lessons to free up space.');
    }
    
    /**
     * Check localStorage availability and health
     */
    checkStorageHealth() {
        try {
            const testKey = `${this.prefix}test`;
            const testData = { test: 'data', timestamp: Date.now() };
            
            // Test write
            const writeSuccess = this.setItem(testKey, testData);
            if (!writeSuccess) {
                return false;
            }
            
            // Test read
            const retrieved = this.getItem(testKey);
            if (!retrieved || retrieved.test !== 'data') {
                return false;
            }
            
            // Clean up
            this.removeItem(testKey);
            
            console.log('localStorage health check passed');
            return true;
        } catch (error) {
            console.error('localStorage health check failed:', error);
            return false;
        }
    }
    
    /**
     * Clear all saved lessons (emergency cleanup)
     */
    clearAllSavedLessons() {
        try {
            const savedLessons = this.getSavedLessons();
            
            // Remove all lesson data
            Object.keys(savedLessons).forEach(id => {
                this.removeItem(`${this.lessonPrefix}${id}`);
            });
            
            // Clear the index
            this.removeItem(this.indexKey);
            
            console.log('All saved lessons cleared');
            return true;
        } catch (error) {
            console.error('Error clearing saved lessons:', error);
            return false;
        }
    }
    
    /**
     * Get storage usage info
     */
    getStorageInfo() {
        try {
            const savedLessons = this.getSavedLessons();
            const lessonCount = Object.keys(savedLessons).length;
            
            // Calculate total storage usage
            let totalSize = 0;
            const indexSize = JSON.stringify(savedLessons).length;
            totalSize += indexSize;
            
            Object.keys(savedLessons).forEach(id => {
                const lessonData = this.getItem(`${this.lessonPrefix}${id}`);
                if (lessonData) {
                    const dataSize = typeof lessonData === 'string' ? 
                        lessonData.length : JSON.stringify(lessonData).length;
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
                formattedSize: StringUtils.formatBytes(totalSize),
                formattedTotalSize: StringUtils.formatBytes(totalLocalStorageSize),
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
    }
}