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
                    window.location.href = 'admin-dashboard.html';
                } else {
                    window.location.href = 'user-dashboard.html';
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
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Logout error:', error);
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
        if (menu) {
            menu.classList.toggle('open');
            // Prevent body scroll when menu is open
            document.body.style.overflow = menu.classList.contains('open') ? 'hidden' : '';
        }
    },

    // Initialize Navbar UI
    initNavbar: async () => {
        const dropdownContent = document.getElementById('dropdown-content');
        if (!dropdownContent) return;

        const authData = await Auth.checkAuth();

        if (authData.status === 'authenticated') {
            const user = authData.user;
            const dashboardLink = user.role === 'admin' ? 'admin-dashboard.html' : 'user-dashboard.html';
            dropdownContent.innerHTML = `
                <div class="px-4 py-3 border-b border-gray-100">
                    <p class="text-sm font-bold text-gray-900 truncate">${user.name}</p>
                    <p class="text-xs text-gray-500 truncate">${user.email}</p>
                </div>
                <a href="${dashboardLink}" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition">
                    <i class="fas fa-th-large w-4 mr-2 text-blue-500"></i> Dashboard
                </a>

                <div class="border-t border-gray-100"></div>
                <button onclick="Auth.logout()" class="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition">
                    <i class="fas fa-sign-out-alt w-4 mr-2"></i> Log Out
                </button>
            `;
        } else {
            dropdownContent.innerHTML = `
                <a href="login.html" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition font-semibold">
                    <i class="fas fa-sign-in-alt w-4 mr-2 text-blue-600"></i> Login
                </a>
                <a href="signup.html" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition font-semibold">
                    <i class="fas fa-user-plus w-4 mr-2 text-blue-600"></i> Sign Up
                </a>
            `;
        }
    },

    // Protect routes
    enforceAuth: async () => {
        const authData = await Auth.checkAuth();
        if (authData.status !== 'authenticated') {
            window.location.href = 'login.html';
            return null;
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
});
