/**
 * MockAPI.js
 * Simulates a backend API using localStorage.
 * Handles Users, Auth, and Bookings.
 */

const MockAPI = {
    // delay for realism
    delay: (ms = 500) => new Promise(resolve => setTimeout(resolve, ms)),

    // Initialize data if empty
    init: () => {
        let users = JSON.parse(localStorage.getItem('terraquest_users') || 'null');

        if (!users) {
            users = [
                { id: 1, name: 'Admin User', email: 'admin@gmail.com', password: 'admin123', role: 'admin', created_at: new Date().toISOString() },
                { id: 2, name: 'John Doe', email: 'user@terraquest.com', password: 'password123', role: 'user', created_at: new Date().toISOString() }
            ];
            localStorage.setItem('terraquest_users', JSON.stringify(users));
        } else {
            // Ensure admin@gmail.com exists (Update for existing sessions)
            const adminParams = { name: 'Admin User', email: 'admin@gmail.com', password: 'admin123', role: 'admin' };
            const existingAdmin = users.find(u => u.email === adminParams.email);

            if (!existingAdmin) {
                users.push({ id: Date.now(), ...adminParams, created_at: new Date().toISOString() });
                localStorage.setItem('terraquest_users', JSON.stringify(users));
            } else {
                // Force update role and password if they don't match (for dev convenience)
                let updated = false;
                if (existingAdmin.role !== 'admin') { existingAdmin.role = 'admin'; updated = true; }
                if (existingAdmin.password !== 'admin123') { existingAdmin.password = 'admin123'; updated = true; }

                if (updated) {
                    localStorage.setItem('terraquest_users', JSON.stringify(users));
                }
            }
        }
        if (!localStorage.getItem('terraquest_bookings')) {
            localStorage.setItem('terraquest_bookings', JSON.stringify([]));
        }
    },

    // --- AUTH ---
    login: async (email, password) => {
        await MockAPI.delay();
        const users = JSON.parse(localStorage.getItem('terraquest_users') || '[]');
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            // "Session" is just storing the current user ID in localStorage
            localStorage.setItem('terraquest_session', JSON.stringify({ userId: user.id, role: user.role }));
            return { status: 'success', user: { id: user.id, name: user.name, email: user.email, role: user.role } };
        }
        return { status: 'error', message: 'Invalid credentials' };
    },

    signup: async (name, email, password) => {
        await MockAPI.delay();
        const users = JSON.parse(localStorage.getItem('terraquest_users') || '[]');

        if (users.find(u => u.email === email)) {
            return { status: 'error', message: 'Email already exists' };
        }

        const newUser = {
            id: users.length + 1,
            name,
            email,
            password,
            role: 'user', // Default role
            created_at: new Date().toISOString()
        };

        users.push(newUser);
        localStorage.setItem('terraquest_users', JSON.stringify(users));
        return { status: 'success' };
    },

    checkAuth: async () => {
        // No delay for auth check to avoid flickering
        const session = JSON.parse(localStorage.getItem('terraquest_session'));
        if (!session) return { status: 'guest' };

        const users = JSON.parse(localStorage.getItem('terraquest_users') || '[]');
        const user = users.find(u => u.id === session.userId);

        if (user) {
            return { status: 'authenticated', user: { id: user.id, name: user.name, email: user.email, role: user.role, created_at: user.created_at } };
        }

        // Invalid session
        localStorage.removeItem('terraquest_session');
        return { status: 'guest' };
    },

    logout: async () => {
        await MockAPI.delay(300);
        localStorage.removeItem('terraquest_session');
        return { status: 'success' };
    },

    // --- BOOKINGS ---
    createBooking: async (bookingData) => {
        await MockAPI.delay();
        const bookings = JSON.parse(localStorage.getItem('terraquest_bookings') || '[]');
        const session = JSON.parse(localStorage.getItem('terraquest_session'));

        if (!session) return { status: 'error', message: 'Unauthorized' };

        // Determine status based on total (if custom/pending quote)
        let status = 'confirmed';
        if (!bookingData.total || bookingData.total <= 0) {
            status = 'pending_quote';
        }

        const newBooking = {
            id: bookings.length + 1001, // Start IDs from 1001
            user_id: session.userId,
            destination_name: bookingData.destination,
            travel_date: bookingData.date,
            travelers_count: bookingData.travelers,
            total_amount: bookingData.total || 0,
            status: status,
            duration: bookingData.duration || 'Custom',
            created_at: new Date().toISOString()
        };

        bookings.push(newBooking);
        localStorage.setItem('terraquest_bookings', JSON.stringify(bookings));
        return { status: 'success', booking_id: newBooking.id };
    },

    getUserBookings: async (userId) => {
        await MockAPI.delay();
        const bookings = JSON.parse(localStorage.getItem('terraquest_bookings') || '[]');
        // If userId is not provided, try to get from session
        if (!userId) {
            const session = JSON.parse(localStorage.getItem('terraquest_session'));
            if (!session) return [];
            userId = session.userId;
        }

        return bookings.filter(b => b.user_id === userId).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    },

    getAllBookings: async () => { // For Admin
        await MockAPI.delay();
        const bookings = JSON.parse(localStorage.getItem('terraquest_bookings') || '[]');
        // Join with user data
        const users = JSON.parse(localStorage.getItem('terraquest_users') || '[]');

        return bookings.map(b => {
            const user = users.find(u => u.id === b.user_id);
            return {
                ...b,
                user_name: user ? user.name : 'Unknown',
                user_email: user ? user.email : 'Unknown'
            };
        }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    },

    // --- USER MANAGEMENT (Admin) ---
    getAllUsers: async () => {
        await MockAPI.delay();
        return JSON.parse(localStorage.getItem('terraquest_users') || '[]');
    },

    deleteUser: async (userId) => {
        await MockAPI.delay();
        let users = JSON.parse(localStorage.getItem('terraquest_users') || '[]');

        // Prevent deleting self or last admin could be a check, but for now simple delete
        const userToDelete = users.find(u => u.id === userId);
        if (!userToDelete) return { status: 'error', message: 'User not found' };
        if (userToDelete.role === 'admin') return { status: 'error', message: 'Cannot delete admin users' };

        users = users.filter(u => u.id !== userId);
        localStorage.setItem('terraquest_users', JSON.stringify(users));
        return { status: 'success' };
    },

    // --- CONTACT MESSAGES ---
    saveContactMessage: async (msgData) => {
        await MockAPI.delay();
        const messages = JSON.parse(localStorage.getItem('terraquest_messages') || '[]');
        const newMessage = {
            id: messages.length + 1,
            ...msgData,
            created_at: new Date().toISOString(),
            status: 'unread'
        };
        messages.push(newMessage);
        localStorage.setItem('terraquest_messages', JSON.stringify(messages));
        return { status: 'success' };
    },

    getContactMessages: async () => {
        await MockAPI.delay();
        return JSON.parse(localStorage.getItem('terraquest_messages') || '[]').sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    },

    // --- DASHBOARD STATS (Admin) ---
    getAdminStats: async () => {
        await MockAPI.delay();
        const bookings = JSON.parse(localStorage.getItem('terraquest_bookings') || '[]');
        const users = JSON.parse(localStorage.getItem('terraquest_users') || '[]');

        const revenue = bookings
            .filter(b => b.status === 'confirmed')
            .reduce((sum, b) => sum + (b.total_amount || 0), 0);

        const totalBookings = bookings.length;
        const activeUsers = users.filter(u => u.role === 'user').length;
        const pendingInquiries = bookings.filter(b => ['pending', 'pending_quote'].includes(b.status)).length;

        return {
            revenue,
            total_bookings: totalBookings,
            active_users: activeUsers,
            pending_inquiries: pendingInquiries
        };
    },

    // --- HELPER: IMAGES ---
    getDestinationImage: (destinationName) => {
        // Simple mapping of destinations to Unsplash images
        const images = {
            'Bali, Indonesia': 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800',
            'Paris, France': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800',
            'Swiss Alps, Switzerland': 'https://images.unsplash.com/photo-1502784444187-359ac186c5bb?auto=format&fit=crop&q=80&w=800',
            'Tokyo, Japan': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=800',
            'Santorini, Greece': 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800',
            'Patagonia, Argentina': 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&q=80&w=800',
            'Swiss Alps': 'https://images.unsplash.com/photo-1502784444187-359ac186c5bb?auto=format&fit=crop&q=80&w=800'
        };
        // Normalize name to check for partial matches if needed, but for now exact match or fallback
        return images[destinationName] || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800';
    }
};

// Initialize DB on load
MockAPI.init();
