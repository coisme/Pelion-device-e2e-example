// Register WebSocket notification channel
function createWebSocketNotificationChannel() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
            if (this.readyState == XMLHttpRequest.DONE) {
                if(this.status == 200 || this.status == 201) {
                    EventLog(this.status + " " + this.statusText + " " + this.responseText);
                } else {
                    EventLogError(this.status + " " + this.statusText);
                }
            }
    };
    xhttp.open("PUT", "https://api.us-east-1.mbedcloud.com/v2/notification/websocket", true);
    xhttp.setRequestHeader('Authorization', 'Bearer ' + getApiKey());
    xhttp.send();
}

function webSocketTest() {   
    // Check if the browser supports WebSocket
    if ("WebSocket" in window) {  
        // Let us open a web socket
        var ws = new WebSocket("wss://api.us-east-1.mbedcloud.com/v2/notification/websocket-connect", ["wss", "pelion_" + getApiKey()]);
        
        ws.onopen = function(event){
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
                EventLog(this.status + " " + this.statusText + " " + this.responseText);
                let json = JSON.parse(this.responseText);
                let selector = document.getElementById("deviceSelector");
                // clear all options
                selector.innerHTML = null;
                for(i=0; i < json.data.length; i++) {
                    let device = json.data[i];
                    selector.innerHTML += '<option value="' + device.id + '">' + device.id + '</option>';
                }
            } else {
                // TODO: error handling
            }
        }
    };
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

function EventLog(text) {
    let obj = document.getElementById("event_log");
    obj.innerHTML += text + "<br />";
    obj.scrollTop = obj.scrollHeight;
}

function EventLogError(text) {
    let obj = document.getElementById("event_log");
    obj.innerHTML += '<font color="red">' + text + "</font><br />";
    obj.scrollTop = obj.scrollHeight;    
}

function NotificationChannelLog(text) {
    let obj = document.getElementById("notification_channel");
    obj.innerHTML += text + "<br />";
    obj.scrollTop = obj.scrollHeight;
}

function DeviceDataEventsLog(text) {
    let obj = document.getElementById("device_data_events");
    obj.innerHTML += text + "<br />";
    obj.scrollTop = obj.scrollHeight;
}

function ClearEventlog() {
    document.getElementById("event_log").innerHTML = null;
}

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
