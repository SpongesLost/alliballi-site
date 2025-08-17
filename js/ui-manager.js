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
        
        programs.forEach(program => {
            const totalSets = program.exercises.reduce((sum, ex) => sum + ex.sets, 0);
            const card = document.createElement('div');
            card.className = 'program-card';
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
}
