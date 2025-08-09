/**
 * Debug Utilities
 */

import { StorageManager } from './storage-manager.js';
import { URLHandler } from './url-handler.js';
import { AppState } from '../core/state.js';

export class DebugUtils {
    static setupGlobalDebugFunctions() {
        const urlHandler = new URLHandler();

        window.udolingoDebug = {
            clearAllLessons: () => {
                if (confirm('Are you sure you want to delete ALL saved lessons? This cannot be undone.')) {
                    const success = StorageManager.clearAllSavedLessons();
                    if (success) {
                        console.log('All lessons cleared');
                        if (window.udolingoApp?.managers?.ui) {
                            window.udolingoApp.managers.ui.refreshSavedLessonsList();
                        }
                    } else {
                        console.error('Failed to clear lessons');
                    }
                }
            },

            clearAllVocab: () => {
                if (confirm('Are you sure you want to delete ALL saved vocabulary? This cannot be undone.')) {
                    const success = StorageManager.clearVocabulary();
                    if (success) {
                        console.log('All vocabulary cleared');
                    }
                }
            },

            showStorageInfo: () => {
                const info = StorageManager.getStorageInfo();
                console.table(info);
                return info;
            },

            getSavedLessons: () => {
                return StorageManager.getSavedLessons();
            },

            generateShareURL: (config) => {
                try {
                    const configToUse = config || AppState.config;
                    if (!configToUse) {
                        console.error('No configuration available');
                        return null;
                    }
                    const url = urlHandler.generateShareURL(configToUse);
                    console.log('Generated share URL:', url);
                    return url;
                } catch (error) {
                    console.error('Error generating share URL:', error);
                    return null;
                }
            },

            getAppState: () => {
                return AppState;
            },

            getCurrentConfig: () => {
                return AppState.config;
            },

            testPerformance: () => {
                console.log('Running performance tests...');
                
                const tests = [
                    {
                        name: 'Array shuffle (1000 items)',
                        test: () => {
                            const arr = Array.from({ length: 1000 }, (_, i) => i);
                            for (let i = 0; i < 100; i++) {
                                import('./helpers.js').then(({ ArrayUtils }) => {
                                    ArrayUtils.shuffle([...arr]);
                                });
                            }
                        }
                    },
                    {
                        name: 'Storage compression test',
                        test: () => {
                            const testData = {
                                title: 'Test Lesson',
                                exercises: Array.from({ length: 100 }, (_, i) => ({
                                    A: `Test sentence ${i} in English`,
                                    B: `Oración de prueba ${i} en español`
                                }))
                            };
                            const compressed = StorageManager.compressData(testData);
                            const decompressed = StorageManager.decompressData(compressed);
                            console.log('Original size:', JSON.stringify(testData).length);
                            console.log('Compressed size:', compressed.length);
                            console.log('Compression ratio:', 
                                (compressed.length / JSON.stringify(testData).length * 100).toFixed(2) + '%');
                            console.log('Decompression successful:', 
                                JSON.stringify(testData) === JSON.stringify(decompressed));
                        }
                    }
                ];

                tests.forEach(test => {
                    console.time(test.name);
                    test.test();
                    console.timeEnd(test.name);
                });
            },

            simulateError: (type = 'storage') => {
                console.warn('Simulating error for testing...');
                switch (type) {
                    case 'storage':
                        const originalSetItem = localStorage.setItem;
                        localStorage.setItem = () => {
                            throw new Error('Simulated storage error');
                        };
                        setTimeout(() => {
                            localStorage.setItem = originalSetItem;
                            console.log('Storage restored');
                        }, 5000);
                        break;
                    case 'network':
                        console.log('Network error simulation not implemented');
                        break;
                    default:
                        console.log('Unknown error type');
                }
            },

            resetApp: () => {
                if (confirm('Reset the entire application state? This will clear current lesson but not saved lessons.')) {
                    AppState.reset();
                    console.log('Application state reset');
                    if (window.udolingoApp?.managers?.ui) {
                        window.udolingoApp.managers.ui.updateUI();
                    }
                }
            },

            enableFeature: (featureName) => {
                localStorage.setItem(`udolingo_feature_${featureName}`, 'true');
                console.log(`Feature "${featureName}" enabled`);
            },

            disableFeature: (featureName) => {
                localStorage.removeItem(`udolingo_feature_${featureName}`);
                console.log(`Feature "${featureName}" disabled`);
            },

            isFeatureEnabled: (featureName) => {
                return localStorage.getItem(`udolingo_feature_${featureName}`) === 'true';
            },

            exportData: () => {
                const data = {
                    version: '1.0.0',
                    timestamp: new Date().toISOString(),
                    lessons: StorageManager.getSavedLessons(),
                    settings: {}
                };
                
                const blob = new Blob([JSON.stringify(data, null, 2)], 
                    { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `udolingo-export-${Date.now()}.json`;
                a.click();
                URL.revokeObjectURL(url);
                
                console.log('Data exported');
            },

            help: () => {
                console.log(`
Udolingo Debug Console Commands:

Data & Storage:
  - showStorageInfo()     Show storage usage statistics
  - getSavedLessons()     List all saved lessons
  - clearAllLessons()     Delete all saved lessons (with confirmation)
  - clearAllVocab()       Delete all saved vocabulary (with confirmation)
  - exportData()          Export all data to JSON file

URLs & Sharing:
  - generateShareURL()    Generate shareable URL for current lesson
  - generateShareURL(config)  Generate URL for specific config

State & Config:
  - getAppState()         Show current application state
  - getCurrentConfig()    Show current lesson configuration
  - resetApp()            Reset application state

Testing & Performance:
  - testPerformance()     Run performance benchmarks
  - simulateError('storage')  Simulate errors for testing

Features:
  - enableFeature(name)   Enable experimental feature
  - disableFeature(name)  Disable experimental feature
  - isFeatureEnabled(name) Check if feature is enabled

Type any command to run it!
                `);
            }
        };

        console.log('Udolingo Debug Console Ready! Type "udolingoDebug.help()" for available commands.');
    }

    static logStartupInfo() {
        const startTime = performance.now();
        
        console.group('Udolingo Startup');
        console.log('Start time:', new Date().toISOString());
        console.log('User agent:', navigator.userAgent);
        console.log('Screen size:', `${window.screen.width}x${window.screen.height}`);
        console.log('Viewport size:', `${window.innerWidth}x${window.innerHeight}`);
        console.log('Storage available:', typeof(Storage) !== "undefined");
        console.log('Clipboard API available:', !!navigator.clipboard);
        console.log('Performance API available:', !!window.performance);
        console.groupEnd();

        return startTime;
    }

    static logPerformanceMetrics(startTime) {
        const loadTime = performance.now() - startTime;
        console.log(`App loaded in ${loadTime.toFixed(2)}ms`);
        
        if (performance.memory) {
            console.log('Memory usage:', {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + 'MB',
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + 'MB',
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024) + 'MB'
            });
        }
    }

    static validateAppState() {
        const issues = [];

        const criticalElements = [
            'prompt', 'response-container', 'word-bank-container', 
            'submit-btn', 'clear-btn', 'next-btn'
        ];

        criticalElements.forEach(id => {
            if (!document.getElementById(id)) {
                issues.push(`Missing critical element: ${id}`);
            }
        });

        try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
        } catch {
            issues.push('localStorage not available');
        }

        if (issues.length > 0) {
            console.error('Application validation issues:', issues);
            return false;
        }

        console.log('Application validation passed');
        return true;
    }
}