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
        const select = document.getElementById('exercise-select');
        const exercise = select.value;
        const sets = parseInt(document.getElementById('sets-input').value) || 3;
        const repMin = parseInt(document.getElementById('rep-min-input').value) || 8;
        const repMax = parseInt(document.getElementById('rep-max-input').value) || 12;
        
        if (!exercise) return;
        
        // Validate rep range
        if (repMin > repMax) {
            alert('Minimum reps cannot be greater than maximum reps');
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
        
        // Reset form inputs
        select.value = '';
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
            animation: fadeIn 0.3s ease;
        `;
        
        const exerciseList = document.getElementById('exercise-list');
        exerciseList.appendChild(hint);
        
        // Auto-hide hint after 5 seconds
        setTimeout(() => {
            if (hint.parentNode) {
                hint.style.opacity = '0';
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
                        <input type="text" id="edit-exercise-name" value="${exerciseName}" readonly>
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
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.edit-modal').remove()">Cancel</button>
                    <button class="btn" onclick="window.programEditor.saveExerciseEdit(this)">Save</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Focus on sets input
        document.getElementById('edit-sets').focus();
        document.getElementById('edit-sets').select();
    }

    saveExerciseEdit(button) {
        const sets = parseInt(document.getElementById('edit-sets').value) || 3;
        const repMin = parseInt(document.getElementById('edit-rep-min').value) || 8;
        const repMax = parseInt(document.getElementById('edit-rep-max').value) || 12;
        
        // Validate rep range
        if (repMin > repMax) {
            alert('Minimum reps cannot be greater than maximum reps');
            return;
        }
        
        // Update the specific exercise item being edited
        if (this.currentEditingExercise) {
            this.currentEditingExercise.dataset.sets = sets;
            this.currentEditingExercise.dataset.repMin = repMin;
            this.currentEditingExercise.dataset.repMax = repMax;
            
            // Update the display
            const repRangeText = `${repMin}-${repMax} reps`;
            const exerciseInfo = `${sets} sets • ${repRangeText}`;
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
            alert('Please enter a program name');
            return;
        }
        
        if (exerciseElements.length === 0) {
            alert('Please add at least one exercise');
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
        
        alert(editingId ? 'Program updated successfully!' : 'Program saved successfully!');
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
