// CSV file configuration
const CSV_FILE = 'links.csv';
const DATA_CSV_FILE = 'data.csv';
const TASK_CSV_FILE = 'task.csv';

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

    // Handle form submission
    const addUrlForm = document.getElementById('add-url-form');
    if (addUrlForm) {
        addUrlForm.addEventListener('submit', handleAddUrl);
    }

    // Handle show/hide add URL form
    const showAddFormBtn = document.getElementById('show-add-form-btn');
    const addFormContainer = document.getElementById('add-url-form-container');
    const cancelAddFormBtn = document.getElementById('cancel-add-form-btn');

    if (showAddFormBtn && addFormContainer) {
        showAddFormBtn.addEventListener('click', () => {
            addFormContainer.style.display = 'block';
            showAddFormBtn.style.display = 'none';
            // Focus on the first input
            document.getElementById('url-name').focus();
        });
    }

    if (cancelAddFormBtn && addFormContainer && showAddFormBtn) {
        cancelAddFormBtn.addEventListener('click', () => {
            addFormContainer.style.display = 'none';
            showAddFormBtn.style.display = 'inline-block';
            // Clear form
            document.getElementById('add-url-form').reset();
        });
    }

    // Load Data and Task on page load
    loadDataFromCSV();
    loadTaskFromCSV();

    // Handle Data form
    const addDataForm = document.getElementById('add-data-form');
    if (addDataForm) {
        addDataForm.addEventListener('submit', handleAddData);
    }

    const showAddDataBtn = document.getElementById('show-add-data-btn');
    const addDataFormContainer = document.getElementById('add-data-form-container');
    const cancelAddDataBtn = document.getElementById('cancel-add-data-btn');

    if (showAddDataBtn && addDataFormContainer) {
        showAddDataBtn.addEventListener('click', () => {
            addDataFormContainer.style.display = 'block';
            showAddDataBtn.style.display = 'none';
            document.getElementById('data-name').focus();
        });
    }

    if (cancelAddDataBtn && addDataFormContainer && showAddDataBtn) {
        cancelAddDataBtn.addEventListener('click', () => {
            addDataFormContainer.style.display = 'none';
            showAddDataBtn.style.display = 'inline-block';
            document.getElementById('add-data-form').reset();
        });
    }

    // Handle Task form
    const addTaskForm = document.getElementById('add-task-form');
    if (addTaskForm) {
        addTaskForm.addEventListener('submit', handleAddTask);
    }

    const showAddTaskBtn = document.getElementById('show-add-task-btn');
    const addTaskFormContainer = document.getElementById('add-task-form-container');
    const cancelAddTaskBtn = document.getElementById('cancel-add-task-btn');

    if (showAddTaskBtn && addTaskFormContainer) {
        showAddTaskBtn.addEventListener('click', () => {
            addTaskFormContainer.style.display = 'block';
            showAddTaskBtn.style.display = 'none';
            document.getElementById('task-name').focus();
        });
    }

    if (cancelAddTaskBtn && addTaskFormContainer && showAddTaskBtn) {
        cancelAddTaskBtn.addEventListener('click', () => {
            addTaskFormContainer.style.display = 'none';
            showAddTaskBtn.style.display = 'inline-block';
            document.getElementById('add-task-form').reset();
        });
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
            urlsList.innerHTML = '<tr><td colspan="3" class="error">載入連結時發生錯誤。請稍後再試。</td></tr>';
        }
    }
}

// Parse CSV data (generic - works for URLs, Data, and Tasks)
function parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());
    const items = [];
    
    // Skip header row if present
    const firstLine = lines[0] || '';
    const startIndex = firstLine.includes('Name') || firstLine.includes('Data name') || firstLine.includes('Task name') ? 1 : 0;
    
    for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Parse CSV line (handling quoted values)
        const values = parseCSVLine(line);
        if (values.length >= 2) {
            items.push({
                name: values[0].trim(),
                url: values[1].trim(),      // For URLs
                value: values[1].trim(),     // For Data
                remark: values[1].trim()      // For Tasks
            });
        } else if (values.length === 1 && values[0].includes('http')) {
            // Special case for URLs: if only one value and it's a URL, use it as both name and URL
            items.push({
                name: values[0].trim(),
                url: values[0].trim()
            });
        }
    }
    
    return items;
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
        <tr>
            <td>${escapeHtml(item.name || '')}</td>
            <td><a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.url)}</a></td>
            <td>
                <button class="delete-btn" onclick="deleteUrl(${index})" title="刪除連結">×</button>
            </td>
        </tr>
    `).join('');
}

// Show empty state
function showEmpty() {
    const urlsList = document.getElementById('urls-list');
    urlsList.innerHTML = '<tr><td colspan="3" class="empty">尚未找到連結。請使用上方表單新增第一個連結。</td></tr>';
}

// Handle add URL form submission
async function handleAddUrl(event) {
    event.preventDefault();
    
    const nameInput = document.getElementById('url-name');
    const urlInput = document.getElementById('url-link');
    
    const name = nameInput.value.trim();
    const url = urlInput.value.trim();
    
    if (!name || !url) {
        alert('請填寫連結名稱和網址。');
        return;
    }
    
    // Validate URL format
    try {
        new URL(url);
    } catch (e) {
        alert('請輸入有效的網址（需以 http:// 或 https:// 開頭）');
        return;
    }
    
    // Add to localStorage (immediate feedback)
    const urls = loadUrlsFromLocalStorage();
    urls.push({ name, url });
    saveUrlsToLocalStorage(urls);
    displayUrls(urls);
    
    // Show success message
    showSuccessMessage('連結已成功新增！');
    
    // Clear form and hide it
    nameInput.value = '';
    urlInput.value = '';
    
    // Hide form and show button again
    const addFormContainer = document.getElementById('add-url-form-container');
    const showAddFormBtn = document.getElementById('show-add-form-btn');
    if (addFormContainer && showAddFormBtn) {
        addFormContainer.style.display = 'none';
        showAddFormBtn.style.display = 'inline-block';
    }
    
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


// Delete URL
async function deleteUrl(index) {
    if (confirm('確定要刪除此連結嗎？')) {
        // Get current URLs (from display or localStorage)
        const urls = window.currentUrls || loadUrlsFromLocalStorage();
        
        // Remove from array
        urls.splice(index, 1);
        saveUrlsToLocalStorage(urls);
        displayUrls(urls);
        showSuccessMessage('連結已成功刪除！');
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

// Helper function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==================== DATA FUNCTIONS ====================

// Function to load Data from CSV file
async function loadDataFromCSV() {
    const dataList = document.getElementById('data-list');
    if (!dataList) return;
    
    try {
        // Load from localStorage first
        const localData = loadDataFromLocalStorage();
        if (localData.length > 0) {
            displayDataTable(localData);
        }

        // Try to fetch from CSV file
        try {
            const response = await fetch(DATA_CSV_FILE);
            if (response.ok) {
                const csvText = await response.text();
                const data = parseCSV(csvText);
                if (data.length > 0) {
                    displayDataTable(data);
                    saveDataToLocalStorage(data);
                } else if (localData.length === 0) {
                    showDataEmpty();
                }
                return;
            }
        } catch (error) {
            console.warn('Could not fetch from CSV file, using localStorage:', error);
        }

        if (localData.length === 0) {
            showDataEmpty();
        }
    } catch (error) {
        console.error('Error loading data:', error);
        const localData = loadDataFromLocalStorage();
        if (localData.length === 0) {
            dataList.innerHTML = '<tr><td colspan="3" class="error">載入資料時發生錯誤。請稍後再試。</td></tr>';
        }
    }
}

// Display Data in table
function displayDataTable(data) {
    const dataList = document.getElementById('data-list');
    if (!dataList) return;
    
    if (data.length === 0) {
        showDataEmpty();
        return;
    }
    
    window.currentData = data;
    
    dataList.innerHTML = data.map((item, index) => `
        <tr>
            <td>${escapeHtml(item.name || '')}</td>
            <td>${escapeHtml(item.value || '')}</td>
            <td>
                <button class="delete-btn" onclick="deleteData(${index})" title="刪除資料">×</button>
            </td>
        </tr>
    `).join('');
}

// Show empty state for Data
function showDataEmpty() {
    const dataList = document.getElementById('data-list');
    if (!dataList) return;
    dataList.innerHTML = '<tr><td colspan="3" class="empty">尚未找到資料。請使用上方表單新增第一筆資料。</td></tr>';
}

// Handle add Data form submission
async function handleAddData(event) {
    event.preventDefault();
    
    const nameInput = document.getElementById('data-name');
    const valueInput = document.getElementById('data-value');
    
    const name = nameInput.value.trim();
    const value = valueInput.value.trim();
    
    if (!name || !value) {
        alert('請填寫資料名稱和數值。');
        return;
    }
    
    // Add to localStorage
    const data = loadDataFromLocalStorage();
    data.push({ name, value });
    saveDataToLocalStorage(data);
    displayDataTable(data);
    
    showSuccessMessage('資料已成功新增！');
    
    // Clear form and hide it
    nameInput.value = '';
    valueInput.value = '';
    
    const addDataFormContainer = document.getElementById('add-data-form-container');
    const showAddDataBtn = document.getElementById('show-add-data-btn');
    if (addDataFormContainer && showAddDataBtn) {
        addDataFormContainer.style.display = 'none';
        showAddDataBtn.style.display = 'inline-block';
    }
}

// Delete Data
async function deleteData(index) {
    if (confirm('確定要刪除此資料嗎？')) {
        const data = window.currentData || loadDataFromLocalStorage();
        data.splice(index, 1);
        saveDataToLocalStorage(data);
        displayDataTable(data);
        showSuccessMessage('資料已成功刪除！');
    }
}

// Download Data CSV
function downloadDataCSV() {
    const data = loadDataFromLocalStorage();
    let csvContent = 'Data name,Data value\n';
    data.forEach(item => {
        const name = `"${(item.name || '').replace(/"/g, '""')}"`;
        const value = `"${(item.value || '').replace(/"/g, '""')}"`;
        csvContent += `${name},${value}\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', DATA_CSV_FILE);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showSuccessMessage('Data CSV file downloaded successfully!');
}

// LocalStorage functions for Data
function saveDataToLocalStorage(data) {
    localStorage.setItem('commonData', JSON.stringify(data));
}

function loadDataFromLocalStorage() {
    const stored = localStorage.getItem('commonData');
    return stored ? JSON.parse(stored) : [];
}

// ==================== TASK FUNCTIONS ====================

// Function to load Task from CSV file
async function loadTaskFromCSV() {
    const taskList = document.getElementById('task-list');
    if (!taskList) return;
    
    try {
        // Load from localStorage first
        const localTasks = loadTaskFromLocalStorage();
        if (localTasks.length > 0) {
            displayTaskTable(localTasks);
        }

        // Try to fetch from CSV file
        try {
            const response = await fetch(TASK_CSV_FILE);
            if (response.ok) {
                const csvText = await response.text();
                const tasks = parseCSV(csvText);
                if (tasks.length > 0) {
                    displayTaskTable(tasks);
                    saveTaskToLocalStorage(tasks);
                } else if (localTasks.length === 0) {
                    showTaskEmpty();
                }
                return;
            }
        } catch (error) {
            console.warn('Could not fetch from CSV file, using localStorage:', error);
        }

        if (localTasks.length === 0) {
            showTaskEmpty();
        }
    } catch (error) {
        console.error('Error loading tasks:', error);
        const localTasks = loadTaskFromLocalStorage();
        if (localTasks.length === 0) {
            taskList.innerHTML = '<tr><td colspan="3" class="error">Error loading tasks. Please try again later.</td></tr>';
        }
    }
}

// Display Task in table
function displayTaskTable(tasks) {
    const taskList = document.getElementById('task-list');
    if (!taskList) return;
    
    if (tasks.length === 0) {
        showTaskEmpty();
        return;
    }
    
    window.currentTasks = tasks;
    
    taskList.innerHTML = tasks.map((item, index) => `
        <tr>
            <td>${escapeHtml(item.name || '')}</td>
            <td>${escapeHtml(item.remark || '')}</td>
            <td>
                <button class="delete-btn" onclick="deleteTask(${index})" title="刪除工作">×</button>
            </td>
        </tr>
    `).join('');
}

// Show empty state for Task
function showTaskEmpty() {
    const taskList = document.getElementById('task-list');
    if (!taskList) return;
    taskList.innerHTML = '<tr><td colspan="3" class="empty">尚未找到工作。請使用上方表單新增第一個工作。</td></tr>';
}

// Handle add Task form submission
async function handleAddTask(event) {
    event.preventDefault();
    
    const nameInput = document.getElementById('task-name');
    const remarkInput = document.getElementById('task-remark');
    
    const name = nameInput.value.trim();
    const remark = remarkInput.value.trim();
    
    if (!name) {
        alert('請填寫工作名稱。');
        return;
    }
    
    // Add to localStorage
    const tasks = loadTaskFromLocalStorage();
    tasks.push({ name, remark: remark || '' });
    saveTaskToLocalStorage(tasks);
    displayTaskTable(tasks);
    
    showSuccessMessage('工作已成功新增！');
    
    // Clear form and hide it
    nameInput.value = '';
    remarkInput.value = '';
    
    const addTaskFormContainer = document.getElementById('add-task-form-container');
    const showAddTaskBtn = document.getElementById('show-add-task-btn');
    if (addTaskFormContainer && showAddTaskBtn) {
        addTaskFormContainer.style.display = 'none';
        showAddTaskBtn.style.display = 'inline-block';
    }
}

// Delete Task
async function deleteTask(index) {
    if (confirm('確定要刪除此工作嗎？')) {
        const tasks = window.currentTasks || loadTaskFromLocalStorage();
        tasks.splice(index, 1);
        saveTaskToLocalStorage(tasks);
        displayTaskTable(tasks);
        showSuccessMessage('工作已成功刪除！');
    }
}

// Download Task CSV
function downloadTaskCSV() {
    const tasks = loadTaskFromLocalStorage();
    let csvContent = 'Task name,Remark\n';
    tasks.forEach(item => {
        const name = `"${(item.name || '').replace(/"/g, '""')}"`;
        const remark = `"${(item.remark || '').replace(/"/g, '""')}"`;
        csvContent += `${name},${remark}\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', TASK_CSV_FILE);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showSuccessMessage('Task CSV file downloaded successfully!');
}

// LocalStorage functions for Task
function saveTaskToLocalStorage(tasks) {
    localStorage.setItem('commonTasks', JSON.stringify(tasks));
}

function loadTaskFromLocalStorage() {
    const stored = localStorage.getItem('commonTasks');
    return stored ? JSON.parse(stored) : [];
}
