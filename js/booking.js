/**
 * Booking.js - Handles booking form logic
 */

document.addEventListener('DOMContentLoaded', async () => {

    // 1. Check Auth (Allow viewing page, but will check on submit)
    /* 
    if (typeof Auth !== 'undefined') {
        const user = await Auth.enforceAuth();
        if (!user) return; 
    } 
    */

    // 2. Parse URL Parameters
    const urlParams = new URLSearchParams(window.location.search);
    let destination = urlParams.get('dest') || '';
    let basePrice = parseFloat(urlParams.get('price')) || 0;
    let duration = urlParams.get('duration') || '';

    // 3. Handle Custom Booking vs Pre-filled / Selection
    const destInput = document.getElementById('destination');
    const durationInput = document.getElementById('duration');

    const DESTINATION_PRICES = {
        "Bali, Indonesia": 899,
        "Paris, France": 1299,
        "Swiss Alps, Switzerland": 1550,
        "Tokyo, Japan": 1200,
        "Santorini, Greece": 1200,
        "Patagonia, Argentina": 1800
    };

    const DESTINATION_DURATIONS = {
        "Bali, Indonesia": "7 Days",
        "Paris, France": "5 Days",
        "Swiss Alps, Switzerland": "6 Days",
        "Tokyo, Japan": "8 Days",
        "Santorini, Greece": "6 Days",
        "Patagonia, Argentina": "10 Days"
    };

    // Always enable inputs now to allow changes
    destInput.readOnly = false;
    durationInput.readOnly = false;
    destInput.classList.remove('cursor-not-allowed', 'bg-slate-50', 'text-slate-600');
    destInput.classList.add('bg-white', 'text-slate-900', 'focus:border-blue-500', 'focus:ring-4', 'focus:ring-blue-50');

    durationInput.readOnly = false;
    durationInput.classList.remove('cursor-not-allowed', 'bg-slate-50', 'text-slate-600');
    durationInput.classList.add('bg-white', 'text-slate-900', 'focus:border-blue-500', 'focus:ring-4', 'focus:ring-blue-50');

    destInput.placeholder = "Select or enter destination";
    durationInput.placeholder = "e.g., 7 Days";

    if (destination && basePrice) {
        // Pre-filled booking initial state
        destInput.value = destination;
        durationInput.value = duration;
    }

    function handleDestinationChange() {
        const selectedDest = destInput.value;

        // 1. Check if it matches the URL-provided destination (keep special price)
        if (destination && selectedDest === destination && basePrice > 0) {
            // Keep current basePrice (from URL) - Do nothing or ensure it's set?
            // Actually, if we are here, basePrice might have been changed by previous interaction?
            // Let's use the initial URL price if we are reverting to original dest.
            const urlPrice = parseFloat(urlParams.get('price'));
            if (urlPrice) basePrice = urlPrice;
        }
        // 2. Check Dictionary
        else if (DESTINATION_PRICES[selectedDest]) {
            basePrice = DESTINATION_PRICES[selectedDest];
            duration = DESTINATION_DURATIONS[selectedDest] || duration;
            durationInput.value = duration;
        }
        // 3. Custom / Unknown
        else {
            basePrice = 0; // Custom
        }

        document.getElementById('basePriceDisplay').innerText = basePrice > 0 ? `$${basePrice.toLocaleString()}` : 'Quote Pending';
        updatePrice();
    }

    destInput.addEventListener('change', handleDestinationChange);
    destInput.addEventListener('input', handleDestinationChange); // More responsive

    document.getElementById('basePriceDisplay').innerText = basePrice > 0 ? `$${basePrice.toLocaleString()}` : 'Quote Pending';

    // 4. Price Calculation Logic
    const travelersInput = document.getElementById('travelers');
    const travelersDisplay = document.getElementById('travelersDisplay');
    const taxDisplay = document.getElementById('taxDisplay');
    const totalDisplay = document.getElementById('totalDisplay');

    function updatePrice() {
        const count = parseInt(travelersInput.value) || 1;

        if (basePrice > 0) {
            const subtotal = basePrice * count;
            const tax = subtotal * 0.10;
            const total = subtotal + tax;

            travelersDisplay.innerText = `x ${count}`;
            taxDisplay.innerText = `$${tax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            totalDisplay.innerText = `$${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            return total;
        } else {
            // Custom booking
            travelersDisplay.innerText = `x ${count}`;
            taxDisplay.innerText = 'TBD';
            totalDisplay.innerText = 'Pending Quote';
            totalDisplay.classList.remove('text-blue-600');
            totalDisplay.classList.add('text-orange-600'); // Valid visual distinction
            return 0; // 0 indicates inquiry
        }
    }

    travelersInput.addEventListener('input', updatePrice);

    // Initial Calc
    updatePrice();

    // 5. Form Submission
    const form = document.getElementById('bookingForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const customDate = document.getElementById('travelDate').value;
        const travelersCount = parseInt(travelersInput.value);
        const finalTotal = updatePrice(); // Get latest total

        const submitBtn = document.getElementById('submitBtn');
        const originalBtnText = submitBtn.innerText;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Processing...';

        try {
            // Validate user Auth again before submission
            const user = await Auth.checkAuth();
            if (user.status !== 'authenticated') {
                throw new Error("You must be logged in to book.");
            }

            const response = await MockAPI.createBooking({
                destination: destInput.value,
                date: customDate,
                travelers: travelersCount,
                total: finalTotal,
                duration: durationInput.value
            });

            if (response.status === 'success') {
                // Show Success UI
                form.classList.add('hidden');
                document.getElementById('successMessage').classList.remove('hidden');
                window.scrollTo({ top: 0, behavior: 'smooth' });

                // Update link in success message dynamically
                const dashboardLink = document.querySelector('#successMessage a');
                if (dashboardLink) dashboardLink.href = "user-dashboard.html?booking=success";
            } else {
                alert('Error: ' + response.message);
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }

        } catch (error) {
            console.error('Booking error:', error);
            alert('Booking Failed: ' + error.message);
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    });

    // Set min date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('travelDate').min = today;
});
