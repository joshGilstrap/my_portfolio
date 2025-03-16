document.addEventListener('DOMContentLoaded', function() {
    const projectButtons = document.querySelectorAll('.project-button');
    const gameContainer = document.getElementById('game-container');
    const codeContainer = document.querySelector('.code-container'); // Only one code container
    let activeIframe = null;

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


    // --- Project Data (Store project information) ---
    const projectData = {
        project1: {
            title: "Project 1 Title",
            description: "Short description of Project 1.",
            pageSrc: "project1.html", // Use pageSrc instead of iframeSrc
            githubLink: "https://github.com/yourusername/project1-repo" // Replace with your actual repo URL
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
      // --- Code Toggle --- Does nothing now
    const toggleCodeButton = document.querySelector('.toggle-code');
    toggleCodeButton.addEventListener('click', function() {
        if (codeContainer.style.display === 'none' || codeContainer.style.display === '') {
            codeContainer.style.display = 'block';
            this.textContent = 'Hide Code'; // Change button text

        } else {
            codeContainer.style.display = 'none';
            this.textContent = 'Show Code'; // Change button text
        }
    });
});