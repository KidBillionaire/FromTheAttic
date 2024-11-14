document.addEventListener('DOMContentLoaded', () => {
    // Gallery functionality
    const loadGallery = async () => {
        try {
            const response = await fetch('/api/gallery');
            const items = await response.json();
            const galleryDiv = document.getElementById('gallery');
            
            if (items.length === 0) {
                galleryDiv.innerHTML = '<p class="no-items">No artworks available</p>';
                return;
            }

            galleryDiv.innerHTML = items.map(item => `
                <div class="gallery-item">
                    <img src="${item.image_url}" alt="${item.title}" 
                         onerror="this.src='https://via.placeholder.com/300x200?text=Image+Not+Found'">
                    <h3>${item.title}</h3>
                    <p>${item.description}</p>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading gallery:', error);
            document.getElementById('gallery').innerHTML = 
                '<p class="error">Error loading gallery items</p>';
        }
    };

    // Form submission handler
    const galleryForm = document.getElementById('galleryForm');
    if (galleryForm) {
        galleryForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = {
                title: document.getElementById('title').value,
                description: document.getElementById('description').value,
                image_url: document.getElementById('image_url').value
            };

            try {
                const response = await fetch('/api/gallery', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                if (response.ok) {
                    e.target.reset();
                    await loadGallery();
                    showNotification('Artwork added successfully!', 'success');
                } else {
                    showNotification('Failed to add artwork', 'error');
                }
            } catch (error) {
                console.error('Error adding gallery item:', error);
                showNotification('Error adding artwork', 'error');
            }
        });
    }

    // Notification helper
    const showNotification = (message, type = 'info') => {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    };

    // Server status check
    const checkServerStatus = async () => {
        try {
            const response = await fetch('/health');
            const data = await response.json();
            const statusElement = document.getElementById('status');
            
            if (data.status === 'OK') {
                statusElement.textContent = 'Server is running';
                statusElement.className = 'status status-ok';
            } else {
                statusElement.textContent = 'Server error';
                statusElement.className = 'status status-error';
            }
        } catch (error) {
            console.error('Error:', error);
            const statusElement = document.getElementById('status');
            statusElement.textContent = 'Server not responding';
            statusElement.className = 'status status-error';
        }
    };

    // Initialize
    loadGallery();
    checkServerStatus();

    // Refresh gallery periodically (every 30 seconds)
    setInterval(loadGallery, 30000);
}); 