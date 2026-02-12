const baseUrlInput = document.getElementById('baseUrl');
const allInfoLink = document.getElementById('allInfoLink');
const langInfoLink = document.getElementById('langInfoLink');
const downloadLink = document.getElementById('downloadLink');

function updateLinks() {
    let url = baseUrlInput.value.trim();
    if (!url) {
        url = 'https://your-hosting-url.com';
    }

    // Remove trailing slash if exists
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }

    allInfoLink.textContent = `${url}/all_info.json`;
    langInfoLink.textContent = `${url}/eng/info.json`;
    downloadLink.textContent = `${url}/eng/eng-bukhari.sqlite.zip`;
}

baseUrlInput.addEventListener('input', updateLinks);

// Initial run
updateLinks();

function copyText(id) {
    const text = document.getElementById(id).textContent;
    navigator.clipboard.writeText(text).then(() => {
        const btn = document.querySelector(`#${id} + .copy-btn`);
        const originalText = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => {
            btn.textContent = originalText;
        }, 2000);
    });
}
