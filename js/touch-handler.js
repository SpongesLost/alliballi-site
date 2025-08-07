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
        this.didSwipe = false; // Track if a swipe occurred
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
        this.boundHandleClick = this.handleClick.bind(this);

        // Touch events
        this.cardElement.addEventListener('touchstart', this.boundHandleTouchStart, { passive: false });
        this.cardElement.addEventListener('touchmove', this.boundHandleTouchMove, { passive: false });
        this.cardElement.addEventListener('touchend', this.boundHandleTouchEnd, { passive: false });

        // Mouse events for desktop testing
        this.cardElement.addEventListener('mousedown', this.boundHandleMouseStart);
        this.cardElement.addEventListener('mousemove', this.boundHandleMouseMove);
        this.cardElement.addEventListener('mouseup', this.boundHandleMouseEnd);
        this.cardElement.addEventListener('mouseleave', this.boundHandleMouseEnd);
        
        // Click event to prevent clicks after swipes
        this.cardElement.addEventListener('click', this.boundHandleClick, { capture: true });
    }

    handleClick(e) {
        // Prevent click if we just performed a swipe
        if (this.didSwipe) {
            e.preventDefault();
            e.stopPropagation();
            this.didSwipe = false;
        }
    }

    handleTouchStart(e) {
        if (!this.cardElement) return;
        this.startX = e.touches[0].clientX;
        this.startY = e.touches[0].clientY;
        this.currentX = this.startX;
        this.currentY = this.startY;
        this.isDragging = true;
        this.swipeDirection = null;
        this.didSwipe = false;
        this.cardElement.style.transition = 'none';
    }

    handleTouchMove(e) {
        if (!this.isDragging || !this.cardElement) return;
        this.currentX = e.touches[0].clientX;
        this.currentY = e.touches[0].clientY;
        const deltaX = this.currentX - this.startX;
        const deltaY = this.currentY - this.startY;
        
        // Only handle horizontal swipes and prevent default only when actually swiping
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
            e.preventDefault();
            this.cardElement.style.transform = `translateX(${deltaX}px)`;
            this.cardElement.style.opacity = 1 - Math.min(Math.abs(deltaX) / 300, 0.7);
            this.swipeDirection = deltaX > 0 ? 'right' : 'left';
            this.didSwipe = true; // Mark that we performed a swipe
        }
    }

    handleTouchEnd(e) {
        if (!this.isDragging || !this.cardElement) return;
        this.isDragging = false;
        this.cardElement.style.transition = '';
        const deltaX = this.currentX - this.startX;
        if (Math.abs(deltaX) > 100 && this.swipeDirection) {
            this.didSwipe = true;
            this.onSwipeCallback(this.swipeDirection);
        } else {
            this.cardElement.style.transform = 'translateX(0)';
            this.cardElement.style.opacity = '1';
        }
    }

    handleMouseStart(e) {
        if (!this.cardElement) return;
        this.startX = e.clientX;
        this.startY = e.clientY;
        this.currentX = this.startX;
        this.currentY = this.startY;
        this.isDragging = true;
        this.swipeDirection = null;
        this.didSwipe = false;
        this.cardElement.style.transition = 'none';
    }

    handleMouseMove(e) {
        if (!this.isDragging || !this.cardElement) return;
        this.currentX = e.clientX;
        this.currentY = e.clientY;
        const deltaX = this.currentX - this.startX;
        const deltaY = this.currentY - this.startY;
        
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
            e.preventDefault();
            this.cardElement.style.transform = `translateX(${deltaX}px)`;
            this.cardElement.style.opacity = 1 - Math.min(Math.abs(deltaX) / 300, 0.7);
            this.swipeDirection = deltaX > 0 ? 'right' : 'left';
            this.didSwipe = true;
        }
    }

    handleMouseEnd(e) {
        if (!this.isDragging || !this.cardElement) return;
        this.isDragging = false;
        this.cardElement.style.transition = '';
        const deltaX = this.currentX - this.startX;
        if (Math.abs(deltaX) > 100 && this.swipeDirection) {
            this.didSwipe = true;
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
            this.cardElement.removeEventListener('click', this.boundHandleClick);
            
            this.cardElement = null;
            this.onSwipeCallback = null;
            this.isDragging = false;
            this.didSwipe = false;
        }
    }
}
