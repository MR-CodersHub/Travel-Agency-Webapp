/**
 * Auth.js - Handles frontend authentication via MockAPI
 */

const Auth = {
    // Check if user is logged in
    checkAuth: async () => {
        // Ensure MockAPI is loaded
        if (typeof MockAPI === 'undefined') {
            console.error('MockAPI not loaded');
            return { status: 'error' };
        }
        return await MockAPI.checkAuth();
    },

    // Login function
    login: async (email, password) => {
        try {
            const response = await MockAPI.login(email, password);

            if (response.status === 'success') {
                if (response.user.role === 'admin') {
                    window.location.href = 'admin/dashboard.html';
                } else {
                    window.location.href = 'user/dashboard.html';
                }
                return { success: true };
            } else {
                return { success: false, message: response.message };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'System error. Please try again.' };
        }
    },

    // Signup function
    signup: async (name, email, password) => {
        try {
            const response = await MockAPI.signup(name, email, password);

            if (response.status === 'success') {
                window.location.href = 'login.html?registered=true';
                return { success: true };
            } else {
                return { success: false, message: response.message };
            }
        } catch (error) {
            console.error('Signup error:', error);
            return { success: false, message: 'System error. Please try again.' };
        }
    },

    // Logout function
    logout: async () => {
        try {
            await MockAPI.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Always redirect to home, works from both root and subdirectories (admin/, user/)
            const isSubDir = window.location.pathname.includes('/admin/') || window.location.pathname.includes('/user/');
            window.location.href = isSubDir ? '../index.html' : 'index.html';
        }
    },

    // Toggle Dropdown
    toggleDropdown: () => {
        const dropdown = document.getElementById('auth-dropdown');
        if (dropdown) dropdown.classList.toggle('hidden');
    },

    // Toggle Mobile Menu
    toggleMenu: () => {
        const menu = document.getElementById('mobile-menu');
        const icon = document.querySelector('#menu-toggle i');
        if (menu) {
            const isOpen = menu.classList.toggle('open');
            // Prevent body scroll when menu is open
            document.body.style.overflow = isOpen ? 'hidden' : '';

            // Toggle icon
            if (icon) {
                if (isOpen) {
                    icon.classList.replace('fa-bars', 'fa-times');
                } else {
                    icon.classList.replace('fa-times', 'fa-bars');
                }
            }
        }
    },

    // Initialize Navbar UI
    initNavbar: async () => {
        const dropdownContent = document.getElementById('dropdown-content');
        if (!dropdownContent) return;

        // Path detection to ensure links work from subdirectories
        const isSubDir = window.location.pathname.includes('/admin/') || window.location.pathname.includes('/user/');
        const prefix = isSubDir ? '../' : './';
        const adminPath = prefix + 'admin/dashboard.html';
        const userPath = prefix + 'user/dashboard.html';
        const loginPath = prefix + 'login.html';

        dropdownContent.innerHTML = `
            <a href="${adminPath}" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition font-semibold">
                <i class="fas fa-user-shield w-4 mr-2 text-blue-600"></i> Admin
            </a>
            <a href="${userPath}" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition font-semibold">
                <i class="fas fa-user w-4 mr-2 text-blue-600"></i> User
            </a>
            <div class="border-t border-gray-100 my-1"></div>
            <a href="${loginPath}" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition font-semibold">
                <i class="fas fa-sign-in-alt w-4 mr-2 text-blue-600"></i> Login
            </a>
        `;
    },

    // Protect routes - Modified to allow access without credentials
    enforceAuth: async () => {
        const authData = await Auth.checkAuth();
        // If not authenticated, return a default mock user instead of redirecting
        if (authData.status !== 'authenticated') {
            return {
                id: 999,
                name: 'Guest Explorer',
                email: 'guest@terraquest.com',
                role: 'admin', // Default to admin role to allow seeing everything
                created_at: new Date().toISOString()
            };
        } else {
            return authData.user;
        }
    }
};

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('auth-dropdown');
    const trigger = document.getElementById('auth-trigger');

    if (dropdown && !dropdown.classList.contains('hidden')) {
        if (trigger && !trigger.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.add('hidden');
        }
    }
});

// Run init on load
document.addEventListener('DOMContentLoaded', () => {
    Auth.initNavbar();

    // Global fix for mobile menu classes/breakpoints to ensure consistency across all pages
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu) {
        mobileMenu.classList.remove('md:hidden', 'fixed', 'inset-0', 'z-[60]', 'translate-x-full', 'p-8');
        mobileMenu.classList.add('lg:hidden');
    }
});
