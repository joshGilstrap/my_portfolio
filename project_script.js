document.addEventListener('DOMContentLoaded', function() {
    const githubLink = document.querySelector('a').href;
    const codeContainer = document.querySelector(".code-container");
    const tabButtonsContainer = document.querySelector('.tab-buttons');
    const tabContentsContainer = document.querySelector('.tab-contents');

    // --- Dark Mode Toggle ---
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

    // --- Close Tab Button ---
    const closeTabButton = document.querySelector('.close-tab-button');
    if (closeTabButton) { // Check if the button exists
        closeTabButton.addEventListener('click', () => {
            window.close(); // Close the current tab/window
        });
    }
    // --- End Close Tab Button ---

    if (githubLink) {
        fetchRepoContents(githubLink, ""); // Start at the root
    }

    async function fetchRepoContents(repoURL, currentPath) {
        try {
            // 1. Extract owner and repo name
            const urlParts = repoURL.replace("https://github.com/", "").split("/");
            const owner = urlParts[0];
            const repo = urlParts[1];
            const apiURL = `https://api.github.com/repos/${owner}/${repo}/contents/${currentPath}`;

            const response = await fetch(apiURL);

            if (!response.ok) {
                throw new Error(`Failed to fetch repository contents: ${response.status}`);
            }

            const data = await response.json();

            // Clear existing tabs (buttons and content)
            tabButtonsContainer.innerHTML = '';
            tabContentsContainer.innerHTML = '';

            // Add a "Back" button (if not at the root)
            // if (currentPath !== "") {
            //     const backButton = document.createElement('button');
            //     backButton.textContent = 'Back';
            //     backButton.classList.add('tab-button');
            //     backButton.dataset.path = currentPath.split('/').slice(0, -1).join('/'); // Store parent path
            //     backButton.addEventListener('click', handleBackClick); // Use named function
            //     tabButtonsContainer.appendChild(backButton);
            // }
          // Create tabs for files ONLY
            for (const item of data) {
              if (item.type === 'file' && item.name.endsWith('.py')) {
                    await createTab(item.name, item.download_url);
              }  
            //   else if (item.type === 'dir') { //if directory
            //         const dirButton = document.createElement('button');
            //         dirButton.textContent = item.name + "/";
            //         dirButton.classList.add('tab-button');
            //         dirButton.dataset.path = currentPath ? `${currentPath}/${item.name}` : item.name; // Store full path
            //         dirButton.addEventListener('click', handleDirClick); // Use named function
            //     tabButtonsContainer.appendChild(dirButton);
            //   }
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
            tabContentsContainer.appendChild(pre); // Display errors
        }
    }
    // Named function for handling directory clicks
    function handleDirClick(event) {
        event.preventDefault();
        const newPath = event.target.dataset.path;
        fetchRepoContents(githubLink, newPath); // Use stored githubLink
    }

    // Named function for handling back button clicks
    function handleBackClick(event) {
        event.preventDefault();
        const parentPath = event.target.dataset.path;
        fetchRepoContents(githubLink, parentPath); // Use stored githubLink
    }

    async function createTab(filename, downloadURL) {
        // Check if tab already exists
        let button = tabButtonsContainer.querySelector(`[data-filename="${filename}"]`);
        let tabContent = tabContentsContainer.querySelector(`[data-filename="${filename}"]`);

        if (!button) { // Create new tab elements ONLY if they don't exist
            button = document.createElement('button');
            button.textContent = filename;
            button.classList.add('tab-button');
            button.dataset.filename = filename;
            button.dataset.downloadurl = downloadURL; // Store download URL
            tabButtonsContainer.appendChild(button);

            tabContent = document.createElement('div');
            tabContent.classList.add('tab-content');
            tabContent.dataset.filename = filename;
            tabContentsContainer.appendChild(tabContent);

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
              console.error("Error fetching file content:", error); // Log specific error
                tabContent.innerHTML = `<pre><code>Error loading ${filename}: ${error.message}</code></pre>`;
            }

             // Add click event listener to the button
            button.addEventListener('click', () => {
                // Deactivate all tabs
                document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

                // Activate the clicked tab
                button.classList.add('active');
                tabContent.classList.add('active');
            });
        } else { //if it exists
            // Deactivate all tabs
                document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

                // Activate the clicked tab
                button.classList.add('active');
                tabContent.classList.add('active');
        }
    }
});