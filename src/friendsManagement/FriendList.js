import React, { useEffect, useState } from "react";
import { db, auth } from "../Firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  arrayUnion,
  arrayRemove,
    collection,
    getDocs,
    query,
    orderBy,
    limit,
} from "firebase/firestore";
import { MessageSquare, UserPlus, UserMinus, Check, X } from "lucide-react";
import images from "../menu/dashboard/imageUtils"; // Import the images
import "./FriendList.css";
import FriendChat from "./FriendChat";


const FriendList = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [friends, setFriends] = useState([]);
  const [pending, setPending] = useState([]);
  const [newFriend, setNewFriend] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [chatWith, setChatWith] = useState(null);
  const [unseenCounts, setUnseenCounts] = useState({});

  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const ref = doc(db, "friends", user.email);
    const unsubscribe = onSnapshot(ref, async (docSnap) => {
      if (!docSnap.exists()) {
        await setDoc(ref, { friends: [], pendingRequests: [] });
        return;
      }

      const data = docSnap.data();
      const emailList = data.friends || [];
      const pendingList = data.pendingRequests || [];

      // Get full player info
      const friendData = await Promise.all(
        emailList.map(async (email) => {
          const playerRef = doc(db, "players", email);
          const snap = await getDoc(playerRef);
          return snap.exists() ? { email, ...snap.data() } : null;
        })
      );

      const pendingData = await Promise.all(
        pendingList.map(async (email) => {
          const playerRef = doc(db, "players", email);
          const snap = await getDoc(playerRef);
          return snap.exists() ? { email, ...snap.data() } : null;
        })
      );

      setFriends(friendData.filter(Boolean));
      setPending(pendingData.filter(Boolean));
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user || friends.length === 0) return;
  
    const unsubscribes = [];
  
    friends.forEach((friend) => {
      const chatId = [user.email, friend.email].sort().join("_");
      const chatRef = doc(db, "chats", chatId);
      const messagesRef = collection(db, "chats", chatId, "messages");
  
      const unsub = onSnapshot(messagesRef, async (snapshot) => {
        if (chatWith === friend.email){
            console.log("Chat is open, skipping unseen count update.");
            return; // Skip if the chat is already open
        }
      
        const chatSnap = await getDoc(chatRef);
        const chatData = chatSnap.exists() ? chatSnap.data() : {};
        const lastSeen = chatData?.lastSeen?.[user.email.split(".")[0]]?.com?.toMillis() || 0;
        const now = Date.now();
        const oneHourAgo = now - 60 * 60 * 1000;
        
        const unseen = snapshot.docs.filter((doc) => {
          const ts = doc.data().timestamp?.toMillis();
          return (
            ts > lastSeen &&
            ts > oneHourAgo &&
            doc.data().from !== user.email
          );
        });
        
      
        setUnseenCounts((prev) => ({
          ...prev,
          [friend.email]: unseen.length,
        }));
      });
      
  
      unsubscribes.push(unsub);
    });
  
    return () => unsubscribes.forEach((unsub) => unsub());
  }, [user, friends]);
  
  

  const togglePanel = () => setIsOpen(!isOpen);

  const sendFriendRequest = async () => {
    const email = newFriend.trim().toLowerCase();
    if (!email || email === user.email) return;
  
    try {
      const playerRef = doc(db, "players", email);
      const playerSnap = await getDoc(playerRef);
  
      if (!playerSnap.exists()) {
        setErrorMessage("❌ User not found.");
        setTimeout(() => setErrorMessage(""), 3000);
        return;
      }
  
      const receiverRef = doc(db, "friends", email);
      const receiverSnap = await getDoc(receiverRef);
  
      if (!receiverSnap.exists()) {
        await setDoc(receiverRef, {
          friends: [],
          pendingRequests: [user.email],
        });
      } else {
        await updateDoc(receiverRef, {
          pendingRequests: arrayUnion(user.email),
        });
      }
  
      setSuccessMessage("✔️ Friend request has been sent!");
      setNewFriend("");
  
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (err) {
      setErrorMessage("Something went wrong.");
      setTimeout(() => setErrorMessage(""), 3000);
      console.error(err);
    }
  };
  

  const acceptFriendRequest = async (requesterEmail) => {
    const myRef = doc(db, "friends", user.email);
    const requesterRef = doc(db, "friends", requesterEmail);

    await updateDoc(myRef, {
      pendingRequests: arrayRemove(requesterEmail),
      friends: arrayUnion(requesterEmail),
    });

    const snap = await getDoc(requesterRef);
    if (!snap.exists()) {
      await setDoc(requesterRef, {
        friends: [user.email],
        pendingRequests: [],
      });
    } else {
      await updateDoc(requesterRef, {
        friends: arrayUnion(user.email),
      });
    }
  };

  const declineFriendRequest = async (requesterEmail) => {
    const myRef = doc(db, "friends", user.email);
    await updateDoc(myRef, {
      pendingRequests: arrayRemove(requesterEmail),
    });
  };

  const removeFriend = async (friendEmail) => {
    try {
      const myRef = doc(db, "friends", user.email);
      await updateDoc(myRef, {
        friends: arrayRemove(friendEmail),
      });
  
      const friendRef = doc(db, "friends", friendEmail);
      await updateDoc(friendRef, {
        friends: arrayRemove(user.email),
      });
  
      setSuccessMessage("✅ Friend removed successfully!");
  
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (err) {
      console.error("Error removing friend:", err);
    }
  };
  

  const openChatWith = (email) => {
    setChatWith(email);
    setUnseenCounts((prev) => ({ ...prev, [email]: 0 })); // Reset unseen count when opening chat
  };

  const totalUnseenMessages = Object.values(unseenCounts).reduce((sum, count) => sum + count, 0);


  return (
    <div className="friend-list-container">
      <button className="friend-toggle-button" onClick={togglePanel}>
        Friends
{(pending.length > 0 || totalUnseenMessages > 0) && (
  <span className="badge">
    {pending.length + totalUnseenMessages}
  </span>
)}
      </button>

      {isOpen && (
        <div className="friend-panel">
          <h3 className="friend-panel-title">My Friends</h3>

          <ul className="friend-list">
            {friends.map((f) => (
              <li key={f.email} className="friend-item">
                <div className="friend-info">
                  <img src={images[f.profilePic]} alt={f.name} className="friend-pic" />
                  <span>{f.name}</span>
                </div>
                <div className="friend-actions">
                <button className="chat-action-btn" onClick={() => openChatWith(f.email)}>
  <MessageSquare size={16} />
  {unseenCounts[f.email] > 0 && chatWith !== f.email && (
  <span className="chat-unread-badge">{unseenCounts[f.email]}</span>
)}

</button>


<button className="remove-action-btn" onClick={() => removeFriend(f.email)}>
  <UserMinus size={16} />
</button>
                </div>
              </li>
            ))}
          </ul>

          {pending.length > 0 && (
            <>
              <h4>Friend Requests</h4>
              <ul className="friend-list">
                {pending.map((f) => (
                  <li key={f.email} className="friend-item">
                    <div className="friend-info">
                      <img src={images[f.profilePic]} alt={f.name} className="friend-pic" />
                      <span>{f.name}</span>
                    </div>
                    <div className="friend-actions">
                      <button onClick={() => acceptFriendRequest(f.email)}>
                        <Check size={16} color="green" />
                      </button>
                      <button onClick={() => declineFriendRequest(f.email)}>
                        <X size={16} color="red" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}

          <div className="friend-add">
            <input
              type="text"
              placeholder="Friend Email"
              value={newFriend}
              onChange={(e) => setNewFriend(e.target.value)}
            />
<button className="send-request-btn" onClick={sendFriendRequest}>
  <UserPlus size={16} />
</button>
          </div>
        </div>
      )}
{successMessage && (
  <div className="friend-success-message">{successMessage}</div>
)}

{errorMessage && (
  <div className="friend-error-message">{errorMessage}</div>
)}

{chatWith && (
  <FriendChat
    friendEmail={chatWith}
    onClose={() => setChatWith(null)}
  />
)}



    </div>
  );
};

export default FriendList;
