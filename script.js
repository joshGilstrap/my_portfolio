document.addEventListener('DOMContentLoaded', function() {
    const projectButtons = document.querySelectorAll('.project-button');
    const gameContainer = document.getElementById('game-container'); //for dynamic loading
    const codeContainer = document.querySelector('.code-container'); // Only one code container
    let activeIframe = null;


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

    const projectData = {
        project1: {
            title: "Project 1 Title",
            description: "Short description of Project 1.",
            pageSrc: "project1.html", // Use pageSrc instead of iframeSrc
            githubLink: "https://github.com/yourusername/project1-repo" // Replace
        },
        project2: {
            title: "Project 2 Title",
            description: "Short description of Project 2.",
            pageSrc: "project2.html", // Use pageSrc
            githubLink: "https://github.com/yourusername/project2-repo" // Replace
        },
        project3: {
            title: "Project 3 Title",
            description: "Short description of Project 3",
            pageSrc: "project3.html", // Use pageSrc
            githubLink: "https://github.com/yourusername/project3-repo"
        }
        // Add more projects as needed
    };

    projectButtons.forEach(button => {
        button.addEventListener('click', function() {
            const projectId = this.getAttribute('data-project');
            loadProject(projectId);
        });
    });
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
            if (currentPath !== "") {
                const backButton = document.createElement('button');
                backButton.textContent = 'Back';
                backButton.classList.add('tab-button');
                backButton.dataset.path = currentPath.split('/').slice(0, -1).join('/'); // Store parent path
                backButton.addEventListener('click', handleBackClick); // Use named function
                tabButtonsContainer.appendChild(backButton);
            }
          // Create tabs for files ONLY
            for (const item of data) {
              if (item.type === 'file' && item.name.endsWith('.py')) {
                    await createTab(item.name, item.download_url);
              }  else if (item.type === 'dir') { //if directory
                    const dirButton = document.createElement('button');
                    dirButton.textContent = item.name + "/";
                    dirButton.classList.add('tab-button');
                    dirButton.dataset.path = currentPath ? `${currentPath}/${item.name}` : item.name; // Store full path
                    dirButton.addEventListener('click', handleDirClick); // Use named function
                tabButtonsContainer.appendChild(dirButton);
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
            tabContent.innerHTML = `<pre><code>Error loading ${filename}: ${error.message}</code></pre>`;
        }

        tabContentsContainer.appendChild(tabContent);

        // Add click event listener to the button
        button.addEventListener('click', () => {
            // Deactivate all tabs
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

            // Activate the clicked tab
            button.classList.add('active');
            tabContent.classList.add('active');
        });
    }

    function loadProject(projectId) {
        const projectInfo = projectData[projectId];
        if (!projectInfo) {
            console.error(`Project ID "${projectId}" not found in projectData.`);
            return;
        }

        // Open project page in a new window/tab using window.open()
        window.open(projectInfo.pageSrc, '_blank');


        // Update portfolio page content
        document.querySelector('.project h3').textContent = projectInfo.title;
        document.querySelector('.project-description').textContent = projectInfo.description;
        document.getElementById('github-link').href = projectInfo.githubLink; //update link
        document.querySelector('.code-container .code-content').textContent = ''; //clear code
         if (activeIframe) { //remove old iframe
            gameContainer.removeChild(activeIframe);
            activeIframe = null;
        }
    }
});