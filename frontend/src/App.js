import React, { useState, useEffect } from "react";
import { auth, signInWithGoogle, logOut } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import AddItem from "./AddItem";
import ItemList from "./ItemList";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
  }, []);

  return (
    <div style={{ padding: 20 }}>
      {user ? (
        <>
          <h1>Welcome {user.displayName}</h1>
          <img
            src={user.photoURL}
            alt="User"
            style={{ width: 50, borderRadius: "50%" }}
          />
          <button onClick={logOut}>Log Out</button>

          <AddItem user={user} />
          <ItemList user={user} />
        </>
      ) : (
        <button onClick={signInWithGoogle}>Sign In with Google</button>
      )}
    </div>
  );
}

export default App;
