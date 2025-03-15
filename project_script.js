document.addEventListener('DOMContentLoaded', function() {
    const codeContent = document.querySelector('.code-content'); //  `<pre><code>`
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
            const apiURL = `https://api.github.com/repos/${owner}/${repo}/contents/${currentPath}`;

            const response = await fetch(apiURL);

            if (!response.ok) {
                throw new Error(`Failed to fetch repository contents: ${response.status}`);
            }

            const data = await response.json();

            // Create a *new* container for the file list.
            const fileListContainer = document.createElement('div');
            fileListContainer.classList.add('file-list'); // Add a class

            const fileList = document.createElement('ul');
            fileListContainer.appendChild(fileList); // Add the <ul> to the container


            for (const item of data) {
                const listItem = document.createElement('li');
                const link = document.createElement('a');
                link.textContent = item.name;
                link.href = "#";  // Prevent default link behavior
                listItem.appendChild(link);
                fileList.appendChild(listItem);

                link.addEventListener('click', async (event) => {
                    event.preventDefault();

                    if (item.type === 'file') {
                        if (item.name.endsWith('.py')) {
                            codeContainer.innerHTML = ''; // Clear *only* the code display area
                            await fetchAndDisplayCode(item.download_url, codeContainer);
                        }
                    } else if (item.type === 'dir') {
                        const newPath = currentPath ? `${currentPath}/${item.name}` : item.name;

                        //  *Don't* clear here!  We're about to replace the file list.
                        const backButton = document.createElement('button');
                        backButton.textContent = 'Back';
                        backButton.addEventListener('click', () => {
                           const parentPath = currentPath.split('/').slice(0, -1).join('/');
                           fetchRepoContents(repoURL, codeContainer, parentPath); // Go up one level
                        });
                        // Replace entire contents of codeContainer with Back button and new file list
                        codeContainer.innerHTML = ''; // Clear for Back button and new list
                        codeContainer.appendChild(backButton);
                        fetchRepoContents(repoURL, codeContainer, newPath); // Recursive call
                    }
                });
            }
            //Clear
            // codeContainer.innerHTML = '';
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
            codeContainer.appendChild(fileListContainer); // Add the *container*


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
            code.textContent = `// --- ${fileName} ---\n${codeText}\n`;
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