document.addEventListener('DOMContentLoaded', function() {
    const toggleButtons = document.querySelectorAll('[id^="toggle-btn-"]');

    toggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const projectNum = this.id.split('-')[2];

            const gameContainer = document.getElementById(`game-container-${projectNum}`);
            const codeContainer = document.getElementById(`code-container-${projectNum}`);
            const codeContent = document.getElementById(`code-content-${projectNum}`);

            if (gameContainer.style.display === 'none') {
                gameContainer.style.display = 'block';
                codeContainer.style.display = 'none';
                codeContent.textContent = '';
            } else {
                gameContainer.style.display = 'none';
                codeContainer.style.display = 'block';

                if (codeContent.textContent === '') {
                    fetchCode(projectNum, codeContent);
                }
            }
        });
    });

    // Function to fetch and display the code
    async function fetchCode(projectNum, codeContentElement) {
        try {
            const codeURL = `code${projectNum}.py`;

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