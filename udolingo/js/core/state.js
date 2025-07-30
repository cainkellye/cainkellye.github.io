/**
 * Application State Management
 * Centralized state for the Udolingo application
 */

/**
 * Application state object
 */
export const AppState = {
    // Current lesson state
    currentTaskIndex: 0,
    exercises: [],
    config: null,
    
    // User interaction state
    prevResponses: [],
    mistakes: [],
    
    // Language and direction state
    promptLang: '',
    solutionLang: '',
    exerciseDirections: [], // Array to track direction for each exercise
    currentCycle: 0, // Track which cycle we're on (0: first direction, 1: second direction)
    
    // UI state
    currentRenameId: null, // Track which lesson is being renamed
    
    /**
     * Reset state to initial values
     */
    reset() {
        this.currentTaskIndex = 0;
        this.exercises = [];
        this.config = null;
        this.prevResponses = [];
        this.promptLang = '';
        this.solutionLang = '';
        this.exerciseDirections = [];
        this.currentCycle = 0;
        this.currentRenameId = null;
        // Note: mistakes are preserved across lesson changes
    },
    
    /**
     * Update state with new configuration
     */
    updateConfig(config) {
        this.reset();
        this.config = config;
        this.exercises = config.exercises || [];
    },
    
    /**
     * Clear all mistakes
     */
    clearMistakes() {
        this.mistakes = [];
    },
    
    /**
     * Add a mistake to the state
     */
    addMistake(mistake) {
        this.mistakes.push({
            id: Date.now(),
            timestamp: new Date().toISOString(),
            ...mistake
        });
    },
    
    /**
     * Get current exercise
     */
    getCurrentExercise() {
        if (!this.exercises || this.exercises.length === 0) {
            return null;
        }
        return this.exercises[this.currentTaskIndex];
    },
    
    /**
     * Check if there are any exercises loaded
     */
    hasExercises() {
        return this.exercises && this.exercises.length > 0;
    },
    
    /**
     * Get total number of exercises
     */
    getTotalExercises() {
        return this.exercises ? this.exercises.length : 0;
    },
    
    /**
     * Move to next exercise
     */
    nextExercise() {
        if (this.hasExercises()) {
            this.currentTaskIndex = (this.currentTaskIndex + 1) % this.exercises.length;
            this.prevResponses = [];
            return this.currentTaskIndex === 0; // Returns true if cycle completed
        }
        return false;
    },
    
    /**
     * Get exercise progress info
     */
    getProgress() {
        return {
            current: this.currentTaskIndex + 1,
            total: this.getTotalExercises(),
            percentage: this.getTotalExercises() > 0 
                ? Math.round(((this.currentTaskIndex + 1) / this.getTotalExercises()) * 100)
                : 0
        };
    }
};