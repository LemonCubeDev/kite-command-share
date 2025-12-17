(function() {
    const PREFIX = "LemonCube's Kite Command Share";

    // Function to handle clipboard copying
    function copyToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                alert('SUCCESS: Command sharing code has been copied to your clipboard!');
            }).catch(err => {
                console.error(PREFIX + ': Failed to copy text to clipboard:', err);
                // Fallback: If clipboard fails, output to console for manual copy
                console.warn(PREFIX + ': FAILURE: Copy failed. Please copy the JSON from the console manually:');
                console.log(text);
                alert('Error: The Kite has flown away! Check console for details.');
            });
        } else {
            // Fallback for browsers without navigator.clipboard
            console.warn(PREFIX + ': Clipboard API not supported. JSON output to console:');
            console.log(text);
            alert('The Kite has flown away! Check console for details.');
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
                    console.log(PREFIX + ': Intercepted PATCH request for command update.');
                }
            }
            return originalFetch(url, options);
        };
        
        console.log('');
        console.log('--- ' + PREFIX + ' ---');
        console.log('Click "Save Changes" on your Kite command to generate the share code.');
        console.log('');
        alert(PREFIX + ' is now active! Click "Save Changes" on your command to generate the code. Once generated, it will automatically copy to your clipboard.');
    } else {
        alert('Error: The Kite has flown away! Check console for details.');
        console.error(PREFIX + ': window.fetch not available. Script failed to load.');
    }
})();
