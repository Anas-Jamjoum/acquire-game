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
} from "firebase/firestore";
import { MessageSquare, UserPlus, UserMinus, Check, X } from "lucide-react";
import images from "../menu/dashboard/imageUtils"; // Import the images
import "./FriendList.css";

const FriendList = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [friends, setFriends] = useState([]);
  const [pending, setPending] = useState([]);
  const [newFriend, setNewFriend] = useState("");
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

  const togglePanel = () => setIsOpen(!isOpen);

  const sendFriendRequest = async () => {
    const email = newFriend.trim().toLowerCase();
    if (!email || email === user.email) return;

    const playerRef = doc(db, "players", email);
    const playerSnap = await getDoc(playerRef);
    if (!playerSnap.exists()) {
      alert("User not found.");
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

    alert("Friend request sent!");
    setNewFriend("");
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
    const myRef = doc(db, "friends", user.email);
    await updateDoc(myRef, {
      friends: arrayRemove(friendEmail),
    });

    const friendRef = doc(db, "friends", friendEmail);
    await updateDoc(friendRef, {
      friends: arrayRemove(user.email),
    });
  };

  const chatWith = (email) => {
    alert(`Start chat with ${email}`);
  };

  return (
    <div className="friend-list-container">
      <button className="friend-toggle-button" onClick={togglePanel}>
        Friends
        {pending.length > 0 && <span className="badge">{pending.length}</span>}
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
                  <button onClick={() => chatWith(f.email)}>
                    <MessageSquare size={16} />
                  </button>
                  <button onClick={() => removeFriend(f.email)}>
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
            <button onClick={sendFriendRequest}>
              <UserPlus size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FriendList;
