(function() {
    const PREFIX = "LemonCube's Kite Command Share: ";
    let storedPayload = null;
    let capturedData = {
        name: null,
        description: null,
        session: null
    };
    let isMonitoring = false;
    
    // --- IMPROVED: Utility Function to find the Session ---
    function getKiteSession(headers) {
        // Method 1: Check document.cookie (Most reliable for non-HttpOnly)
        const docMatch = document.cookie.match(/kite-session=([^;]+)/);
        if (docMatch) return docMatch[1];

        // Method 2: Check intercepted headers (Backup)
        if (headers) {
            const cookieHeader = headers.get('Cookie') || '';
            const headerMatch = cookieHeader.match(/kite-session=([^;]+)/);
            if (headerMatch) return headerMatch[1];
        }

        return null;
    }

    function sendPatchRequest(appId, commandId, name, description, session) {
        // If session is still missing, we try one LAST look at document.cookie
        const finalSession = session || getKiteSession();

        if (!finalSession) {
            console.error(PREFIX + "Session value could not be captured. PATCH aborted.");
            alert(PREFIX + "Error: Could not find your session cookie. Please ensure you are logged in.");
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
        } catch (e) {
            console.error(PREFIX + "Failed to parse payload. Details:", e);
            return;
        }

        console.log(PREFIX + "Sending PATCH request...");
        
        const myHeaders = new Headers();
        myHeaders.append("accept-language", "en-US,en;q=0.9");
        myHeaders.append("Cookie", `kite-session=${finalSession}`);
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
            .then(response => response.ok ? response.text() : Promise.reject(response.status))
            .then(result => {
                console.log(PREFIX + "Success! Command Injected.");
                alert(PREFIX + "Automation complete! Flow injected successfully.");
            })
            .catch(error => {
                console.error(PREFIX + "PATCH Failed:", error);
                alert(PREFIX + "PATCH failed. Session might be invalid.");
            });
    }

    // --- Setup and URL Logic (Same as before) ---
    const urlMatch = window.location.pathname.match(/\/apps\/([^\/]+)/);
    if (!urlMatch) return;
    const appId = urlMatch[1];
    
    storedPayload = prompt(PREFIX + "Enter the BASE JSON payload:");
    if (!storedPayload) return;

    const urlIdPattern = new RegExp(`^/apps/${appId}/commands/([^/]+)`);
    
    function checkAndPatch() {
        const pathMatch = window.location.pathname.match(urlIdPattern);
        if (pathMatch && capturedData.name) {
            const newCommandId = pathMatch[1];
            window.removeEventListener('popstate', checkAndPatch);
            history.pushState = originalPushState; 
            setTimeout(() => {
                sendPatchRequest(appId, newCommandId, capturedData.name, capturedData.description, capturedData.session);
            }, 500);
            isMonitoring = false;
        }
    }

    const originalPushState = history.pushState;
    history.pushState = function() {
        originalPushState.apply(history, arguments);
        if (isMonitoring) checkAndPatch();
    };
    window.addEventListener('popstate', checkAndPatch);

    // --- UPDATED: Fetch Interceptor ---
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
        if (options?.method?.toUpperCase() === 'POST' && url.includes('/commands') && options.body) {
            
            // Try to grab session immediately
            const session = getKiteSession(new Headers(options.headers));
            console.log(PREFIX + `POST Intercepted. Session found: ${!!session}`);
            
            try {
                const parsedBody = JSON.parse(options.body);
                const entryNode = parsedBody.flow_source.nodes.find(node => node.type === 'entry_command');
                if (entryNode?.data.name) {
                    capturedData = {
                        name: entryNode.data.name,
                        description: entryNode.data.description || "",
                        session: session
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

    console.log(PREFIX + "Setup Complete. Waiting for POST...");
})();
