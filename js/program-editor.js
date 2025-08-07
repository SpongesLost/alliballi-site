// Custom alert utility
class CustomAlert {
    static show(message, title = '', icon = '⚠️', type = '') {
        // Remove existing alert if any
        const existingAlert = document.querySelector('.custom-alert');
        if (existingAlert) {
            existingAlert.remove();
        }

        // Create alert element
        const alertDiv = document.createElement('div');
        alertDiv.className = `custom-alert ${type}`;
        alertDiv.innerHTML = `
            <div class="custom-alert-content">
                <span class="custom-alert-icon">${icon}</span>
                <div class="custom-alert-text">
                    ${title ? `<div class="custom-alert-title">${title}</div>` : ''}
                    <div class="custom-alert-message">${message}</div>
                </div>
                <button class="custom-alert-close" onclick="this.closest('.custom-alert').remove()">×</button>
            </div>
        `;

        // Add to DOM
        document.body.appendChild(alertDiv);

        // Show with animation
        setTimeout(() => {
            alertDiv.classList.add('show');
        }, 10);

        // Auto-hide after 4 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.classList.remove('show');
                setTimeout(() => {
                    if (alertDiv.parentNode) {
                        alertDiv.remove();
                    }
                }, 300);
            }
        }, 4000);

        // Handle escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                alertDiv.remove();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);

        return alertDiv;
    }

    static success(message, title = 'Success') {
        return this.show(message, title, '✅', 'success');
    }

    static error(message, title = 'Error') {
        return this.show(message, title, '❌', 'error');
    }

    static warning(message, title = 'Warning') {
        return this.show(message, title, '⚠️', 'warning');
    }

    static info(message, title = 'Info') {
        return this.show(message, title, 'ℹ️', 'info');
    }

    static confirm(message, title = 'Confirm Action', onConfirm = null, onCancel = null) {
        // Remove existing alert if any
        const existingAlert = document.querySelector('.custom-alert');
        if (existingAlert) {
            existingAlert.remove();
        }

        // Create alert element
        const alertDiv = document.createElement('div');
        alertDiv.className = 'custom-alert confirm';
        alertDiv.innerHTML = `
            <div class="custom-alert-content">
                <span class="custom-alert-icon">❓</span>
                <div class="custom-alert-text">
                    ${title ? `<div class="custom-alert-title">${title}</div>` : ''}
                    <div class="custom-alert-message">${message}</div>
                </div>
                <div class="custom-alert-buttons">
                    <button class="custom-alert-btn cancel-btn" title="Cancel">✕</button>
                    <button class="custom-alert-btn confirm-btn" title="Confirm">✓</button>
                </div>
            </div>
        `;

        // Add to DOM
        document.body.appendChild(alertDiv);

        // Show with animation
        setTimeout(() => {
            alertDiv.classList.add('show');
        }, 10);

        // Handle button clicks
        const cancelBtn = alertDiv.querySelector('.cancel-btn');
        const confirmBtn = alertDiv.querySelector('.confirm-btn');

        const closeAlert = () => {
            alertDiv.classList.remove('show');
            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.remove();
                }
            }, 300);
            document.removeEventListener('keydown', handleKeydown);
        };

        cancelBtn.onclick = () => {
            closeAlert();
            if (onCancel) onCancel();
        };

        confirmBtn.onclick = () => {
            closeAlert();
            if (onConfirm) onConfirm();
        };

        // Handle escape key
        const handleKeydown = (e) => {
            if (e.key === 'Escape') {
                closeAlert();
                if (onCancel) onCancel();
            } else if (e.key === 'Enter') {
                closeAlert();
                if (onConfirm) onConfirm();
            }
        };
        document.addEventListener('keydown', handleKeydown);

        // Focus on cancel button by default
        cancelBtn.focus();

        return alertDiv;
    }
}

// Program editor for creating and managing workout programs
class ProgramEditor {
    constructor(programManager) {
        this.programManager = programManager;
        this.dragDropHandler = null;
        this.currentEditingExercise = null;
        this.initializeDragDrop();
        this.setupRangeTypeCheckbox();
    }

    setupRangeTypeCheckbox() {
        const checkbox = document.getElementById('range-type-checkbox');
        const repFields = document.getElementById('rep-range-fields');
        const secFields = document.getElementById('second-range-fields');
        if (!checkbox || !repFields || !secFields) return;
        checkbox.addEventListener('change', function() {
            if (checkbox.checked) {
                repFields.style.display = 'none';
                secFields.style.display = '';
            } else {
                repFields.style.display = '';
                secFields.style.display = 'none';
            }
        });
    }

    initializeDragDrop() {
        // Initialize drag and drop handler
        this.dragDropHandler = new DragDropHandler(
            '#exercises-container',
            '.exercise-item',
            this.onExerciseReorder.bind(this)
        );
        this.dragDropHandler.init();
    }

    // Helper method to create exercise HTML - eliminates duplication
    createExerciseHTML(exerciseName, sets, rangeObj) {
        let rangeText = '';
        if (rangeObj) {
            if (rangeObj.type === 'seconds') {
                rangeText = `${rangeObj.min}-${rangeObj.max} sec`;
            } else {
                rangeText = `${rangeObj.min}-${rangeObj.max} reps`;
            }
        }
        const exerciseInfo = rangeText ? `${sets} sets • ${rangeText}` : `${sets} sets`;
        
        return `
            <div class="exercise-details">
                <div class="exercise-header">
                    <div class="exercise-name">${exerciseName}</div>
                </div>
                <div class="exercise-sets">${exerciseInfo}</div>
            </div>
            <div class="exercise-actions">
                <button class="btn btn-small btn-secondary exercise-menu-btn" onclick="window.programEditor.editExercise(this)" title="Edit exercise">⋮</button>
            </div>
        `;
    }

    // Helper method to setup exercise div with common properties
    setupExerciseDiv(exerciseDiv, exerciseName, sets, rangeObj) {
        exerciseDiv.dataset.exercise = exerciseName;
        exerciseDiv.dataset.sets = sets;
        if (rangeObj) {
            exerciseDiv.dataset.rangeType = rangeObj.type;
            if (rangeObj.type === 'seconds') {
                exerciseDiv.dataset.secMin = rangeObj.min;
                exerciseDiv.dataset.secMax = rangeObj.max;
            } else {
                exerciseDiv.dataset.repMin = rangeObj.min;
                exerciseDiv.dataset.repMax = rangeObj.max;
            }
        }
        
        // Add drag handle indicator
        exerciseDiv.style.cursor = 'grab';
        exerciseDiv.title = 'Hold and drag to reorder or drag out to delete';
    }

    onExerciseReorder(newOrder) {
        // Update the DOM to reflect the new order, preserving repRange/rangeType
        const container = document.getElementById('exercises-container');
        container.innerHTML = '';
        newOrder.forEach(exercise => {
            const exerciseDiv = document.createElement('div');
            exerciseDiv.className = 'exercise-item';
            // Try to get repRange from exercise object, fallback to dataset if needed
            let repRange = exercise.repRange;
            if (!repRange && exercise.rangeType) {
                if (exercise.rangeType === 'seconds') {
                    repRange = { min: exercise.secMin, max: exercise.secMax, type: 'seconds' };
                } else {
                    repRange = { min: exercise.repMin, max: exercise.repMax, type: 'reps' };
                }
            }
            exerciseDiv.innerHTML = this.createExerciseHTML(exercise.exercise, exercise.sets, repRange);
            this.setupExerciseDiv(exerciseDiv, exercise.exercise, exercise.sets, repRange);
            container.appendChild(exerciseDiv);
        });
    }

    addExercise() {
        const selectedExercise = window.getSelectedExercise();
        if (!selectedExercise) {
            CustomAlert.warning('Please select an exercise first', 'No Exercise Selected');
            return;
        }
        const exercise = selectedExercise.name;
        const sets = parseInt(document.getElementById('sets-input').value) || 3;
        const rangeType = document.getElementById('range-type-checkbox').checked ? 'seconds' : 'reps';
        let rangeMin, rangeMax;
        let repRange;
        if (rangeType === 'reps') {
            rangeMin = parseInt(document.getElementById('rep-min-input').value) || 8;
            rangeMax = parseInt(document.getElementById('rep-max-input').value) || 12;
            if (rangeMin > rangeMax) {
                CustomAlert.error('Minimum reps cannot be greater than maximum reps', 'Invalid Rep Range');
                return;
            }
            repRange = { min: rangeMin, max: rangeMax, type: 'reps' };
        } else {
            rangeMin = parseInt(document.getElementById('sec-min-input').value) || 30;
            rangeMax = parseInt(document.getElementById('sec-max-input').value) || 60;
            if (rangeMin > rangeMax) {
                CustomAlert.error('Minimum seconds cannot be greater than maximum seconds', 'Invalid Second Range');
                return;
            }
            repRange = { min: rangeMin, max: rangeMax, type: 'seconds' };
        }
        const container = document.getElementById('exercises-container');
        const exerciseList = document.getElementById('exercise-list');
        const exerciseDiv = document.createElement('div');
        exerciseDiv.className = 'exercise-item';
        exerciseDiv.innerHTML = this.createExerciseHTML(exercise, sets, repRange);
        this.setupExerciseDiv(exerciseDiv, exercise, sets, repRange);
        // Save repRange and rangeType to dataset for later editing
        exerciseDiv.dataset.rangeType = repRange.type;
        exerciseDiv.dataset.repRange = JSON.stringify(repRange);
        container.appendChild(exerciseDiv);
        exerciseList.style.display = 'block';
        window.clearExerciseSelection();
        document.getElementById('sets-input').value = '3';
        document.getElementById('rep-min-input').value = '8';
        document.getElementById('rep-max-input').value = '12';
        document.getElementById('sec-min-input').value = '30';
        document.getElementById('sec-max-input').value = '60';
        document.getElementById('range-type-checkbox').checked = false;
        document.getElementById('rep-range-fields').style.display = '';
        document.getElementById('second-range-fields').style.display = 'none';
        const rangeLabel = document.getElementById('range-type-label');
        if (rangeLabel) rangeLabel.textContent = 'Rep Range';
        // Show drag hint if this is the first exercise being added
        if (container.children.length === 1) {
            this.showDragHint();
        }
    }

    showDragHint() {
        const hint = document.createElement('div');
        hint.className = 'drag-hint';
        hint.innerHTML = '💡 Tip: Hold and drag exercises to reorder them or drag out to delete';
        hint.style.cssText = `
            background: rgba(0, 122, 255, 0.1);
            border: 1px solid rgba(0, 122, 255, 0.3);
            border-radius: 8px;
            padding: 10px;
            margin: 10px 0;
            text-align: center;
            font-size: 14px;
            color: #007aff;
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.3s ease;
        `;
        
        const exerciseList = document.getElementById('exercise-list');
        exerciseList.appendChild(hint);
        
        // Trigger fade-in animation
        setTimeout(() => {
            hint.style.opacity = '1';
            hint.style.transform = 'translateY(0)';
        }, 10);
        
        // Auto-hide hint after 5 seconds
        setTimeout(() => {
            if (hint.parentNode) {
                hint.style.opacity = '0';
                hint.style.transform = 'translateY(-20px)';
                setTimeout(() => {
                    if (hint.parentNode) {
                        hint.parentNode.removeChild(hint);
                    }
                }, 300);
            }
        }, 5000);
    }

    editExercise(button) {
        const exerciseItem = button.closest('.exercise-item');
        const exerciseName = exerciseItem.dataset.exercise;
        const sets = parseInt(exerciseItem.dataset.sets);
        const rangeType = exerciseItem.dataset.rangeType || 'reps';
        const repMin = parseInt(exerciseItem.dataset.repMin) || 8;
        const repMax = parseInt(exerciseItem.dataset.repMax) || 12;
        const secMin = parseInt(exerciseItem.dataset.secMin) || 30;
        const secMax = parseInt(exerciseItem.dataset.secMax) || 60;

        this.currentEditingExercise = exerciseItem;

        const modal = document.createElement('div');
        modal.className = 'edit-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Edit Exercise</h3>
                    <button class="close-btn" onclick="this.closest('.edit-modal').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Exercise Name</label>
                        <input type="text" id="edit-exercise-name" value="${exerciseName}">
                    </div>
                    <div class="form-group">
                        <label for="edit-sets">Sets</label>
                        <input type="number" id="edit-sets" value="${sets}" min="1" max="10">
                    </div>
                    <div class="form-group">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                            <input type="checkbox" id="edit-range-type-checkbox" ${rangeType === 'seconds' ? 'checked' : ''} style="width: 14px; height: 14px; border-radius: 4px; box-shadow: none; outline: none; margin: 0; opacity: ${rangeType === 'seconds' ? '1' : '0.2'}; transition: opacity 0.2s;">
                            <span style="font-size: 14px; color: #f2f2f7;">Seconds</span>
                        </div>
                        <label id="edit-range-type-label" for="edit-range-type-checkbox" style="font-size: 16px; font-weight: 500; color: #f2f2f7; margin-bottom: 0;">${rangeType === 'seconds' ? 'Second Range' : 'Rep Range'}</label>
                        <div style="display: flex; align-items: center; gap: 8px; margin-top: 8px;">
                            <div id="edit-rep-range-fields" class="rep-range-container" style="${rangeType === 'seconds' ? 'display:none;' : ''}">
                                <input type="number" id="edit-rep-min" value="${repMin}" min="1" max="100">
                                <span class="rep-range-separator">-</span>
                                <input type="number" id="edit-rep-max" value="${repMax}" min="1" max="100">
                            </div>
                            <div id="edit-second-range-fields" class="rep-range-container" style="${rangeType === 'seconds' ? '' : 'display:none;'}">
                                <input type="number" id="edit-sec-min" value="${secMin}" min="1" max="600">
                                <span class="rep-range-separator">-</span>
                                <input type="number" id="edit-sec-max" value="${secMax}" min="1" max="600">
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer" style="display: flex; gap: 8px;">
                    <button class="btn btn-primary" style="flex:2;" onclick="window.programEditor.saveExerciseEdit(this)">Save</button>
                    <button class="btn btn-secondary" style="flex:1;" onclick="this.closest('.edit-modal').remove()">Cancel</button>
                    <button class="btn btn-danger" style="flex:1;" onclick="window.programEditor.deleteExerciseFromEdit(this)">Delete</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        // Setup checkbox and fields logic
        const checkbox = modal.querySelector('#edit-range-type-checkbox');
        const repFields = modal.querySelector('#edit-rep-range-fields');
        const secFields = modal.querySelector('#edit-second-range-fields');
        const rangeLabel = modal.querySelector('#edit-range-type-label');
        if (checkbox && repFields && secFields && rangeLabel) {
            checkbox.addEventListener('change', function() {
                checkbox.style.opacity = checkbox.checked ? '1' : '0.2';
                if (checkbox.checked) {
                    repFields.style.display = 'none';
                    secFields.style.display = '';
                    rangeLabel.textContent = 'Second Range';
                } else {
                    repFields.style.display = '';
                    secFields.style.display = 'none';
                    rangeLabel.textContent = 'Rep Range';
                }
            });
        }
    }

    // Delete exercise from edit modal
    deleteExerciseFromEdit(button) {
        const modal = button.closest('.edit-modal');
        const nameInput = modal.querySelector('#edit-exercise-name');
        const exerciseName = nameInput ? nameInput.value.trim() : '';
        if (!exerciseName) return;
        CustomAlert.confirm(
            `Are you sure you want to delete "${exerciseName}"? This action cannot be undone.`,
            'Delete Exercise',
            () => {
                this._deleteExerciseByName(exerciseName);
                if (modal && modal.parentNode) modal.remove();
                CustomAlert.success('Exercise deleted successfully');
            },
            () => {
                // Cancelled - do nothing
            }
        );
    }

    // Helper to remove the exact exercise instance from current program or DOM
    _deleteExerciseByName(name) {
        let deleted = false;
        // Remove from currentProgram by DOM index if possible
        if (this.currentEditingExercise && this.currentProgram && Array.isArray(this.currentProgram.exercises)) {
            const container = document.getElementById('exercises-container');
            if (container) {
                const items = Array.from(container.querySelectorAll('.exercise-item'));
                const domIndex = items.indexOf(this.currentEditingExercise);
                if (domIndex !== -1 && domIndex < this.currentProgram.exercises.length) {
                    this.currentProgram.exercises.splice(domIndex, 1);
                    this.renderExercisesList();
                    deleted = true;
                }
            }
        }
        // If not found in currentProgram, remove from DOM (unsaved exercise)
        if (!deleted) {
            if (this.currentEditingExercise) {
                this.currentEditingExercise.remove();
            } else {
                // fallback: try to remove by name
                const container = document.getElementById('exercises-container');
                if (container) {
                    const items = Array.from(container.querySelectorAll('.exercise-item'));
                    const item = items.find(el => (el.dataset.exercise || '').trim() === name);
                    if (item) {
                        item.remove();
                    }
                }
            }
        }
    }

    saveExerciseEdit(button) {
        const modal = button.closest('.edit-modal');
        const exerciseName = modal.querySelector('#edit-exercise-name').value.trim();
        const sets = parseInt(modal.querySelector('#edit-sets').value) || 3;
        const isSeconds = modal.querySelector('#edit-range-type-checkbox').checked;
        const repMin = parseInt(modal.querySelector('#edit-rep-min').value) || 8;
        const repMax = parseInt(modal.querySelector('#edit-rep-max').value) || 12;
        const secMin = parseInt(modal.querySelector('#edit-sec-min').value) || 30;
        const secMax = parseInt(modal.querySelector('#edit-sec-max').value) || 60;

        // Validate exercise name
        if (!exerciseName) {
            CustomAlert.error('Exercise name cannot be empty', 'Invalid Exercise Name');
            return;
        }

        // Validate range
        if (isSeconds) {
            if (secMin > secMax) {
                CustomAlert.error('Minimum seconds cannot be greater than maximum seconds', 'Invalid Second Range');
                return;
            }
        } else {
            if (repMin > repMax) {
                CustomAlert.error('Minimum reps cannot be greater than maximum reps', 'Invalid Rep Range');
                return;
            }
        }

        // Update the specific exercise item being edited
        if (this.currentEditingExercise) {
            this.currentEditingExercise.dataset.exercise = exerciseName;
            this.currentEditingExercise.dataset.sets = sets;
            if (isSeconds) {
                this.currentEditingExercise.dataset.rangeType = 'seconds';
                this.currentEditingExercise.dataset.secMin = secMin;
                this.currentEditingExercise.dataset.secMax = secMax;
                // Remove rep fields
                delete this.currentEditingExercise.dataset.repMin;
                delete this.currentEditingExercise.dataset.repMax;
            } else {
                this.currentEditingExercise.dataset.rangeType = 'reps';
                this.currentEditingExercise.dataset.repMin = repMin;
                this.currentEditingExercise.dataset.repMax = repMax;
                // Remove seconds fields
                delete this.currentEditingExercise.dataset.secMin;
                delete this.currentEditingExercise.dataset.secMax;
            }
            // Update the display
            let rangeText = '';
            if (isSeconds) {
                rangeText = `${secMin}-${secMax} sec`;
            } else {
                rangeText = `${repMin}-${repMax} reps`;
            }
            const exerciseInfo = `${sets} sets • ${rangeText}`;
            this.currentEditingExercise.querySelector('.exercise-name').textContent = exerciseName;
            this.currentEditingExercise.querySelector('.exercise-sets').textContent = exerciseInfo;
            this.currentEditingExercise = null;
        }
        // Close modal
        modal.remove();
    }

    saveProgram() {
        const name = document.getElementById('program-name').value.trim();
        if (!name) {
            CustomAlert.error('Program name cannot be empty', 'Invalid Program Name');
            return;
        }
        const container = document.getElementById('exercises-container');
        const exerciseDivs = Array.from(container.querySelectorAll('.exercise-item'));
        if (exerciseDivs.length === 0) {
            CustomAlert.error('Add at least one exercise to save the program', 'No Exercises');
            return;
        }
        const exercises = exerciseDivs.map(div => {
            const exerciseName = div.dataset.exercise;
            const sets = parseInt(div.dataset.sets) || 3;
            let repRange = { min: 8, max: 12, type: 'reps' };
            if (div.dataset.repRange) {
                try {
                    repRange = JSON.parse(div.dataset.repRange);
                } catch {}
            } else {
                if (div.dataset.rangeType === 'seconds') {
                    repRange = { min: parseInt(div.dataset.secMin) || 30, max: parseInt(div.dataset.secMax) || 60, type: 'seconds' };
                } else {
                    repRange = { min: parseInt(div.dataset.repMin) || 8, max: parseInt(div.dataset.repMax) || 12, type: 'reps' };
                }
            }
            return {
                name: exerciseName,
                sets,
                repRange,
                rangeType: repRange.type
            };
        });
        if (this.programManager.getEditingProgramId()) {
            this.programManager.updateProgram(this.programManager.getEditingProgramId(), name, exercises);
            CustomAlert.success('Program updated!', 'Success');
        } else {
            this.programManager.createProgram(name, exercises);
            CustomAlert.success('Program saved!', 'Success');
        }
        this.resetCreateForm();
        UIManager.displayPrograms(this.programManager.getAllPrograms());
        UIManager.showProgramsTab();
    }

    resetCreateForm() {
        document.getElementById('program-name').value = '';
        document.getElementById('exercises-container').innerHTML = '';
        document.getElementById('exercise-list').style.display = 'none';
        document.getElementById('edit-indicator').classList.add('hidden');
        document.getElementById('save-btn').textContent = 'Save Program';
        document.getElementById('cancel-btn').classList.add('hidden');
        document.getElementById('sets-input').value = '3';
        document.getElementById('rep-min-input').value = '8';
        document.getElementById('rep-max-input').value = '12';
        document.getElementById('sec-min-input').value = '30';
        document.getElementById('sec-max-input').value = '60';
        document.getElementById('range-type-checkbox').checked = false;
        document.getElementById('rep-range-fields').style.display = '';
        document.getElementById('second-range-fields').style.display = 'none';
        const rangeLabel = document.getElementById('range-type-label');
        if (rangeLabel) rangeLabel.textContent = 'Rep Range';
        this.programManager.clearEditingProgram();
    }

    editProgram(programId) {
        const program = this.programManager.getProgramById(programId);
        if (!program) return;

        this.programManager.setEditingProgramId(programId);
        
        // Switch to create tab
        UIManager.showTab('create');
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-btn')[1].classList.add('active');

        // Populate form with existing data
        document.getElementById('program-name').value = program.name;
        document.getElementById('edit-indicator').classList.remove('hidden');
        document.getElementById('save-btn').textContent = 'Update Program';
        document.getElementById('cancel-btn').classList.remove('hidden');

        // Clear existing exercises
        const container = document.getElementById('exercises-container');
        container.innerHTML = '';

        // Add existing exercises
        program.exercises.forEach(exercise => {
            const exerciseDiv = document.createElement('div');
            exerciseDiv.className = 'exercise-item';
            
            // Handle both old and new data formats - normalize to use .name
            const exerciseName = exercise.name || exercise.exercise;
            const repRange = exercise.repRange || { min: 8, max: 12 };
            
            exerciseDiv.innerHTML = this.createExerciseHTML(exerciseName, exercise.sets, repRange);
            this.setupExerciseDiv(exerciseDiv, exerciseName, exercise.sets, repRange);
            
            container.appendChild(exerciseDiv);
        });

        document.getElementById('exercise-list').style.display = 'block';
    }

    cancelEdit() {
        this.resetCreateForm();
        UIManager.showProgramsTab();
    }
}
