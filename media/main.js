//@ts-check

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
    const vscode = acquireVsCodeApi();

    let status = document.querySelector('.status');

    let errorsContainer = document.querySelector('.errors-container');
    let elapsedSeconds = document.querySelector('.elapsed-seconds');

    hideElement(errorsContainer);
    hideElement(elapsedSeconds);

    let counter = 0;

    document.querySelector('.check-problem').addEventListener('click', () => {
        hideElement(errorsContainer);
        showElement(elapsedSeconds);
        counter = 0;
        vscode.postMessage({ type: 'checkProblem' });
    });

    // Handle messages sent from the extension to the webview
    window.addEventListener('message', event => {
        const message = event.data; // The json data that the extension sent
        switch (message.type) {
            case 'setStatus':
                {
                    if (message.value === 'Failed') {
                        status.style.color = 'red';
                    } else if (message.value === 'Passed') {
                        status.style.color = 'green';
                    } else {
                        status.style.color = 'yellow';
                    }

                    status.textContent = message.value;

                    counter++;
                    elapsedSeconds.textContent = 'Elapsed: ' + counter + ' sec';

                    break;
                }
            case 'showErrors':
                {
                    showElement(errorsContainer);
                    let errors = message.value;
                    errorsContainer.innerHTML = '<h3 class="red">Errors:</h3>';

                    errors.forEach(error => {
                        errorsContainer.innerHTML += '<div class="error-div"><p class="error-type">' + error.type + '</p><p class="error-p">' + error.message + '</p></div>';
                    });
                }
        }
    });

    function hideElement(element) {
        element.style.display = 'none';
    }

    function showElement(element) {
        element.style.display = 'block';
    }
}());


