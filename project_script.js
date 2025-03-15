document.addEventListener('DOMContentLoaded', function() {
    const codeContent = document.querySelector('.code-content');
    const githubLink = document.querySelector('a').href;

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

    if (codeContent && githubLink) {
        fetchRepoContents(githubLink, codeContent, ""); // Start at the root
    }

    async function fetchRepoContents(repoURL, codeContainer, currentPath) {
        try {
            // 1. Extract owner and repo name
            const urlParts = repoURL.replace("https://github.com/", "").split("/");
            const owner = urlParts[0];
            const repo = urlParts[1];
            const apiURL = `https://api.github.com/repos/<span class="math-inline">\{owner\}/</span>{repo}/contents/${currentPath}`;

            const response = await fetch(apiURL);

            if (!response.ok) {
                throw new Error(`Failed to fetch repository contents: ${response.status}`);
            }

            const data = await response.json();

            //Create list
            const fileList = document.createElement('ul');

            for (const item of data) {
                const listItem = document.createElement('li');
                const link = document.createElement('a');
                link.textContent = item.name;
                link.href = "#";  // Prevent default link behavior
                listItem.appendChild(link);
                fileList.appendChild(listItem);

                link.addEventListener('click', async (event) => { // Make this async
                    event.preventDefault();

                    if (item.type === 'file') {
                        if (item.name.endsWith('.py')) { // Only display .py files
                            codeContainer.innerHTML = ''; // Clear previous content!
                            await fetchAndDisplayCode(item.download_url, codeContainer); //await to fetch
                        }
                    } else if (item.type === 'dir') {
                        const newPath = currentPath ? `<span class="math-inline">\{currentPath\}/</span>{item.name}` : item.name;
                         // Clear previous list and fetch new contents
                        codeContainer.innerHTML = ''; // Clear current contents
                        const backButton = document.createElement('button');
                        backButton.textContent = 'Back';
                        backButton.addEventListener('click', () => {
                           const parentPath = currentPath.split('/').slice(0, -1).join('/');
                           fetchRepoContents(repoURL, codeContainer, parentPath);
                        });
                        codeContainer.appendChild(backButton);
                        fetchRepoContents(repoURL, codeContainer, newPath); //recursive call
                    }
                });

            }
             // Clear and display
            codeContainer.innerHTML = '';
              // Add a "Back" button (if not at the root)
            if (currentPath !== "") {
                const backButton = document.createElement('button');
                backButton.textContent = 'Back';
                backButton.addEventListener('click', () => {
                  const parentPath = currentPath.split('/').slice(0, -1).join('/');
                    fetchRepoContents(repoURL, codeContainer, parentPath);
                });
                codeContainer.appendChild(backButton);
          }
            codeContainer.appendChild(fileList);


        } catch (error) {
            codeContainer.innerHTML = `<p>Error: ${error.message}</p>`;
        }
    }


    async function fetchAndDisplayCode(downloadURL, container) {
        try {
            const response = await fetch(downloadURL);
            if (!response.ok) {
                throw new Error(`Failed to fetch file content: ${response.status}`);
            }
            const codeText = await response.text();
            const fileName = downloadURL.split('/').pop();
              // Create a new <pre><code> block for each file
            const pre = document.createElement('pre');
            const code = document.createElement('code');
            code.textContent = `// --- <span class="math-inline">\{fileName\} \-\-\-\\n</span>{codeText}\n`;
            pre.appendChild(code);
            container.appendChild(pre);
        } catch (error) {
             const pre = document.createElement('pre');
            const code = document.createElement('code');
            code.textContent = `Error loading file content: ${error.message}`;
            pre.appendChild(code);
            container.appendChild(pre);
        }
    }
});