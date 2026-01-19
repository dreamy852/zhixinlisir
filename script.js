// Google Sheets configuration
const SHEET_ID = '1utrF4anYUAoDGHMj1tAZDQOVbi-l61LYRWWMAIJJ1lw';
const SHEET_NAME = 'Sheet1'; // Default sheet name

// Google Apps Script Web App URL
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxeOmvP6PuNzteC3z4MG7ae3hz2ZfbXXiU_5V6VRRJ6BGaLflLwAgFvVFbxPa-NMdRL/exec';

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

    // Load URLs from Google Sheet on page load
    loadUrlsFromSheet();

    // Handle form submission
    const addUrlForm = document.getElementById('add-url-form');
    if (addUrlForm) {
        addUrlForm.addEventListener('submit', handleAddUrl);
    }
});

// Function to load URLs from Google Sheet
async function loadUrlsFromSheet() {
    const urlsList = document.getElementById('urls-list');
    
    try {
        // Load from localStorage first for immediate display (fallback)
        const localUrls = loadUrlsFromLocalStorage();
        if (localUrls.length > 0) {
            displayUrls(localUrls);
        }

        // Try to fetch from Google Apps Script (primary method)
        if (APPS_SCRIPT_URL) {
            try {
                const response = await fetch(APPS_SCRIPT_URL);
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.urls) {
                        if (data.urls.length > 0) {
                            displayUrls(data.urls);
                            saveUrlsToLocalStorage(data.urls);
                        } else if (localUrls.length === 0) {
                            showEmpty();
                        }
                        return; // Successfully loaded from Apps Script
                    } else if (data.error) {
                        console.warn('Apps Script error:', data.error);
                    }
                } else {
                    console.warn('Apps Script returned non-OK response:', response.status, response.statusText);
                }
            } catch (error) {
                console.warn('Could not fetch from Apps Script:', error);
                // Continue to localStorage fallback
            }
        } else {
            console.warn('Apps Script URL not configured');
        }

        // If Apps Script failed or not configured, use localStorage
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
    showSuccessMessage('URL added successfully!');
    
    // Clear form
    nameInput.value = '';
    urlInput.value = '';
    
    // Try to add to Google Sheets (requires API setup)
    // For now, we'll just store in localStorage
    // In production, you would use Google Sheets API here
    try {
        await addUrlToSheet(name, url);
    } catch (error) {
        console.log('Could not add to Google Sheets:', error);
        // URL is already saved to localStorage, so it's okay
    }
}

// Add URL to Google Sheet using Apps Script
async function addUrlToSheet(name, url) {
    if (!APPS_SCRIPT_URL) {
        console.warn('Apps Script URL not configured. URL saved to localStorage only.');
        return;
    }

    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: name,
                url: url
            })
        });

        const data = await response.json();
        
        if (data.success) {
            console.log('URL added to Google Sheet successfully');
            // Reload URLs from sheet to get updated list
            loadUrlsFromSheet();
        } else {
            console.error('Error adding URL to sheet:', data.error);
        }
    } catch (error) {
        console.error('Error calling Apps Script:', error);
    }
}

// Delete URL
async function deleteUrl(index) {
    if (confirm('Are you sure you want to delete this URL?')) {
        const urls = loadUrlsFromLocalStorage();
        const urlToDelete = urls[index];
        
        // Remove from localStorage immediately for UI feedback
        urls.splice(index, 1);
        saveUrlsToLocalStorage(urls);
        displayUrls(urls);
        showSuccessMessage('URL deleted successfully!');
        
        // Delete from Google Sheet if Apps Script is configured
        if (APPS_SCRIPT_URL && urlToDelete) {
            try {
                const response = await fetch(APPS_SCRIPT_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        action: 'delete',
                        name: urlToDelete.name,
                        url: urlToDelete.url
                    })
                });

                const data = await response.json();
                if (data.success) {
                    console.log('URL deleted from Google Sheet successfully');
                    // Reload URLs from sheet to get updated list
                    loadUrlsFromSheet();
                } else {
                    console.error('Error deleting URL from sheet:', data.error);
                }
            } catch (error) {
                console.error('Error calling Apps Script:', error);
            }
        }
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
