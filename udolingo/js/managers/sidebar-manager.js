/**
 * Sidebar Manager
 * Handles mobile sidebar collapsing and interaction
 */

import { DOM } from '../core/dom.js';
import { PlatformUtils } from '../utils/helpers.js';

export class SidebarManager {
    constructor() {
        this.isInitialized = false;
    }

    /**
     * Initialize sidebar functionality
     */
    init() {
        if (this.isInitialized) return;

        const sidebar = DOM.get('sidebar');
        const sidebarHeader = DOM.get('sidebarHeader');
        
        if (!sidebar || !sidebarHeader) {
            console.warn('Sidebar elements not found');
            return;
        }

        // Initially collapse sidebar on mobile
        if (PlatformUtils.isMobile()) {
            sidebar.classList.add('collapsed');
        }

        // Toggle sidebar when header is clicked on mobile
        sidebarHeader.addEventListener('click', () => {
            if (PlatformUtils.isMobile()) {
                this.toggleSidebar();
            }
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        this.isInitialized = true;
        console.log('Sidebar manager initialized');
    }

    /**
     * Handle window resize events
     */
    handleResize() {
        const sidebar = DOM.get('sidebar');
        if (!sidebar) return;

        if (window.innerWidth > 768) {
            // Remove collapsed class on desktop
            sidebar.classList.remove('collapsed');
        } else if (!sidebar.classList.contains('collapsed')) {
            // Auto-collapse on mobile if not already collapsed
            sidebar.classList.add('collapsed');
        }
    }

    /**
     * Toggle sidebar visibility
     */
    toggleSidebar() {
        const sidebar = DOM.get('sidebar');
        if (sidebar) {
            sidebar.classList.toggle('collapsed');
        }
    }

    /**
     * Collapse sidebar
     */
    collapseSidebar() {
        const sidebar = DOM.get('sidebar');
        if (sidebar && PlatformUtils.isMobile()) {
            sidebar.classList.add('collapsed');
        }
    }

    /**
     * Expand sidebar
     */
    expandSidebar() {
        const sidebar = DOM.get('sidebar');
        if (sidebar) {
            sidebar.classList.remove('collapsed');
        }
    }

    /**
     * Check if sidebar is collapsed
     */
    isCollapsed() {
        const sidebar = DOM.get('sidebar');
        return sidebar ? sidebar.classList.contains('collapsed') : false;
    }
}