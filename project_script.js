document.addEventListener('DOMContentLoaded', function() {
    const codeContent = document.querySelector('.code-content');
    const githubLink = document.querySelector('a').href;

     // --- Dark Mode (Keep as is) ---
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
    // --- End Dark Mode ---

    if (codeContent && githubLink) {
        fetchRepoContents(githubLink, codeContent); // Call the function
    }

    async function fetchRepoContents(repoURL, codeContainer) {
        try {
            // 1. Extract owner, repo name, and path from the GitHub URL
            const urlParts = repoURL.replace("https://github.com/", "").split("/");
            const owner = urlParts[0];
            const repo = urlParts[1];
            const path = "game" // Set the path to game

            // 2. Construct the API URL
            const apiURL = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

            const response = await fetch(apiURL);

            if (!response.ok) {
                throw new Error(`Failed to fetch repository contents: ${response.status}`);
            }

            const data = await response.json();

            //Iterate
            for (const item of data) {
              if (item.type === 'file' && item.name.endsWith('.py')) { //only .py files
                await fetchCode(item.name, codeContainer, repoURL); //await to fetch
                }
            }

        } catch (error) {
            codeContainer.innerHTML = `<p>Error: ${error.message}</p>`; //show errors
        }
    }
    async function fetchCode(filename, codeContentElement, repoURL) {
        try {
            // Construct the raw URL correctly (using "main" branch)
            const baseURL = repoURL.replace("github.com", "raw.githubusercontent.com").replace(/\/$/, "").replace("/blob","");
            const branch = "main";
            const rawURL = `${baseURL}/${branch}/game/${filename}`; //added game

            const response = await fetch(rawURL);

            if (!response.ok) {
                if (response.status === 404) {
                    return; // File not found, just return (shouldn't happen, but good to handle)
                }
                throw new Error(`Failed to fetch ${filename}: ${response.status}`);
            }

            const codeText = await response.text();
            codeContentElement.textContent += `\n// --- ${filename} ---\n${codeText}\n`;

        } catch (error) {
                codeContentElement.textContent += `Error loading ${filename}: ${error.message}\n`;
        }
    }
});