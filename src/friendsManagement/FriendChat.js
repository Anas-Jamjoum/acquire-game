// src/friendsManagement/FriendChat.js
import React, { useState, useEffect, useRef } from "react";
import { db, auth } from "../Firebase";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
    doc,
    getDoc,
} from "firebase/firestore";
import "./FriendChat.css";
import images from "../menu/dashboard/imageUtils"; // ✅ Adjust path if needed


const FriendChat = ({ friendEmail, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [friendInfo, setFriendInfo] = useState(null);

  const user = auth.currentUser;
  const scrollRef = useRef(null);

  const chatId = [user.email, friendEmail].sort().join("_");

  useEffect(() => {
    const msgRef = collection(db, "chats", chatId, "messages");
    const q = query(msgRef, orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => doc.data());
      setMessages(msgs);
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    });

    return () => unsubscribe();
  }, [chatId]);

  useEffect(() => {
    const fetchFriendInfo = async () => {
      const ref = doc(db, "players", friendEmail);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setFriendInfo(snap.data());
      }
    };
  
    fetchFriendInfo();
  }, [friendEmail]);
  

  const sendMessage = async () => {
    if (!newMsg.trim()) return;

    const msgRef = collection(db, "chats", chatId, "messages");
    await addDoc(msgRef, {
      from: user.email,
      to: friendEmail,
      text: newMsg.trim(),
      timestamp: serverTimestamp(),
    });

    setNewMsg("");
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
      {friendInfo && (
  <div className="chat-header-info">
    <img
      src={images[friendInfo.profilePic]}
      alt={friendInfo.name}
      className="chat-header-pic"
    />
    <span>Chat with: {friendInfo.name}</span>
  </div>
)}
<button className="chat-close-btn" onClick={onClose}>✖</button>
</div>

      <div className="chat-body">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`chat-message ${
              msg.from === user.email ? "from-me" : "from-them"
            }`}
          >
            {msg.text}
          </div>
        ))}
        <div ref={scrollRef}></div>
      </div>

      <div className="chat-input">
        <input
          type="text"
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default FriendChat;
