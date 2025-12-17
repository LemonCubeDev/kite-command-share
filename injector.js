(function() {
    const PREFIX = "LemonCube's Kite Command Share: ";
    let storedPayload = null;
    let capturedData = {
        name: null,
        description: null,
        session: null
    };
    let isMonitoring = false;
    
    // --- Utility Functions ---
    function getSessionFromHeaders(headers) {
        const cookieHeader = headers.get('Cookie') || '';
        const match = cookieHeader.match(/kite-session=([^;]+)/);
        return match ? match[1] : null;
    }

    function sendPatchRequest(appId, commandId, name, description, session) {
        if (!session) {
            console.error(PREFIX + "Session value could not be captured. PATCH aborted.");
            return;
        }
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
            console.log(PREFIX + "Payload successfully prepared.");
        } catch (e) {
            console.error(PREFIX + "Failed to parse or modify user-provided JSON payload. Details:", e);
            alert(PREFIX + "FATAL ERROR during payload modification. Check console.");
            return;
        }
        console.log(PREFIX + "Sending PATCH request to update command...");
        console.log(PREFIX + "Target URL:", `https://api.kite.onl/v1/apps/${appId}/commands/${commandId}`);
        console.log(PREFIX + "Final Payload (Injected):", finalPayload);
        
        const myHeaders = new Headers();
        myHeaders.append("accept-language", "en-US,en;q=0.9");
        myHeaders.append("Cookie", `kite-session=${session}`);
        myHeaders.append("Origin", "https://kite.onl");
        myHeaders.append("Referer", "https://kite.onl/");
        myHeaders.append("Content-Type", "application/json");
        
        const requestOptions = {
            method: "PATCH",
            headers: myHeaders,
            body: finalPayload,
            redirect: "follow"
        };
        
        fetch(`https://api.kite.onl/v1/apps/${appId}/commands/${commandId}`, requestOptions)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(result => {
                console.log(PREFIX + "Success! Command PATCH Response received.");
                alert(PREFIX + "Automation complete! Check console for API response.");
                console.log(PREFIX + "API Response Body:", result);
            })
            .catch(error => {
                console.error(PREFIX + "PATCH Request Failed! Details:", error);
                alert("The kite has flown away! Check console for details.");
            });
    }

    // --- Setup Checks ---
    if (typeof window.fetch !== 'function') {
        console.error(PREFIX + 'window.fetch is not available.');
        return;
    }
    const currentUrlPath = window.location.pathname;
    const urlMatch = currentUrlPath.match(/\/apps\/([^\/]+)/);
    if (!urlMatch) {
        console.error(PREFIX + "Could not find app_id in URL path. Setup aborted.");
        alert(PREFIX + "Could not find app_id in URL path. Setup aborted.");
        return;
    }
    const appId = urlMatch[1];
    
    // --- Prompt for Payload ---
    storedPayload = prompt("STEP 1/1: Enter the BASE JSON payload. (Entry command name/description will be overwritten):");
    if (!storedPayload) {
        console.log(PREFIX + "Payload input cancelled. Setup aborted.");
        alert(PREFIX + "Payload input cancelled. Setup aborted.");
        return;
    }

    // --- URL Monitoring Setup ---
    const urlIdPattern = new RegExp(`^/apps/${appId}/commands/([^/]+)`);
    
    function checkAndPatch() {
        const newPath = window.location.pathname;
        const pathMatch = newPath.match(urlIdPattern);
        
        if (pathMatch && capturedData.name) {
            const newCommandId = pathMatch[1];
            console.log(PREFIX + `New Command ID Captured from URL: ${newCommandId}`);
            
            // Cleanup listeners
            window.removeEventListener('popstate', checkAndPatch);
            history.pushState = originalPushState; 

            // Use a timeout to ensure the UI is fully loaded before the PATCH request
            setTimeout(() => {
                sendPatchRequest(appId, newCommandId, capturedData.name, capturedData.description, capturedData.session);
            }, 500);
            
            isMonitoring = false;
        }
    }

    // Intercept pushState (used by Single Page Apps for navigation)
    const originalPushState = history.pushState;
    history.pushState = function() {
        originalPushState.apply(history, arguments);
        if (isMonitoring) {
            checkAndPatch();
        }
    };
    window.addEventListener('popstate', checkAndPatch);
    // --- End URL Monitoring Setup ---

    // --- Fetch Interceptor ---
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
        if (options && options.method && options.method.toUpperCase() === 'POST' && url.includes('/commands') && options.body) {
            let session = null;
            try {
                if (options.headers) {
                    // Create a safe Headers object to maximize session capture chances
                    const safeHeaders = new Headers(options.headers);
                    session = getSessionFromHeaders(safeHeaders);
                }
            } catch (e) {
                console.warn(PREFIX + "Failed to read headers for session capture (Framework conflict).", e);
            }
            
            console.log(PREFIX + `POST Intercepted. Session captured: ${!!session}`);
            
            try {
                const parsedBody = JSON.parse(options.body);
                const entryNode = parsedBody.flow_source.nodes.find(node => node.type === 'entry_command');
                const commandName = entryNode?.data.name;
                const commandDescription = entryNode?.data.description || "";
                
                if (commandName) {
                    console.log(PREFIX + `Name: "${commandName}", Description: "${commandDescription}"`);
                    
                    // Store data and start URL monitoring immediately
                    capturedData = {
                        name: commandName,
                        description: commandDescription,
                        session: session
                    };
                    isMonitoring = true;
                    
                    // Allow the original POST to proceed
                    return originalFetch(url, options).then(response => {
                        // After the POST finishes, check if the URL has already changed
                        checkAndPatch();
                        return response;
                    });
                } else {
                    console.warn(PREFIX + "Could not extract name/description from POST body.");
                }
            } catch (e) {
                console.error(PREFIX + "Error parsing intercepted POST body.", e);
                alert(PREFIX + "Error during interception. Check console for details.");
            }
        }
        return originalFetch(url, options);
    };

    // --- Final Initialization Messages ---
    console.log(`--- ${PREFIX}Setup Complete ---`);
    console.log(PREFIX + 'App ID:', appId);
    console.log(PREFIX + 'Status: Waiting for Command Creation POST...');
    alert(PREFIX + 'Setup complete. Enter payload, then create your command to trigger the automation.');
})();
