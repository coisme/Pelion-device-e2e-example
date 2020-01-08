// Register WebSocket notification channel
function createWebSocketNotificationChannel() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
            if (this.readyState == XMLHttpRequest.DONE) {
                if(this.status == 200 || this.status == 201) {
                    EventLog(this.status + " " + this.statusText + " ");
                    EventLog("WebSocket notification channel created.");
                } else {
                    EventLogError(this.status + " " + this.statusText);
                }
            }
    };
    EventLog("Creating WebSocket notification channel..");
    xhttp.open("PUT", "https://api.us-east-1.mbedcloud.com/v2/notification/websocket", true);
    xhttp.setRequestHeader('Authorization', 'Bearer ' + getApiKey());
    xhttp.send();
}

function connectWebSocket() {   
    // Check if the browser supports WebSocket
    if ("WebSocket" in window) {  
        // Let us open a web socket
        var ws = new WebSocket("wss://api.us-east-1.mbedcloud.com/v2/notification/websocket-connect", ["wss", "pelion_" + getApiKey()]);
        
        ws.onopen = function(event) {
            EventLog("WebSocket opened");
        };

        ws.onmessage = function(event) {
            var json = JSON.parse(event.data);
            EventLog("Message received on notification channel.");
            NotificationChannelLog(JSON.stringify(json));

            // Note that if property name contains hyphen, you have to use bracket notation.
            // About bracket notation, see this page:
            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Property_Accessors

            // Handles notifications
            if(json.notifications != undefined) {
                for (i = 0; i < json.notifications.length; i++) {
                    var ntf = json.notifications[i];
                    var dec = window.atob(ntf.payload);
                    DeviceDataEventsLog( "Endpoint:" + ntf.ep + " Path:" + ntf.path + " Payload:" + dec );
                }
            } 
            // Handles registration
            if(json.registrations != undefined) {
                for (i=0; i < json.registrations.length; i++) {
                    EventLog("Registration message received.");
                }
            }
            // Handles registrations udpate
            if(json['reg-updates'] != undefined) {
                for (i=0; i < json['reg-updates'].length; i++) {
                    EventLog("Registration update message received.");
                }
            }
            // Handles de-registrations
            if(json['de-registrations'] != undefined) {
                for (i=0; i < json['de-registrations'].length; i++) {
                    EventLog("De-registration message received.");
                }
            }
            // Handles registrations expired
            if(json['registrations-expired'] != undefined) {
                for (i=0; i < json['registrations-expired'].length; i++) {
                    EventLog("Registration expired message received.");
                }    
            }
            // Handles async responses
            if(json['async-responses'] != undefined) {
                for (i=0; i < json['async-responses'].length; i++) {
                    EventLog("Async response message received.");
                }
            }
        };

        ws.onerror = function(err) {
            EventLogError("Websocket notification channel error occurred");
        };

        ws.onclose = function(event) {
            EventLog("WebSocket closed");
        };
    } else {
        // The browser doesn't support WebSocket
        alert("WebSocket NOT supported by your Browser!");
    }
}

function getRegisteredDevices() {
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState === XMLHttpRequest.DONE) {
            if(this.status === 200) {
                let json = JSON.parse(this.responseText);
                let selector = document.getElementById("deviceSelector");
                // clear all options
                selector.innerHTML = null;
                for(i=0; i < json.data.length; i++) {
                    let device = json.data[i];
                    selector.innerHTML += '<option value="' + device.id + '">' + device.id + '</option>';
                    EventLog("Device found: " + device.id);
                }
            } else {
                EventLogError("Unable to get registered device.");
            }
        }
    };
    EventLog('Getting registered devices..');
    xhttp.open("GET", "https://api.us-east-1.mbedcloud.com/v3/devices?filter=state%3Dregistered", true);
    xhttp.setRequestHeader('Authorization', 'Bearer ' + getApiKey());
    xhttp.send();
}

function writeResource( deviceId, resourcePath, value) {
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if(this.readyState == XMLHttpRequest.DONE) {
            if(this.status == 202) { // 202 Accepted
                EventLog(this.status + " " + this.statusText + " " + this.responseText);
            } else {
                EventLogError(this.status + " " + this.statusText + " " + this.responseText);
            }
        }
    };
    xhttp.open("POST", "https://api.us-east-1.mbedcloud.com/v2/device-requests/" + deviceId + "?async-id=" + create_UUID(), true);
    xhttp.setRequestHeader('Authorization', 'Bearer ' + getApiKey());
    xhttp.setRequestHeader('Content-type', 'application/json');
    // Create post data
    let blinkPattern = document.getElementById("blinkPattern").innerText;
    let postdata = '{"method":"PUT","uri":"' + resourcePath + '", "accept": "text/plain", "content-type": "text/plain", "payload-b64": "' + btoa(value) + '"}';
    EventLog("Writing resource " + resourcePath + " in " + deviceId + "..");
    xhttp.send(postdata);
}

function readResource( deviceId, resourcePath) {
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if(this.readyState == XMLHttpRequest.DONE) {
            if(this.status == 202) { // 202 Accepted
                EventLog(this.status + " " + this.statusText + " " + this.responseText);
            } else {
                EventLogError(this.status + " " + this.statusText + " " + this.responseText);
            }
        }
    };
    xhttp.open("POST", "https://api.us-east-1.mbedcloud.com/v2/device-requests/" + deviceId + "?async-id=" + create_UUID(), true);
    xhttp.setRequestHeader('Authorization', 'Bearer ' + getApiKey());
    xhttp.setRequestHeader('Content-type', 'application/json');
    // Create post data
    let postdata = '{"method":"GET","uri":"' + resourcePath + '"}';
    EventLog("Reading resource " + resourcePath + " in " + deviceId + "..");
    xhttp.send(postdata);
}

function subscribeResource( deviceId, resourcePath) {
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if(this.readyState == XMLHttpRequest.DONE) {
            if(this.status == 200 || this.status == 202) { // 202 Accepted
                EventLog("Subscribed: " + deviceId + " " + resourcePath);
            } else {
                EventLogError(this.status + " " + this.statusText + " " + this.responseText);
            }
        }
    };
    xhttp.open("PUT", "https://api.us-east-1.mbedcloud.com/v2/subscriptions/" + deviceId + resourcePath, true);
    xhttp.setRequestHeader('Authorization', 'Bearer ' + getApiKey());
    EventLog("Subscribing to " + resourcePath + " in " + deviceId + "..");
    xhttp.send();
}

function unsubscribeResource( deviceId, resourcePath) {
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if(this.readyState == XMLHttpRequest.DONE) {
            if(this.status == 204) { // 204 Successfully removed subscription
                EventLog("Unsubscribed: " + deviceId + " " + resourcePath);
            } else {
                EventLogError(this.status + " " + this.statusText + " " + this.responseText);
            }
        }
    };
    xhttp.open("DELETE", "https://api.us-east-1.mbedcloud.com/v2/subscriptions/" + deviceId + resourcePath, true);
    xhttp.setRequestHeader('Authorization', 'Bearer ' + getApiKey());
    EventLog("Unsubscribing to " + resourcePath + " in " + deviceId + "..");
    xhttp.send();
}

function presubscribe( deviceId, resourcePath) {
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if(this.readyState == XMLHttpRequest.DONE) {
            if(this.status == 204) { // 204 Successfully created.
                EventLog(this.status + " " + this.statusText);
            } else {
                EventLogError(this.status + " " + this.statusText);
            }
        }
    };
    xhttp.open("PUT", "https://api.us-east-1.mbedcloud.com/v2/subscriptions", true);
    xhttp.setRequestHeader('Authorization', 'Bearer ' + getApiKey());
    xhttp.setRequestHeader('Content-type', 'application/json');
    // Create post data
    let postdata = '[{"endpoint-name":"' + deviceId + '","resource-path":["' + resourcePath + '"]}]';
    EventLog("Presubscribing to " + resourcePath + " in " + deviceId + "..");
    xhttp.send(postdata);
}

function unpresubscribe() {
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if(this.readyState == XMLHttpRequest.DONE) {
            if(this.status == 204) { // 204 Successfully created.
                EventLog(this.status + " " + this.statusText);
            } else {
                EventLogError(this.status + " " + this.statusText + " " + this.responseText);
            }
        }
    };
    xhttp.open("DELETE", "https://api.us-east-1.mbedcloud.com/v2/subscriptions", true);
    xhttp.setRequestHeader('Authorization', 'Bearer ' + getApiKey());
    EventLog("Unpresubscribing..");
    xhttp.send();
}

function setFilterParameter( deviceId, resourcePath, param) {
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if(this.readyState == XMLHttpRequest.DONE) {
            if(this.status == 202) { // 202 Accepted
                EventLog(this.status + " " + this.statusText);
            } else {
                EventLogError(this.status + " " + this.statusText);
            }
        }
    };
    xhttp.open("POST", "https://api.us-east-1.mbedcloud.com/v2/device-requests/" + deviceId + "?async-id=" + create_UUID(), true);
    xhttp.setRequestHeader('Authorization', 'Bearer ' + getApiKey());
    xhttp.setRequestHeader('Content-type', 'application/json');
    // Create post data
    let postdata = '{"method":"PUT","uri":"' + resourcePath + '?' + param + '"}';
    EventLog("Setting filter parameter " + param + " to " + resourcePath + " in " + deviceId + "..");
    xhttp.send(postdata);
}

function deleteWebSocketNotificationChannel() {
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if(this.readyState == XMLHttpRequest.DONE) {
            if(this.status == 204) { // 204 Successfully created.
                EventLog(this.status + " " + this.statusText);
            } else {
                EventLogError(this.status + " " + this.statusText + " ");
            }
        }
    };
    xhttp.open("DELETE", "https://api.us-east-1.mbedcloud.com/v2/notification/websocket", true);
    xhttp.setRequestHeader('Authorization', 'Bearer ' + getApiKey());
    EventLog("Deleting notification channel..");
    xhttp.send();
}

function getDeviceId() {
    let deviceId = document.getElementById("deviceSelector").value;
    return deviceId;
}

// Get API key from text box
function getApiKey() {
    let key = document.getElementById("apikey").value;
    if(key == "") {
        window.alert("Set your API key.");
        console.log("API key hasn't been set yet.");
        return "";
    }
    return key;
}

function getTimeHtml() {
    let d = new Date();
    let hour = ('00' + d.getHours()).slice(-2);
    let min = ('00' + d.getMinutes()).slice(-2);
    let sec = ('00' + d.getSeconds()).slice(-2);
    return '<font color="gray">' + hour + ":" + min + ":" + sec + '</font>';
}

function EventLog(text) {
    let obj = document.getElementById("event_log");
    obj.innerHTML += getTimeHtml() + " " + text + "<br />";
    obj.scrollTop = obj.scrollHeight;
}

function EventLogError(text) {
    let obj = document.getElementById("event_log");
    obj.innerHTML += getTimeHtml() + " " + '<font color="red">' + text + "</font><br />";
    obj.scrollTop = obj.scrollHeight;    
}

function NotificationChannelLog(text) {
    let obj = document.getElementById("notification_channel");
    obj.innerHTML += getTimeHtml() + " " + text + "<br />";
    obj.scrollTop = obj.scrollHeight;
}

function DeviceDataEventsLog(text) {
    let obj = document.getElementById("device_data_events");
    obj.innerHTML += text + "<br />";
    obj.scrollTop = obj.scrollHeight;
}

function ClearEventLog() {
    document.getElementById("event_log").innerHTML = null;
    document.getElementById("notification_channel").innerHTML = null;
    document.getElementById("device_data_events").innerHTML = null;
}

/*
 * API key store handling functions
 */

// Save API key in Cookie
function saveApiKey() {
    let ageInSeconds = 60 * 60 * 24 * 30; // 30 days
    let value = getApiKey();
    if (value != "") {
        document.cookie = "apiKey=" + encodeURIComponent(value) + ";max-age=" + ageInSeconds;
        return true;
    }
    return false;
}

// Delete API key from Cookie
function deleteApiKey() {
    document.cookie = "apiKey=; expires=Thu, 01 Jan 1970 00:00:00 GMT";
}

function handleApiKeyCheckbox() {
    let checkbox = document.getElementById("storeApiKey");
    if (checkbox.checked == true) {
        if(saveApiKey()) {
            console.log('API key saved.');
        }
    } else {
        deleteApiKey();
        console.log('API key deleted.');
    }
}

// Check if API key exists in Cookie and set it if exists.
function checkApiKey() {
    if (
        document.cookie.split(';').filter(
            function(item) {
                return (item.indexOf('apiKey=') >= 0)
            }
        ).length
    ) {
        console.log('API key found in Cookie.');
        // Set API key into the text box
        let cookieValue = document.cookie.replace(/(?:(?:^|.*;\s*)apiKey\s*\=\s*([^;]*).*$)|^.*$/, "$1");
        document.getElementById("apikey").value = decodeURIComponent(cookieValue);
        // Check the checkbox
        document.getElementById("storeApiKey").checked = true;
    } else {
        console.log("API key not found in Cookie.");
    }
}

// Load API key
window.addEventListener('DOMContentLoaded', 
    function() {
        console.log("Checking API key in Cookie.");
        checkApiKey();
    }
)

// create_UUID()
// from https://www.w3resource.com/javascript-exercises/javascript-math-exercise-23.php
function create_UUID(){
    var dt = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (dt + Math.random()*16)%16 | 0;
        dt = Math.floor(dt/16);
        return (c=='x' ? r :(r&0x3|0x8)).toString(16);
    });
    return uuid;
}
