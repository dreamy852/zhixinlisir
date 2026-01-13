// Configuration - Google Sheets IDs and Sheet Names
const CONFIG = {
    appsScriptUrl: 'https://script.google.com/macros/s/AKfycby4IuZThCSvWvNMAdBuHt4iCEpcBEEMPwh4pmXK6wWJrzbRB0mfSOrk-d9xKAYQWIw/exec',
    urls: {
        sheetId: '1utrF4anYUAoDGHMj1tAZDQOVbi-l61LYRWWMAIJJ1lw',
        sheetName: 'Sheet1', // gid=0
        defaultUrls: [
            { name: 'Report generator', url: 'https://tutorial-report-generator.pages.dev/' },
            { name: 'Timetable', url: 'https://docs.google.com/spreadsheets/d/1XGYc-0WeVQSH1aauZs7uiipujw_7zyeWTcdrjZzEltg/edit?gid=1420492652#gid=1420492652' },
            { name: 'Overleaf', url: 'https://www.overleaf.com/project' },
            { name: 'Timetable import', url: 'http://112.124.37.52:5001/teacher/56/schedule?week=2025-W51' }
        ]
    },
    data: {
        sheetId: '1utrF4anYUAoDGHMj1tAZDQOVbi-l61LYRWWMAIJJ1lw',
        sheetName: 'Sheet1', // gid=997844508
        gid: '997844508'
    },
    tasks: {
        sheetId: '1utrF4anYUAoDGHMj1tAZDQOVbi-l61LYRWWMAIJJ1lw',
        sheetName: 'Sheet1', // gid=2063120752
        gid: '2063120752'
    }
};

// Google Sheets API Helper
class GoogleSheetsAPI {
    constructor() {
        // Using Google Sheets API v4 with public access or API key
        // For public sheets, we can use CSV export
        this.baseUrl = 'https://docs.google.com/spreadsheets/d';
    }

    // Get CSV data from Google Sheets
    async getCSVData(sheetId, gid = '0') {
        const url = `${this.baseUrl}/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch data');
            const text = await response.text();
            return this.parseCSV(text);
        } catch (error) {
            console.error('Error fetching CSV:', error);
            throw error;
        }
    }

    // Parse CSV text to array of objects
    parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        if (lines.length === 0) return [];
        
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        const data = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            if (values.length > 0 && values.some(v => v.trim() !== '')) {
                const obj = {};
                headers.forEach((header, index) => {
                    obj[header] = values[index] || '';
                });
                data.push(obj);
            }
        }
        
        return data;
    }

    parseCSVLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim());
        
        return values.map(v => v.replace(/^"|"$/g, ''));
    }

    // Write to Google Sheets using Google Apps Script Web App
    async appendRow(sheetId, gid, rowData) {
        try {
            // Try to write to Google Sheets via Apps Script
            const response = await fetch(CONFIG.appsScriptUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'append',
                    gid: gid,
                    rowData: rowData
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to append row');
            }
            
            const result = await response.json();
            
            // Also store in localStorage as backup
            const key = `sheet_${sheetId}_${gid}`;
            const existing = JSON.parse(localStorage.getItem(key) || '[]');
            existing.push(rowData);
            localStorage.setItem(key, JSON.stringify(existing));
            
            return result;
        } catch (error) {
            console.error('Error appending row via Apps Script, using localStorage:', error);
            // Fallback to localStorage
            const key = `sheet_${sheetId}_${gid}`;
            const existing = JSON.parse(localStorage.getItem(key) || '[]');
            existing.push(rowData);
            localStorage.setItem(key, JSON.stringify(existing));
            return { success: true, message: 'Saved to local storage (Apps Script failed)' };
        }
    }

    async deleteRow(sheetId, gid, rowIndex) {
        try {
            // Try to delete from Google Sheets via Apps Script
            const response = await fetch(CONFIG.appsScriptUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'delete',
                    gid: gid,
                    rowIndex: rowIndex
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to delete row');
            }
            
            const result = await response.json();
            
            // Also update localStorage
            const key = `sheet_${sheetId}_${gid}`;
            const existing = JSON.parse(localStorage.getItem(key) || '[]');
            existing.splice(rowIndex, 1);
            localStorage.setItem(key, JSON.stringify(existing));
            
            return result;
        } catch (error) {
            console.error('Error deleting row via Apps Script, using localStorage:', error);
            // Fallback to localStorage
            const key = `sheet_${sheetId}_${gid}`;
            const existing = JSON.parse(localStorage.getItem(key) || '[]');
            existing.splice(rowIndex, 1);
            localStorage.setItem(key, JSON.stringify(existing));
            return { success: true, message: 'Deleted from local storage (Apps Script failed)' };
        }
    }
}

const sheetsAPI = new GoogleSheetsAPI();

// Tab Management
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            // Update buttons
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Update contents
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(targetTab).classList.add('active');
            
            // Load data for active tab
            loadTabData(targetTab);
        });
    });
}

// Load data for specific tab
async function loadTabData(tab) {
    switch(tab) {
        case 'urls':
            await loadUrls();
            break;
        case 'data':
            await loadData();
            break;
        case 'tasks':
            await loadTasks();
            break;
    }
}

// URL Management
async function loadUrls() {
    const urlList = document.getElementById('urlList');
    urlList.innerHTML = '<div class="loading">載入中...</div>';
    
    try {
        // Try to load from Google Sheets
        const data = await sheetsAPI.getCSVData(CONFIG.urls.sheetId, '0');
        let urls = [];
        
        if (data.length > 0 && data[0].Name && data[0].URL) {
            urls = data.map(row => ({ name: row.Name, url: row.URL }));
        } else {
            // Fallback to default URLs
            urls = CONFIG.urls.defaultUrls;
        }
        
        // Merge with localStorage backup
        const backupKey = `sheet_${CONFIG.urls.sheetId}_0`;
        const backup = JSON.parse(localStorage.getItem(backupKey) || '[]');
        urls = [...urls, ...backup];
        
        renderUrls(urls);
    } catch (error) {
        console.error('Error loading URLs:', error);
        // Fallback to default URLs
        renderUrls(CONFIG.urls.defaultUrls);
    }
}

// Store current data for deletion
let currentUrls = [];
let currentData = [];
let currentTasks = [];

function renderUrls(urls) {
    const urlList = document.getElementById('urlList');
    currentUrls = urls; // Store for deletion
    
    if (urls.length === 0) {
        urlList.innerHTML = '<div class="loading">尚無連結</div>';
        return;
    }
    
    urlList.innerHTML = urls.map((item, index) => `
        <div class="url-item">
            <button class="delete-btn" onclick="deleteUrl(${index})" title="刪除">×</button>
            <a href="${item.url}" target="_blank">${item.name}</a>
            <div class="url-link">${item.url}</div>
        </div>
    `).join('');
}

async function deleteUrl(index) {
    if (!confirm('確定要刪除此連結嗎？')) return;
    
    try {
        // Find the item to delete
        const itemToDelete = currentUrls[index];
        if (!itemToDelete) {
            await loadUrls();
            return;
        }
        
        // Try to delete via Apps Script
        await sheetsAPI.deleteRow(CONFIG.urls.sheetId, '0', index);
        
        // Remove from localStorage backup
        const backupKey = `sheet_${CONFIG.urls.sheetId}_0`;
        const backup = JSON.parse(localStorage.getItem(backupKey) || '[]');
        const filtered = backup.filter(item => 
            !(item.name === itemToDelete.name && item.url === itemToDelete.url)
        );
        localStorage.setItem(backupKey, JSON.stringify(filtered));
        
        await loadUrls();
    } catch (error) {
        console.error('Error deleting URL:', error);
        await loadUrls();
    }
}

// Data Management
async function loadData() {
    const dataList = document.getElementById('dataList');
    dataList.innerHTML = '<tr><td colspan="3" class="loading">載入中...</td></tr>';
    
    try {
        const data = await sheetsAPI.getCSVData(CONFIG.data.sheetId, CONFIG.data.gid);
        let items = [];
        
        if (data.length > 0 && data[0].資料 && data[0].數值) {
            items = data.map(row => ({ data: row.資料, value: row.數值 }));
        }
        
        // Merge with localStorage backup
        const backupKey = `sheet_${CONFIG.data.sheetId}_${CONFIG.data.gid}`;
        const backup = JSON.parse(localStorage.getItem(backupKey) || '[]');
        items = [...items, ...backup];
        
        renderData(items);
    } catch (error) {
        console.error('Error loading data:', error);
        dataList.innerHTML = '<tr><td colspan="3" class="loading">尚無資料</td></tr>';
    }
}

function renderData(items) {
    const dataList = document.getElementById('dataList');
    currentData = items; // Store for deletion
    
    if (items.length === 0) {
        dataList.innerHTML = '<tr><td colspan="3" class="loading">尚無資料</td></tr>';
        return;
    }
    
    dataList.innerHTML = items.map((item, index) => `
        <tr>
            <td>${item.data || item.資料 || ''}</td>
            <td>${item.value || item.數值 || ''}</td>
            <td><button class="delete-btn" onclick="deleteData(${index})" style="position: static; width: auto; height: auto; padding: 5px 10px; border-radius: 4px;">刪除</button></td>
        </tr>
    `).join('');
}

async function deleteData(index) {
    if (!confirm('確定要刪除此資料嗎？')) return;
    
    try {
        // Find the item to delete
        const itemToDelete = currentData[index];
        if (!itemToDelete) {
            await loadData();
            return;
        }
        
        // Try to delete via Apps Script
        await sheetsAPI.deleteRow(CONFIG.data.sheetId, CONFIG.data.gid, index);
        
        // Remove from localStorage backup
        const backupKey = `sheet_${CONFIG.data.sheetId}_${CONFIG.data.gid}`;
        const backup = JSON.parse(localStorage.getItem(backupKey) || '[]');
        const filtered = backup.filter(item => 
            !((item.data || item.資料) === (itemToDelete.data || itemToDelete.資料) && 
              (item.value || item.數值) === (itemToDelete.value || itemToDelete.數值))
        );
        localStorage.setItem(backupKey, JSON.stringify(filtered));
        
        await loadData();
    } catch (error) {
        console.error('Error deleting data:', error);
        await loadData();
    }
}

// Task Management
async function loadTasks() {
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = '<div class="loading">載入中...</div>';
    
    try {
        const data = await sheetsAPI.getCSVData(CONFIG.tasks.sheetId, CONFIG.tasks.gid);
        let tasks = [];
        
        if (data.length > 0) {
            // Try different possible column names
            const firstRow = data[0];
            const taskColumn = firstRow['任務名稱'] || firstRow['Task'] || firstRow['task'] || firstRow['任務'] || Object.values(firstRow)[0];
            tasks = data.map(row => ({ 
                name: row['任務名稱'] || row['Task'] || row['task'] || row['任務'] || Object.values(row)[0] || ''
            })).filter(t => t.name.trim() !== '');
        }
        
        // Merge with localStorage backup
        const backupKey = `sheet_${CONFIG.tasks.sheetId}_${CONFIG.tasks.gid}`;
        const backup = JSON.parse(localStorage.getItem(backupKey) || '[]');
        tasks = [...tasks, ...backup];
        
        renderTasks(tasks);
    } catch (error) {
        console.error('Error loading tasks:', error);
        taskList.innerHTML = '<div class="loading">尚無任務</div>';
    }
}

function renderTasks(tasks) {
    const taskList = document.getElementById('taskList');
    currentTasks = tasks; // Store for deletion
    
    if (tasks.length === 0) {
        taskList.innerHTML = '<div class="loading">尚無任務</div>';
        return;
    }
    
    taskList.innerHTML = tasks.map((task, index) => `
        <div class="task-item">
            <span class="task-name">${task.name || task.task || ''}</span>
            <button class="delete-btn" onclick="deleteTask(${index})" style="position: static; width: auto; height: auto; padding: 5px 10px; border-radius: 4px;">刪除</button>
        </div>
    `).join('');
}

async function deleteTask(index) {
    if (!confirm('確定要刪除此任務嗎？')) return;
    
    try {
        // Find the item to delete
        const itemToDelete = currentTasks[index];
        if (!itemToDelete) {
            await loadTasks();
            return;
        }
        
        // Try to delete via Apps Script
        await sheetsAPI.deleteRow(CONFIG.tasks.sheetId, CONFIG.tasks.gid, index);
        
        // Remove from localStorage backup
        const backupKey = `sheet_${CONFIG.tasks.sheetId}_${CONFIG.tasks.gid}`;
        const backup = JSON.parse(localStorage.getItem(backupKey) || '[]');
        const filtered = backup.filter(item => 
            (item.任務名稱 || item.taskName || item.name) !== (itemToDelete.name || itemToDelete.task)
        );
        localStorage.setItem(backupKey, JSON.stringify(filtered));
        
        await loadTasks();
    } catch (error) {
        console.error('Error deleting task:', error);
        await loadTasks();
    }
}

// Modal Management
function initModals() {
    // URL Modal
    const urlModal = document.getElementById('urlModal');
    const urlBtn = document.getElementById('addUrlBtn');
    const urlForm = document.getElementById('urlForm');
    
    urlBtn.onclick = () => {
        urlModal.classList.add('active');
        document.getElementById('urlName').value = '';
        document.getElementById('urlLink').value = '';
    };
    
    urlForm.onsubmit = async (e) => {
        e.preventDefault();
        const name = document.getElementById('urlName').value;
        const url = document.getElementById('urlLink').value;
        
        try {
            await sheetsAPI.appendRow(CONFIG.urls.sheetId, '0', { Name: name, URL: url });
            urlModal.classList.remove('active');
            await loadUrls();
        } catch (error) {
            alert('新增失敗，請檢查網路連線或 Google Sheets 設定');
            console.error('Error adding URL:', error);
        }
    };
    
    // Data Modal
    const dataModal = document.getElementById('dataModal');
    const dataBtn = document.getElementById('addDataBtn');
    const dataForm = document.getElementById('dataForm');
    
    dataBtn.onclick = () => {
        dataModal.classList.add('active');
        document.getElementById('dataKey').value = '';
        document.getElementById('dataValue').value = '';
    };
    
    dataForm.onsubmit = async (e) => {
        e.preventDefault();
        const data = document.getElementById('dataKey').value;
        const value = document.getElementById('dataValue').value;
        
        try {
            await sheetsAPI.appendRow(CONFIG.data.sheetId, CONFIG.data.gid, { 資料: data, 數值: value });
            dataModal.classList.remove('active');
            await loadData();
        } catch (error) {
            alert('新增失敗，請檢查網路連線或 Google Sheets 設定');
            console.error('Error adding data:', error);
        }
    };
    
    // Task Modal
    const taskModal = document.getElementById('taskModal');
    const taskBtn = document.getElementById('addTaskBtn');
    const taskForm = document.getElementById('taskForm');
    
    taskBtn.onclick = () => {
        taskModal.classList.add('active');
        document.getElementById('taskName').value = '';
    };
    
    taskForm.onsubmit = async (e) => {
        e.preventDefault();
        const taskName = document.getElementById('taskName').value;
        
        try {
            await sheetsAPI.appendRow(CONFIG.tasks.sheetId, CONFIG.tasks.gid, { 任務名稱: taskName });
            taskModal.classList.remove('active');
            await loadTasks();
        } catch (error) {
            alert('新增失敗，請檢查網路連線或 Google Sheets 設定');
            console.error('Error adding task:', error);
        }
    };
    
    // Close modals
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.onclick = () => {
            closeBtn.closest('.modal').classList.remove('active');
        };
    });
    
    // Close modal when clicking outside
    window.onclick = (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    };
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initModals();
    loadTabData('urls'); // Load initial tab
});

