/**
 * Admin Dashboard Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Check Auth (Admin Only)
    const user = await Auth.enforceAuth();
    if (!user) return; // Auth.enforceAuth handles redirect

    if (user.role !== 'admin') {
        window.location.href = 'index.html'; // Not authorized
        return;
    }

    // 2. Populate Admin Details
    document.querySelectorAll('.admin-name-display').forEach(el => el.textContent = user.name);
    document.querySelectorAll('.admin-initial-display').forEach(el => el.textContent = user.name.charAt(0).toUpperCase());

    // 3. Fetch Admin Stats
    const stats = await MockAPI.getAdminStats();

    // 4. Update Overview Cards
    document.getElementById('revenue-display').textContent = '$' + stats.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    document.getElementById('total-bookings-display').textContent = stats.total_bookings;
    document.getElementById('active-users-display').textContent = stats.active_users;
    document.getElementById('pending-inquiries-display').textContent = stats.pending_inquiries;

    const inquiryStatusEl = document.getElementById('inquiry-status-message');
    if (stats.pending_inquiries > 0) {
        inquiryStatusEl.innerHTML = `<span class="text-orange-600 text-sm font-bold">Action Needed</span>`;
    } else {
        inquiryStatusEl.innerHTML = `<span class="text-green-600 text-sm font-bold">All caught up!</span>`;
    }

    // 5. Fetch Recent Bookings
    const bookings = await MockAPI.getAllBookings();
    const recentBookings = bookings.slice(0, 10); // Limit to 10

    const bookingsTableBody = document.getElementById('recent-bookings-body');
    if (recentBookings.length === 0) {
        bookingsTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="p-8 text-center text-slate-500">No bookings found yet.</td>
            </tr>
        `;
    } else {
        bookingsTableBody.innerHTML = recentBookings.map(row => {
            let statusClass = 'bg-slate-100 text-slate-600';
            if (row.status === 'confirmed') statusClass = 'bg-green-100 text-green-700';
            if (row.status === 'pending_quote' || row.status === 'pending') statusClass = 'bg-orange-100 text-orange-700';
            if (row.status === 'cancelled') statusClass = 'bg-red-100 text-red-700';

            const amountDisplay = row.total_amount > 0 ? '$' + row.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '<span class="text-orange-600 italic">Quote Pending</span>';
            const dateDisplay = new Date(row.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

            return `
                <tr class="hover:bg-slate-50 transition">
                    <td class="p-4 font-mono font-bold text-slate-600">#TQ-${row.id}</td>
                    <td class="p-4 font-bold text-slate-900">
                        ${row.user_name}
                        <div class="text-xs text-slate-400 font-normal">${row.user_email}</div>
                    </td>
                    <td class="p-4">${row.destination_name}</td>
                    <td class="p-4 text-slate-500">${dateDisplay}</td>
                    <td class="p-4 font-bold text-slate-800">${amountDisplay}</td>
                    <td class="p-4"><span class="${statusClass} px-2 py-1 rounded text-xs font-bold uppercase">${row.status}</span></td>
                </tr>
            `;
        }).join('');
    }

    // 6. Fetch and Render Users
    async function renderUsers() {
        const users = await MockAPI.getAllUsers();
        const usersTableBody = document.getElementById('users-table-body');

        if (!usersTableBody) return;

        if (users.length === 0) {
            usersTableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="p-8 text-center text-slate-500">No users found.</td>
                </tr>
            `;
        } else {
            usersTableBody.innerHTML = users.map(u => {
                const dateJoined = new Date(u.created_at).toLocaleDateString();
                const roleBadge = u.role === 'admin'
                    ? `<span class="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-bold uppercase">Admin</span>`
                    : `<span class="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold uppercase">User</span>`;

                // Don't allow deleting self (current user) - simple check
                const isSelf = u.id === user.id;
                const deleteBtn = isSelf || u.role === 'admin'
                    ? `<button class="text-slate-300 cursor-not-allowed" disabled><i class="fas fa-trash-alt"></i></button>`
                    : `<button onclick="confirmDeleteUser(${u.id}, '${u.name}')" class="text-red-500 hover:text-red-700 transition"><i class="fas fa-trash-alt"></i></button>`;

                return `
                    <tr class="hover:bg-slate-50 transition">
                        <td class="p-4">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs">
                                    ${u.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div class="font-bold text-slate-900">${u.name}</div>
                                    <div class="text-xs text-slate-500">${u.email}</div>
                                </div>
                            </div>
                        </td>
                        <td class="p-4">${roleBadge}</td>
                        <td class="p-4 text-slate-500">${dateJoined}</td>
                        <td class="p-4 text-right">
                           ${deleteBtn}
                        </td>
                    </tr>
                `;
            }).join('');
        }
    }

    // Initial Render
    renderUsers();

    // Expose delete function to global scope so onclick works
    window.confirmDeleteUser = async (userId, userName) => {
        if (confirm(`Are you sure you want to delete user ${userName}? This action cannot be undone.`)) {
            const result = await MockAPI.deleteUser(userId);
            if (result.status === 'success') {
                alert('User deleted successfully.');
                renderUsers(); // Re-render
                // Update stats too if needed, but a page refresh is easier. 
                // Simple re-fetch stats:
                const newStats = await MockAPI.getAdminStats();
                document.getElementById('active-users-display').textContent = newStats.active_users;
            } else {
                alert('Error: ' + result.message);
            }
        }
    };
});
