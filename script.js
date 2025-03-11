document.addEventListener('DOMContentLoaded', function() {
    // Get all toggle buttons
    const toggleButtons = document.querySelectorAll('[id^="toggle-btn-"]');

    toggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Get the project number from the button's ID
            const projectNum = this.id.split('-')[2];

            // Get the corresponding game and code containers
            const gameContainer = document.getElementById(`game-container-${projectNum}`);
            const codeContainer = document.getElementById(`code-container-${projectNum}`);
            const codeContent = document.getElementById(`code-content-${projectNum}`);

            // Toggle visibility
            if (gameContainer.style.display === 'none') {
                gameContainer.style.display = 'block';
                codeContainer.style.display = 'none';
                // Clear the code content when showing the game
                codeContent.textContent = '';
            } else {
                gameContainer.style.display = 'none';
                codeContainer.style.display = 'block';

                // Fetch and display the code *only* if it hasn't been loaded yet
                if (codeContent.textContent === '') {
                    fetchCode(projectNum, codeContent);
                }
            }
        });
    });

    // Function to fetch and display the code
    async function fetchCode(projectNum, codeContentElement) {
        try {
            // Construct the URL to your code file (assuming it's in the same directory)
            const codeURL = `code${projectNum}.py`; //  IMPORTANT: See explanation below

            const response = await fetch(codeURL);

            if (!response.ok) {
                throw new Error(`Failed to fetch code: ${response.status}`);
            }

            const codeText = await response.text();
            codeContentElement.textContent = codeText;

        } catch (error) {
            codeContentElement.textContent = `Error loading code: ${error.message}`;
        }
    }
});