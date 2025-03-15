document.addEventListener('DOMContentLoaded', function() {
    const projectButtons = document.querySelectorAll('.project-button');
    const gameContainer = document.getElementById('game-container');
    const toggleButtons = document.querySelectorAll('.toggle-code'); //for code
    const codeContainer = document.querySelector('.code-container'); //for code
    let activeIframe = null; // Keep track of the active iframe

    // --- Dark Mode Toggle (Keep this as is) ---
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
    const projectData = {
        project1: {
            title: "Star Wars Arcade 1983",
            description: "A clone of the 1983 Star Wars game",
            iframeSrc: "star_wars_arcade/index.html",
            githubLink: "https://github.com/joshGilstrap/Star-Wars-Arcade-1983"
        },
        project2: {
            title: "Asteroids",
            description: "Asteroids Clone",
            iframeSrc: "asteroids/index.html",
            githubLink: "https://github.com/joshGilstrap/Asteroids-Clone"
        },
        project3: {
            title: "Space Fighter",
            description: "Loose Space Invaders clone.",
            iframeSrc: "space_fighter/index.html",
            githubLink: "https://github.com/joshGilstrap/Space-Fighter"
        }
    };

    // --- Project Button Click Handling ---
    projectButtons.forEach(button => {
        button.addEventListener('click', function() {
            const projectId = this.getAttribute('data-project');
            loadProject(projectId);
        });
    });
     // --- Code Toggle (Modified for iframe handling) ---
        toggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const projectContainer = button.closest('.project');
            const githubLink = document.getElementById("github-link").href;

            if (codeContainer.style.display === 'none' || codeContainer.style.display === '') {
                codeContainer.style.display = 'block';
                button.textContent = 'Hide Code';

                // Fetch and display the file list ONLY if it hasn't been loaded yet.
                if (codeContainer.querySelector('.file-list') === null) { //check for file list div
                   // Initialize with the root of the repository
                    const initialPath = ""; // Start at the root
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
    function loadProject(projectId) {
    const projectInfo = projectData[projectId];

    // Update the project information (title, description, GitHub link)
    document.querySelector('.project h3').textContent = projectInfo.title;
    document.querySelector('.project-description').textContent = projectInfo.description;
    document.getElementById('github-link').href = projectInfo.githubLink;
    document.querySelector('.code-container .code-content').textContent = ''; //clear code

    // Remove the previous iframe, if any
    if (activeIframe) {
        gameContainer.removeChild(activeIframe);
        activeIframe = null; // Reset activeIframe
    }

    // Create a new iframe
    const iframe = document.createElement('iframe');
    iframe.src = projectInfo.iframeSrc;
    iframe.width = "800";  // Set width (adjust as needed)
    iframe.height = "600"; // Set height (adjust as needed)
    iframe.frameBorder = "0";
    iframe.classList.add('game-iframe'); // Add the class
    // Add event listeners for pause/resume (using postMessage)
    iframe.addEventListener('mouseenter', () => {
        if (activeIframe !== iframe) {
            pauseGame(activeIframe);
            activeIframe = iframe;
            resumeGame(activeIframe);
        }
    });
    //Pause game when mouse leaves window.
    document.addEventListener('mouseleave', () => {
        pauseGame(activeIframe);
        activeIframe = null;

    });

    gameContainer.appendChild(iframe); // Add the iframe to the container
    activeIframe = iframe; // Set as active iframe
}
    function pauseGame(iframe) {
        if (iframe) {
            iframe.contentWindow.postMessage({ type: 'pause' }, '*');
        }
    }

    function resumeGame(iframe) {
        if (iframe) {
            iframe.contentWindow.postMessage({ type: 'resume' }, '*');
        }
    }
});