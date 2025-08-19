// UI manager for handling tab navigation and general UI operations
class UIManager {
    static showTab(tabName, event) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.add('hidden');
        });
        
        // Remove active class from all buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected tab
        document.getElementById(tabName + '-tab').classList.remove('hidden');
        
        // Add active class to clicked button
        if (event) {
            event.target.classList.add('active');
        }

        // Reset edit mode when switching tabs
        if (tabName !== 'create') {
            window.programEditor.resetCreateForm();
        }
    }

    static displayPrograms(programs) {
        const container = document.getElementById('programs-list');
        container.innerHTML = '';
        
        if (programs.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #8e8e93; font-size: 18px; margin-top: 50px;">No programs created yet. Create your first program!</p>';
            return;
        }
        
        programs.forEach((program, index) => {
            const totalSets = program.exercises.reduce((sum, ex) => sum + ex.sets, 0);
            const card = document.createElement('div');
            card.className = 'program-card';
            card.draggable = true;
            card.dataset.programId = program.id;
            card.dataset.originalIndex = index;
            card.innerHTML = `
                <h3></h3>
                <p>${program.exercises.length} exercises • ${totalSets} total sets</p>
                <p style="font-size: 14px;">${program.sessions.length} sessions completed</p>
                <div class="program-actions">
                    <button class="btn" onclick="startWorkout(${program.id})">Start</button>
                    <button class="btn btn-secondary" onclick="editProgram(${program.id})">Edit</button>
                    <button class="btn btn-danger" onclick="deleteProgram(${program.id})">Delete</button>
                </div>
            `;
            
            // Safely set the program name as text content to prevent HTML injection
            const nameElement = card.querySelector('h3');
            nameElement.textContent = program.name;
            
            container.appendChild(card);
        });
        
        // Initialize drag and drop for programs
        UIManager.initializeProgramDragDrop();
    }

    static showWorkoutMode() {
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.add('hidden');
        });
        document.getElementById('workout-tab').classList.remove('hidden');
        
        // Deactivate all tab buttons visually when in workout mode
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
    }

    static showProgramsTab() {
        UIManager.showTab('programs');
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector('.tab-btn').classList.add('active');
    }

    static exportPrograms() {
        try {
            const allPrograms = window.app.programManager.getAllPrograms();
            
            if (allPrograms.length === 0) {
                CustomAlert.warning('No programs available to export.', 'Nothing to Export');
                return;
            }
            
            // Show program selection dialog
            UIManager.showProgramSelectionDialog(allPrograms);
        } catch (error) {
            CustomAlert.error(
                'Failed to load programs for export.',
                'Export Failed'
            );
            console.error('Export error:', error);
        }
    }

    static showProgramSelectionDialog(programs) {
        // Remove existing dialog if any
        const existingDialog = document.querySelector('.export-dialog');
        if (existingDialog) {
            existingDialog.remove();
        }

        // Create export selection dialog
        const dialog = document.createElement('div');
        dialog.className = 'export-dialog';
        dialog.innerHTML = `
            <div class="export-dialog-content">
                <div class="export-dialog-header">
                    <h3>Select Programs to Export</h3>
                    <button class="export-dialog-close" onclick="this.closest('.export-dialog').remove()">×</button>
                </div>
                <div class="export-dialog-body">
                    <div class="export-options">
                        <label class="export-option">
                            <input type="checkbox" id="select-all-programs" onchange="UIManager.toggleAllPrograms(this)">
                            <span>Select All</span>
                        </label>
                    </div>
                    <div class="program-selection-list">
                        ${programs.map(program => `
                            <label class="export-option program-option">
                                <input type="checkbox" class="program-checkbox" value="${program.id}">
                                <span class="program-info">
                                    <strong>${program.name}</strong>
                                    <small>${program.exercises.length} exercises • ${program.sessions.length} sessions</small>
                                </span>
                            </label>
                        `).join('')}
                    </div>
                </div>
                <div class="export-dialog-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.export-dialog').remove()">Cancel</button>
                    <button class="btn btn-primary" onclick="UIManager.exportSelectedPrograms()">Export Selected</button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        // Show with animation
        setTimeout(() => {
            dialog.classList.add('show');
        }, 10);

        // Handle escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                dialog.remove();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }

    static toggleAllPrograms(selectAllCheckbox) {
        const programCheckboxes = document.querySelectorAll('.program-checkbox');
        programCheckboxes.forEach(checkbox => {
            checkbox.checked = selectAllCheckbox.checked;
        });
    }

    static exportSelectedPrograms() {
        const selectedCheckboxes = document.querySelectorAll('.program-checkbox:checked');
        
        if (selectedCheckboxes.length === 0) {
            CustomAlert.warning('Please select at least one program to export.', 'No Selection');
            return;
        }

        const selectedIds = Array.from(selectedCheckboxes).map(cb => parseInt(cb.value));
        const allPrograms = window.app.programManager.getAllPrograms();
        const selectedPrograms = allPrograms.filter(program => selectedIds.includes(program.id));

        try {
            const exportData = window.app.programManager.exportSelectedPrograms(selectedPrograms);
            CustomAlert.success(
                `Exported ${exportData.programs.length} selected programs successfully!`,
                'Export Complete'
            );
            
            // Close the dialog
            document.querySelector('.export-dialog').remove();
        } catch (error) {
            CustomAlert.error(
                'Failed to export selected programs. Please try again.',
                'Export Failed'
            );
            console.error('Export error:', error);
        }
    }

    static importPrograms() {
        const fileInput = document.getElementById('import-file-input');
        fileInput.click();
    }

    static handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importData = JSON.parse(e.target.result);
                const result = window.app.programManager.importPrograms(importData);
                
                if (result.success) {
                    CustomAlert.success(result.message, 'Import Complete');
                    // Refresh the programs display
                    UIManager.displayPrograms(window.app.programManager.getAllPrograms());
                } else {
                    CustomAlert.error(result.message, 'Import Failed');
                }
            } catch (error) {
                CustomAlert.error(
                    'Invalid JSON file. Please select a valid fitness programs export file.',
                    'Import Failed'
                );
                console.error('Import error:', error);
            }
        };
        
        reader.readAsText(file);
        
        // Reset file input for next import
        event.target.value = '';
    }

    static initializeProgramDragDrop() {
        const container = document.getElementById('programs-list');
        const cards = container.querySelectorAll('.program-card');
        
        // Remove any existing event listeners on the container
        container.removeEventListener('dragover', UIManager.handleDragOver);
        container.removeEventListener('drop', UIManager.handleDrop);
        container.removeEventListener('dragenter', UIManager.handleDragEnter);
        container.removeEventListener('dragleave', UIManager.handleDragLeave);
        
        // Add container-level event listeners for better reliability
        container.addEventListener('dragover', UIManager.handleDragOver.bind(UIManager));
        container.addEventListener('drop', UIManager.handleDrop.bind(UIManager));
        
        // Add drag start/end listeners to individual cards
        cards.forEach(card => {
            card.addEventListener('dragstart', UIManager.handleDragStart.bind(UIManager));
            card.addEventListener('dragend', UIManager.handleDragEnd.bind(UIManager));
        });
    }

    static handleDragStart(e) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.target.outerHTML);
        e.target.classList.add('dragging');
        
        // Store the dragged element reference
        UIManager.draggedElement = e.target;
    }

    static handleDragEnd(e) {
        e.target.classList.remove('dragging');
        
        // Clear all drag effects and indicators
        UIManager.clearInsertionIndicators();
        
        UIManager.draggedElement = null;
    }

    static handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        
        // Clear any existing insertion indicators
        UIManager.clearInsertionIndicators();
        
        // Find where to show the insertion indicator
        const insertionPoint = UIManager.getInsertionPoint(e.clientY);
        if (insertionPoint) {
            UIManager.showInsertionIndicator(insertionPoint);
        }
    }

    static getInsertionPoint(mouseY) {
        const container = document.getElementById('programs-list');
        const cards = Array.from(container.querySelectorAll('.program-card:not(.dragging)'));
        
        // If no cards, insert at the beginning
        if (cards.length === 0) {
            return { position: 'start', element: container };
        }
        
        for (let i = 0; i < cards.length; i++) {
            const card = cards[i];
            const rect = card.getBoundingClientRect();
            const cardMiddle = rect.top + rect.height / 2;
            
            if (mouseY < cardMiddle) {
                return { position: 'before', element: card };
            }
        }
        
        // If we're past all cards, insert at the end
        return { position: 'after', element: cards[cards.length - 1] };
    }

    static showInsertionIndicator(insertionPoint) {
        // Create insertion indicator if it doesn't exist
        let indicator = document.getElementById('drag-insertion-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'drag-insertion-indicator';
            indicator.style.cssText = `
                height: 3px;
                background: #007aff;
                border-radius: 2px;
                margin: 4px 2px;
                opacity: 0.8;
                transition: all 0.2s ease;
                box-shadow: 0 0 8px rgba(0, 122, 255, 0.5);
            `;
        }
        
        const container = document.getElementById('programs-list');
        
        if (insertionPoint.position === 'start') {
            container.insertBefore(indicator, container.firstChild);
        } else if (insertionPoint.position === 'before') {
            container.insertBefore(indicator, insertionPoint.element);
        } else if (insertionPoint.position === 'after') {
            container.insertBefore(indicator, insertionPoint.element.nextSibling);
        }
    }

    static clearInsertionIndicators() {
        const indicator = document.getElementById('drag-insertion-indicator');
        if (indicator) {
            indicator.remove();
        }
        
        // Also clear any card highlights
        document.querySelectorAll('.program-card').forEach(card => {
            card.classList.remove('drag-over');
        });
    }

    static handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        
        if (!UIManager.draggedElement) return;
        
        // Find where to insert the dragged element
        const insertionPoint = UIManager.getInsertionPoint(e.clientY);
        
        if (insertionPoint) {
            const container = document.getElementById('programs-list');
            
            if (insertionPoint.position === 'start') {
                container.insertBefore(UIManager.draggedElement, container.firstChild);
            } else if (insertionPoint.position === 'before') {
                container.insertBefore(UIManager.draggedElement, insertionPoint.element);
            } else if (insertionPoint.position === 'after') {
                container.insertBefore(UIManager.draggedElement, insertionPoint.element.nextSibling);
            }
            
            // Update the order in the program manager
            UIManager.updateProgramOrder();
        }
        
        // Clean up
        UIManager.clearInsertionIndicators();
    }

    static updateProgramOrder() {
        const container = document.getElementById('programs-list');
        const cards = Array.from(container.querySelectorAll('.program-card'));
        const newOrder = cards.map(card => parseInt(card.dataset.programId));
        
        // Get current programs and reorder them
        const allPrograms = window.app.programManager.getAllPrograms();
        const reorderedPrograms = newOrder.map(id => 
            allPrograms.find(program => program.id === id)
        ).filter(Boolean);
        
        // Update the program manager's programs array
        window.app.programManager.programs = reorderedPrograms;
        window.app.programManager.savePrograms();
    }
}
