// Touch handler for workout swipe gestures
class TouchHandler {
    constructor() {
        this.startX = 0;
        this.startY = 0;
        this.currentX = 0;
        this.currentY = 0;
        this.isDragging = false;
        this.cardElement = null;
        this.swipeDirection = null;
        this.onSwipeCallback = null;
    }

    setupSwipeHandlers(cardElement, onSwipeCallback) {
        this.cardElement = cardElement;
        this.onSwipeCallback = onSwipeCallback;

        // Store bound functions for proper cleanup
        this.boundHandleTouchStart = this.handleTouchStart.bind(this);
        this.boundHandleTouchMove = this.handleTouchMove.bind(this);
        this.boundHandleTouchEnd = this.handleTouchEnd.bind(this);
        this.boundHandleMouseStart = this.handleMouseStart.bind(this);
        this.boundHandleMouseMove = this.handleMouseMove.bind(this);
        this.boundHandleMouseEnd = this.handleMouseEnd.bind(this);

        // Touch events
        this.cardElement.addEventListener('touchstart', this.boundHandleTouchStart, { passive: false });
        this.cardElement.addEventListener('touchmove', this.boundHandleTouchMove, { passive: false });
        this.cardElement.addEventListener('touchend', this.boundHandleTouchEnd, { passive: false });

        // Mouse events for desktop testing
        this.cardElement.addEventListener('mousedown', this.boundHandleMouseStart);
        this.cardElement.addEventListener('mousemove', this.boundHandleMouseMove);
        this.cardElement.addEventListener('mouseup', this.boundHandleMouseEnd);
        this.cardElement.addEventListener('mouseleave', this.boundHandleMouseEnd);
    }

    handleTouchStart(e) {
        if (!this.cardElement) return;
        // Prevent swipe if starting on input or button
        const target = e.target;
        if (target.tagName === 'INPUT' || target.tagName === 'BUTTON') {
            this.isDragging = false;
            return;
        }
        this.startX = e.touches[0].clientX;
        this.startY = e.touches[0].clientY;
        this.currentX = this.startX;
        this.currentY = this.startY;
        this.isDragging = true;
        this.swipeDirection = null;
        this.cardElement.style.transition = 'none';
    }

    handleTouchMove(e) {
        if (!this.isDragging || !this.cardElement) return;
        e.preventDefault();
        this.currentX = e.touches[0].clientX;
        this.currentY = e.touches[0].clientY;
        const deltaX = this.currentX - this.startX;
        const deltaY = this.currentY - this.startY;
        // Only handle horizontal swipes
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
            this.cardElement.style.transform = `translateX(${deltaX}px)`;
            this.cardElement.style.opacity = 1 - Math.min(Math.abs(deltaX) / 300, 0.7);
            this.swipeDirection = deltaX > 0 ? 'right' : 'left';
        }
    }

    handleTouchEnd(e) {
        if (!this.isDragging || !this.cardElement) return;
        this.isDragging = false;
        this.cardElement.style.transition = '';
        const deltaX = this.currentX - this.startX;
        if (Math.abs(deltaX) > 100 && this.swipeDirection) {
            this.onSwipeCallback(this.swipeDirection);
        } else {
            // Snap back
            this.cardElement.style.transform = 'translateX(0)';
            this.cardElement.style.opacity = '1';
        }
    }

    handleMouseStart(e) {
        if (!this.cardElement) return;
        // Prevent swipe if starting on input or button
        const target = e.target;
        if (target.tagName === 'INPUT' || target.tagName === 'BUTTON') {
            this.isDragging = false;
            return;
        }
        this.startX = e.clientX;
        this.startY = e.clientY;
        this.currentX = this.startX;
        this.currentY = this.startY;
        this.isDragging = true;
        this.swipeDirection = null;
        this.cardElement.style.transition = 'none';
        e.preventDefault();
    }

    handleMouseMove(e) {
        if (!this.isDragging || !this.cardElement) return;
        this.currentX = e.clientX;
        this.currentY = e.clientY;
        const deltaX = this.currentX - this.startX;
        const deltaY = this.currentY - this.startY;
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
            this.cardElement.style.transform = `translateX(${deltaX}px)`;
            this.cardElement.style.opacity = 1 - Math.min(Math.abs(deltaX) / 300, 0.7);
            this.swipeDirection = deltaX > 0 ? 'right' : 'left';
        }
    }

    handleMouseEnd(e) {
        if (!this.isDragging || !this.cardElement) return;
        this.isDragging = false;
        this.cardElement.style.transition = '';
        const deltaX = this.currentX - this.startX;
        if (Math.abs(deltaX) > 100 && this.swipeDirection) {
            this.onSwipeCallback(this.swipeDirection);
        } else {
            this.cardElement.style.transform = 'translateX(0)';
            this.cardElement.style.opacity = '1';
        }
    }

    cleanup() {
        if (this.cardElement) {
            this.cardElement.removeEventListener('touchstart', this.boundHandleTouchStart);
            this.cardElement.removeEventListener('touchmove', this.boundHandleTouchMove);
            this.cardElement.removeEventListener('touchend', this.boundHandleTouchEnd);
            this.cardElement.removeEventListener('mousedown', this.boundHandleMouseStart);
            this.cardElement.removeEventListener('mousemove', this.boundHandleMouseMove);
            this.cardElement.removeEventListener('mouseup', this.boundHandleMouseEnd);
            this.cardElement.removeEventListener('mouseleave', this.boundHandleMouseEnd);
            
            // Reset properties
            this.cardElement = null;
            this.onSwipeCallback = null;
            this.isDragging = false;
        }
    }
}
