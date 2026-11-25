// Compares the hourly portion of a local move using rates supplied by the build.
// It never predicts duration, adds route charges, or sends a quote request.
export function calculateHourlySubtotal(rate, hours) {
    if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0 || typeof hours !== 'number' || !Number.isFinite(hours) || hours < 0) return null;
    const subtotal = Math.round(rate * Math.max(3, hours) * 100) / 100;
    return Number.isFinite(subtotal) ? subtotal : null;
}

if (typeof document !== 'undefined') {
    document.querySelectorAll('[data-moving-cost-calculator]').forEach(calculator => {
        const rates = JSON.parse(calculator.dataset.rates);
        const crew = calculator.querySelector('[name="calculator-crew"]');
        const payment = calculator.querySelector('[name="calculator-payment"]');
        const hours = calculator.querySelector('[name="calculator-hours"]');
        const result = calculator.querySelector('[data-calculator-result]');
        const explanation = calculator.querySelector('[data-calculator-explanation]');
        const money = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(value);
        function updateSubtotal() {
            const rate = rates[crew.value]?.[payment.value];
            const requestedHours = hours.value.trim() === '' ? NaN : Number(hours.value);
            const subtotal = hours.validity.valid ? calculateHourlySubtotal(rate, requestedHours) : null;
            hours.setAttribute('aria-invalid', subtotal === null ? 'true' : 'false');
            result.textContent = subtotal === null ? 'Enter valid hours' : money(subtotal);
            explanation.textContent = subtotal === null ? 'Enter zero or a positive number of billable hours.' : `${Math.max(3, requestedHours)} hours × ${money(rate)}/hour${requestedHours < 3 ? ' · Three-hour minimum applied' : ''}`;
        }
        calculator.querySelector('fieldset').hidden = false;
        calculator.addEventListener('input', updateSubtotal);
        calculator.addEventListener('change', updateSubtotal);
        updateSubtotal();
    });
}
