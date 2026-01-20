/**
 * User Dashboard Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Check Auth
    const user = await Auth.enforceAuth();
    if (!user) return; // Auth.enforceAuth handles redirect

    // 2. Populate User Details
    document.querySelectorAll('.user-name-display').forEach(el => el.textContent = user.name);
    document.querySelectorAll('.user-first-name-display').forEach(el => el.textContent = user.name.split(' ')[0]);
    document.querySelectorAll('.user-email-display').forEach(el => el.textContent = user.email);
    document.querySelectorAll('.user-initial-display').forEach(el => el.textContent = user.name.charAt(0).toUpperCase());

    if (user.created_at) {
        const dateDate = new Date(user.created_at);
        const options = { year: 'numeric', month: 'long' };
        document.querySelectorAll('.member-since-display').forEach(el => el.textContent = dateDate.toLocaleDateString('en-US', options));
    }

    // 3. Fetch Bookings
    const bookings = await MockAPI.getUserBookings(user.id);

    // 4. Calculate Stats
    let totalSpent = 0;
    const countriesVisited = new Set();
    let upcomingTrip = null;

    bookings.forEach(b => {
        if (b.status === 'confirmed') {
            totalSpent += b.total_amount;

            // Extract country (simple heuristic)
            const parts = b.destination_name.split(',');
            if (parts.length > 1) {
                countriesVisited.add(parts[parts.length - 1].trim());
            } else {
                countriesVisited.add(b.destination_name);
            }
        }

        const tripDate = new Date(b.travel_date);
        if (tripDate > new Date() && b.status === 'confirmed') {
            if (!upcomingTrip || tripDate < new Date(upcomingTrip.travel_date)) {
                upcomingTrip = b;
            }
        }
    });

    // 5. Update UI with Stats
    document.getElementById('total-spent-display').textContent = '$' + totalSpent.toLocaleString();
    document.getElementById('countries-count-display').textContent = countriesVisited.size;

    // Upcoming Trip Card
    const upcomingContainer = document.getElementById('upcoming-trip-container');
    if (upcomingTrip) {
        const daysUntil = Math.ceil((new Date(upcomingTrip.travel_date) - new Date()) / (1000 * 60 * 60 * 24));

        upcomingContainer.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <div class="p-3 bg-white/20 rounded-xl">
                    <i class="fas fa-plane-departure text-xl"></i>
                </div>
                <span class="bg-white/20 px-3 py-1 rounded-full text-xs font-bold">In ${daysUntil} Days</span>
            </div>
            <h3 class="text-3xl font-bold mb-1">${upcomingTrip.destination_name}</h3>
            <p class="opacity-90">Upcoming Adventure</p>
        `;

        // Update Next Adventure Section
        const nextAdventureSection = document.getElementById('next-adventure-section');
        if (nextAdventureSection) {
            nextAdventureSection.innerHTML = `
                <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div class="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h3 class="font-bold text-lg">Next Adventure</h3>
                    </div>
                    <div class="p-6 flex flex-col md:flex-row gap-6">
                        <div class="w-full md:w-48 h-32 bg-slate-100 rounded-xl overflow-hidden shrink-0">
                                <img src="${MockAPI.getDestinationImage(upcomingTrip.destination_name)}" class="w-full h-full object-cover">
                        </div>
                        
                        <div class="flex-1">
                            <div class="flex justify-between items-start mb-2">
                                <div>
                                    <h4 class="text-xl font-bold text-slate-900">${upcomingTrip.destination_name}</h4>
                                    <p class="text-slate-500 text-sm"><i class="fas fa-calendar-alt mr-1"></i> ${new Date(upcomingTrip.travel_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                </div>
                                <span class="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">Confirmed</span>
                            </div>
                            <div class="grid grid-cols-2 gap-4 mt-4 text-sm">
                                <div>
                                    <p class="text-slate-400 text-xs uppercase font-bold">Travelers</p>
                                    <p class="font-semibold text-slate-700">${upcomingTrip.travelers_count} Adults</p>
                                </div>
                                <div>
                                    <p class="text-slate-400 text-xs uppercase font-bold">Amount Paid</p>
                                    <p class="font-semibold text-slate-700">$${upcomingTrip.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                </div>
                            </div>
                        </div>
                        <div class="flex items-center">
                            <button class="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition">View Details</button>
                        </div>
                    </div>
                </div>
            `;
        }

    } else {
        upcomingContainer.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <div class="p-3 bg-white/20 rounded-xl">
                    <i class="fas fa-plane-departure text-xl"></i>
                </div>
                <span class="bg-white/20 px-3 py-1 rounded-full text-xs font-bold">No Trips</span>
            </div>
            <h3 class="text-3xl font-bold mb-1">Plan a Trip</h3>
            <p class="opacity-90">Explore Destinations</p>
        `;

        const nextAdventureSection = document.getElementById('next-adventure-section');
        if (nextAdventureSection) {
            nextAdventureSection.innerHTML = `
                <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
                    <div class="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-compass text-2xl"></i>
                    </div>
                    <h3 class="text-xl font-bold text-slate-900 mb-2">No trips planned yet?</h3>
                    <p class="text-slate-500 mb-6">Your next adventure is just a click away.</p>
                    <a href="destinations.html" class="bg-blue-600 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200">
                        Explore Destinations
                    </a>
                </div>
            `;
        }
    }

    // 6. Render Bookings List
    const bookingsContainer = document.getElementById('bookings-container');
    if (bookings.length === 0) {
        bookingsContainer.innerHTML = `
            <div class="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-300">
                <p class="text-slate-500 mb-4">You haven't booked any trips yet.</p>
                <a href="destinations.html" class="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition">Explore Destinations</a>
            </div>
        `;
    } else {
        bookingsContainer.innerHTML = bookings.map(booking => {
            const dateObj = new Date(booking.travel_date);
            const month = dateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
            const day = dateObj.toLocaleDateString('en-US', { day: '2-digit' });
            const year = dateObj.getFullYear();

            let statusColor = 'text-green-600 bg-green-50';
            if (booking.status === 'pending_quote') statusColor = 'text-orange-600 bg-orange-50';
            if (booking.status === 'cancelled') statusColor = 'text-red-600 bg-red-50';

            const amountDisplay = booking.total_amount > 0 ? `$${booking.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '<span class="text-orange-600">Quote Pending</span>';

            return `
                <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col md:flex-row gap-6 hover:shadow-md transition">
                    <div class="w-full md:w-24 h-24 bg-blue-50 rounded-xl flex flex-col items-center justify-center shrink-0 text-blue-600">
                        <span class="text-xl font-bold">${month}</span>
                        <span class="text-3xl font-bold">${day}</span>
                        <span class="text-xs font-bold opacity-60">${year}</span>
                    </div>
                    <div class="flex-1">
                        <div class="flex flex-col md:flex-row justify-between md:items-start gap-4 mb-4">
                            <div>
                                <h3 class="text-lg font-bold text-slate-900">${booking.destination_name}</h3>
                                <p class="text-slate-500 text-sm">Booking ID: #TQ-${booking.id}</p>
                                <p class="text-slate-500 text-sm mt-1 mb-1"><i class="fas fa-user-friends mr-1"></i> ${booking.travelers_count} Travelers</p>
                                <p class="text-xs text-slate-400">Booked on ${new Date(booking.created_at).toLocaleDateString()}</p>
                            </div>
                            <div class="text-left md:text-right">
                                <span class="text-lg font-bold text-slate-900">${amountDisplay}</span>
                                <span class="block text-xs font-bold uppercase mt-1 ${statusColor} px-2 py-1 rounded w-fit md:ml-auto">${booking.status}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
});
