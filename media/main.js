//@ts-check

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
    const vscode = acquireVsCodeApi();

    let status = document.querySelector('.status');

    let statusList = document.querySelector('.status-list');

    let statusHistory = document.querySelector('.status-history');

    clearStatusList();

    document.querySelector('.check-problem').addEventListener('click', () => {
        clearStatusList();
        showElement(statusHistory);
        vscode.postMessage({ type: 'checkProblem' });
    });

    // Handle messages sent from the extension to the webview
    window.addEventListener('message', event => {
        const message = event.data; // The json data that the extension sent
        switch (message.type) {
            case 'setStatus':
                {
                    status.textContent = message.value;
                    addStatusItem(message.value);
                    break;
                }
        }
    });

    function addStatusItem(item) {
        let li = document.createElement('li');
        li.textContent = item;
        statusList.appendChild(li);
    }

    function clearStatusList() {
        statusList.innerHTML = '';
        hideElement(statusHistory);
    }

    function hideElement(element) {
        element.style.display = 'none';
    }

    function showElement(element) {
        element.style.display = 'block';
    }
}());


