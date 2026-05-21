// Human-readable language map
const LANGUAGE_NAMES = {
    "ara": "Arabic (ara)",
    "ben": "Bengali (ben)",
    "eng": "English (eng)",
    "fra": "French (fra)",
    "ind": "Indonesian (ind)",
    "rus": "Russian (rus)",
    "tam": "Tamil (tam)",
    "tur": "Turkish (tur)",
    "urd": "Urdu (urd)"
};

// Global state variables
let globalMetadata = null;
const baseUrlInput = document.getElementById('baseUrl');
const langSelect = document.getElementById('langSelect');
const bookSelect = document.getElementById('bookSelect');

const allInfoLink = document.getElementById('allInfoLink');
const langInfoLink = document.getElementById('langInfoLink');
const downloadLink = document.getElementById('downloadLink');

// Console DOM elements
const consoleStatus = document.getElementById('consoleStatus');
const consoleMeta = document.getElementById('consoleMeta');
const metaStatus = document.getElementById('metaStatus');
const metaTime = document.getElementById('metaTime');
const metaSize = document.getElementById('metaSize');
const consoleCode = document.getElementById('consoleCode');

// Automatically configure default Base URL
function getAutoBaseUrl() {
    let url = window.location.origin + window.location.pathname;
    // Remove index.html or trailing slash if exists
    url = url.replace(/\/index\.html$/, '').replace(/\/$/, '');
    // Handle opening as local file:// protocol
    if (url.startsWith('file://')) {
        return 'https://your-hosting-url.com';
    }
    return url;
}

// Set up initial URL
baseUrlInput.value = getAutoBaseUrl();

// Fetch all_info.json on page load to populate selectors
async function initPlayground() {
    try {
        const response = await fetch('./all_info.json');
        if (!response.ok) throw new Error('Network response was not ok');
        globalMetadata = await response.json();
        populateLanguages();
    } catch (err) {
        console.warn("Could not fetch ./all_info.json. Falling back to default lists.", err);
        // Fallback static list so page remains functional even if loaded from local file://
        globalMetadata = {
            "eng": [
                { "book": "eng-bukhari", "name": "Sahih al Bukhari" },
                { "book": "eng-muslim", "name": "Sahih Muslim" },
                { "book": "eng-abudawud", "name": "Sunan Abu Dawud" }
            ],
            "ara": [
                { "book": "ara-bukhari", "name": "Sahih al Bukhari" },
                { "book": "ara-muslim", "name": "Sahih Muslim" }
            ]
        };
        populateLanguages();
    }
}

// Populate languages selector
function populateLanguages() {
    langSelect.innerHTML = '';
    Object.keys(globalMetadata).forEach(lang => {
        const option = document.createElement('option');
        option.value = lang;
        option.textContent = LANGUAGE_NAMES[lang] || `Language: ${lang}`;
        langSelect.appendChild(option);
    });
    
    // Default to eng or first lang
    if (globalMetadata['eng']) {
        langSelect.value = 'eng';
    } else {
        langSelect.value = Object.keys(globalMetadata)[0];
    }
    
    populateBooks();
}

// Populate books selector based on selected language
function populateBooks() {
    const selectedLang = langSelect.value;
    const books = globalMetadata[selectedLang] || [];
    bookSelect.innerHTML = '';
    
    books.forEach(bookItem => {
        const option = document.createElement('option');
        option.value = bookItem.book;
        option.textContent = bookItem.name;
        bookSelect.appendChild(option);
    });
    
    updateLinks();
}

// Update URL elements
function updateLinks() {
    let url = baseUrlInput.value.trim();
    if (!url) {
        url = getAutoBaseUrl();
    }

    // Strip trailing slash
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }

    const selectedLang = langSelect.value || 'eng';
    const selectedBook = bookSelect.value || 'eng-bukhari';

    allInfoLink.textContent = `${url}/all_info.json`;
    langInfoLink.textContent = `${url}/${selectedLang}/info.json`;
    downloadLink.textContent = `${url}/${selectedLang}/${selectedBook}.sqlite.zip`;
}

// Live Sandbox API Endpoint Tester
async function testEndpoint(elementId) {
    const linkElement = document.getElementById(elementId);
    let targetUrl = linkElement.textContent.trim();
    
    // If it's the download endpoint, prevent browser sandbox fetch
    if (elementId === 'downloadLink') {
        alert("Download test is handled by the Download button next to it.");
        return;
    }
    
    // If base URL matches the current domain, we fetch relatively to avoid local CORS blocks
    let fetchUrl = targetUrl;
    const currentDomain = window.location.origin;
    if (targetUrl.startsWith(currentDomain)) {
        // convert to relative fetch
        fetchUrl = '.' + targetUrl.replace(currentDomain, '').replace(window.location.pathname.replace(/\/index\.html$/, ''), '');
    }

    consoleStatus.textContent = 'Fetching...';
    consoleStatus.className = 'console-status fetching';
    consoleMeta.style.display = 'none';
    consoleCode.textContent = '// Loading data from: ' + targetUrl + ' ...';

    const startTime = performance.now();

    try {
        const response = await fetch(fetchUrl);
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);

        if (!response.ok) {
            throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const jsonText = JSON.stringify(data, null, 2);
        
        // Calculate approx response size
        const bytes = new Blob([jsonText]).size;
        const sizeStr = bytes > 1024 ? `${(bytes / 1024).toFixed(2)} KB` : `${bytes} B`;

        // Update Terminal State
        consoleStatus.textContent = 'Success';
        consoleStatus.className = 'console-status success';
        consoleMeta.style.display = 'flex';
        metaStatus.textContent = `${response.status} ${response.statusText}`;
        metaStatus.className = 'text-green';
        metaTime.textContent = `${duration}ms`;
        metaSize.textContent = sizeStr;

        // Populate response window with a neat snippet of data
        consoleCode.textContent = jsonText;
    } catch (err) {
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);

        consoleStatus.textContent = 'Failed';
        consoleStatus.className = 'console-status failed';
        consoleMeta.style.display = 'flex';
        metaStatus.textContent = 'Error';
        metaStatus.className = 'text-red';
        metaTime.textContent = `${duration}ms`;
        metaSize.textContent = '0 B';

        consoleCode.textContent = `// Error fetching endpoint:\n// ${err.message}\n\n// Tip: If you entered a custom Base URL hosted externally,\n// make sure that CORS is enabled on your host.`;
    }
}

// Download Button
function downloadDatabase() {
    const downloadUrl = downloadLink.textContent.trim();
    window.open(downloadUrl, '_blank');
}

// Copy URL to Clipboard
function copyText(id) {
    const text = document.getElementById(id).textContent;
    navigator.clipboard.writeText(text).then(() => {
        const btn = document.querySelector(`#${id} ~ .btn-group .copy-btn`) || document.querySelector(`#${id} + .copy-btn`);
        const originalText = btn.textContent;
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(() => {
            btn.textContent = originalText;
            btn.classList.remove('copied');
        }, 2000);
    });
}

// Schema table expand/collapse toggle
function toggleSchemaTable(tableId) {
    const element = document.getElementById(tableId);
    element.classList.toggle('expanded');
}

// Multi-tab code snippet selector
function switchTab(tabId) {
    // Deactivate all tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    // Find tab button by matching text/id
    event.currentTarget.classList.add('active');
    document.getElementById(tabId).classList.add('active');
}

// Switch App Showcase Screenshots with a smooth fade animation
function switchAppScreenshot(tabName, imagePath, descriptionText) {
    // 1. Update active classes on buttons
    const buttons = document.querySelectorAll('.app-feature-item');
    buttons.forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Set active state on the clicked button
    if (window.event && window.event.currentTarget) {
        window.event.currentTarget.classList.add('active');
    }

    // 2. Animate and update active screenshot inside mock phone
    const phoneImg = document.getElementById('active-phone-img');
    if (phoneImg) {
        // Trigger fade out
        phoneImg.classList.add('loading');
        
        setTimeout(() => {
            // Swap image src
            phoneImg.src = imagePath;
            
            // Trigger fade in when loaded
            if (phoneImg.complete) {
                phoneImg.classList.remove('loading');
            } else {
                phoneImg.onload = () => {
                    phoneImg.classList.remove('loading');
                };
            }
        }, 250); // Match style.css transition timing nicely
    }
}

// Bind selectors and inputs
baseUrlInput.addEventListener('input', updateLinks);
langSelect.addEventListener('change', populateBooks);
bookSelect.addEventListener('change', updateLinks);

// Initial start
initPlayground();
