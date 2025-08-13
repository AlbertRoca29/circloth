import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

function ItemList({ user }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const fetchItems = async () => {
      const q = query(collection(db, "items"), where("ownerId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      const itemsData = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setItems(itemsData);
    };
    fetchItems();
  }, [user]);

  if (!items.length) return <p>No clothing items added yet.</p>;

  return (
    <div>
      <h2>Your Clothing Items</h2>
      {items.map((item) => (
        <div key={item.id} style={{ border: "1px solid #ccc", margin: 10, padding: 10 }}>
          <img src={item.photoURL} alt={item.name} style={{ width: 100 }} />
          <h3>{item.name}</h3>
          <p><strong>Category:</strong> {item.category}</p>
          <p><strong>Size:</strong> {item.size}</p>
          <p><strong>Color:</strong> {item.color}</p>
          {item.brand && <p><strong>Brand:</strong> {item.brand}</p>}
          {item.material && <p><strong>Material:</strong> {item.material}</p>}
          {item.description && <p>{item.description}</p>}
        </div>
      ))}
    </div>
  );
}

export default ItemList;
