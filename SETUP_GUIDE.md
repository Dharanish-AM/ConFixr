# ConFixr Setup & Testing Guide

## Problem
Chrome extension APIs (`chrome.runtime`, `chrome.storage`) are only available to:
- ✅ Extension popup pages
- ✅ Extension options pages  
- ✅ Extension background service workers
- ✅ Content scripts (injected into webpages)
- ❌ Regular HTML files opened as `file://` URLs

## Solution

### Step 1: Reload the Extension
1. Open `chrome://extensions`
2. Find **ConFixr**
3. Toggle it **OFF** then **ON** (or click refresh icon)
4. Wait 3-5 seconds for it to reload

### Step 2: Verify Extension Loaded
1. Look for the ConFixr icon in your Chrome toolbar (top-right)
2. If you don't see it, the extension failed to load
3. Check for errors under "Errors" on the extension details page

### Step 3: Open the Correct Pages

#### Option A: Use the Diagnostics Page (Recommended)
1. Right-click the ConFixr icon in toolbar
2. Select **"Options"**
3. This opens `diagnostics.html` as an extension page
4. Should now show ✅ for both runtime and storage

#### Option B: Use the Test Page
1. Open `test-page.html` in your browser (local file or via server)
2. Click buttons to trigger errors
3. Open the ConFixr popup to see captured errors

### Step 4: Test Error Capture

**From the Diagnostics Page:**
- Click "Runtime Error" button
- Click "Console Error" button  
- Click "Promise Rejection" button
- Watch "Stored Errors" section update

**From the Test Page:**
- Open test-page.html
- Click error trigger buttons
- Check ConFixr popup for captured errors

### Step 5: View Errors

#### In the Popup
1. Click the ConFixr icon
2. Should show captured errors
3. Click "Refresh" to reload list
4. Click "Clear All" to delete errors

#### In Diagnostics
1. Right-click ConFixr → Options
2. "Stored Errors" section shows live list
3. Auto-refreshes every 2 seconds

## Troubleshooting

### Issue: "chrome.runtime NOT available"
**Cause:** Page is not loaded as an extension page
**Fix:** 
- Don't open as `file://` URL
- Use "Options" button from `chrome://extensions`
- Right-click extension icon → "Options"

### Issue: No errors appearing in popup
**Check:**
1. Are you on a valid webpage? (not local file for content script)
2. Have you triggered any errors? (click buttons on test page)
3. Click "Refresh" in popup
4. Check diagnostics page for "Stored Errors"
5. Check extension errors at `chrome://extensions`

### Issue: Extension not showing in toolbar
**Fix:**
1. Go to `chrome://extensions`
2. Reload the extension (refresh icon)
3. Try pinning it to toolbar (puzzle icon)

### Issue: Extension shows errors in red
**Fix:**
1. Go to `chrome://extensions`
2. Click "Errors" under ConFixr
3. Fix the displayed errors
4. Reload extension

## File Structure Reference

```
ConFixr/
├── manifest.json              # Extension config
├── background/
│   └── worker.js             # Service worker (listens for errors)
├── content/
│   └── capture.js            # Injected into webpages (captures errors)
├── popup/
│   ├── popup.html            # Extension popup UI
│   ├── popup.js              # Popup logic
│   └── popup.css             # Popup styling
├── rules/
│   └── classifiers.js        # Error classification engine
├── diagnostics.html          # Testing & debugging page (options page)
├── test-page.html            # Safe page to trigger test errors
└── TEST_REPORT.md            # Test results
```

## How It Works

1. **Content Script** (`capture.js`) runs on every webpage
2. Captures: runtime errors, console calls, promise rejections, network errors
3. Sends error data to **Service Worker** via `chrome.runtime.sendMessage()`
4. **Service Worker** (`worker.js`) classifies error and stores in `chrome.storage`
5. **Popup** and **Diagnostics** pages read from storage and display errors

## Next Steps

Once everything is working:
- ✅ Extension captures errors
- ✅ Popup displays them
- ✅ Diagnostics page monitors them
- 🚀 Ready for deployment!
