(function() {
    if (typeof window.fetch === 'function') {
        const originalFetch = window.fetch;
        window.fetch = function(url, options) {
            if (options && options.method && options.method.toUpperCase() === 'PATCH') {
                const body = options.body;
                if (body) {
                    console.log('--- Generated JSON Share Code ---');
                    console.log('');
                    console.log(body);
                    console.log('');
                    console.log('Use This Code To Share Your Command!');
                    console.log('Made by LemonCube Dev');
                    console.log('');
                }
            }
            return originalFetch(url, options);
        };
        console.log('');
        console.log('JSON Share Generator Activated');
        console.log('Click "Save Changes" To Generate Code');
    }
})();
