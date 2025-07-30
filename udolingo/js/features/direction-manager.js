/**
 * Direction Manager
 * Handles exercise direction randomization and cycling
 */

import { AppState } from '../core/state.js';
import { ArrayUtils } from '../utils/helpers.js';

export class DirectionManager {
    /**
     * Initialize randomized directions for all exercises
     */
    initializeDirections() {
        if (!AppState.hasExercises()) return;
        
        // Create array with half AtoB and half BtoA, then shuffle
        const directions = [];
        const halfLength = Math.floor(AppState.exercises.length / 2);
        
        // Add AtoB directions
        for (let i = 0; i < halfLength; i++) {
            directions.push('AtoB');
        }
        
        // Add BtoA for the rest
        for (let i = halfLength; i < AppState.exercises.length; i++) {
            directions.push('BtoA');
        }
        
        // Shuffle the directions
        ArrayUtils.shuffle(directions);
        AppState.exerciseDirections = directions;
        AppState.currentCycle = 0;
        
        console.log('?? Exercise directions initialized');
    }

    /**
     * Get current direction for an exercise
     */
    getCurrentDirection(exerciseIndex) {
        if (AppState.exerciseDirections.length === 0) {
            this.initializeDirections();
        }
        
        // In the second cycle, flip the direction
        const baseDirection = AppState.exerciseDirections[exerciseIndex];
        if (AppState.currentCycle === 1) {
            return baseDirection === 'AtoB' ? 'BtoA' : 'AtoB';
        }
        return baseDirection;
    }

    /**
     * Check if we need to advance to the next cycle
     */
    checkAndAdvanceCycle() {
        if (AppState.currentCycle === 0) {
            // We've completed the first cycle, move to second cycle
            AppState.currentCycle = 1;
            console.log('?? Advanced to cycle 2 (flipped directions)');
        } else if (AppState.currentCycle === 1) {
            // Reset and initialize new directions
            this.initializeDirections();
            console.log('?? Reset to cycle 1 with new directions');
        }
    }

    /**
     * Shuffle directions (called when shuffle button is pressed)
     */
    shuffleDirections() {
        this.initializeDirections();
    }

    /**
     * Get direction statistics
     */
    getDirectionStats() {
        if (!AppState.exerciseDirections.length) {
            return { AtoB: 0, BtoA: 0 };
        }

        const stats = { AtoB: 0, BtoA: 0 };
        AppState.exerciseDirections.forEach(direction => {
            stats[direction]++;
        });

        return stats;
    }
}