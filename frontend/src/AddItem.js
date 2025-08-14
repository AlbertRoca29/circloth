import React, { useState } from "react";
import { db, storage } from "./firebase";
import { collection, addDoc, updateDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import imageCompression from "browser-image-compression";

function AddItem({ user }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [brand, setBrand] = useState("");
  const [material, setMaterial] = useState("");
  const [description, setDescription] = useState("");
  const [photoFiles, setPhotoFiles] = useState([]); // Array of files
  const [thumbnailIdx, setThumbnailIdx] = useState(0);
  const [loading, setLoading] = useState(false);

  const categories = [
    "T-shirt", "Shirt", "Jacket", "Sweater", "Pants", "Jeans", "Shorts", "Dress", "Skirt", "Shoes", "Hat", "Other"
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !category || !size || !color) {
      alert("Please fill all required fields");
      return;
    }   
    if (photoFiles.length < 2) {
      alert("Please add at least 2 photos (max 5)");
      return;
    }

    setLoading(true);
    let itemDoc = null;
    try {
      console.log("aaa");
      console.log({ user, name, category, size, color, brand, material, description });

      itemDoc = await addDoc(collection(db, "items"), {
        ownerId: user.uid,
        name,
        category,
        size,
        color,
        brand,
        material,
        description,
        photoURLs: [],
        dateAdded: new Date(),
      });
      console.log("aaa")
      console.log("Item added with ID: ", itemDoc.id);

      // Image compression and upload (multiple)
      const itemId = itemDoc.id;
      const photoURLs = [];
      for (let i = 0; i < photoFiles.length; i++) {
        const file = photoFiles[i];
        const options = { maxSizeMB: 0.2, maxWidthOrHeight: 800, useWebWorker: true };
        const compressedFile = await imageCompression(file, options);
        const ext = file.name.split('.').pop() || 'jpg';
        const imageId = `photo${i+1}`;
        const photoRef = ref(storage, `items/${user.uid}/${itemId}/${imageId}.${ext}`);
        try {
          await uploadBytes(photoRef, compressedFile);
          const photoURL = await getDownloadURL(photoRef);
          photoURLs.push(photoURL);
        } catch (imgErr) {
          throw imgErr;
        }
      }
      // Place thumbnail first in array
      const orderedPhotoURLs = [photoURLs[thumbnailIdx], ...photoURLs.filter((_, i) => i !== thumbnailIdx)];
      await updateDoc(doc(db, "items", itemId), { photoURLs: orderedPhotoURLs });

      alert("Clothing item added successfully!");
      setName("");
      setCategory("");
      setSize("");
      setColor("");
      setBrand("");
      setMaterial("");
      setDescription("");
      setPhotoFiles([]);
      setThumbnailIdx(0);
    } catch (error) {
      if (itemDoc && itemDoc.id) {
        // Optionally, delete the Firestore item if anything failed
        // await deleteDoc(doc(db, "items", itemDoc.id));
      }
      console.error("Error adding clothing item: ", error);
      alert("Failed to add clothing item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{
      maxWidth: 400,
      margin: "0 auto",
      background: "#fff",
      borderRadius: 12,
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      padding: 24,
      display: "flex",
      flexDirection: "column",
      gap: 16
    }}>
      <h2 style={{ textAlign: "center", marginBottom: 16 }}>Add a Clothing Item</h2>

      <input
        type="text"
        placeholder="Name (e.g. Blue T-shirt)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc", fontSize: 16 }}
      />

      <select
        value={category}
        onChange={e => setCategory(e.target.value)}
        required
        style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc", fontSize: 16 }}
      >
        <option value="" disabled>Category</option>
        {categories.map(cat => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>

      <input
        type="text"
        placeholder="Size (e.g. M, L, 42)"
        value={size}
        onChange={(e) => setSize(e.target.value)}
        required
        style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc", fontSize: 16 }}
      />

      <input
        type="text"
        placeholder="Color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
        required
        style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc", fontSize: 16 }}
      />

      <input
        type="text"
        placeholder="Brand (optional)"
        value={brand}
        onChange={(e) => setBrand(e.target.value)}
        style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc", fontSize: 16 }}
      />

      <input
        type="text"
        placeholder="Material (optional)"
        value={material}
        onChange={(e) => setMaterial(e.target.value)}
        style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc", fontSize: 16 }}
      />

      <textarea
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc", fontSize: 16, minHeight: 60 }}
      />

      <div style={{ marginBottom: 12 }}>
        <label style={{ fontWeight: 600, marginBottom: 4, display: "block" }}>Photos (2-5):</label>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
          {photoFiles.map((file, idx) => (
            <div key={idx} style={{ position: "relative", display: "inline-block" }}>
              <img
                src={URL.createObjectURL(file)}
                alt={`preview-${idx}`}
                style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 8, border: idx === thumbnailIdx ? "2px solid #1976d2" : "2px solid #ccc", cursor: "pointer" }}
                onClick={() => setThumbnailIdx(idx)}
                title={idx === thumbnailIdx ? "Thumbnail" : "Set as thumbnail"}
              />
              <button
                type="button"
                onClick={() => {
                  const newFiles = photoFiles.filter((_, i) => i !== idx);
                  setPhotoFiles(newFiles);
                  if (thumbnailIdx === idx) setThumbnailIdx(0);
                  else if (thumbnailIdx > idx) setThumbnailIdx(thumbnailIdx - 1);
                }}
                style={{
                  position: "absolute",
                  top: -8,
                  right: -8,
                  background: "#e53935",
                  color: "#fff",
                  border: "none",
                  borderRadius: "50%",
                  width: 20,
                  height: 20,
                  fontSize: 12,
                  cursor: "pointer"
                }}
                title="Remove"
              >×</button>
              {idx === thumbnailIdx && (
                <div style={{ position: "absolute", bottom: -18, left: 0, right: 0, textAlign: "center", fontSize: 10, color: "#1976d2" }}>Thumbnail</div>
              )}
            </div>
          ))}
          {photoFiles.length < 5 && (
            <label style={{ display: "inline-block", cursor: "pointer" }}>
              <span style={{
                display: "inline-block",
                width: 60,
                height: 60,
                borderRadius: 8,
                background: "#e3eafc",
                color: "#1976d2",
                fontSize: 32,
                textAlign: "center",
                lineHeight: "60px",
                border: "2px dashed #1976d2"
              }}>+</span>
              <input
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={e => {
                  if (!e.target.files[0]) return;
                  if (photoFiles.length >= 5) return;
                  setPhotoFiles([...photoFiles, e.target.files[0]]);
                }}
              />
            </label>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        style={{
          padding: 12,
          borderRadius: 6,
          border: "none",
          background: loading ? "#ccc" : "#1976d2",
          color: "#fff",
          fontSize: 18,
          fontWeight: 600,
          marginTop: 8,
          cursor: loading ? "not-allowed" : "pointer",
          transition: "background 0.2s"
        }}
      >
        {loading ? "Adding..." : "Add Clothing Item"}
      </button>
    </form>
  );
}

export default AddItem;
