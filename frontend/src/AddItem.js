import React, { useState } from "react";
import { db, storage } from "./firebase";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

function AddItem({ user }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [brand, setBrand] = useState("");
  const [material, setMaterial] = useState("");
  const [description, setDescription] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !category || !size || !color || !photoFile) {
      alert("Please fill all required fields and select a photo");
      return;
    }

    setLoading(true);
    try {
      console.log("Uploading photo...");
      const photoRef = ref(storage, `items/${user.uid}/${photoFile.name}`);
      await uploadBytes(photoRef, photoFile);
      console.log("Upload complete:");
      const photoURL = await getDownloadURL(photoRef);
      console.log("Photo url complete:");

      await addDoc(collection(db, "items"), {
        ownerId: user.uid,
        name,
        category,
        size,
        color,
        brand,
        material,
        description,
        photoURL,
        dateAdded: new Date(),
      });

      alert("Clothing item added successfully!");
      setName("");
      setCategory("");
      setSize("");
      setColor("");
      setBrand("");
      setMaterial("");
      setDescription("");
      setPhotoFile(null);
    } catch (error) {
      console.error("Error adding clothing item: ", error);
      alert("Failed to add clothing item");
    } finally{
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Add a Clothing Item</h2>

      <input
        type="text"
        placeholder="Name (e.g. Blue T-shirt)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      <input
        type="text"
        placeholder="Category (e.g. T-shirt, Jacket)"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        required
      />

      <input
        type="text"
        placeholder="Size (e.g. M, L, 42)"
        value={size}
        onChange={(e) => setSize(e.target.value)}
        required
      />

      <input
        type="text"
        placeholder="Color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
        required
      />

      <input
        type="text"
        placeholder="Brand (optional)"
        value={brand}
        onChange={(e) => setBrand(e.target.value)}
      />

      <input
        type="text"
        placeholder="Material (optional)"
        value={material}
        onChange={(e) => setMaterial(e.target.value)}
      />

      <textarea
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setPhotoFile(e.target.files[0])}
        required
      />

      <button type="submit" disabled={loading}>
        {loading ? "Adding..." : "Add Clothing Item"}
      </button>
    </form>
  );
}

export default AddItem;
