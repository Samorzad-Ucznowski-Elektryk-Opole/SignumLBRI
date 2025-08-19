/**
 * Admin Sidebar Counter for Book Dictionary Pending Items
 * Updates the pending count badge in the sidebar navigation
 */

document.addEventListener('DOMContentLoaded', function() {
    // Only run if we're on an admin page and the pending count element exists
    const pendingCountElement = document.getElementById('pendingCount');
    if (!pendingCountElement) return;

    // Function to update the pending count
    async function updatePendingCount() {
        try {
            const response = await fetch('/admin/book-dictionary/api/pending-count', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                pendingCountElement.textContent = data.count || 0;
                
                // Add visual indicator if there are pending items
                const parentLink = pendingCountElement.closest('a.nav-link');
                if (parentLink) {
                    if (data.count > 0) {
                        parentLink.classList.add('text-warning');
                        parentLink.style.fontWeight = 'bold';
                    } else {
                        parentLink.classList.remove('text-warning');
                        parentLink.style.fontWeight = 'normal';
                    }
                }
            } else {
                console.warn('Failed to fetch pending count:', response.status);
                pendingCountElement.textContent = '?';
            }
        } catch (error) {
            console.error('Error fetching pending count:', error);
            pendingCountElement.textContent = '?';
        }
    }

    // Update count on page load
    updatePendingCount();

    // Update count every 30 seconds while user is active on admin pages
    const updateInterval = setInterval(updatePendingCount, 30000);

    // Clear interval when leaving the page
    window.addEventListener('beforeunload', function() {
        clearInterval(updateInterval);
    });

    // Also update when visibility changes (user returns to tab)
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            updatePendingCount();
        }
    });
});
