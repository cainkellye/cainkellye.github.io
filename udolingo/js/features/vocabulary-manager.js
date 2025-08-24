/**
 * Vocabulary Manager
 * Handles the standalone vocabulary manager page functionality
 */

import { StorageManager } from '../utils/storage-manager.js';
import { VocabularyRenderer } from '../utils/vocabulary-renderer.js';
import { VocabularyStorage } from './vocabulary-storage.js';
import { StringUtils, ArrayUtils, UIUtils } from '../utils/helpers.js';

export class VocabularyManager {
    constructor() {
        this.currentLanguagePair = null;
        this.currentDirection = 'normal'; // 'normal' or 'reverse'
        this.vocabularyData = {};
        this.allVocabularyEntries = []; // Store all entries for filtering
        this.vocabularyStorage = new VocabularyStorage();
        this.filterTimeout = null; // For debouncing filter updates
    }

    init() {
        this.loadVocabularyData();
        this.populateLanguagePairs();
        this.autoSelectLanguagePair(); // New: auto-select language pair
        this.setupEventListeners();
        this.setupMobileResponsive();
    }

    autoSelectLanguagePair() {
        const pairs = Object.keys(this.vocabularyData);
        if (pairs.length === 0) return;

        let targetPairKey = null;
        let targetDirection = 'normal';

        // Try to get current exercise language pair from the main app
        try {
            // Check if we can access parent window (if opened from main app)
            if (window.opener && window.opener.udolingoApp) {
                const parentApp = window.opener.udolingoApp;
                if (parentApp.state && parentApp.state.config && parentApp.state.config['langA-B']) {
                    const [langA, langB] = parentApp.state.config['langA-B'];
                    const sortedLangs = [langA.toLowerCase(), langB.toLowerCase()].sort();
                    const exercisePairKey = sortedLangs.join(':');
                    
                    if (this.vocabularyData[exercisePairKey]) {
                        targetPairKey = exercisePairKey;
                        
                        // Determine direction based on current prompt language
                        if (parentApp.state.promptLang) {
                            const [lang1, lang2] = targetPairKey.split(':');
                            targetDirection = (lang1 === parentApp.state.promptLang.toLowerCase()) ? 'normal' : 'reverse';
                        }
                        
                        console.log(`Auto-selected language pair from current exercise: ${targetPairKey} (${targetDirection})`);
                    }
                }
            }
        } catch (error) {
            console.log('Could not access parent app state:', error.message);
        }

        // Fallback: select the first available language pair
        if (!targetPairKey) {
            targetPairKey = pairs[0];
            console.log(`Auto-selected first available language pair: ${targetPairKey}`);
        }

        // Set the dropdown value and load the vocabulary
        const select = document.getElementById('language-pair-select');
        if (select) {
            select.value = targetPairKey;
            this.currentLanguagePair = targetPairKey;
            this.currentDirection = targetDirection;
            this.loadLanguagePairVocabulary();
            this.updateUI();
            this.updateFilterPlaceholder(); // Update placeholder text
        }
    }

    setupMobileResponsive() {
        // Handle sidebar toggle for mobile
        document.getElementById('sidebar-header').addEventListener('click', () => {
            const sidebar = document.getElementById('sidebar');
            const toggle = document.getElementById('sidebar-toggle');
            const content = document.getElementById('sidebar-content');
            
            if (window.innerWidth <= 768) {
                sidebar.classList.toggle('collapsed');
                
                if (sidebar.classList.contains('collapsed')) {
                    content.style.display = 'none';
                    toggle.style.transform = 'rotate(-90deg)';
                } else {
                    content.style.display = 'block';
                    toggle.style.transform = 'rotate(0deg)';
                }
            }
        });
    }

    loadVocabularyData() {
        this.vocabularyData = StorageManager.getCentralVocabulary() || {};
        console.log('Loaded vocabulary data:', this.vocabularyData);
    }

    populateLanguagePairs() {
        const select = document.getElementById('language-pair-select');
        const pairs = Object.keys(this.vocabularyData);
        
        // Clear existing options
        select.innerHTML = '';
        
        if (pairs.length === 0) {
            select.innerHTML = '<option value="">No vocabulary pairs available</option>';
            return;
        }
        
        // Add default option
        select.innerHTML = '<option value="">Select a language pair...</option>';
        
        // Add language pairs
        pairs.forEach(pairKey => {
            const [lang1, lang2] = pairKey.split(':');
            const displayName = `${lang1.charAt(0).toUpperCase() + lang1.slice(1)} ↔ ${lang2.charAt(0).toUpperCase() + lang2.slice(1)}`;
            const option = document.createElement('option');
            option.value = pairKey;
            option.textContent = displayName;
            select.appendChild(option);
        });
    }

    setupEventListeners() {
        // Language pair selection
        document.getElementById('language-pair-select').addEventListener('change', (e) => {
            this.selectLanguagePair(e.target.value);
            this.closeSidebarOnMobile();
        });

        // Switch direction button
        document.getElementById('switch-direction-btn').addEventListener('click', () => {
            this.switchDirection();
            this.closeSidebarOnMobile();
        });

        // Add new entry button
        document.getElementById('add-entry-btn').addEventListener('click', () => {
            this.addNewEntry();
        });

        // Save changes button
        document.getElementById('save-changes-btn').addEventListener('click', () => {
            this.saveVocabularyChanges();
            this.closeSidebarOnMobile();
        });

        // Save changes main button
        document.getElementById('save-changes-main-btn').addEventListener('click', () => {
            this.saveVocabularyChanges();
            this.closeSidebarOnMobile();
        });

        // Export button
        document.getElementById('export-vocab-btn').addEventListener('click', () => {
            this.exportVocabulary();
            this.closeSidebarOnMobile();
        });

        // Import vocabulary button (opens modal)
        document.getElementById('import-vocab-btn').addEventListener('click', () => {
            this.showImportModal('');
            this.closeSidebarOnMobile();
        });

        // Browse file button in modal
        document.getElementById('browse-file-btn').addEventListener('click', () => {
            document.getElementById('import-file-input').click();
        });

        // File input
        document.getElementById('import-file-input').addEventListener('change', (e) => {
            this.handleFileImport(e);
        });

        // Import modal buttons
        document.getElementById('confirm-import-btn').addEventListener('click', () => {
            this.confirmImport();
        });

        document.getElementById('cancel-import-btn').addEventListener('click', () => {
            this.hideImportModal();
        });

        // Phrase filter input with debouncing
        const filterInput = document.getElementById('phrase-filter');
        if (filterInput) {
            filterInput.addEventListener('input', (e) => {
                this.debouncedFilterVocabulary(e.target.value);
            });
        }
    }

    selectLanguagePair(pairKey) {
        if (!pairKey) {
            this.currentLanguagePair = null;
            this.hideVocabulary();
            return;
        }

        this.currentLanguagePair = pairKey;
        this.currentDirection = 'normal';
        this.loadLanguagePairVocabulary();
        this.updateUI();
    }

    loadLanguagePairVocabulary() {
        if (!this.currentLanguagePair) return;

        const compressedData = this.vocabularyData[this.currentLanguagePair];
        if (!compressedData) {
            this.showNoVocabulary();
            return;
        }

        const vocabularyEntries = StorageManager.decompressData(compressedData) || [];
        this.allVocabularyEntries = vocabularyEntries; // Store all entries for filtering
        this.displayVocabulary(vocabularyEntries);

        // Clear filter when loading new vocabulary and cancel any pending filter
        const filterInput = document.getElementById('phrase-filter');
        if (filterInput) {
            filterInput.value = '';
        }
        
        // Update placeholder text for the filter
        this.updateFilterPlaceholder();
        
        // Cancel any pending filter timeout
        if (this.filterTimeout) {
            clearTimeout(this.filterTimeout);
            this.filterTimeout = null;
        }
    }

    updateFilterPlaceholder() {
        const filterInput = document.getElementById('phrase-filter');
        if (!filterInput || !this.currentLanguagePair) return;

        const [lang1, lang2] = this.currentLanguagePair.split(':');
        const sourceLang = this.currentDirection === 'normal' ? lang1 : lang2;
        const sourceLanguageDisplay = sourceLang.charAt(0).toUpperCase() + sourceLang.slice(1);
        
        filterInput.placeholder = `Filter ${sourceLanguageDisplay} words, phrases or sentences...`;
    }

    debouncedFilterVocabulary(filterText) {
        // Clear any existing timeout
        if (this.filterTimeout) {
            clearTimeout(this.filterTimeout);
        }

        // If filter is empty, apply immediately (no need to wait)
        if (!filterText.trim()) {
            this.hideFilterPending();
            this.filterVocabulary(filterText);
            return;
        }

        // Add visual feedback that filtering is pending
        this.showFilterPending();

        // Set new timeout
        this.filterTimeout = setTimeout(() => {
            this.filterVocabulary(filterText);
            this.hideFilterPending();
            this.filterTimeout = null;
        }, 500);
    }

    showFilterPending() {
        const filterInput = document.getElementById('phrase-filter');
        if (filterInput) {
            filterInput.style.borderColor = '#ffa500';
            filterInput.style.backgroundColor = '#fff8e1';
        }
    }

    hideFilterPending() {
        const filterInput = document.getElementById('phrase-filter');
        if (filterInput) {
            filterInput.style.borderColor = '#ddd';
            filterInput.style.backgroundColor = 'white';
        }
    }

    filterVocabulary(filterText) {
        if (!this.currentLanguagePair || !this.allVocabularyEntries) {
            return;
        }

        if (!filterText.trim()) {
            // Show all entries if filter is empty
            this.displayVocabulary(this.allVocabularyEntries);
            return;
        }

        // Normalize filter text for comparison
        const normalizedFilter = filterText.toLowerCase();
        const normalDirection = this.currentDirection === 'normal';

        let filteredEntries = [];
        let filterWords = [];

        try {
            // Set up the vocabulary storage for filtering
            this.setupVocabularyStorageForFiltering();

            // Use extractVocabularyEntriesFromPrompt
            const [lang1, lang2] = this.currentLanguagePair.split(':');
            const sourceLang = this.currentDirection === 'normal' ? lang1 : lang2;

            filterWords = this.vocabularyStorage.extractVocabularyEntriesFromPrompt(
                filterText, 
                sourceLang, 
                [lang1, lang2]
            );

            for (let entry of this.allVocabularyEntries) {
                const [primary, secondary] = entry;
                const sourceWord = normalDirection ? primary : secondary;
                
                // Check if this entry's source word matches the relevant word
                if (filterWords.some(relevantWord => relevantWord.toLowerCase() === sourceWord.toLowerCase())) {
                    filteredEntries.push(entry);
                }
            }
        } catch (error) {
            console.error('Error in vocabulary extraction filtering:', error);
            // Continue with simple filter results
            filterWords = normalizedFilter.split(/\s+/).filter(w => w.length > 0);
            filterWords.forEach(filterWord => {
                this.allVocabularyEntries.forEach(entry => {
                    const [primary, secondary] = entry;
                    const sourceWord = normalDirection ? primary : secondary;
                    
                    // Only check source words (no target word checking)
                    const sourceWords = sourceWord.toLowerCase().split(/\s+/);
                    
                    if (sourceWords.some(word => word.startsWith(filterWord))) {
                        filteredEntries.push(entry);
                    }
                });
            });
        }
        
        // Create filter result with missing words as rows
        this.displayFilteredVocabulary(filteredEntries, filterWords);
    }

    displayFilteredVocabulary(filteredEntries, filterWords) {
        const container = document.getElementById('vocabulary-container');
        const grid = document.getElementById('vocabulary-grid');
        const noVocabMsg = document.getElementById('no-vocabulary-message');
        const description = document.getElementById('vocabulary-description');

        // Hide other elements and show vocabulary
        description.style.display = 'none';
        noVocabMsg.style.display = 'none';
        container.style.display = 'block';

        // Clear existing content
        VocabularyRenderer.clearGrid(grid);

        // Group existing entries by source word and combine translations
        const groupedEntries = this.groupEntriesBySourceWord(filteredEntries);

        let foundCount = 0;

        for (let word of filterWords) {
            let translation = '';
            Object.keys(groupedEntries).forEach(sourceWord => {
                if (sourceWord.toLowerCase() === word.toLowerCase()) {
                    translation = groupedEntries[sourceWord].join(', ');
                }
            });

            if (translation) { foundCount++; }
            VocabularyRenderer.createVocabularyRow(word, translation, grid);
        }

        // Add button at the end of the grid to add new entries
        VocabularyRenderer.addGridAddButton(grid, () => {
            this.addNewEntry();
        });

        // Update vocabulary info with filter information
        const totalCount = filterWords.length;
        
        this.updateVocabularyInfoWithFilter(foundCount, totalCount);
    }

    updateVocabularyInfoWithFilter(foundCount, totalCount) {
        if (!this.currentLanguagePair) return;

        const [lang1, lang2] = this.currentLanguagePair.split(':');
        const sourceLang = this.currentDirection === 'normal' ? lang1 : lang2;
        const targetLang = this.currentDirection === 'normal' ? lang2 : lang1;
        
        const description = document.getElementById('vocabulary-description');
        description.style.display = 'block';
        
        const totalEntries = this.allVocabularyEntries ? this.groupEntriesBySourceWord(this.allVocabularyEntries) : {};
        const totalAvailableCount = Object.keys(totalEntries).length;
        
        if (foundCount < totalCount) {
            const missingCount = totalCount - foundCount;
            description.innerHTML = `<strong>${foundCount}</strong> matched, <strong>${missingCount}</strong> missing from <strong>${totalAvailableCount}</strong> entries`;
        } else {
            description.innerHTML = `<strong>${foundCount}</strong> matched of <strong>${totalAvailableCount}</strong> entries`;
        }
        
        const title = document.getElementById('vocabulary-title');
        title.innerHTML = `${sourceLang.charAt(0).toUpperCase() + sourceLang.slice(1)} → ${targetLang.charAt(0).toUpperCase() + targetLang.slice(1)} Vocabulary`;
    }

    displayVocabulary(entries) {
        const container = document.getElementById('vocabulary-container');
        const grid = document.getElementById('vocabulary-grid');
        const noVocabMsg = document.getElementById('no-vocabulary-message');
        const description = document.getElementById('vocabulary-description');

        if (!entries || entries.length === 0) {
            this.showNoVocabulary();
            return;
        }

        // Hide other elements and show vocabulary
        description.style.display = 'none';
        noVocabMsg.style.display = 'none';
        container.style.display = 'block';

        // Clear existing content
        VocabularyRenderer.clearGrid(grid);

        // Group entries by source word and combine translations
        const groupedEntries = this.groupEntriesBySourceWord(entries);

        // Sort entries alphabetically by the source language
        const sortedEntries = Object.keys(groupedEntries).sort((a, b) => 
            a.toLowerCase().localeCompare(b.toLowerCase())
        );

        // Create vocabulary rows
        sortedEntries.forEach(sourceWord => {
            const translations = groupedEntries[sourceWord];
            VocabularyRenderer.createVocabularyRow(sourceWord, translations.join(', '), grid);
        });

        // Add button at the end of the grid to add new entries
        VocabularyRenderer.addGridAddButton(grid, () => {
            this.addNewEntry();
        });

        // Update vocabulary info
        this.updateVocabularyInfo(sortedEntries.length);
    }

    groupEntriesBySourceWord(entries) {
        const grouped = {};
        
        entries.forEach(entry => {
            if (Array.isArray(entry) && entry.length === 2) {
                const [primary, secondary] = entry;
                
                // Here we show striked out entries too, so the user can edit them
                
                const sourceWord = this.currentDirection === 'normal' ? primary : secondary;
                const targetWord = this.currentDirection === 'normal' ? secondary : primary;
                
                if (!grouped[sourceWord]) {
                    grouped[sourceWord] = [];
                }
                
                // Add translation if not already present
                if (!grouped[sourceWord].includes(targetWord)) {
                    grouped[sourceWord].push(targetWord);
                }
            }
        });

        return grouped;
    }

    showNoVocabulary() {
        const container = document.getElementById('vocabulary-container');
        const noVocabMsg = document.getElementById('no-vocabulary-message');
        const description = document.getElementById('vocabulary-description');

        description.style.display = 'none';
        container.style.display = 'none';
        noVocabMsg.style.display = 'block';
    }

    showEmptyVocabularyGrid() {
        const container = document.getElementById('vocabulary-container');
        const grid = document.getElementById('vocabulary-grid');
        const noVocabMsg = document.getElementById('no-vocabulary-message');
        const description = document.getElementById('vocabulary-description');

        // Hide other elements and show vocabulary container
        description.style.display = 'none';
        noVocabMsg.style.display = 'none';
        container.style.display = 'block';

        // Clear existing content and add the add button
        VocabularyRenderer.clearGrid(grid, () => {
            this.addNewEntry();
        });
        
        // Update vocabulary info
        this.updateVocabularyInfo(0);
    }

    hideVocabulary() {
        const container = document.getElementById('vocabulary-container');
        const noVocabMsg = document.getElementById('no-vocabulary-message');
        const description = document.getElementById('vocabulary-description');
        const title = document.getElementById('vocabulary-title');

        container.style.display = 'none';
        noVocabMsg.style.display = 'none';
        description.style.display = 'block';
        description.textContent = 'Select a language pair from the sidebar to view and edit your vocabulary.';
        title.innerHTML = 'Central Vocabulary';
    }

    updateUI() {
        const switchBtn = document.getElementById('switch-direction-btn');
        const exportBtn = document.getElementById('export-vocab-btn');
        const addEntryBtn = document.getElementById('add-entry-btn');
        const saveChangesBtn = document.getElementById('save-changes-btn');
        const saveChangesMainBtn = document.getElementById('save-changes-main-btn');
        
        const hasSelection = !!this.currentLanguagePair;
        switchBtn.disabled = !hasSelection;
        exportBtn.disabled = !hasSelection;
        addEntryBtn.disabled = !hasSelection;
        saveChangesBtn.disabled = !hasSelection;
        saveChangesMainBtn.disabled = !hasSelection;

        if (hasSelection) {
            const [lang1, lang2] = this.currentLanguagePair.split(':');
            const sourceLang = this.currentDirection === 'normal' ? lang1 : lang2;
            const targetLang = this.currentDirection === 'normal' ? lang2 : lang1;
            
            switchBtn.textContent = `Switch to ${targetLang.charAt(0).toUpperCase() + targetLang.slice(1)} → ${sourceLang.charAt(0).toUpperCase() + sourceLang.slice(1)}`;
        } else {
            switchBtn.textContent = 'Switch Direction';
        }
    }

    updateVocabularyInfo(count) {
        if (!this.currentLanguagePair) return;

        const [lang1, lang2] = this.currentLanguagePair.split(':');
        const sourceLang = this.currentDirection === 'normal' ? lang1 : lang2;
        const targetLang = this.currentDirection === 'normal' ? lang2 : lang1;
        
        const description = document.getElementById('vocabulary-description');
        description.style.display = 'block';
        
        // Check if we have a filter applied
        const filterInput = document.getElementById('phrase-filter');
        const hasFilter = filterInput && filterInput.value.trim();
        const totalEntries = this.allVocabularyEntries ? this.groupEntriesBySourceWord(this.allVocabularyEntries) : {};
        const totalCount = Object.keys(totalEntries).length;
        
        if (hasFilter && count < totalCount) {
            description.innerHTML = `<strong>${count} of ${totalCount} entries</strong> (filtered)`;
        } else {
            description.innerHTML = `<strong>${count} entries</strong>`;
        }
        
        const title = document.getElementById('vocabulary-title');
        title.innerHTML = `${sourceLang.charAt(0).toUpperCase() + sourceLang.slice(1)} → ${targetLang.charAt(0).toUpperCase() + targetLang.slice(1)} Vocabulary`
    }

    switchDirection() {
        if (!this.currentLanguagePair) return;
        
        // Cancel any pending filter timeout since we're changing direction
        if (this.filterTimeout) {
            clearTimeout(this.filterTimeout);
            this.filterTimeout = null;
            this.hideFilterPending();
        }
        
        this.currentDirection = this.currentDirection === 'normal' ? 'reverse' : 'normal';
        this.loadLanguagePairVocabulary();
        this.updateUI();
    }

    setupVocabularyStorageForFiltering() {
        // Set up the vocabulary storage to work with current language pair and direction
        const [lang1, lang2] = this.currentLanguagePair.split(':');
        const sourceLang = this.currentDirection === 'normal' ? lang1 : lang2;

        // Configure the vocabulary storage for standalone use
        this.vocabularyStorage.configureStandalone(
            this.currentLanguagePair,
            sourceLang,
            this.allVocabularyEntries
        );
    }

    exportVocabulary() {
        if (!this.currentLanguagePair) return;

        const compressedData = this.vocabularyData[this.currentLanguagePair];
        if (!compressedData) {
            UIUtils.showError('No vocabulary data to export.');
            return;
        }

        const vocabularyEntries = StorageManager.decompressData(compressedData) || [];
        if (vocabularyEntries.length === 0) {
            UIUtils.showError('No vocabulary entries to export.');
            return;
        }

        // Group entries by source word and combine translations
        const groupedEntries = this.groupEntriesBySourceWord(vocabularyEntries);
        
        if (Object.keys(groupedEntries).length === 0) {
            UIUtils.showError('No valid vocabulary entries to export.');
            return;
        }

        const [lang1, lang2] = this.currentLanguagePair.split(':');
        const sourceLang = this.currentDirection === 'normal' ? lang1 : lang2;
        const targetLang = this.currentDirection === 'normal' ? lang2 : lang1;
        
        // Create header line with language pair and direction
        const headerLine = `Vocabulary: ${sourceLang} → ${targetLang}`;
        
        // Format entries for export
        const exportLines = [];
        Object.keys(groupedEntries).forEach(sourceWord => {
            const translations = groupedEntries[sourceWord];
            exportLines.push(`${sourceWord} → ${translations.join(', ')}`);
        });

        // Sort alphabetically
        exportLines.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

        // Combine header and entries
        const content = [headerLine, ...exportLines].join('\n');
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        
        const filename = `vocabulary_${sourceLang}_to_${targetLang}.txt`;
        
        // Create download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log(`Exported ${exportLines.length} vocabulary entries to ${filename}`);
    }

    handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            this.showImportModal(content);
        };
        reader.readAsText(file);
    }

    showImportModal(content = '') {
        const modal = document.getElementById('import-modal');
        const preview = document.getElementById('import-preview');
        
        preview.value = content;
        modal.style.display = 'flex';
        
        // Focus on textarea and place cursor at the end if there's content
        setTimeout(() => {
            preview.focus();
            if (content) {
                preview.setSelectionRange(preview.value.length, preview.value.length);
            }
        }, 100);
    }

    hideImportModal() {
        document.getElementById('import-modal').style.display = 'none';
        document.getElementById('import-file-input').value = '';
    }

    confirmImport() {
        const content = document.getElementById('import-preview').value;
        const lines = content.split('\n').filter(line => line.trim());
        
        if (lines.length === 0) {
            UIUtils.showError('No valid entries found in the file.');
            return;
        }

        // Check for vocabulary header line
        const firstLine = lines[0].trim();
        let importPairKey = null;
        let importDirection = 'normal';
        let vocabularyLines = lines;

        // Parse header if it exists
        if (firstLine.startsWith('Vocabulary:')) {
            const headerMatch = firstLine.match(/Vocabulary:\s*(\w+)\s*→\s*(\w+)/);
            if (!headerMatch) {
                UIUtils.showError('Invalid header format. Expected format: "Vocabulary: sourceLang → targetLang"\n\nPlease add this header as the first line of your file.');
                return;
            }

            const [, sourceLang, targetLang] = headerMatch;
            
            // Find the matching language pair key
            const availablePairs = Object.keys(this.vocabularyData);
            importPairKey = availablePairs.find(pairKey => {
                const [lang1, lang2] = pairKey.split(':');
                return (lang1 === sourceLang.toLowerCase() && lang2 === targetLang.toLowerCase()) ||
                       (lang1 === targetLang.toLowerCase() && lang2 === sourceLang.toLowerCase());
            });

            if (!importPairKey) {
                // Create new language pair key if it doesn't exist
                const sortedLangs = [sourceLang.toLowerCase(), targetLang.toLowerCase()].sort();
                importPairKey = sortedLangs.join(':');
            }

            // Determine import direction
            const [lang1, lang2] = importPairKey.split(':');
            importDirection = (lang1 === sourceLang.toLowerCase()) ? 'normal' : 'reverse';
            
            // Remove header line from vocabulary lines
            vocabularyLines = lines.slice(1);
            
            console.log(`Importing for pair: ${importPairKey}, direction: ${importDirection}`);
        } else {
            // No header found - show error
            UIUtils.showError('Missing vocabulary header!\n\nPlease add a header line as the first line of your file in this format:\nVocabulary: sourceLang → targetLang\n\nExample: Vocabulary: en → hu');
            return;
        }

        if (vocabularyLines.length === 0) {
            UIUtils.showError('No vocabulary entries found after the header line.');
            return;
        }

        let importedCount = 0;
        const compressedData = this.vocabularyData[importPairKey];
        const existingEntries = compressedData ? StorageManager.decompressData(compressedData) || [] : [];

        vocabularyLines.forEach(line => {
            // Try to split with common separators
            const separators = ['→', '->', '|', '\t', ':', '='];
            let source = '';
            let translationsText = '';

            for (const sep of separators) {
                if (line.includes(sep)) {
                    const parts = line.split(sep, 2);
                    source = parts[0].trim();
                    translationsText = parts[1] ? parts[1].trim() : '';
                    break;
                }
            }

            if (source && translationsText) {
                // Split multiple translations by comma
                const translations = translationsText
                    .replace("~~~", "---") // Allow ~~~ to delete words too
                    .split(',')
                    .map(t => t.trim())
                    .filter(t => t.length > 0);

                translations.forEach(translation => {
                    // Determine correct order based on import direction and language pair
                    const [lang1, lang2] = importPairKey.split(':');
                    let primaryWord, secondaryWord;
                
                    if (importDirection === 'normal') {
                        primaryWord = source;
                        secondaryWord = translation;
                    } else {
                        primaryWord = translation;
                        secondaryWord = source;
                    }

                    // Check if entry already exists
                    const existsAlready = existingEntries.some(entry => 
                        Array.isArray(entry) && entry.length === 2 && 
                        entry[0].toLowerCase() === primaryWord.toLowerCase() && 
                        entry[1].toLowerCase() === secondaryWord.toLowerCase()
                    );

                    if (!existsAlready) {
                        existingEntries.push([primaryWord, secondaryWord]);
                        importedCount++;
                    }
                });
            }
        });

        if (importedCount > 0) {
            // Save updated vocabulary to local data
            this.vocabularyData[importPairKey] = StorageManager.compressData(existingEntries);
            
            // Save to localStorage
            StorageManager.setCentralVocabulary(this.vocabularyData);
            
            // Refresh language pair dropdown
            this.populateLanguagePairs();
            
            // Set the dropdown value and update the internal state properly
            document.getElementById('language-pair-select').value = importPairKey;
            this.currentLanguagePair = importPairKey;
            this.currentDirection = importDirection;
            this.loadLanguagePairVocabulary();
            this.updateUI();
            
            const [lang1, lang2] = importPairKey.split(':');
            const sourceLang = importDirection === 'normal' ? lang1 : lang2;
            const targetLang = importDirection === 'normal' ? lang2 : lang1;

            UIUtils.showSuccess(`Successfully imported ${importedCount} new vocabulary entries for ${sourceLang} → ${targetLang}.`);
            
            // Close sidebar on mobile after successful import
            this.closeSidebarOnMobile();
        } else {
            UIUtils.showError('No new entries were imported. All entries may already exist.');
        }

        this.hideImportModal();
    }

    saveVocabularyChanges() {
        if (!this.currentLanguagePair) {
            UIUtils.showError('No language pair selected.');
            return;
        }

        const entries = VocabularyRenderer.getVocabularyInputs();
        
        if (entries.length === 0) {
            UIUtils.showError('No vocabulary entries to save.');
            return;
        }

        const [lang1, lang2] = this.currentLanguagePair.split(':');
        const sourceLang = this.currentDirection === 'normal' ? lang1 : lang2;
        const targetLang = this.currentDirection === 'normal' ? lang2 : lang1;
        
        // Check if we have a filter applied
        const filterInput = document.getElementById('phrase-filter');
        const hasActiveFilter = filterInput && filterInput.value.trim();
        
        let existingEntries = [];
        let savedCount = 0;

        if (hasActiveFilter) {
            // Get existing entries
            let compressedData = this.vocabularyData[this.currentLanguagePair];
            existingEntries = compressedData ? StorageManager.decompressData(compressedData) || [] : [];
            
            // When filtering is active, preserve entries that are not currently displayed
            const currentlyDisplayedSourceWords = new Set();
            
            // Collect all source words that are currently displayed in the UI
            entries.forEach(entry => {
                if (entry.source) {
                    currentlyDisplayedSourceWords.add(entry.source.toLowerCase());
                }
            });
            
            // Remove entries that are currently displayed (filtered out)
            existingEntries = existingEntries.filter(existingEntry => {
                const [primary, secondary] = existingEntry;
                const sourceWord = this.currentDirection === 'normal' ? primary : secondary;
                
                return !currentlyDisplayedSourceWords.has(sourceWord.toLowerCase());
            });
        }
        
        // Process entries from the UI
        entries.forEach(entry => {
            const { source, translation } = entry;
            
            if (source) {
                if (translation) {
                    // Split multiple translations by comma
                    const translations = translation
                        .replace("~~~", "---") // Allow ~~~ to delete words too
                        .split(',')
                        .map(t => t.trim())
                        .filter(t => t.length > 0);
                    
                    translations.forEach(trans => {
                        // Determine correct order based on current direction and language pair
                        let primaryWord, secondaryWord;
                        
                        if (this.currentDirection === 'normal') {
                            primaryWord = source;
                            secondaryWord = trans;
                        } else {
                            primaryWord = trans;
                            secondaryWord = source;
                        }
                        
                        existingEntries.push([primaryWord, secondaryWord]);
                        savedCount++;
                    });
                }
                // If source exists but no translation, we simply don't add it (deletion by empty translation)
            }
        });

        // Save updated vocabulary
        this.vocabularyData[this.currentLanguagePair] = StorageManager.compressData(existingEntries);
        StorageManager.setCentralVocabulary(this.vocabularyData);
        
        // Update our internal reference to all entries
        this.allVocabularyEntries = existingEntries;
        
        // Refresh display
        if (hasActiveFilter) {
            // Re-apply the current filter
            this.filterVocabulary(filterInput.value);
        } else {
            this.loadLanguagePairVocabulary();
        }
        
        if (savedCount > 0) {
            UIUtils.showSuccess(`Saved or updated ${savedCount} vocabulary entries for ${sourceLang} → ${targetLang}.`);
        } else {
            UIUtils.showSuccess('Displayed entries have been removed (empty translations delete entries).');
        }
    }

    addNewEntry() {
        if (!this.currentLanguagePair) return;

        const grid = document.getElementById('vocabulary-grid');
        if (!grid) return;

        const container = document.getElementById('vocabulary-container');
        
        // If container is hidden, show empty grid first
        if (container.style.display === 'none') {
            this.showEmptyVocabularyGrid();
            return;
        }

        // Create a new empty vocabulary row
        VocabularyRenderer.createVocabularyRow('', '', grid);
        
        // Re-add the grid add button
        VocabularyRenderer.addGridAddButton(grid, () => {
            this.addNewEntry();
        });
        
        // Focus on the new input
        VocabularyRenderer.focusLastSourceInput(grid);

        // Close sidebar on mobile
        this.closeSidebarOnMobile();
    }

    closeSidebarOnMobile() {
        if (window.innerWidth <= 768) {
            const sidebar = document.getElementById('sidebar');
            const toggle = document.getElementById('sidebar-toggle');
            const content = document.getElementById('sidebar-content');
            
            if (sidebar && !sidebar.classList.contains('collapsed')) {
                sidebar.classList.add('collapsed');
                if (content) content.style.display = 'none';
                if (toggle) toggle.style.transform = 'rotate(-90deg)';
            }
        }
    }
}