import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import "./ChatApp.css";

const socket = io("http://localhost:5000");

function Chat() {
  const colors = ["user1", "user2", "user3", "user4"];
  const chatBoxRef = useRef(null);

  const userColors = {};

  const getAvatarUrl = (username) => {
    return `https://robohash.org/${username}.png?size=50x50`;
  };


  const getUserColor = (username) => {
    if (!userColors[username]) {
      const colors = ["red", "blue", "green", "purple", "orange", "teal"];
      userColors[username] = colors[Object.keys(userColors).length % colors.length];
    }
    return userColors[username];
  };

  const [userList, setUserList] = useState([]);

  useEffect(() => {
    socket.on("user-list", (users) => {
      setUserList(users);
    });

    return () => {
      socket.off("user-list");
    };
  }, []);


  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    console.log("🟢 Connecting to WebSocket...");
    console.log("Socket instance:", socket);

    socket.on("connect", () => {
      console.log("✅ WebSocket Connected:", socket.id);
    });

    const name = prompt("Enter your username:");
    setUsername(name || "Anonymous");

    if (name) {
      socket.emit("join", name);
    }

    // WebSocket event correctly registered
    socket.on("chat message", (msg) => {
      console.log("📩 New message received:", msg);
      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages, msg];
        console.log("🔄 Updated Messages:", updatedMessages);
        return updatedMessages;
      });
    });

    socket.on("disconnect", () => {
      console.log("❌ WebSocket Disconnected");
    });

    return () => {
      socket.off("connect");
      socket.off("chat message");
      socket.off("disconnect");
    };
  }, []);

  useEffect(() => {
    chatBoxRef.current?.scrollTo({
      top: chatBoxRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const sendMessage = () => {
    if (message.trim()) {
      const msgData = {
        username,
        text: message,
        time: new Date().toLocaleTimeString(),
        color: colors[Math.floor(Math.random() * colors.length)],
      };
      socket.emit("chat message", msgData);
      setMessage("");
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <img src="/logo.png" alt="Chat Logo" className="chat-logo" />
        <h2 style={{ color: "var(--accent-color)" }}>Convofy 🗨️</h2>
      </div>

      <div className="user-list">
        <h3>Online Users:</h3>
        <ul>
          {userList.map((user, index) => (
            <li key={index}>{user}</li>
          ))}
        </ul>
      </div>
      <div className="chat-box" ref={chatBoxRef}>
        {messages.map((msg, index) => (
           <div key={index} className={`message-container ${msg.username === username ? "right" : "left"}`}>
           <img src={getAvatarUrl(msg.username)} alt="Avatar" className="avatar" />
           <p className={`user-message ${msg.username === username ? "right-msg" : "left-msg"}`}>
             <strong>{msg.username}</strong> [{msg.time}]: {msg.text}
           </p>
         </div>
        ))}
      </div>
      <div className="input-container">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>



    </div>
  );
}

export default Chat;
