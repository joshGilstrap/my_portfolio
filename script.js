document.addEventListener('DOMContentLoaded', function() {
    const projectButtons = document.querySelectorAll('.project-button');
    const gameContainer = document.getElementById('game-container');
    const codeContainer = document.querySelector('.code-container'); // Only one code container
    let activeIframe = null;

    // --- Dark Mode Toggle (Keep this as is, it's correct) ---
    const darkModeToggle = document.querySelector('.dark-mode-toggle');
    const htmlElement = document.documentElement;

    const currentTheme = localStorage.getItem('theme');
    if (currentTheme) {
        htmlElement.setAttribute('data-theme', currentTheme);
        if (currentTheme === 'dark') {
            darkModeToggle.textContent = "Toggle Light Mode";
        }
    }

    darkModeToggle.addEventListener('click', () => {
        if (htmlElement.getAttribute('data-theme') === 'dark') {
            htmlElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
            darkModeToggle.textContent = "Toggle Dark Mode";
        } else {
            htmlElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            darkModeToggle.textContent = "Toggle Light Mode";
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

    function loadProject(projectId) {
        const projectInfo = projectData[projectId];
        if (!projectInfo) {
            console.error(`Project ID "${projectId}" not found in projectData.`);
            return; // Exit if project not found
        }

        // Update the project information (title, description, GitHub link)
        document.querySelector('.project h3').textContent = projectInfo.title;
        document.querySelector('.project-description').textContent = projectInfo.description;
        document.getElementById('github-link').href = projectInfo.githubLink; //update link
        document.querySelector('code-container .code-content').textContent = ''; //clear code


        // Remove the previous iframe, if any
        if (activeIframe) {
            gameContainer.removeChild(activeIframe);
            activeIframe = null;
        }

        // Create a new iframe
        const iframe = document.createElement('iframe');
        iframe.src = projectInfo.iframeSrc;
        iframe.width = "800";  // Or your preferred dimensions
        iframe.height = "600";
        iframe.frameBorder = "0";
        iframe.classList.add('game-iframe'); // Add the class for pause/resume

        // Add event listeners for pause/resume (using postMessage)
        iframe.addEventListener('mouseenter', () => {
            if (activeIframe !== iframe) {
                pauseGame(activeIframe);
                activeIframe = iframe;
                resumeGame(activeIframe);
            }
        });
        //Pause on leave.
        document.addEventListener('mouseleave', () => {
            pauseGame(activeIframe);
            activeIframe = null;

        });

        gameContainer.appendChild(iframe);
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

    // --- Code Toggle ---
    const toggleCodeButton = document.querySelector('.toggle-code'); // Select the button
    toggleCodeButton.addEventListener('click', function() {
        if (codeContainer.style.display === 'none' || codeContainer.style.display === '') {
            codeContainer.style.display = 'block';
            this.textContent = 'Hide Code'; // Change button text

            // Fetch and display the file list ONLY if it hasn't been loaded yet.
            if (codeContainer.querySelector('.file-list') === null) {
                const githubLink = document.getElementById('github-link').href; //get link
                fetchRepoContents(githubLink, codeContainer, ""); // Start at the root
            }
        } else {
            codeContainer.style.display = 'none';
            this.textContent = 'Show Code'; // Change button text
        }
    });

    async function fetchRepoContents(repoURL, codeContainer, currentPath) {
       //From before, but repeated for completeness.
        try {
            // 1. Extract owner, repo name from the GitHub URL
            const urlParts = repoURL.replace("https://github.com/", "").split("/");
            const owner = urlParts[0];
            const repo = urlParts[1];

            // 2. Construct the API URL. currentPath is already handled
            const apiURL = `https://api.github.com/repos/${owner}/${repo}/contents/${currentPath}`;

            const response = await fetch(apiURL);

            if (!response.ok) {
                throw new Error(`Failed to fetch repository contents: ${response.status}`);
            }

            const data = await response.json();

            // Clear previous content and set up structure
            codeContainer.innerHTML = '';

            // Add a "Back" button (if not at the root)
            if (currentPath !== "") {
                const backButton = document.createElement('button');
                backButton.textContent = 'Back';
                backButton.addEventListener('click', () => {
                    // Go up one level.  Handle going back to the root.
                    const parentPath = currentPath.split('/').slice(0, -1).join('/');
                    fetchRepoContents(repoURL, codeContainer, parentPath);
                });
                codeContainer.appendChild(backButton);
          }

            // Create the file list container
            const fileListContainer = document.createElement('div');
            fileListContainer.classList.add('file-list');
            codeContainer.appendChild(fileListContainer);


            // Create file list
            const fileList = document.createElement('ul');
            fileListContainer.appendChild(fileList);


            // Create content display
            const fileContentContainer = document.createElement('div');
            fileContentContainer.classList.add('file-content');
            codeContainer.appendChild(fileContentContainer);


            data.forEach(item => {
                const listItem = document.createElement('li');
                const link = document.createElement('a');
                link.textContent = item.name;
                link.href = "#";  // Prevent page reload
                listItem.appendChild(link);
                fileList.appendChild(listItem);

                link.addEventListener('click', (event) => {
                    event.preventDefault(); //prevent reload

                    if (item.type === 'file') {
                      fetchFileContent(item.download_url, fileContentContainer);
                    } else if (item.type === 'dir') {
                        const newPath = currentPath ? `${currentPath}/${item.name}` : item.name; //Handle root
                        fetchRepoContents(repoURL, codeContainer, newPath); // Recurse into directory
                    }
                });

            });

        } catch (error) {
            codeContainer.innerHTML = `<p>Error: ${error.message}</p>`;
        }
    }
  async function fetchFileContent(downloadURL, container) {
        //From before, but repeated for completeness
    try {
        const response = await fetch(downloadURL);
        if (!response.ok) {
            throw new Error(`Failed to fetch file content: ${response.status}`);
        }
        const text = await response.text();
        container.textContent = text; // Display as plain text
    } catch (error) {
        container.textContent = `Error loading file content: ${error.message}`;
    }
}
});