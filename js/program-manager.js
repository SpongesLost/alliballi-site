// Program manager for handling program CRUD operations
class ProgramManager {
    constructor() {
        this.programs = [];
        this.editingProgramId = null;
        this.loadPrograms();
    }

    loadPrograms() {
        this.programs = Storage.loadPrograms();
    }

    savePrograms() {
        Storage.savePrograms(this.programs);
    }

    getAllPrograms() {
        return this.programs;
    }

    getProgramById(id) {
        return this.programs.find(p => p.id === id);
    }

    createProgram(name, exercises) {
        const program = {
            id: Date.now(),
            name: name,
            exercises: exercises,
            sessions: []
        };
        this.programs.push(program);
        this.savePrograms();
        return program;
    }

    updateProgram(id, name, exercises) {
        const programIndex = this.programs.findIndex(p => p.id === id);
        if (programIndex !== -1) {
            this.programs[programIndex].name = name;
            this.programs[programIndex].exercises = exercises;
            this.savePrograms();
            return this.programs[programIndex];
        }
        return null;
    }

    deleteProgram(id) {
        this.programs = this.programs.filter(p => p.id !== id);
        this.savePrograms();
    }

    addSessionToProgram(programId, session) {
        const program = this.getProgramById(programId);
        if (program) {
            program.sessions.push(session);
            this.savePrograms();
        }
    }

    exportPrograms() {
        const exportData = {
            version: "1.0",
            exportDate: new Date().toISOString(),
            programs: this.programs.map(program => ({
                id: program.id,
                name: program.name,
                exercises: program.exercises,
                sessions: program.sessions || []
            }))
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `fitness-programs-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        // Clean up
        URL.revokeObjectURL(link.href);
        
        return exportData;
    }

    exportSelectedPrograms(selectedPrograms) {
        const exportData = {
            version: "1.0",
            exportDate: new Date().toISOString(),
            programs: selectedPrograms.map(program => ({
                id: program.id,
                name: program.name,
                exercises: program.exercises,
                sessions: program.sessions || []
            }))
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        // Create filename based on selection
        let filename;
        if (selectedPrograms.length === 1) {
            const safeName = selectedPrograms[0].name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
            filename = `fitness-program-${safeName}-${new Date().toISOString().split('T')[0]}.json`;
        } else {
            filename = `fitness-programs-selected-${new Date().toISOString().split('T')[0]}.json`;
        }
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = filename;
        link.click();
        
        // Clean up
        URL.revokeObjectURL(link.href);
        
        return exportData;
    }

    importPrograms(importData) {
        try {
            // Validate import data structure
            if (!importData || !importData.programs || !Array.isArray(importData.programs)) {
                throw new Error('Invalid import file format');
            }

            let importedCount = 0;
            
            importData.programs.forEach(importProgram => {
                // Always import programs, even if names are duplicated
                // This allows multiple "Upper", "Lower", etc. programs
                const newProgram = {
                    id: Date.now() + Math.random(), // Ensure unique ID
                    name: importProgram.name,
                    exercises: importProgram.exercises || [],
                    sessions: importProgram.sessions || []
                };
                
                this.programs.push(newProgram);
                importedCount++;
            });
            
            if (importedCount > 0) {
                this.savePrograms();
            }
            
            return {
                success: true,
                imported: importedCount,
                skipped: 0,
                message: `Successfully imported ${importedCount} programs.`
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: 'Failed to import programs. Please check the file format.'
            };
        }
    }

    setEditingProgramId(id) {
        this.editingProgramId = id;
    }

    getEditingProgramId() {
        return this.editingProgramId;
    }

    clearEditingProgram() {
        this.editingProgramId = null;
    }
}
