/* ===================================
   SPLENDID MOVING - Interactive Features
   =================================== */

document.addEventListener('DOMContentLoaded', function () {
    // Initialize all modules
    initStickyHeader();
    initMobileNav();
    initSmoothScroll();
    initTestimonialsCarousel();
    initFaqAccordion();
    initScrollAnimations();
    initScrollToTop();
});

/* ===================================
   Sticky Header
   =================================== */

function initStickyHeader() {
    const header = document.getElementById('header');
    const scrollThreshold = 50;

    function updateHeader() {
        if (window.scrollY > scrollThreshold) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }

    window.addEventListener('scroll', updateHeader, { passive: true });
    updateHeader(); // Check on load
}

/* ===================================
   Mobile Navigation
   =================================== */

function initMobileNav() {
    const toggle = document.getElementById('nav-toggle');
    const menu = document.getElementById('nav-menu');

    if (!toggle || !menu) return;

    toggle.addEventListener('click', function () {
        const isOpen = menu.classList.toggle('active');
        toggle.classList.toggle('active');
        toggle.setAttribute('aria-expanded', isOpen);

        // Prevent body scroll when menu is open
        document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close menu when clicking a link
    menu.querySelectorAll('.nav__link').forEach(link => {
        link.addEventListener('click', function () {
            menu.classList.remove('active');
            toggle.classList.remove('active');
            document.body.style.overflow = '';
        });
    });
}

/* ===================================
   Smooth Scroll
   =================================== */

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (!targetElement) return;

            e.preventDefault();

            const headerHeight = document.getElementById('header').offsetHeight;
            const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - headerHeight - 20;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        });
    });
}

/* ===================================
   Testimonials Carousel
   =================================== */

function initTestimonialsCarousel() {
    const carousel = document.getElementById('testimonials-carousel');
    if (!carousel) return;

    const track = carousel.querySelector('.testimonials__track');
    const prevBtn = carousel.querySelector('.testimonials__btn--prev');
    const nextBtn = carousel.querySelector('.testimonials__btn--next');

    if (!track || !prevBtn || !nextBtn) return;

    const cards = track.querySelectorAll('.testimonial-card');
    let currentIndex = 0;

    function getVisibleCards() {
        const width = window.innerWidth;
        if (width >= 1024) return 3;
        if (width >= 768) return 2;
        return 1;
    }

    function scrollToCard(index) {
        const visibleCards = getVisibleCards();
        const maxIndex = Math.max(0, cards.length - visibleCards);
        currentIndex = Math.max(0, Math.min(index, maxIndex));

        const card = cards[currentIndex];
        if (card) {
            const trackRect = track.getBoundingClientRect();
            const cardRect = card.getBoundingClientRect();
            const scrollLeft = card.offsetLeft - track.offsetLeft;

            track.scrollTo({
                left: scrollLeft,
                behavior: 'smooth'
            });
        }

        updateButtons();
    }

    function updateButtons() {
        const visibleCards = getVisibleCards();
        const maxIndex = Math.max(0, cards.length - visibleCards);

        prevBtn.disabled = currentIndex === 0;
        nextBtn.disabled = currentIndex >= maxIndex;

        prevBtn.style.opacity = currentIndex === 0 ? '0.5' : '1';
        nextBtn.style.opacity = currentIndex >= maxIndex ? '0.5' : '1';
    }

    prevBtn.addEventListener('click', () => scrollToCard(currentIndex - 1));
    nextBtn.addEventListener('click', () => scrollToCard(currentIndex + 1));

    // Handle resize
    window.addEventListener('resize', () => {
        scrollToCard(currentIndex);
    });

    updateButtons();
}

/* ===================================
   FAQ Accordion
   =================================== */

function initFaqAccordion() {
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const header = item.querySelector('.faq-item__header');

        header.addEventListener('click', function () {
            const isActive = item.classList.contains('active');

            // Close all other items
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                    otherItem.querySelector('.faq-item__header').setAttribute('aria-expanded', 'false');
                }
            });

            // Toggle current item
            item.classList.toggle('active');
            header.setAttribute('aria-expanded', !isActive);
        });
    });
}

/* ===================================
   Scroll Animations (AOS Alternative)
   =================================== */

function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('[data-aos]');

    if (!animatedElements.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('aos-animate');
                // Optionally unobserve after animation
                // observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    animatedElements.forEach(el => observer.observe(el));
}

/* ===================================
   Utility Functions
   =================================== */

// Debounce function for performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function for scroll events
function throttle(func, limit) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/* ===================================
   Scroll to Top Button
   =================================== */

function initScrollToTop() {
    const scrollBtn = document.getElementById('scroll-top');
    if (!scrollBtn) return;

    const scrollThreshold = 400;

    function updateButton() {
        if (window.scrollY > scrollThreshold) {
            scrollBtn.classList.add('visible');
        } else {
            scrollBtn.classList.remove('visible');
        }
    }

    window.addEventListener('scroll', updateButton, { passive: true });
    updateButton();

    scrollBtn.addEventListener('click', function () {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

/* ===================================
   Quote Modal
   =================================== */

function initQuoteModal() {
    const modal = document.getElementById('quote-modal');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalClose = document.getElementById('modal-close');
    const modalDone = document.getElementById('modal-done');
    const formView = document.getElementById('quote-form-view');
    const successView = document.getElementById('quote-success-view');
    const form = document.getElementById('quote-form');

    if (!modal) return;

    // Get all quote buttons
    const quoteButtons = document.querySelectorAll('a[href="#quote"], .mobile-cta__btn--quote');

    function openModal(e) {
        if (e) e.preventDefault();
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        // Reset to form view
        formView.style.display = 'block';
        successView.style.display = 'none';
    }

    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    function showSuccess() {
        formView.style.display = 'none';
        successView.style.display = 'block';
    }

    // Event listeners
    quoteButtons.forEach(btn => {
        btn.addEventListener('click', openModal);
    });

    modalOverlay.addEventListener('click', closeModal);
    modalClose.addEventListener('click', closeModal);
    if (modalDone) {
        modalDone.addEventListener('click', closeModal);
    }

    // Close on escape key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });

    // Form submission
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        // Validate addresses were selected from dropdown
        const addressFromFull = document.getElementById('address-from-full').value;
        const addressToFull = document.getElementById('address-to-full').value;
        const addressFromInput = document.getElementById('address-from');
        const addressToInput = document.getElementById('address-to');

        let isValid = true;

        if (!addressFromFull) {
            addressFromInput.classList.add('error');
            addressFromInput.classList.remove('selected');
            isValid = false;
        }

        if (!addressToFull) {
            addressToInput.classList.add('error');
            addressToInput.classList.remove('selected');
            isValid = false;
        }

        if (!isValid) {
            alert('Please select addresses from the dropdown suggestions to ensure we have the complete address including zip code.');
            return;
        }

        // Collect form data (for future use)
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        console.log('Quote form submitted:', data);

        // Show success screen
        showSuccess();

        // Reset form
        form.reset();
        addressFromInput.classList.remove('selected');
        addressToInput.classList.remove('selected');
        document.getElementById('address-from-full').value = '';
        document.getElementById('address-to-full').value = '';
    });
}

/* ===================================
   Google Places Address Autocomplete
   =================================== */

// This function is called by the Google Maps API callback
function initAddressAutocomplete() {
    const addressFromInput = document.getElementById('address-from');
    const addressToInput = document.getElementById('address-to');

    if (!addressFromInput || !addressToInput) return;

    const options = {
        types: ['address'],
        componentRestrictions: { country: 'us' }
    };

    // Helper function to format address as "Street, City, State ZIP"
    function formatAddress(place) {
        const components = place.address_components || [];
        let streetNumber = '';
        let streetName = '';
        let city = '';
        let state = '';
        let zip = '';

        components.forEach(comp => {
            const types = comp.types;
            if (types.includes('street_number')) {
                streetNumber = comp.long_name;
            } else if (types.includes('route')) {
                streetName = comp.long_name;
            } else if (types.includes('locality')) {
                city = comp.long_name;
            } else if (types.includes('sublocality_level_1') && !city) {
                city = comp.long_name;
            } else if (types.includes('administrative_area_level_1')) {
                state = comp.short_name;
            } else if (types.includes('postal_code')) {
                zip = comp.long_name;
            }
        });

        // Build formatted address: "123 Main St, Los Angeles, CA 90001"
        const street = streetNumber ? `${streetNumber} ${streetName}` : streetName;
        let formatted = street;
        if (city) formatted += `, ${city}`;
        if (state) formatted += `, ${state}`;
        if (zip) formatted += ` ${zip}`;

        return formatted || place.formatted_address;
    }

    // Setup autocomplete for "Moving From" address
    const autocompleteFrom = new google.maps.places.Autocomplete(addressFromInput, options);
    autocompleteFrom.setFields(['address_components', 'formatted_address']);
    autocompleteFrom.addListener('place_changed', function () {
        const place = autocompleteFrom.getPlace();
        if (place.address_components) {
            const formatted = formatAddress(place);
            addressFromInput.value = formatted;
            document.getElementById('address-from-full').value = formatted;
            addressFromInput.classList.add('selected');
            addressFromInput.classList.remove('error');
        }
    });

    // Setup autocomplete for "Moving To" address
    const autocompleteTo = new google.maps.places.Autocomplete(addressToInput, options);
    autocompleteTo.setFields(['address_components', 'formatted_address']);
    autocompleteTo.addListener('place_changed', function () {
        const place = autocompleteTo.getPlace();
        if (place.address_components) {
            const formatted = formatAddress(place);
            addressToInput.value = formatted;
            document.getElementById('address-to-full').value = formatted;
            addressToInput.classList.add('selected');
            addressToInput.classList.remove('error');
        }
    });

    // Clear validation when user starts typing again
    addressFromInput.addEventListener('input', function () {
        if (this.classList.contains('selected')) {
            document.getElementById('address-from-full').value = '';
            this.classList.remove('selected');
        }
        this.classList.remove('error');
    });

    addressToInput.addEventListener('input', function () {
        if (this.classList.contains('selected')) {
            document.getElementById('address-to-full').value = '';
            this.classList.remove('selected');
        }
        this.classList.remove('error');
    });

    // Prevent form submission on enter in address fields (let them select from dropdown)
    [addressFromInput, addressToInput].forEach(input => {
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
            }
        });
    });
}

// Make sure initAddressAutocomplete is available globally for Google Maps callback
window.initAddressAutocomplete = initAddressAutocomplete;

// Add quote modal to initialization
document.addEventListener('DOMContentLoaded', function () {
    initQuoteModal();
});
