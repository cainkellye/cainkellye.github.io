/**
 * Application State Management
 * Centralized state for the Udolingo application
 */

export const AppState = {
    // Current lesson state
    currentTaskIndex: 0,
    exercises: [],
    config: null,
    
    // User interaction state
    mistakes: [],
    
    // Language and direction state
    promptLang: '',
    solutionLang: '',
    exerciseDirections: [], // Array to track direction for each exercise
    currentCycle: 0, // Track which cycle we're on (0: first direction, 1: second direction)
    
    // UI state
    currentRenameId: null, // Track which lesson is being renamed
    
    reset() {
        this.currentTaskIndex = 0;
        this.exercises = [];
        this.config = null;
        this.promptLang = '';
        this.solutionLang = '';
        this.exerciseDirections = [];
        this.currentCycle = 0;
        this.currentRenameId = null;
        // Note: mistakes are preserved across lesson changes
    },
    
    updateConfig(config) {
        this.reset();
        this.config = config;
        this.exercises = config.exercises || [];
    },
    
    clearMistakes() {
        this.mistakes = [];
    },
    
    addMistake(mistake) {
        this.mistakes.push({
            id: Date.now(),
            timestamp: new Date().toISOString(),
            ...mistake
        });
    },
    
    getCurrentExercise() {
        if (!this.exercises || this.exercises.length === 0) {
            return null;
        }
        return this.exercises[this.currentTaskIndex];
    },
    
    hasExercises() {
        return this.exercises && this.exercises.length > 0;
    },
    
    getTotalExercises() {
        return this.exercises ? this.exercises.length : 0;
    },
    
    nextExercise() {
        if (this.hasExercises()) {
            this.currentTaskIndex = (this.currentTaskIndex + 1) % this.exercises.length;
            return this.currentTaskIndex === 0; // Returns true if cycle completed
        }
        return false;
    },
    
    getProgress() {
        return {
            current: this.currentTaskIndex + 1,
            total: this.getTotalExercises()
        };
    }
};