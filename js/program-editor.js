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
    createExerciseHTML(exerciseName, sets, repRange) {
        const repRangeText = repRange ? `${repRange.min}-${repRange.max} reps` : '';
        const exerciseInfo = repRangeText ? `${sets} sets • ${repRangeText}` : `${sets} sets`;
        
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
    setupExerciseDiv(exerciseDiv, exerciseName, sets, repRange) {
        exerciseDiv.dataset.exercise = exerciseName;
        exerciseDiv.dataset.sets = sets;
        if (repRange) {
            exerciseDiv.dataset.repMin = repRange.min;
            exerciseDiv.dataset.repMax = repRange.max;
        }
        
        // Add drag handle indicator
        exerciseDiv.style.cursor = 'grab';
        exerciseDiv.title = 'Hold and drag to reorder or drag out to delete';
    }

    onExerciseReorder(newOrder) {
        // Update the DOM to reflect the new order
        const container = document.getElementById('exercises-container');
        container.innerHTML = '';
        
        newOrder.forEach(exercise => {
            const exerciseDiv = document.createElement('div');
            exerciseDiv.className = 'exercise-item';
            
            exerciseDiv.innerHTML = this.createExerciseHTML(exercise.exercise, exercise.sets, exercise.repRange);
            this.setupExerciseDiv(exerciseDiv, exercise.exercise, exercise.sets, exercise.repRange);
            
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
        const repMin = parseInt(document.getElementById('rep-min-input').value) || 8;
        const repMax = parseInt(document.getElementById('rep-max-input').value) || 12;
        
        // Validate rep range
        if (repMin > repMax) {
            CustomAlert.error('Minimum reps cannot be greater than maximum reps', 'Invalid Rep Range');
            return;
        }
        
        const container = document.getElementById('exercises-container');
        const exerciseList = document.getElementById('exercise-list');
        
        const exerciseDiv = document.createElement('div');
        exerciseDiv.className = 'exercise-item';
        
        const repRange = { min: repMin, max: repMax };
        exerciseDiv.innerHTML = this.createExerciseHTML(exercise, sets, repRange);
        this.setupExerciseDiv(exerciseDiv, exercise, sets, repRange);
        
        container.appendChild(exerciseDiv);
        exerciseList.style.display = 'block';
        
        // Clear the exercise selection after adding
        window.clearExerciseSelection();
        
        document.getElementById('sets-input').value = '3';
        document.getElementById('rep-min-input').value = '8';
        document.getElementById('rep-max-input').value = '12';
        
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
        const repMin = parseInt(exerciseItem.dataset.repMin) || 8;
        const repMax = parseInt(exerciseItem.dataset.repMax) || 12;
        
        // Store reference to the exercise item being edited
        this.currentEditingExercise = exerciseItem;
        
        // Create edit modal
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
                        <label>Rep Range</label>
                        <div class="rep-range-container">
                            <input type="number" id="edit-rep-min" value="${repMin}" min="1" max="100">
                            <span class="rep-range-separator">-</span>
                            <input type="number" id="edit-rep-max" value="${repMax}" min="1" max="100">
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
        // Focus on exercise name input
        document.getElementById('edit-exercise-name').focus();
        document.getElementById('edit-exercise-name').select();
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
        const exerciseName = document.getElementById('edit-exercise-name').value.trim();
        const sets = parseInt(document.getElementById('edit-sets').value) || 3;
        const repMin = parseInt(document.getElementById('edit-rep-min').value) || 8;
        const repMax = parseInt(document.getElementById('edit-rep-max').value) || 12;
        
        // Validate exercise name
        if (!exerciseName) {
            CustomAlert.error('Exercise name cannot be empty', 'Invalid Exercise Name');
            return;
        }
        
        // Validate rep range
        if (repMin > repMax) {
            CustomAlert.error('Minimum reps cannot be greater than maximum reps', 'Invalid Rep Range');
            return;
        }
        
        // Update the specific exercise item being edited
        if (this.currentEditingExercise) {
            this.currentEditingExercise.dataset.exercise = exerciseName;
            this.currentEditingExercise.dataset.sets = sets;
            this.currentEditingExercise.dataset.repMin = repMin;
            this.currentEditingExercise.dataset.repMax = repMax;
            
            // Update the display
            const repRangeText = `${repMin}-${repMax} reps`;
            const exerciseInfo = `${sets} sets • ${repRangeText}`;
            this.currentEditingExercise.querySelector('.exercise-name').textContent = exerciseName;
            this.currentEditingExercise.querySelector('.exercise-sets').textContent = exerciseInfo;
            
            // Clear the reference
            this.currentEditingExercise = null;
        }
        
        // Close modal
        button.closest('.edit-modal').remove();
    }

    saveProgram() {
        const name = document.getElementById('program-name').value.trim();
        const exerciseElements = document.querySelectorAll('#exercises-container .exercise-item');
        
        if (!name) {
            CustomAlert.warning('Please enter a program name', 'Program Name Required');
            return;
        }
        
        if (exerciseElements.length === 0) {
            CustomAlert.warning('Please add at least one exercise', 'No Exercises Added');
            return;
        }
        
        const exercises = Array.from(exerciseElements).map(el => ({
            name: el.dataset.exercise,
            sets: parseInt(el.dataset.sets),
            repRange: {
                min: parseInt(el.dataset.repMin) || 8,
                max: parseInt(el.dataset.repMax) || 12
            }
        }));
        
        const editingId = this.programManager.getEditingProgramId();
        
        if (editingId) {
            // Update existing program
            this.programManager.updateProgram(editingId, name, exercises);
        } else {
            // Create new program
            this.programManager.createProgram(name, exercises);
        }
        
        UIManager.displayPrograms(this.programManager.getAllPrograms());
        this.resetCreateForm();
        
        // Switch to programs tab
        UIManager.showProgramsTab();
        
        CustomAlert.success(editingId ? 'Program updated successfully!' : 'Program saved successfully!');
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
