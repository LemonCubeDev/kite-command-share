(function() {
    const PREFIX = "LemonCube's JSON Generator: ";

    // Function to handle clipboard copying
    function copyToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                alert(PREFIX + 'SUCCESS: Command JSON has been copied to your clipboard!');
            }).catch(err => {
                console.error(PREFIX + 'Failed to copy text to clipboard:', err);
                // Fallback: If clipboard fails, output to console for manual copy
                console.log(PREFIX + 'FAILURE: Copy failed. Please copy the JSON from the console manually:');
                console.log('--- Generated JSON Share Code ---');
                console.log(text);
                console.log('--- END OF CODE ---');
            });
        } else {
            // Fallback for browsers without navigator.clipboard
            console.warn(PREFIX + 'Clipboard API not supported. JSON output to console:');
            console.log('--- Generated JSON Share Code ---');
            console.log(text);
            console.log('--- END OF CODE ---');
            alert(PREFIX + 'WARNING: Clipboard API not supported. JSON written to console.');
        }
    }

    if (typeof window.fetch === 'function') {
        const originalFetch = window.fetch;

        window.fetch = function(url, options) {
            if (options && options.method && options.method.toUpperCase() === 'PATCH') {
                const body = options.body;
                if (body) {
                    // Instead of logging, call the copy function
                    copyToClipboard(body);

                    // We still log the event to the console for debugging
                    console.log(PREFIX + 'Intercepted PATCH request for command update.');
                }
            }
            return originalFetch(url, options);
        };
        
        console.log('');
        console.log('--- JSON Share Generator Activated ---');
        console.log('Click "Save Changes" on your Kite command to generate the share code.');
        console.log('');
        alert('LemonCube Generator is now active. Click "Save Changes" on your command.');
    } else {
        alert(PREFIX + 'Error: window.fetch not available. Script failed to load.');
    }
})();
