// Drag and drop handler for reordering exercises with delete functionality
class DragDropHandler {
    constructor(containerSelector, itemSelector, onReorderCallback) {
        this.containerSelector = containerSelector;
        this.itemSelector = itemSelector;
        this.onReorderCallback = onReorderCallback;
        this.draggedElement = null;
        this.placeholder = null;
        this.deleteZone = null;
        this.isDragging = false;
        this.dragStartY = 0;
        this.dragThreshold = 10; // pixels to move before starting drag
        this.longPressTimeout = null;
        this.longPressDelay = 500; // milliseconds
        this.isLongPress = false;
        this.isOverDeleteZone = false;
    }

    init() {
        this.setupEventListeners();
        this.createPlaceholder();
        this.createDeleteZone();
    }

    createPlaceholder() {
        this.placeholder = document.createElement('div');
        this.placeholder.className = 'drag-placeholder';
        this.placeholder.style.cssText = `
            height: 60px;
            background: #f0f0f0;
            border: 2px dashed #ccc;
            border-radius: 8px;
            margin: 5px 0;
            display: none;
            align-items: center;
            justify-content: center;
            color: #999;
            font-size: 14px;
        `;
        this.placeholder.textContent = 'Drop exercise here';
    }

    createDeleteZone() {
        this.deleteZone = document.createElement('div');
        this.deleteZone.className = 'delete-zone';
        this.deleteZone.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 59, 48, 0.1);
            backdrop-filter: blur(5px);
            display: none;
            z-index: 500;
            pointer-events: none;
        `;
        
        // Create trash icon at top of screen
        const trashIcon = document.createElement('div');
        trashIcon.className = 'delete-trash-icon';
        trashIcon.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(255, 59, 48, 0.9);
            color: white;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            box-shadow: 0 4px 20px rgba(255, 59, 48, 0.4);
            z-index: 1000;
            animation: pulse 1s infinite;
        `;
        trashIcon.innerHTML = '🗑️';
        
        this.deleteZone.appendChild(trashIcon);
        document.body.appendChild(this.deleteZone);
    }

    setupEventListeners() {
        const container = document.querySelector(this.containerSelector);
        if (!container) return;

        // Use event delegation for dynamic items
        container.addEventListener('mousedown', this.handleMouseDown.bind(this));
        container.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
        document.addEventListener('touchend', this.handleTouchEnd.bind(this));
        
        // Prevent default drag behavior on exercise items
        container.addEventListener('dragstart', (e) => {
            if (e.target.closest(this.itemSelector)) {
                e.preventDefault();
            }
        });
    }

    handleMouseDown(e) {
        const item = e.target.closest(this.itemSelector);
        if (!item || e.target.tagName === 'BUTTON') return;

        this.startLongPress(e, item);
    }

    handleTouchStart(e) {
        const item = e.target.closest(this.itemSelector);
        if (!item || e.target.tagName === 'BUTTON') return;

        this.startLongPress(e, item);
    }

    startLongPress(e, item) {
        const clientY = e.type === 'mousedown' ? e.clientY : e.touches[0].clientY;
        this.dragStartY = clientY;
        this.isLongPress = false;

        // Clear any existing timeout
        if (this.longPressTimeout) {
            clearTimeout(this.longPressTimeout);
        }

        // Start long press timer
        this.longPressTimeout = setTimeout(() => {
            this.isLongPress = true;
            this.startDrag(item, clientY);
        }, this.longPressDelay);

        // Add visual feedback for long press
        item.style.transition = 'transform 0.1s ease';
        item.style.transform = 'scale(0.98)';
        setTimeout(() => {
            if (item.style.transform) {
                item.style.transform = 'scale(1)';
            }
        }, 100);
    }

    handleMouseMove(e) {
        if (this.longPressTimeout && !this.isLongPress) {
            const deltaY = Math.abs(e.clientY - this.dragStartY);
            if (deltaY > this.dragThreshold) {
                this.cancelLongPress();
            }
        }

        if (this.isDragging) {
            this.updateDragPosition(e.clientY);
        }
    }

    handleTouchMove(e) {
        if (this.longPressTimeout && !this.isLongPress) {
            const deltaY = Math.abs(e.touches[0].clientY - this.dragStartY);
            if (deltaY > this.dragThreshold) {
                this.cancelLongPress();
            }
        }

        if (this.isDragging) {
            e.preventDefault();
            this.updateDragPosition(e.touches[0].clientY);
        }
    }

    handleMouseUp(e) {
        this.endDrag();
    }

    handleTouchEnd(e) {
        this.endDrag();
    }

    cancelLongPress() {
        if (this.longPressTimeout) {
            clearTimeout(this.longPressTimeout);
            this.longPressTimeout = null;
        }
        this.isLongPress = false;
    }

    startDrag(item, clientY) {
        this.isDragging = true;
        this.draggedElement = item;
        
        // Store original dimensions before any modifications
        const rect = item.getBoundingClientRect();
        const originalWidth = rect.width;
        const originalHeight = rect.height;
        
        // Add dragging class for visual feedback
        item.classList.add('dragging');
        
        // Apply dragging styles with fixed dimensions
        item.style.cssText += `
            position: fixed;
            z-index: 10000;
            pointer-events: none;
            transform: rotate(2deg);
            box-shadow: 0 8px 16px rgba(0,0,0,0.2);
            opacity: 0.9;
            width: ${originalWidth}px !important;
            height: ${originalHeight}px !important;
            max-width: ${originalWidth}px !important;
            min-width: ${originalWidth}px !important;
            box-sizing: border-box;
        `;

        // Position the dragged element
        item.style.left = rect.left + 'px';
        item.style.top = (clientY - rect.height / 2) + 'px';

        // Insert placeholder
        this.placeholder.style.display = 'flex';
        item.parentNode.insertBefore(this.placeholder, item.nextSibling);

        // Add haptic feedback on mobile
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    }

    updateDragPosition(clientY) {
        if (!this.isDragging || !this.draggedElement) return;

        // Update dragged element position
        const rect = this.draggedElement.getBoundingClientRect();
        this.draggedElement.style.top = (clientY - rect.height / 2) + 'px';

        // Check if dragging outside the container for delete
        const container = document.querySelector(this.containerSelector);
        const containerRect = container.getBoundingClientRect();
        const isOutsideContainer = clientY < containerRect.top - 50 || 
                                  clientY > containerRect.bottom + 50;

        if (isOutsideContainer && !this.isOverDeleteZone) {
            this.isOverDeleteZone = true;
            this.deleteZone.style.display = 'block';
            this.draggedElement.classList.add('over-delete');
        } else if (!isOutsideContainer && this.isOverDeleteZone) {
            this.isOverDeleteZone = false;
            this.deleteZone.style.display = 'none';
            this.draggedElement.classList.remove('over-delete');
        }

        // Handle reordering within container
        if (!isOutsideContainer) {
            // Find the drop target
            const items = Array.from(container.querySelectorAll(this.itemSelector))
                .filter(item => item !== this.draggedElement);

            let insertBeforeElement = null;
            let minDistance = Infinity;

            items.forEach(item => {
                const itemRect = item.getBoundingClientRect();
                const itemCenter = itemRect.top + itemRect.height / 2;
                const distance = Math.abs(clientY - itemCenter);

                if (distance < minDistance) {
                    minDistance = distance;
                    insertBeforeElement = clientY < itemCenter ? item : item.nextSibling;
                }
            });

            // Move placeholder to new position
            if (insertBeforeElement) {
                container.insertBefore(this.placeholder, insertBeforeElement);
            } else {
                container.appendChild(this.placeholder);
            }
            
            this.placeholder.style.display = 'flex';
        } else {
            this.placeholder.style.display = 'none';
        }
    }

    endDrag() {
        this.cancelLongPress();

        if (!this.isDragging || !this.draggedElement) return;

        this.isDragging = false;

        // Check if item should be deleted
        if (this.isOverDeleteZone) {
            // Delete the exercise
            const exerciseName = this.draggedElement.dataset.exercise;
            this.draggedElement.remove();
            this.draggedElement.classList.remove('over-delete');
            // Hide delete zone
            this.deleteZone.style.display = 'none';
            this.isOverDeleteZone = false;
            // Update the container
            const container = document.querySelector(this.containerSelector);
            if (container.children.length === 0) {
                document.getElementById('exercise-list').style.display = 'none';
            }
            
            // Add haptic feedback
            if (navigator.vibrate) {
                navigator.vibrate([50, 100, 50]);
            }
            
            this.draggedElement = null;
            return;
        }

        // Get the final position for reordering
        const container = document.querySelector(this.containerSelector);
        
        // Remove dragging styles
        this.draggedElement.classList.remove('dragging');
        this.draggedElement.classList.remove('over-delete');
        this.draggedElement.style.cssText = '';

        // Insert the dragged element at the new position
        if (this.placeholder.parentNode) {
            container.insertBefore(this.draggedElement, this.placeholder);
        } else {
            container.appendChild(this.draggedElement);
        }

        // Hide placeholder
        this.placeholder.style.display = 'none';
        if (this.placeholder.parentNode) {
            this.placeholder.parentNode.removeChild(this.placeholder);
        }

        // Hide delete zone
        this.deleteZone.style.display = 'none';
        this.isOverDeleteZone = false;

        // Calculate the new order
        const items = Array.from(container.querySelectorAll(this.itemSelector));
        const newOrder = items.map(item => ({
            exercise: item.dataset.exercise,
            sets: parseInt(item.dataset.sets),
            repRange: {
                min: parseInt(item.dataset.repMin) || 8,
                max: parseInt(item.dataset.repMax) || 12
            }
        }));

        // Notify about the reorder
        if (this.onReorderCallback) {
            this.onReorderCallback(newOrder);
        }

        // Reset dragged element reference
        this.draggedElement = null;

        // Add haptic feedback on mobile
        if (navigator.vibrate) {
            navigator.vibrate(30);
        }
    }

    destroy() {
        this.cancelLongPress();
        
        const container = document.querySelector(this.containerSelector);
        if (container) {
            container.removeEventListener('mousedown', this.handleMouseDown);
            container.removeEventListener('touchstart', this.handleTouchStart);
        }
        
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('touchmove', this.handleTouchMove);
        document.removeEventListener('mouseup', this.handleMouseUp);
        document.removeEventListener('touchend', this.handleTouchEnd);
    }
}
