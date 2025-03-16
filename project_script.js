document.addEventListener('DOMContentLoaded', function() {
    const githubLink = document.querySelector('a').href;
    const codeContainer = document.querySelector(".code-container");
    const tabButtonsContainer = document.querySelector('.tab-buttons');
    const tabContentsContainer = document.querySelector('.tab-contents');

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

    const closeTabButton = document.querySelector('close-tab-button');
    if (closeTabButton) {
        closeTabButton.addEventListener('click', () => {
            window.close();
        });
    }

    if (githubLink) {
        fetchRepoContents(githubLink, "");
    }

    async function fetchRepoContents(repoURL, currentPath) {
        try {
            const urlParts = repoURL.replace("https://github.com/", "").split("/");
            const owner = urlParts[0];
            const repo = urlParts[1];
            const apiURL = `https://api.github.com/repos/${owner}/${repo}/contents/${currentPath}`;

            const response = await fetch(apiURL);

            if (!response.ok) {
                throw new Error(`Failed to fetch repository contents: ${response.status}`);
            }

            const data = await response.json();

            tabButtonsContainer.innerHTML = '';
            tabContentsContainer.innerHTML = '';

            for (const item of data) {
              if (item.type === 'file' && item.name.endsWith('.py')) {
                    await createTab(item.name, item.download_url);
              }
            }

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
        let button = tabButtonsContainer.querySelector(`[data-filename="${filename}"]`);
        let tabContent = tabContentsContainer.querySelector(`[data-filename="${filename}"]`);

        if (!button) {
            button = document.createElement('button');
            button.textContent = filename;
            button.classList.add('tab-button');
            button.dataset.filename = filename;
            button.dataset.downloadurl = downloadURL;
            tabButtonsContainer.appendChild(button);

            tabContent = document.createElement('div');
            tabContent.classList.add('tab-content');
            tabContent.dataset.filename = filename;
            tabContentsContainer.appendChild(tabContent);

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
              console.error("Error fetching file content:", error);
                tabContent.innerHTML = `<pre><code>Error loading ${filename}: ${error.message}</code></pre>`;
            }

            button.addEventListener('click', () => {
                document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

                button.classList.add('active');
                tabContent.classList.add('active');
            });
        } else {
                document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

                button.classList.add('active');
                tabContent.classList.add('active');
        }
    }
});