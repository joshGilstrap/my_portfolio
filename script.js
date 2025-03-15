document.addEventListener('DOMContentLoaded', function() {
    const toggleButtons = document.querySelectorAll('.toggle-code');

    const darkModeToggle = document.querySelector('.dark-mode-toggle');
    const htmlElement = document.documentElement;

    // Toggle themes
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

    // Focus management
    let activeIframe = null;

    const iframes = document.querySelectorAll(".game-iframe");

    function pauseGame(iframe) {
        if(iframe) {
            iframe.contentElement.postMessage({type: "pause"}, '*');
        }
    }

    function resumeGame(iframe) {
        if(iframe) {
            iframe.contentWindow.postMessage({type: "resume"}, '*');
        }
    }

    iframes.forEach(iframe => {
        iframe.classList.add("game-iframe");
        iframe.addEventListener('mouseenter', () => {
            if(activeIframe !== iframe) {
                pauseGame(activeIframe);
                activeIframe = iframe;
                resumeGame(activeIframe);
            }
        });
    });

    document.addEventListener('mouseleave', () => {
        pauseGame(activeIframe);
        // activeIframe = null;
    })

    // Toggle code
    toggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const projectContainer = button.closest('.project');
            const codeContainer = projectContainer.querySelector('.code-container');
            const githubLink = projectContainer.querySelector('a').href;

            if (codeContainer.style.display === 'none' || codeContainer.style.display === '') {
                codeContainer.style.display = 'block';
                button.textContent = 'Hide Code';

                if (codeContainer.querySelector('.file-list') === null) {
                    const initialPath = "";
                    fetchRepoContents(githubLink, codeContainer, initialPath);
                }
            } else {
                codeContainer.style.display = 'none';
                button.textContent = 'Show Code';
            }
        });
    });

    async function fetchRepoContents(repoURL, codeContainer, currentPath) {
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

            codeContainer.innerHTML = '';

            if (currentPath !== "") {
                const backButton = document.createElement('button');
                backButton.textContent = 'Back';
                backButton.addEventListener('click', () => {
                    const parentPath = currentPath.split('/').slice(0, -1).join('/');
                    fetchRepoContents(repoURL, codeContainer, parentPath);
                });
                codeContainer.appendChild(backButton);
          }

            const fileListContainer = document.createElement('div');
            fileListContainer.classList.add('file-list');
            codeContainer.appendChild(fileListContainer);


            const fileList = document.createElement('ul');
            fileListContainer.appendChild(fileList);


            const fileContentContainer = document.createElement('div');
            fileContentContainer.classList.add('file-content');
            codeContainer.appendChild(fileContentContainer);


            data.forEach(item => {
                const listItem = document.createElement('li');
                const link = document.createElement('a');
                link.textContent = item.name;
                link.href = "#";
                listItem.appendChild(link);
                fileList.appendChild(listItem);

                link.addEventListener('click', (event) => {
                    event.preventDefault();

                    if (item.type === 'file') {
                      fetchFileContent(item.download_url, fileContentContainer);
                    } else if (item.type === 'dir') {
                        const newPath = currentPath ? `${currentPath}/${item.name}` : item.name;
                        fetchRepoContents(repoURL, codeContainer, newPath);
                    }
                });

            });

        } catch (error) {
            codeContainer.innerHTML = `<p>Error: ${error.message}</p>`;
        }
    }

  async function fetchFileContent(downloadURL, container) {
    try {
        const response = await fetch(downloadURL);
        if (!response.ok) {
            throw new Error(`Failed to fetch file content: ${response.status}`);
        }
        const text = await response.text();
        container.textContent = text;
    } catch (error) {
        container.textContent = `Error loading file content: ${error.message}`;
    }
}
});