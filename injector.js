(function() {
    const PREFIX = "LemonCube's Kite Command Share";
    let storedPayload = null;
    let capturedData = {
        name: null,
        description: null
    };
    let isMonitoring = false;

    function sendPatchRequest(appId, commandId, name, description) {
        let finalPayload;
        try {
            const parsedPayload = JSON.parse(storedPayload);
            parsedPayload.flow_source.nodes = parsedPayload.flow_source.nodes.map(node => {
                if (node.type === 'entry_command') {
                    node.data.name = name;
                    node.data.description = description;
                }
                return node;
            });
            finalPayload = JSON.stringify(parsedPayload);
        } catch (e) {
            console.error(PREFIX + ": Failed to parse/modify JSON payload:", e);
            alert('Error: The Kite has flown away! Check the console for details.');
            return;
        }

        console.log(PREFIX + ": Sending PATCH request with native credentials...");
        
        const myHeaders = new Headers();
        myHeaders.append("accept", "application/json");
        myHeaders.append("Content-Type", "application/json");
        
        const requestOptions = {
            method: "PATCH",
            headers: myHeaders,
            body: finalPayload,
            // THIS IS THE KEY: It tells the browser to use your logged-in session automatically
            credentials: 'include', 
            redirect: "follow"
        };
        
        fetch(`https://api.kite.onl/v1/apps/${appId}/commands/${commandId}`, requestOptions)
            .then(async response => {
                if (!response.ok) {
                    const errText = await response.text();
                    throw new Error(`HTTP ${response.status}: ${errText}`);
                }
                return response.json();
            })
            .then(result => {
                console.log(PREFIX + ": Success!", result);
                alert('Success! The command has now been loaded onto your account.\n\nSimply reload the page to deactivate the injector and to view & edit your command.');
            })
            .catch(error => {
                console.error(PREFIX + ": PATCH Failed:", error);
                alert('Error: The Kite has flown away! Check the console for details.');
            });
    }

    // --- Setup Checks ---
    const urlMatch = window.location.pathname.match(/\/apps\/([^\/]+)/);
    if (!urlMatch) {
        alert('Error: The Kite has flown away! Check the console for details.');
        console.warn(PREFIX + ': Not run on the Kite apps page! (kite.onl/apps/...)');
        return;
    }
    const appId = urlMatch[1];
    
    // --- Step 1: Prompt ---
    storedPayload = prompt(PREFIX + "has been activated!\n\nEnter the JSON sharing code to begin:");
    if (!storedPayload) {
        console.log(PREFIX + ": Setup cancelled.");
        return;
    }

    const urlIdPattern = new RegExp(`^/apps/${appId}/commands/([^/]+)`);
    
    function checkAndPatch() {
        const pathMatch = window.location.pathname.match(urlIdPattern);
        if (pathMatch && capturedData.name) {
            const newCommandId = pathMatch[1];
            window.removeEventListener('popstate', checkAndPatch);
            history.pushState = originalPushState; 
            
            setTimeout(() => {
                sendPatchRequest(appId, newCommandId, capturedData.name, capturedData.description);
            }, 800);
            
            isMonitoring = false;
        }
    }

    const originalPushState = history.pushState;
    history.pushState = function() {
        originalPushState.apply(history, arguments);
        if (isMonitoring) checkAndPatch();
    };
    window.addEventListener('popstate', checkAndPatch);

    // --- Fetch Interceptor ---
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
        if (options?.method?.toUpperCase() === 'POST' && url.includes('/commands') && options.body) {
            try {
                const parsedBody = JSON.parse(options.body);
                const entryNode = parsedBody.flow_source.nodes.find(node => node.type === 'entry_command');
                
                if (entryNode?.data.name) {
                    console.log(PREFIX + ": New Command creation detected. Capturing info...");
                    capturedData = {
                        name: entryNode.data.name,
                        description: entryNode.data.description || ""
                    };
                    isMonitoring = true;
                    
                    return originalFetch(url, options).then(res => {
                        checkAndPatch();
                        return res;
                    });
                }
            } catch (e) {}
        }
        return originalFetch(url, options);
    };
    console.log(PREFIX + "Setup Complete. Waiting for command creation...");
    alert('The JSON sharing code has been entered!\n\nNow, go ahead and create your command. You can give it any name and description.');
})();
