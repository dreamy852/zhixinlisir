# Google Apps Script Deployment Instructions

Follow these steps to set up Google Apps Script for your Common URLs web page:

## Step 1: Open Google Apps Script

1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/1utrF4anYUAoDGHMj1tAZDQOVbi-l61LYRWWMAIJJ1lw/edit
2. Click on **Extensions** → **Apps Script** (or go to https://script.google.com)

## Step 2: Create the Script

1. In the Apps Script editor, you'll see a default `Code.gs` file
2. Delete the default code
3. Copy the entire contents of `Code.gs` from this project
4. Paste it into the Apps Script editor
5. Click **Save** (or press Ctrl+S / Cmd+S)
6. Give your project a name (e.g., "Common URLs Manager")

## Step 3: Deploy as Web App

1. Click on **Deploy** → **New deployment**
2. Click the gear icon (⚙️) next to "Select type"
3. Choose **Web app**
4. Configure the deployment:
   - **Description**: "Common URLs API" (optional)
   - **Execute as**: **Me** (your account)
   - **Who has access**: **Anyone** (this allows your web page to access it)
5. Click **Deploy**
6. You may be prompted to authorize the script:
   - Click **Authorize access**
   - Choose your Google account
   - Click **Advanced** → **Go to [Project Name] (unsafe)**
   - Click **Allow**
7. After authorization, you'll see a **Web app URL**
8. **Copy this URL** - you'll need it for the next step

## Step 4: Update Your Web Page

1. Open `script.js` in your project
2. Find the line: `const APPS_SCRIPT_URL = '';`
3. Paste your copied Web App URL between the quotes
4. Save the file

Example:
```javascript
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby.../exec';
```

## Step 5: Test It

1. Open `index.html` in your browser
2. Try adding a URL using the form
3. Check your Google Sheet - the URL should appear there
4. Refresh the page - the URL should load from the sheet

## Troubleshooting

### If URLs don't appear:
- Make sure the Web App URL is correctly set in `script.js`
- Check the browser console (F12) for any error messages
- Verify that the Apps Script deployment has "Who has access" set to "Anyone"

### If you get permission errors:
- Make sure you authorized the Apps Script when prompted
- Try redeploying the script and authorizing again

### If the sheet is empty:
- The script will automatically create headers (Name, URL) in the first row
- Make sure the sheet name matches "Sheet1" (or update `SHEET_NAME` in both files)

## Security Note

The Web App URL allows anyone with the link to read and write to your sheet. If you want to restrict access, you can:
- Use Google OAuth in your web page
- Implement additional authentication in the Apps Script
- Use a different deployment method

For personal use or trusted environments, the current setup is sufficient.
