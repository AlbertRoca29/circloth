import React, { useState } from "react";
import { storage } from "./firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import imageCompression from "browser-image-compression";
import BACKEND_URL from "./config";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import MenuItem from "@mui/material/MenuItem";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import Collapse from "@mui/material/Collapse";

// import {
//   Box, Button, Dialog, DialogTitle, DialogContent, Grid, TextField, Typography, IconButton, Accordion, AccordionSummary, AccordionDetails, MenuItem, InputLabel, FormControl, Select, Collapse
// } from "@mui/material";
// import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

// import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
// import CloseIcon from '@mui/icons-material/Close';
// import { styled } from '@mui/material/styles';


function AddItem({ user, onItemAdded }) {
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

      // 1. Upload images to Firebase Storage
      const photoURLs = [];
      for (let i = 0; i < photoFiles.length; i++) {
        const file = photoFiles[i];
        const options = { maxSizeMB: 0.2, maxWidthOrHeight: 800, useWebWorker: true };
        const compressedFile = await imageCompression(file, options);
        const ext = file.name.split('.').pop() || 'jpg';
        const imageId = `photo${i+1}`;
        const photoRef = ref(storage, `items/${user.uid}/${Date.now()}_${imageId}.${ext}`);
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
      // 2. Send item data to backend
  const res = await fetch(`${BACKEND_URL}/item`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerId: user.uid,
          name,
          category,
          size,
          color,
          brand,
          material,
          description,
          photoURLs: orderedPhotoURLs
        })
      });
      if (!res.ok) throw new Error("Failed to add item");
  setName("");
  setCategory("");
  setSize("");
  setColor("");
  setBrand("");
  setMaterial("");
  setDescription("");
  setPhotoFiles([]);
  setThumbnailIdx(0);
  if (onItemAdded) onItemAdded();
    } catch (error) {
      console.error("Error adding clothing item: ", error);
  // Optionally show error UI
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
  placeholder="Name (e.g. Green T-shirt)"
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
                style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 12, border: idx === thumbnailIdx ? "2.5px solid var(--primary, #22c55e)" : "2px solid #ccc", cursor: "pointer" }}
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
                <div style={{ position: "absolute", bottom: -18, left: 0, right: 0, textAlign: "center", fontSize: 10, color: "var(--primary, #22c55e)" }}>Thumbnail</div>
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
                color: "var(--primary, #22c55e)",
                fontSize: 32,
                textAlign: "center",
                lineHeight: "60px",
                border: "2px dashed var(--primary, #22c55e)"
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
          background: loading ? "#ccc" : "var(--primary, #22c55e)",
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
