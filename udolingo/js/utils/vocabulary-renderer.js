/**
 * Vocabulary Renderer Component
 * Shared component for rendering vocabulary grids
 * Used by both vocabulary.html and vocabulary-manager.js
 */

export class VocabularyRenderer {
    /**
     * Creates a vocabulary row with input fields for source and translation
     * @param {string} sourceWord - The source word/phrase
     * @param {string} targetWord - The target translation
     * @param {HTMLElement} container - The container to append the row to
     * @param {number} index - Optional index for data attributes
     */
    static createVocabularyRow(sourceWord, targetWord, container, index = null) {
        // Create source word input (editable)
        const sourceInput = document.createElement('input');
        sourceInput.type = 'text';
        sourceInput.className = 'vocab-source-input';
        sourceInput.value = sourceWord || '';
        sourceInput.placeholder = 'word/phrase...';
        if (index !== null) {
            sourceInput.setAttribute('data-index', index);
        }

        // Create target word input (editable)
        const targetInput = document.createElement('input');
        targetInput.type = 'text';
        targetInput.className = 'vocab-translation-input';
        targetInput.value = targetWord || '';
        targetInput.placeholder = 'add translation...';
        if (index !== null) {
            targetInput.setAttribute('data-index', index);
        }

        container.appendChild(sourceInput);
        container.appendChild(targetInput);

        return { sourceInput, targetInput };
    }

    /**
     * Creates and adds a grid add button to the vocabulary grid
     * @param {HTMLElement} grid - The vocabulary grid element
     * @param {Function} onAddCallback - Callback function when add button is clicked
     */
    static addGridAddButton(grid, onAddCallback) {
        // Remove existing add button if present
        const existingButton = grid.querySelector('.grid-add-button');
        if (existingButton) {
            existingButton.remove();
        }

        // Create add button that spans both columns
        const addButton = document.createElement('button');
        addButton.className = 'grid-add-button';
        addButton.textContent = '+ Add New Entry';
        
        addButton.addEventListener('click', () => {
            if (onAddCallback) {
                onAddCallback();
            }
        });
        
        addButton.addEventListener('mouseenter', () => {
            addButton.style.backgroundColor = '#45a049';
        });
        
        addButton.addEventListener('mouseleave', () => {
            addButton.style.backgroundColor = '#4CAF50';
        });

        grid.appendChild(addButton);
        return addButton;
    }

    /**
     * Creates a vocabulary grid with proper CSS classes
     * @param {string} additionalClasses - Additional CSS classes to add
     * @returns {HTMLElement} The created grid element
     */
    static createVocabularyGrid(additionalClasses = '') {
        const vocabGrid = document.createElement('div');
        vocabGrid.className = `vocab-grid ${additionalClasses}`.trim();
        return vocabGrid;
    }

    /**
     * Clears a vocabulary grid and optionally adds an add button
     * @param {HTMLElement} grid - The grid to clear
     * @param {Function} onAddCallback - Optional callback for add button
     */
    static clearGrid(grid, onAddCallback = null) {
        if (!grid) return;
        
        grid.innerHTML = '';
        
        if (onAddCallback) {
            this.addGridAddButton(grid, onAddCallback);
        }
    }

    /**
     * Creates a vocabulary row using the legacy row-based structure (for backward compatibility)
     * @param {string} sourceWord - The source word/phrase
     * @param {string} targetWord - The target translation
     * @param {number} index - Index for data attributes
     * @returns {HTMLElement} The created row element
     */
    static createVocabularyRowElement(sourceWord, targetWord, index = null) {
        const row = document.createElement('div');
        row.className = 'vocab-row';

        const sourceInput = document.createElement('input');
        sourceInput.type = 'text';
        sourceInput.className = 'vocab-source-input';
        sourceInput.value = sourceWord || '';
        sourceInput.placeholder = 'word/phrase...';
        if (index !== null) {
            sourceInput.setAttribute('data-index', index);
        }

        const targetInput = document.createElement('input');
        targetInput.type = 'text';
        targetInput.className = 'vocab-translation-input';
        targetInput.value = targetWord || '';
        targetInput.placeholder = 'add translation...';
        if (index !== null) {
            targetInput.setAttribute('data-index', index);
        }

        row.appendChild(sourceInput);
        row.appendChild(targetInput);

        return row;
    }

    /**
     * Gets all vocabulary input pairs from a container
     * @param {HTMLElement|Document} container - Container to search in
     * @returns {Array} Array of {source, translation} objects
     */
    static getVocabularyInputs(container = document) {
        const sourceInputs = container.querySelectorAll('.vocab-source-input');
        const translationInputs = container.querySelectorAll('.vocab-translation-input');
        
        const entries = [];
        sourceInputs.forEach((sourceInput, index) => {
            const source = sourceInput.value.trim();
            const translation = translationInputs[index]?.value.trim() || '';
            
            if (source) {
                entries.push({ source, translation });
            }
        });
        
        return entries;
    }

    /**
     * Focuses on the last source input in a grid
     * @param {HTMLElement} grid - The vocabulary grid
     */
    static focusLastSourceInput(grid) {
        const inputs = grid.querySelectorAll('.vocab-source-input');
        if (inputs.length > 0) {
            inputs[inputs.length - 1].focus();
        }
    }
}