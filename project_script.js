document.addEventListener('DOMContentLoaded', function() {
    const codeContent = document.querySelector('.code-content');
    const githubLink = document.querySelector('a').href;
// Dark Mode Toggle
    const darkModeToggle = document.querySelector('.dark-mode-toggle');
    const htmlElement = document.documentElement;

    const currentTheme = localStorage.getItem('theme');
    if (currentTheme) {
        htmlElement.setAttribute('data-theme', currentTheme);
        if (currentTheme === 'dark') {
          darkModeToggle.textContent = "Toggle Light Mode"
        }

    }

    darkModeToggle.addEventListener('click', () => {
        if (htmlElement.getAttribute('data-theme') === 'dark') {
            htmlElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
             darkModeToggle.textContent = "Toggle Dark Mode"
        } else {
            htmlElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            darkModeToggle.textContent = "Toggle Light Mode"
        }
    });
    // --- End Dark Mode Toggle ---

    // Fetch and display the code *immediately* on page load.
    if (codeContent && githubLink) { // Check if elements exist
        fetchCode('main.py', codeContent, githubLink);
        fetchCode('level_loader.py', codeContent, githubLink); // Add other files as needed
    }

    async function fetchCode(filename, codeContentElement, repoURL) {
        try {
            const baseURL = repoURL.replace("github.com", "raw.githubusercontent.com").replace(/\/$/, "").replace("/blob", "");
            const branch = "main"; // Or 'master'
            const rawURL = `${baseURL}/${branch}/${filename}`;
            const response = await fetch(rawURL);

            if (!response.ok) {
                 if (response.status === 404) {
                    return; // File not found, just skip
                }
                throw new Error(`Failed to fetch ${filename}: ${response.status}`);
            }

            const codeText = await response.text();
            codeContentElement.textContent += `\n// --- ${filename} ---\n${codeText}\n`;
        } catch (error) {
            if (filename == 'main.py'){
                codeContentElement.textContent += `Error loading ${filename}: ${error.message}\n`;
            }
        }
    }
});