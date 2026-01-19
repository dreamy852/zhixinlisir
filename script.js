// CSV file configuration
const CSV_FILE = 'links.csv';

// Tab switching functionality
document.addEventListener('DOMContentLoaded', function() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });

    // Load URLs from CSV file on page load
    loadUrlsFromCSV();
    
    // Update download button on page load
    updateDownloadButton();

    // Handle form submission
    const addUrlForm = document.getElementById('add-url-form');
    if (addUrlForm) {
        addUrlForm.addEventListener('submit', handleAddUrl);
    }
});

// Function to load URLs from CSV file
async function loadUrlsFromCSV() {
    const urlsList = document.getElementById('urls-list');
    
    try {
        // Load from localStorage first for immediate display (fallback)
        const localUrls = loadUrlsFromLocalStorage();
        if (localUrls.length > 0) {
            displayUrls(localUrls);
        }

        // Try to fetch from CSV file
        try {
            const response = await fetch(CSV_FILE);
            if (response.ok) {
                const csvText = await response.text();
                const urls = parseCSV(csvText);
                if (urls.length > 0) {
                    displayUrls(urls);
                    saveUrlsToLocalStorage(urls);
                } else if (localUrls.length === 0) {
                    showEmpty();
                }
                return; // Successfully loaded from CSV
            } else {
                console.warn('Could not fetch CSV file:', response.status);
            }
        } catch (error) {
            console.warn('Could not fetch from CSV file, using localStorage:', error);
        }

        // If CSV failed, use localStorage
        if (localUrls.length === 0) {
            showEmpty();
        }
    } catch (error) {
        console.error('Error loading URLs:', error);
        const localUrls = loadUrlsFromLocalStorage();
        if (localUrls.length === 0) {
            urlsList.innerHTML = '<p class="error">Error loading URLs. Please try again later.</p>';
        }
    }
}

// Parse CSV data
function parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());
    const urls = [];
    
    // Skip header row if present
    const startIndex = lines[0].includes('Name') || lines[0].includes('URL') ? 1 : 0;
    
    for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Parse CSV line (handling quoted values)
        const values = parseCSVLine(line);
        if (values.length >= 2) {
            urls.push({
                name: values[0].trim(),
                url: values[1].trim()
            });
        } else if (values.length === 1 && values[0].includes('http')) {
            // If only one value and it's a URL, use it as both name and URL
            urls.push({
                name: values[0].trim(),
                url: values[0].trim()
            });
        }
    }
    
    return urls;
}

// Parse CSV line handling quoted values
function parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            values.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    values.push(current);
    
    return values;
}

// Display URLs in the list
function displayUrls(urls) {
    const urlsList = document.getElementById('urls-list');
    
    if (urls.length === 0) {
        showEmpty();
        return;
    }
    
    // Store current URLs array for delete function
    window.currentUrls = urls;
    
    urlsList.innerHTML = urls.map((item, index) => `
        <div class="url-item">
            <a href="${item.url}" target="_blank" rel="noopener noreferrer">${item.name || item.url}</a>
            <button class="delete-btn" onclick="deleteUrl(${index})" title="Delete URL">×</button>
        </div>
    `).join('');
}

// Show empty state
function showEmpty() {
    const urlsList = document.getElementById('urls-list');
    urlsList.innerHTML = '<p class="empty">No URLs found. Add your first URL using the form above.</p>';
}

// Handle add URL form submission
async function handleAddUrl(event) {
    event.preventDefault();
    
    const nameInput = document.getElementById('url-name');
    const urlInput = document.getElementById('url-link');
    
    const name = nameInput.value.trim();
    const url = urlInput.value.trim();
    
    if (!name || !url) {
        alert('Please fill in both URL name and link.');
        return;
    }
    
    // Validate URL format
    try {
        new URL(url);
    } catch (e) {
        alert('Please enter a valid URL (starting with http:// or https://)');
        return;
    }
    
    // Add to localStorage (immediate feedback)
    const urls = loadUrlsFromLocalStorage();
    urls.push({ name, url });
    saveUrlsToLocalStorage(urls);
    displayUrls(urls);
    
    // Show success message
    showSuccessMessage('URL added successfully! You can download the updated CSV file.');
    
    // Clear form
    nameInput.value = '';
    urlInput.value = '';
    
    // Update download button visibility
    updateDownloadButton();
}

// Download CSV file with current URLs
function downloadCSV() {
    const urls = loadUrlsFromLocalStorage();
    
    // Create CSV content
    let csvContent = 'Name,URL\n';
    urls.forEach(item => {
        // Escape commas and quotes in CSV
        const name = `"${item.name.replace(/"/g, '""')}"`;
        const url = `"${item.url.replace(/"/g, '""')}"`;
        csvContent += `${name},${url}\n`;
    });
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', CSV_FILE);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showSuccessMessage('CSV file downloaded successfully!');
}

// Update download button visibility
function updateDownloadButton() {
    const urls = loadUrlsFromLocalStorage();
    let downloadBtn = document.getElementById('download-csv-btn');
    
    if (urls.length > 0) {
        if (!downloadBtn) {
            // Create download button if it doesn't exist
            downloadBtn = document.createElement('button');
            downloadBtn.id = 'download-csv-btn';
            downloadBtn.className = 'btn-primary';
            downloadBtn.textContent = 'Download links.csv';
            downloadBtn.onclick = downloadCSV;
            
            const addUrlSection = document.querySelector('.add-url-section');
            const form = document.getElementById('add-url-form');
            addUrlSection.insertBefore(downloadBtn, form);
        }
        downloadBtn.style.display = 'inline-block';
    } else if (downloadBtn) {
        downloadBtn.style.display = 'none';
    }
}

// Delete URL
async function deleteUrl(index) {
    if (confirm('Are you sure you want to delete this URL?')) {
        // Get current URLs (from display or localStorage)
        const urls = window.currentUrls || loadUrlsFromLocalStorage();
        
        // Remove from array
        urls.splice(index, 1);
        saveUrlsToLocalStorage(urls);
        displayUrls(urls);
        showSuccessMessage('URL deleted successfully! You can download the updated CSV file.');
        
        // Update download button visibility
        updateDownloadButton();
    }
}

// LocalStorage functions
function saveUrlsToLocalStorage(urls) {
    localStorage.setItem('commonUrls', JSON.stringify(urls));
}

function loadUrlsFromLocalStorage() {
    const stored = localStorage.getItem('commonUrls');
    return stored ? JSON.parse(stored) : [];
}

// Show success message
function showSuccessMessage(message) {
    // Create or get success message element
    let successMsg = document.querySelector('.success-message');
    if (!successMsg) {
        successMsg = document.createElement('div');
        successMsg.className = 'success-message';
        const addUrlSection = document.querySelector('.add-url-section');
        addUrlSection.insertBefore(successMsg, addUrlSection.firstChild);
    }
    
    successMsg.textContent = message;
    successMsg.classList.add('show');
    
    setTimeout(() => {
        successMsg.classList.remove('show');
    }, 3000);
}
