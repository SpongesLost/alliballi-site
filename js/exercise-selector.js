// Advanced Exercise Selector with search, categories, and filtering
class ExerciseSelector {
    constructor() {
        this.exercises = [];
        this.selectedExercise = null;
        this.isOpen = false;
        
        this.searchInput = document.getElementById('exercise-search');
        this.modalSearchInput = document.getElementById('exercise-search-modal');
        this.modalMuscleFilter = document.getElementById('muscle-filter-modal');
        this.modalEquipmentFilter = document.getElementById('equipment-filter-modal');
        this.dropdown = document.getElementById('exercise-dropdown');
        this.dropdownClose = document.getElementById('exercise-dropdown-close');
        this.categoriesContainer = document.getElementById('exercise-categories');
        this.selectedExerciseInput = document.getElementById('selected-exercise');
        
        this.init();
    }

    async init() {
        try {
            await this.loadExercises();
            this.setupEventListeners();
            this.renderExercises();
        } catch (error) {
            console.error('Failed to initialize ExerciseSelector:', error);
            // Fallback to empty exercises array
            this.exercises = [];
            this.setupEventListeners();
            this.renderExercises();
        }
    }

    async loadExercises() {
        try {
            const response = await fetch('./data/exercises.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.exercises = await response.json();
        } catch (error) {
            console.error('Error loading exercises:', error);
            throw error;
        }
    }
    setupEventListeners() {
        // Search input
        this.searchInput.addEventListener('input', () => this.handleSearch());
        this.searchInput.addEventListener('focus', () => this.showDropdown());
        this.modalSearchInput.addEventListener('input', () => this.handleModalSearch());
        
        // Filter dropdowns - modal versions only
        this.modalMuscleFilter.addEventListener('change', () => this.handleModalFilter());
        this.modalEquipmentFilter.addEventListener('change', () => this.handleModalFilter());
        // If muscle filter dropdown exists, update its options to reflect new categories
        this.updateMuscleFilterOptions();
        
        // Close button - only way to close the modal
        this.dropdownClose.addEventListener('click', () => this.hideDropdown());
    }

    updateMuscleFilterOptions() {
        // Only update if filter exists and is a select element
        if (!this.modalMuscleFilter || this.modalMuscleFilter.tagName !== 'SELECT') return;
        // Save current value
        const currentValue = this.modalMuscleFilter.value;
        // New muscle categories
        const muscleOptions = [
            { value: '', label: 'All Muscles' },
            { value: 'chest', label: 'Chest' },
            { value: 'back', label: 'Back' },
            { value: 'legs', label: 'Legs' },
            { value: 'shoulders', label: 'Shoulders' },
            { value: 'biceps', label: 'Biceps' },
            { value: 'triceps', label: 'Triceps' },
            { value: 'forearms', label: 'Forearms' },
            { value: 'core', label: 'Core' },
            { value: 'cardio', label: 'Cardio' },
            { value: 'full-body', label: 'Full Body' }
        ];
        // Remove all options
        while (this.modalMuscleFilter.options.length > 0) {
            this.modalMuscleFilter.remove(0);
        }
        // Add new options
        muscleOptions.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.label;
            this.modalMuscleFilter.appendChild(option);
        });
        // Restore previous value if possible
        this.modalMuscleFilter.value = currentValue;
    }

    showDropdown() {
        // Reset modal filters when opening
        this.modalMuscleFilter.value = '';
        this.modalEquipmentFilter.value = '';
        this.modalSearchInput.value = this.searchInput.value;
        
        // Ensure exercises are rendered when opening the modal
        this.renderExercises();
        
        this.dropdown.classList.add('show');
        this.isOpen = true;
        
        // Focus modal search input after opening
        setTimeout(() => {
            this.modalSearchInput.focus();
        }, 100);
    }

    hideDropdown() {
        this.dropdown.classList.remove('show');
        this.isOpen = false;
    }

    handleSearch() {
        this.renderExercises();
        if (this.searchInput.value.trim()) {
            this.showDropdown();
        }
    }

    handleModalSearch() {
        // Sync the main search with the modal search
        this.searchInput.value = this.modalSearchInput.value;
        this.renderExercises();
    }

    handleModalFilter() {
        // Render exercises based on modal filters
        this.renderExercises();
    }

    getFilteredExercises() {
        const searchTerm = this.searchInput.value.toLowerCase().trim();
        const muscleFilter = this.modalMuscleFilter.value;
        const equipmentFilter = this.modalEquipmentFilter.value;

        // Normalize search term for better matching
        const normalizedSearchTerm = this.normalizeSearchTerm(searchTerm);

        const results = [];
        this.exercises.forEach(exercise => {
            // Main exercise search
            const normalizedExerciseName = this.normalizeSearchTerm(exercise.name.toLowerCase());
            const normalizedMuscle = this.normalizeSearchTerm(exercise.muscle.toLowerCase());
            const normalizedEquipment = this.normalizeSearchTerm(exercise.equipment.toLowerCase());
            let allExerciseWords = [normalizedExerciseName, normalizedMuscle, normalizedEquipment];
            if (exercise.aliases) {
                exercise.aliases.forEach(alias => {
                    allExerciseWords.push(this.normalizeSearchTerm(alias.toLowerCase()));
                });
            }
            if (exercise.modifiers) {
                Object.values(exercise.modifiers).forEach(modifierArray => {
                    modifierArray.forEach(modifier => {
                        allExerciseWords.push(this.normalizeSearchTerm(modifier.toLowerCase()));
                    });
                });
            }

            // Search for main exercise
            let matchesSearch = !searchTerm;
            let searchScore = 0;
            if (searchTerm) {
                let searchWords = searchTerm.split(/\s+/);
                if (searchWords.length > 1) {
                    searchWords = searchWords.filter(word => word.length > 1);
                }
                matchesSearch = searchWords.length > 0 && searchWords.every(word =>
                    allExerciseWords.some(exWord => exWord.includes(this.normalizeSearchTerm(word)))
                );
                if (matchesSearch) {
                    searchScore = 100 + searchWords.length * 5;
                    if (normalizedExerciseName === normalizedSearchTerm) {
                        searchScore += 1000;
                    } else if (normalizedExerciseName.startsWith(normalizedSearchTerm)) {
                        searchScore += 500;
                    }
                }
            }
            const matchesMuscle = !muscleFilter || exercise.muscle === muscleFilter;
            const matchesEquipment = !equipmentFilter || exercise.equipment === equipmentFilter;
            let variantMatched = false;
            if (exercise.variants && Array.isArray(exercise.variants)) {
                exercise.variants.forEach(variant => {
                    const normalizedVariantName = this.normalizeSearchTerm(variant.name.toLowerCase());
                    let variantWords = [normalizedVariantName];
                    // Add variant aliases to search words
                    if (variant.aliases) {
                        variant.aliases.forEach(alias => {
                            variantWords.push(this.normalizeSearchTerm(alias.toLowerCase()));
                        });
                    }
                    if (variant.modifiers) {
                        Object.values(variant.modifiers).forEach(modifierArray => {
                            modifierArray.forEach(modifier => {
                                variantWords.push(this.normalizeSearchTerm(modifier.toLowerCase()));
                            });
                        });
                    }
                    let matchesVariantSearch = !searchTerm;
                    let variantSearchScore = 0;
                    if (searchTerm) {
                        let searchWords = searchTerm.split(/\s+/);
                        if (searchWords.length > 1) {
                            searchWords = searchWords.filter(word => word.length > 1);
                        }
                        matchesVariantSearch = searchWords.length > 0 && searchWords.every(word =>
                            variantWords.some(exWord => exWord.includes(this.normalizeSearchTerm(word)))
                        );
                        if (matchesVariantSearch) {
                            variantSearchScore = 100 + searchWords.length * 5;
                            if (normalizedVariantName === normalizedSearchTerm) {
                                variantSearchScore += 1000;
                            } else if (normalizedVariantName.startsWith(normalizedSearchTerm)) {
                                variantSearchScore += 500;
                            }
                        }
                    }
                    const matchesVariantMuscle = !muscleFilter || exercise.muscle === muscleFilter;
                    const matchesVariantEquipment = !equipmentFilter || variant.equipment === equipmentFilter;
                    if (matchesVariantSearch && matchesVariantMuscle && matchesVariantEquipment) {
                        variantMatched = true;
                        // Attach parent muscle for grouping
                        const variantResult = {
                            ...variant,
                            muscle: exercise.muscle,
                            parentName: exercise.name,
                            _searchScore: variantSearchScore
                        };
                        results.push(variantResult);
                    }
                });
            }

            // Only add main exercise if no variant matched, but only hide it if searchTerm is not empty
            if ((!variantMatched || !searchTerm) && matchesSearch && matchesMuscle && matchesEquipment) {
                exercise._searchScore = searchScore;
                results.push(exercise);
            }
        });

        // Sort by search score (highest first) and then by name
        if (searchTerm) {
            results.sort((a, b) => {
                const scoreDiff = (b._searchScore || 0) - (a._searchScore || 0);
                if (scoreDiff !== 0) return scoreDiff;
                return a.name.localeCompare(b.name);
            });
        }

        // Clean up temporary search scores
        results.forEach(exercise => delete exercise._searchScore);

        return results;

        // Sort by search score (highest first) and then by name
        if (searchTerm) {
            results.sort((a, b) => {
                const scoreDiff = (b._searchScore || 0) - (a._searchScore || 0);
                if (scoreDiff !== 0) return scoreDiff;
                return a.name.localeCompare(b.name);
            });
        }

        // Clean up temporary search scores
        results.forEach(exercise => delete exercise._searchScore);

        return results;
    }

    renderExercises() {
        const filteredExercises = this.getFilteredExercises();
        const searchTerm = (this.searchInput && this.searchInput.value) ? this.searchInput.value.trim() : '';

        // If searching, show results strictly by score order, not grouped
        if (searchTerm) {
            let html = '';
            if (filteredExercises.length === 0) {
                this.categoriesContainer.innerHTML = `
                    <div class="no-exercises" style="margin-bottom: 8px;">No exercises found</div>
                    ${searchTerm ? `<button id="add-custom-exercise-btn" class="btn btn-small" style="margin: 0 auto; display:block;padding:7px 14px;font-size:13px;max-width:250px;align">Add "${searchTerm}" as new exercise</button>` : ''}
                `;
                if (searchTerm) {
                    setTimeout(() => {
                        const btn = document.getElementById('add-custom-exercise-btn');
                        if (btn) {
                            btn.addEventListener('click', () => {
                                this.addCustomExerciseFromSearch(searchTerm);
                            });
                        }
                    }, 0);
                }
                return;
            }
            html += `<div class="exercise-category">
                <div class="category-header">Results</div>
                ${filteredExercises.map(exercise => this.renderExerciseItem(exercise)).join('')}
            </div>`;
            this.categoriesContainer.innerHTML = html;
            this.attachExerciseClickListeners();
            return;
        }

        // Not searching: group by muscle and show subexercises section if any
        const mainExercises = filteredExercises.filter(ex => !ex.parentName);
        const variantResults = filteredExercises.filter(ex => ex.parentName);
        let html = '';
        if (mainExercises.length > 0) {
            const groupedExercises = this.groupExercisesByMuscle(mainExercises);
            Object.entries(groupedExercises).forEach(([muscle, exercises]) => {
                html += `
                    <div class="exercise-category">
                        <div class="category-header">${this.capitalizeFirst(muscle)}</div>
                        ${exercises.map(exercise => this.renderExerciseItem(exercise)).join('')}
                    </div>
                `;
            });
        }
        if (variantResults.length > 0) {
            html += `
                <div class="exercise-category">
                    <div class="category-header">Subexercises</div>
                    ${variantResults.map(exercise => this.renderExerciseItem(exercise)).join('')}
                </div>
            `;
        }
        this.categoriesContainer.innerHTML = html;
        this.attachExerciseClickListeners();
    }

    addCustomExerciseFromSearch(name) {
        // Capitalize the first letter of each word
        const capitalizedName = name.replace(/\b\w/g, c => c.toUpperCase());
        const customExercise = {
            name: capitalizedName,
            muscle: '',
            equipment: '',
            custom: true
        };
        this.selectExercise(customExercise);
    }

    groupExercisesByMuscle(exercises) {
        return exercises.reduce((groups, exercise) => {
            const muscle = exercise.muscle;
            if (!groups[muscle]) {
                groups[muscle] = [];
            }
            groups[muscle].push(exercise);
            return groups;
        }, {});
    }

    renderExerciseItem(exercise) {
        const hasModifiers = exercise.modifiers && Object.keys(exercise.modifiers).length > 0;
        const hasVariants = exercise.variants && exercise.variants.length > 1;
        // Properly escape the JSON for HTML attribute
        const exerciseDataJson = JSON.stringify(exercise).replace(/'/g, '&apos;');
        
        // Always use the clean exercise name, not the label
        const displayName = exercise.name;
        
        return `
            <div class="exercise-item ${hasModifiers ? 'has-modifiers' : ''} ${hasVariants ? 'has-variants' : ''}" data-exercise='${exerciseDataJson}'>
                <div class="exercise-name">
                    ${displayName}
                    ${hasVariants ? '<span class="variant-indicator">▼</span>' : ''}
                </div>
                ${hasModifiers ? this.renderModifiersSelection(exercise.modifiers) : ''}
                ${hasVariants ? this.renderVariantsDropdown(exercise.variants) : ''}
            </div>
        `;
    }

    renderModifiersSelection(modifiers) {
        // Try to preselect modifier options based on the search term
        const searchTerm = (this.searchInput && this.searchInput.value) ? this.searchInput.value.toLowerCase() : '';
        return `
            <div class="modifiers-selection">
                ${Object.entries(modifiers).map(([type, options]) => {
                    // Try to find a matching option in the search term
                    let selected = '';
                    for (const option of options) {
                        if (searchTerm && searchTerm.includes(option.toLowerCase())) {
                            selected = option;
                            break;
                        }
                    }
                    return `
                        <div class="modifier-group" style="display: flex; align-items: center; position: relative; max-width: 100%; flex-wrap: nowrap;">
                            <select class="modifier-select" data-modifier-type="${type}" data-placeholder="${type}" style="width: 110px; max-width: 100%; flex-shrink:0;">
                                <option value="" hidden>${type}</option>
                                ${options.map(option => `<option value="${option}"${selected === option ? ' selected' : ''}>${option}</option>`).join('')}
                            </select>
                            <button class="modifier-reset-btn" title="Reset selection" style="background:none; border:none; cursor:pointer; padding:0; font-size:18px; line-height:1; color:#ccc; position:absolute; right:-20px; top:50%; transform:translateY(-50%); z-index:2; flex-shrink:0; width:22px; height:22px; opacity:0.3; transition: opacity 0.2s;">
                                &#8635;
                            </button>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    renderVariantsDropdown(variants) {
        return `
            <div class="variants-dropdown">
                ${variants.map(variant => {
                    const variantDataJson = JSON.stringify(variant).replace(/'/g, '&apos;');
                    let modifiersHtml = '';
                    if (variant.modifiers && Object.keys(variant.modifiers).length > 0) {
                        modifiersHtml = this.renderModifiersSelection(variant.modifiers);
                    }
                    return `
                        <div class="variant-item" data-variant='${variantDataJson}'>
                            ${variant.name}
                            ${modifiersHtml}
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    attachExerciseClickListeners() {
        const exerciseItems = this.categoriesContainer.querySelectorAll('.exercise-item');
        exerciseItems.forEach(item => {
            // Decode the escaped JSON from HTML attribute
            const exerciseDataJson = item.dataset.exercise.replace(/&apos;/g, "'");
            const exerciseData = JSON.parse(exerciseDataJson);
            const hasVariants = exerciseData.variants && exerciseData.variants.length > 1;
            
            if (hasVariants) {
                // Handle main exercise click to toggle variants (anywhere on the item)
                item.addEventListener('click', (e) => {
                    if (!e.target.closest('.variant-item') && !e.target.closest('.modifier-select')) {
                        e.preventDefault();
                        e.stopPropagation();
                        e.stopImmediatePropagation();
                        this.toggleVariants(item);
                    }
                });

                // Handle variant clicks
                const variantItems = item.querySelectorAll('.variant-item');
                variantItems.forEach(variantItem => {
                    variantItem.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.stopImmediatePropagation();
                        // Decode the escaped JSON from HTML attribute
                        const variantDataJson = variantItem.dataset.variant.replace(/&apos;/g, "'");
                        const variantData = JSON.parse(variantDataJson);

                        // If variant has its own modifiers, collect those, else use parent exercise modifiers
                        let finalExerciseName = variantData.name;
                        let selectedModifiers = {};
                        let modifierSelects;
                        if (variantData.modifiers) {
                            modifierSelects = variantItem.querySelectorAll('.modifier-select');
                        } else if (exerciseData.modifiers) {
                            modifierSelects = item.querySelectorAll('.modifier-select');
                        }
                        const modifierParts = [];
                        if (modifierSelects) {
                            modifierSelects.forEach(select => {
                                const modifierType = select.dataset.modifierType;
                                const selectedValue = select.value;
                                if (selectedValue) {
                                    selectedModifiers[modifierType] = selectedValue;
                                    modifierParts.push(selectedValue);
                                }
                            });
                            if (modifierParts.length > 0) {
                                finalExerciseName = `${modifierParts.join(' ')} ${variantData.name}`;
                            }
                        }

                        this.selectedExercise = {
                            ...variantData,
                            muscle: exerciseData.muscle,
                            equipment: variantData.equipment,
                            name: finalExerciseName,
                            baseName: variantData.name,
                            selectedModifiers: selectedModifiers
                        };
                        this.selectedExerciseInput.value = finalExerciseName;
                        this.searchInput.value = finalExerciseName;
                        this.hideDropdown();
                        this.modalMuscleFilter.value = '';
                        this.modalEquipmentFilter.value = '';
                    });
                });
            } else {
                // Handle single exercise click
                item.addEventListener('click', (e) => {
                    if (!e.target.closest('.modifier-select')) {
                        e.preventDefault();
                        e.stopPropagation();
                        e.stopImmediatePropagation();
                        this.selectExercise(exerciseData);
                    }
                });
            }

            // Handle modifier dropdown clicks (prevent event bubbling)
            const modifierGroups = item.querySelectorAll('.modifier-group');
            modifierGroups.forEach(group => {
                const select = group.querySelector('.modifier-select');
                const resetBtn = group.querySelector('.modifier-reset-btn');
                // Show faded or full opacity based on selection
                const updateResetBtn = () => {
                    if (select.value) {
                        resetBtn.style.opacity = '1';
                        resetBtn.style.pointerEvents = '';
                    } else {
                        resetBtn.style.opacity = '0.3';
                        resetBtn.style.pointerEvents = 'none';
                    }
                };
                select.addEventListener('click', (e) => {
                    e.stopPropagation();
                });
                select.addEventListener('change', (e) => {
                    e.stopPropagation();
                    updateResetBtn();
                });
                select.addEventListener('mousedown', (e) => {
                    e.stopPropagation();
                });
                // Initial state
                updateResetBtn();
                // Reset button click
                resetBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    select.value = '';
                    updateResetBtn();
                    // Optionally, trigger change event to update selection logic
                    select.dispatchEvent(new Event('change', { bubbles: true }));
                });
            });
        });
    }

    toggleVariants(exerciseItem) {
        const variantsDropdown = exerciseItem.querySelector('.variants-dropdown');
        const isOpen = exerciseItem.classList.contains('variants-open');
        
        // Close all other open variants and reset their z-indexes
        this.categoriesContainer.querySelectorAll('.exercise-item.variants-open').forEach(item => {
            if (item !== exerciseItem) {
                item.classList.remove('variants-open');
                this.resetVariantZIndex(item);
            }
        });
        
        // Toggle current variants
        if (isOpen) {
            exerciseItem.classList.remove('variants-open');
            this.resetVariantZIndex(exerciseItem);
        } else {
            exerciseItem.classList.add('variants-open');
            
            // Dynamically adjust z-index to ensure proper layering
            this.adjustVariantDropdownZIndex(exerciseItem);
        }
    }

    resetVariantZIndex(exerciseItem) {
        const variantsDropdown = exerciseItem.querySelector('.variants-dropdown');
        if (variantsDropdown) {
            variantsDropdown.style.zIndex = '';
        }
        exerciseItem.style.zIndex = '';
        
        // Reset parent category header z-index as well
        const parentCategory = exerciseItem.closest('.exercise-category');
        const parentCategoryHeader = parentCategory ? parentCategory.querySelector('.category-header') : null;
        if (parentCategoryHeader) {
            parentCategoryHeader.style.zIndex = '';
        }
    }

    adjustVariantDropdownZIndex(exerciseItem) {
        const variantsDropdown = exerciseItem.querySelector('.variants-dropdown');
        if (!variantsDropdown) return;

        // Find the parent category of this exercise
        const parentCategory = exerciseItem.closest('.exercise-category');
        const parentCategoryHeader = parentCategory ? parentCategory.querySelector('.category-header') : null;
        
        // Get all category headers that come after this exercise's parent category
        const allCategories = this.categoriesContainer.querySelectorAll('.exercise-category');
        const parentIndex = Array.from(allCategories).indexOf(parentCategory);
        
        // Set z-index higher than subsequent category headers, but not the parent
        const DROPDOWN_Z = 150; // Above subsequent category headers (z-index: 100) but below parent
        
        // Apply z-indexes to ensure dropdown appears above subsequent headers only
        variantsDropdown.style.zIndex = DROPDOWN_Z;
        exerciseItem.style.zIndex = DROPDOWN_Z - 1;
        
        // Ensure parent category header stays above the dropdown
        if (parentCategoryHeader) {
            parentCategoryHeader.style.zIndex = DROPDOWN_Z + 10;
        }
    }

    selectExercise(exercise) {
        // If exercise has modifiers, collect selected modifier values
        let finalExerciseName = exercise.name;
        let selectedModifiers = {};
        
        if (exercise.modifiers) {
            // Find the exercise item in the DOM to get modifier selections
            const exerciseItems = this.categoriesContainer.querySelectorAll('.exercise-item');
            const exerciseItem = Array.from(exerciseItems).find(item => {
                const itemData = JSON.parse(item.dataset.exercise.replace(/&apos;/g, "'"));
                return itemData.name === exercise.name;
            });
            
            if (exerciseItem) {
                const modifierSelects = exerciseItem.querySelectorAll('.modifier-select');
                const modifierParts = [];
                
                modifierSelects.forEach(select => {
                    const modifierType = select.dataset.modifierType;
                    const selectedValue = select.value;
                    
                    if (selectedValue) {
                        selectedModifiers[modifierType] = selectedValue;
                        modifierParts.push(selectedValue);
                    }
                });
                
                // Build final exercise name with modifiers
                if (modifierParts.length > 0) {
                    finalExerciseName = `${modifierParts.join(' ')} ${exercise.name}`;
                }
            }
        }
        
        this.selectedExercise = {
            ...exercise,
            name: finalExerciseName,
            baseName: exercise.name,
            selectedModifiers: selectedModifiers
        };
        
        this.selectedExerciseInput.value = finalExerciseName;
        this.searchInput.value = finalExerciseName;
        this.hideDropdown();
        
        // Clear modal filters after selection
        this.modalMuscleFilter.value = '';
        this.modalEquipmentFilter.value = '';
    }

    getSelectedExercise() {
        return this.selectedExercise;
    }

    clearSelection() {
        this.selectedExercise = null;
        this.selectedExerciseInput.value = '';
        this.searchInput.value = '';
        this.modalMuscleFilter.value = '';
        this.modalEquipmentFilter.value = '';
        this.hideDropdown();
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    normalizeSearchTerm(term) {
        // Remove hyphens, underscores, and extra spaces for better matching
        // "Push-ups" becomes "pushups", "push ups" becomes "pushups"
        return term.replace(/[-_\s]+/g, '').toLowerCase();
    }
}

// Initialize the exercise selector
let exerciseSelector;

// Global function to get selected exercise without needing direct access to exerciseSelector
window.getSelectedExercise = function() {
    if (exerciseSelector && typeof exerciseSelector.getSelectedExercise === 'function') {
        return exerciseSelector.getSelectedExercise();
    }
    return null;
};

// Global function to clear exercise selection
window.clearExerciseSelection = function() {
    if (exerciseSelector && typeof exerciseSelector.clearSelection === 'function') {
        exerciseSelector.clearSelection();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    try {
        exerciseSelector = new ExerciseSelector();
    } catch (error) {
        console.error('Error initializing ExerciseSelector:', error);
        exerciseSelector = null;
    }
});

// Update style block for mobile fix
if (!document.getElementById('modifier-reset-style')) {
    const style = document.createElement('style');
    style.id = 'modifier-reset-style';
    style.innerHTML = `
        .modifier-group { position: relative; }
        .modifier-reset-btn { 
            color: #ccc !important; 
            position: absolute; 
            right: -14px; 
            top: 50%; 
            transform: translateY(-50%); 
            z-index: 2; 
            width: 22px; 
            height: 22px; 
            opacity: 0.3;
            transition: opacity 0.2s;
        }
        .modifier-group .modifier-select { width: 110px; max-width: 100%; flex-shrink:0; }
        .variants-dropdown {
            background: #222 !important;
            box-shadow: 0 2px 12px rgba(0,0,0,0.18);
        }
        .variant-item {
            background: transparent;
            color: #f5f5f5;
        }
        @media (max-width: 600px) {
            .modifier-group { max-width: 100vw; overflow: visible !important; flex-wrap: nowrap !important; }
            .modifier-reset-btn { right: -10px; left: auto; }
        }
    `;
    document.head.appendChild(style);
}

