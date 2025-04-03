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
  const [myInfo, setMyInfo] = useState(null);
  
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
    const fetchProfiles = async () => {
      const friendRef = doc(db, "players", friendEmail);
      const meRef = doc(db, "players", user.email);
  
      const [friendSnap, meSnap] = await Promise.all([
        getDoc(friendRef),
        getDoc(meRef),
      ]);
  
      if (friendSnap.exists()) setFriendInfo(friendSnap.data());
      if (meSnap.exists()) setMyInfo(meSnap.data());
    };
  
    fetchProfiles();
  }, [friendEmail, user.email]);
  
  

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
      {messages.map((msg, index) => {
  const isMe = msg.from === user.email;
  const senderInfo = isMe ? myInfo : friendInfo;

  return (
    <div
      key={index}
      className={`chat-message ${isMe ? "from-me" : "from-them"}`}
    >
      <div className="chat-message-meta">
        {senderInfo && (
          <>
            <img
              src={images[senderInfo.profilePic]}
              alt={senderInfo.name}
              className="chat-msg-pic"
            />
            <span className="chat-msg-name">{senderInfo.name}</span>
          </>
        )}
      </div>
      <div>{msg.text}</div>
    </div>
  );
})}

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
