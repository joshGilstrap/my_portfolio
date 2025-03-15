document.addEventListener('DOMContentLoaded', function() {
    const githubLink = document.querySelector('a').href;
    const codeContainer = document.querySelector(".code-container");
    const tabButtonsContainer = document.querySelector('.tab-buttons');
    const tabContentsContainer = document.querySelector('.tab-contents');

    // --- Dark Mode Toggle (Keep as is) ---
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


    if (githubLink) {
        fetchRepoContents(githubLink); // No path needed
    }

    async function fetchRepoContents(repoURL) {
        try {
            // 1. Extract owner and repo name
            const urlParts = repoURL.replace("https://github.com/", "").split("/");
            const owner = urlParts[0];
            const repo = urlParts[1];
            const apiURL = `https://api.github.com/repos/${owner}/${repo}/contents`; // Fetch root

            const response = await fetch(apiURL);

            if (!response.ok) {
                throw new Error(`Failed to fetch repository contents: ${response.status}`);
            }

            const data = await response.json();

            // Clear existing tabs
            tabButtonsContainer.innerHTML = '';
            tabContentsContainer.innerHTML = '';

            // Create tabs for .py files ONLY
            for (const item of data) {
                if (item.type === 'file' && item.name.endsWith('.py')) {
                    await createTab(item.name, item.download_url);
                }
            }

            // Activate the first tab by default (if there are any)
            const firstTabButton = tabButtonsContainer.querySelector('.tab-button');
            if (firstTabButton) {
                firstTabButton.click();
            }

        } catch (error) {
            const pre = document.createElement('pre');
            const code = document.createElement('code');
            code.textContent = `Error: ${error.message}`;
            pre.appendChild(code);
            tabContentsContainer.appendChild(pre);
        }
    }


    async function createTab(filename, downloadURL) {
        // Create tab button
        const button = document.createElement('button');
        button.textContent = filename;
        button.classList.add('tab-button');
        button.dataset.filename = filename;
        tabButtonsContainer.appendChild(button);

        // Create tab content container
        const tabContent = document.createElement('div');
        tabContent.classList.add('tab-content');
        tabContent.dataset.filename = filename;

        // Fetch and add code to tab content
        try {
            const response = await fetch(downloadURL);
            if (!response.ok) {
                throw new Error(`Failed to fetch ${filename}: ${response.status}`);
            }
            const codeText = await response.text();
            const pre = document.createElement('pre');
            const code = document.createElement('code');
            code.classList.add('file-content');
            code.textContent = codeText;
            pre.appendChild(code);
            tabContent.appendChild(pre);
        } catch (error) {
             const pre = document.createElement('pre');
            const code = document.createElement('code');
            code.textContent = `Error loading ${filename}: ${error.message}`;
            pre.appendChild(code);
            tabContentsContainer.appendChild(pre);
        }

        tabContentsContainer.appendChild(tabContent);

        // Add click event listener to the button (no changes here)
        button.addEventListener('click', () => {
            // Deactivate all tabs
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

            // Activate the clicked tab
            button.classList.add('active');
            tabContent.classList.add('active');
        });
    }
});