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
        
        // Close button - only way to close the modal
        this.dropdownClose.addEventListener('click', () => this.hideDropdown());
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

        const results = this.exercises.filter(exercise => {
            // Normalize exercise data for better matching
            const normalizedExerciseName = this.normalizeSearchTerm(exercise.name.toLowerCase());
            const normalizedMuscle = this.normalizeSearchTerm(exercise.muscle.toLowerCase());
            const normalizedEquipment = this.normalizeSearchTerm(exercise.equipment.toLowerCase());
            let matchesSearch = !searchTerm;
            let searchScore = 0;
            if (searchTerm) {
                // Stricter AND logic: all search words must match somewhere
                let searchWords = searchTerm.split(/\s+/);
                if (searchWords.length > 1) {
                    searchWords = searchWords.filter(word => word.length > 1);
                }
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
                matchesSearch = searchWords.length > 0 && searchWords.every(word =>
                    allExerciseWords.some(exWord => exWord.includes(this.normalizeSearchTerm(word)))
                );
                // Boost for exact and prefix matches
                if (matchesSearch) {
                    searchScore = 100 + searchWords.length * 5;
                    // Highest boost for exact match
                    if (normalizedExerciseName === normalizedSearchTerm) {
                        searchScore += 1000;
                    } else if (normalizedExerciseName.startsWith(normalizedSearchTerm)) {
                        searchScore += 500;
                    }
                }
            }
            const matchesMuscle = !muscleFilter || exercise.muscle === muscleFilter;
            const matchesEquipment = !equipmentFilter || exercise.equipment === equipmentFilter;
            if (matchesSearch && matchesMuscle && matchesEquipment) {
                exercise._searchScore = searchScore;
                return true;
            }
            return false;
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
    }

    renderExercises() {
        const filteredExercises = this.getFilteredExercises();
        const searchTerm = (this.searchInput && this.searchInput.value) ? this.searchInput.value.trim() : '';

        // Add custom add button if no results and search term is not empty
        if (filteredExercises.length === 0) {
            this.categoriesContainer.innerHTML = `
                <div class="no-exercises" style="margin-bottom: 8px;">No exercises found</div>
                ${searchTerm ? `<button id="add-custom-exercise-btn" class="btn btn-small" style="margin: 0 auto; display:block;padding:7px 14px;font-size:13px;max-width:250px;align">Add "${searchTerm}" as new exercise</button>` : ''}
            `;
            // Attach handler for add button
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

        // Group by muscle group
        const groupedExercises = this.groupExercisesByMuscle(filteredExercises);
        
        let html = '';
        Object.entries(groupedExercises).forEach(([muscle, exercises]) => {
            html += `
                <div class="exercise-category">
                    <div class="category-header">${this.capitalizeFirst(muscle)}</div>
                    ${exercises.map(exercise => this.renderExerciseItem(exercise)).join('')}
                </div>
            `;
        });

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
                    // Properly escape the JSON for HTML attribute
                    const variantDataJson = JSON.stringify(variant).replace(/'/g, '&apos;');
                    return `
                        <div class="variant-item" data-variant='${variantDataJson}'>
                            ${variant.name}
                            <span class="equipment-tag">${variant.equipment}</span>
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
                    // Don't toggle if clicking on a variant item or modifier dropdown
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
                        this.selectExercise({
                            name: variantData.name,
                            muscle: exerciseData.muscle,
                            equipment: variantData.equipment
                        });
                    });
                });
            } else {
                // Handle single exercise click
                item.addEventListener('click', (e) => {
                    // Don't select if clicking on a modifier dropdown
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
        @media (max-width: 600px) {
            .modifier-group { max-width: 100vw; overflow: visible !important; flex-wrap: nowrap !important; }
            .modifier-reset-btn { right: -10px; left: auto; }
        }
    `;
    document.head.appendChild(style);
}

