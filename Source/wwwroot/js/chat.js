﻿"use strict";

var connection = new signalR.HubConnectionBuilder().withUrl("/chatHub").build();

connection.on("HandleMessage", function (user, message) {
    console.log("User " + user + " said: " + message);
    /*
    var msg = message.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    //var encodedMsg = user + " says " + msg;
    var div = document.createElement("div");
    //div.textContent = encodedMsg;
    div.className = "message";
    var text_user = document.createElement("p");
    var text_message = document.createElement("p");
    text_user.textContent = user;
    text_message.textContent = msg;
    text_user.className = "message-text-user";
    text_message.className = "message-text-message";
    div.appendChild(text_user);
    div.appendChild(text_message);
    //document.getElementById("messagesList").appendChild(div);
    document.getElementById("messagesList").insertAdjacentElement('afterbegin', div);
    */
});

connection.on("OnUserJoined", function (username) {
    console.log("User " + username + " has joined the chat");
});

connection.on("OnUserLeft", function (username) {
    console.log("User " + username + " has left the chat");
});

connection.start().catch(function (err) {
    return console.error(err.toString());
});

document.getElementById("send-message-button").addEventListener("click", function (event) {
    /*var user = document.getElementById("userInput").value;*/
    var message = document.getElementById("message-input").value;
    connection.invoke("SendMessage", message).catch(function (err) {
        return console.error(err.toString());
    });
    console.log("Sended message: " + message);
    event.preventDefault();
});