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
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import FormControl from "@mui/material/FormControl";
import Collapse from "@mui/material/Collapse";

// import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
// import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
// import CloseIcon from '@mui/icons-material/Close';

// import { styled } from '@mui/material/styles';



// Local icon loader
const getCategoryIcon = (key) => (
  <img src={require(`./assets/category-icons/${key}.png`)} alt={key} style={{ width: 36, height: 36, objectFit: 'contain' }} />
);

const categories = [
  { key: 'shirt', label: 'Shirt' },
  { key: 'tshirt', label: 'T-shirt' },
  { key: 'jacket', label: 'Jacket' },
  { key: 'sweater', label: 'Sweater' },
  { key: 'pants', label: 'Pants' },
  { key: 'jeans', label: 'Jeans' },
  { key: 'shorts', label: 'Shorts' },
  { key: 'dress', label: 'Dress' },
  { key: 'skirt', label: 'Skirt' },
  { key: 'shoes', label: 'Shoes' },
  { key: 'hat', label: 'Hat' },
  { key: 'bag', label: 'Bag' },
  { key: 'accessory', label: 'Accessory' },
  { key: 'other', label: 'Other' },
];

const sizeOptions = {
  shirt: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  tshirt: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  jacket: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  sweater: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  pants: ['28', '30', '32', '34', '36', '38', '40', '42'],
  jeans: ['28', '30', '32', '34', '36', '38', '40', '42'],
  shorts: ['XS', 'S', 'M', 'L', 'XL'],
  dress: ['XS', 'S', 'M', 'L', 'XL'],
  skirt: ['XS', 'S', 'M', 'L', 'XL'],
  shoes: ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'],
  hat: ['S', 'M', 'L', 'XL'],
  bag: ['S', 'M', 'L'],
  accessory: ['S', 'M', 'L'],
  other: ['One Size', 'Custom'],
};

const colorPalette = [
  '#ffffff', '#bdbdbd', '#000000', '#e11d48', '#f59e42', '#fbbf24', '#22c55e', '#15803d', '#a16207', '#d97706', '#be185d', '#7c3aed'
];

function AddItem({ user, onItemAdded }) {
  const [open, setOpen] = useState(false);
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [category, setCategory] = useState('');
  const [size, setSize] = useState('');
  const [sizeDetails, setSizeDetails] = useState('');
  const [itemStory, setItemStory] = useState('');
  const [color, setColor] = useState('');
  const [brand, setBrand] = useState('');
  const [material, setMaterial] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [photoFiles, setPhotoFiles] = useState([]);
  const [thumbnailIdx, setThumbnailIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleCategorySelect = (cat) => {
    setCategory(cat);
    setCategoryDialog(false);
    setSize('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!category || !size || !itemStory.trim()) {
      alert("Please fill all required fields");
      return;
    }
    if (photoFiles.length < 2) {
      alert("Please add at least 2 photos (max 5)");
      return;
    }
    setLoading(true);
    try {
      const photoURLs = [];
      for (let i = 0; i < photoFiles.length; i++) {
        const file = photoFiles[i];
        const options = { maxSizeMB: 0.2, maxWidthOrHeight: 800, useWebWorker: true };
        const compressedFile = await imageCompression(file, options);
        const ext = file.name.split('.').pop() || 'jpg';
        const imageId = `photo${i+1}`;
        const photoRef = ref(storage, `items/${user.uid}/${Date.now()}_${imageId}.${ext}`);
        await uploadBytes(photoRef, compressedFile);
        const photoURL = await getDownloadURL(photoRef);
        photoURLs.push(photoURL);
      }
      const orderedPhotoURLs = [photoURLs[thumbnailIdx], ...photoURLs.filter((_, i) => i !== thumbnailIdx)];
      const res = await fetch(`${BACKEND_URL}/item`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerId: user.uid,
          category,
          size,
          sizeDetails,
          itemStory,
          color,
          brand,
          material,
          additionalInfo,
          photoURLs: orderedPhotoURLs
        })
      });
      if (!res.ok) throw new Error("Failed to add item");
      setCategory("");
      setSize("");
      setSizeDetails("");
      setItemStory("");
      setColor("");
      setBrand("");
      setMaterial("");
      setAdditionalInfo("");
      setPhotoFiles([]);
      setThumbnailIdx(0);
      setOpen(false);
      if (onItemAdded) onItemAdded();
    } catch (error) {
      console.error("Error adding clothing item: ", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ mt: open ? 0.5 : 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {!open && (
        <Button
          variant="contained"
          onClick={() => setOpen(true)}
          sx={{
            fontSize: 18,
            borderRadius: 3,
            px: 4,
            py: 2,
            background: '#22c55e',
            color: '#fff',
            boxShadow: '0 2px 8px rgba(34,197,94,0.10)',
            textTransform: 'none',
            fontWeight: 700,
            minWidth: 180,
            '&:hover': { background: '#15803d' }
          }}
        >
          + Add Item
        </Button>
      )}
      <Collapse in={open} sx={{ width: '100%', maxWidth: 500, mt: 0.5 }}>
        <Box component="form" onSubmit={handleSubmit} sx={{ bgcolor: '#fff', p: 2.5, borderRadius: 4, boxShadow: 3, position: 'relative', border: '1.5px solid #22c55e' }}>

          <Button onClick={() => setOpen(false)} sx={{ position: 'absolute', top: 8, right: 8 }}>×</Button>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 700, color: '#15803d' }}>Add New Item</Typography>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <Typography sx={{ mb: 1 }}>Category</Typography>
            <Button variant="outlined" onClick={() => setCategoryDialog(true)} sx={{ justifyContent: 'flex-start' }}>
              {category ? (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {getCategoryIcon(category)}
                  <Typography sx={{ ml: 1 }}>{categories.find(c => c.key === category)?.label}</Typography>
                </Box>
              ) : 'Select Category'}
            </Button>
            <Dialog open={categoryDialog} onClose={() => setCategoryDialog(false)}>
              <DialogTitle>Select Category</DialogTitle>
              <DialogContent>
                <Grid container spacing={2}>
                  {categories.map(cat => (
                    <Grid item xs={4} key={cat.key}>
                      <Button onClick={() => handleCategorySelect(cat.key)} sx={{ flexDirection: 'column' }}>
                        {getCategoryIcon(cat.key)}
                        <Typography variant="body2">{cat.label}</Typography>
                      </Button>
                    </Grid>
                  ))}
                </Grid>
              </DialogContent>
            </Dialog>

            {category && (
              <>
                <Box sx={{ mb: 2, mt: 2 }}>
                  <Typography sx={{ mb: 1 }}>Size</Typography>
                  <Grid container spacing={1}>
                    {(sizeOptions[category] || []).map(opt => (
                      <Grid item xs={6} key={opt}>
                        <Button
                          variant={size === opt ? 'contained' : 'outlined'}
                          onClick={() => setSize(opt)}
                          sx={{ width: '100%', borderRadius: 2 }}
                        >
                          {opt}
                        </Button>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
                <TextField
                  label="Details of Size"
                  value={sizeDetails}
                  onChange={e => setSizeDetails(e.target.value)}
                  fullWidth
                  sx={{ mb: 2 }}
                />
              </>
            )}

            <TextField
              label="Item Story"
              value={itemStory}
              onChange={e => setItemStory(e.target.value)}
              fullWidth
              multiline
              minRows={3}
              required
              sx={{ mb: 2 }}
            />

            {/* Photos */}
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ mb: 1 }}>Photos (2-5)</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {photoFiles.map((file, idx) => (
                  <Box key={idx} sx={{ position: 'relative' }}>
                    <img src={URL.createObjectURL(file)} alt={`preview-${idx}`} style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 12, border: idx === thumbnailIdx ? "2.5px solid #22c55e" : "2px solid #222", cursor: "pointer" }} onClick={() => setThumbnailIdx(idx)} />
                    <Button size="small" onClick={() => {
                      const newFiles = photoFiles.filter((_, i) => i !== idx);
                      setPhotoFiles(newFiles);
                      if (thumbnailIdx === idx) setThumbnailIdx(0);
                      else if (thumbnailIdx > idx) setThumbnailIdx(thumbnailIdx - 1);
                    }} sx={{ position: "absolute", top: -8, right: -8, minWidth: 0, padding: 0, fontSize: 12 }}>×</Button>
                  </Box>
                ))}
                {photoFiles.length < 5 && (
                  <label style={{ display: "inline-block", cursor: "pointer" }}>
                    <span style={{ display: "inline-block", width: 60, height: 60, borderRadius: 8, background: "#f5f5f5", color: "#22c55e", fontSize: 32, textAlign: "center", lineHeight: "60px", border: "2px dashed #22c55e" }}>+</span>
                    <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => { if (!e.target.files[0]) return; setPhotoFiles([...photoFiles, e.target.files[0]]); }} />
                  </label>
                )}
              </Box>
            </Box>

            <Accordion expanded={showAdvanced} onChange={() => setShowAdvanced(!showAdvanced)} sx={{ mb: 2 }}>
              <AccordionSummary>
                <Typography>More Details</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {/* Color picker */}
                <Grid container spacing={1}>
                  {colorPalette.map(c => (
                    <Grid item xs={4} key={c}>
                      <Button
                        variant={color === c ? 'contained' : 'outlined'}
                        onClick={() => setColor(c)}
                        sx={{ width: 40, height: 40, minWidth: 40, minHeight: 40, borderRadius: '50%', background: c }}
                      />
                    </Grid>
                  ))}
                </Grid>
                <TextField label="Brand" value={brand} onChange={e => setBrand(e.target.value)} fullWidth sx={{ mb: 2 }} />
                <TextField label="Material" value={material} onChange={e => setMaterial(e.target.value)} fullWidth sx={{ mb: 2 }} />
                <TextField label="Additional Info" value={additionalInfo} onChange={e => setAdditionalInfo(e.target.value)} fullWidth multiline minRows={2} />
              </AccordionDetails>
            </Accordion>

            <Button type="submit" variant="contained" fullWidth sx={{ py: 1.5, fontSize: 18, borderRadius: 3, background: '#22c55e', color: '#fff', fontWeight: 700, '&:hover': { background: '#15803d' } }} disabled={loading}>
              {loading ? "Adding..." : "Submit"}
            </Button>

          </FormControl>
        </Box>
      </Collapse>
    </Box>
  );
}

export default AddItem;







// function AddItem({ user, onItemAdded }) {
//   const [name, setName] = useState("");
//   const [category, setCategory] = useState("");
//   const [size, setSize] = useState("");
//   const [color, setColor] = useState("");
//   const [brand, setBrand] = useState("");
//   const [material, setMaterial] = useState("");
//   const [description, setDescription] = useState("");
//   const [photoFiles, setPhotoFiles] = useState([]); // Array of files
//   const [thumbnailIdx, setThumbnailIdx] = useState(0);
//   const [loading, setLoading] = useState(false);

//   const categories = [
//     "T-shirt", "Shirt", "Jacket", "Sweater", "Pants", "Jeans", "Shorts", "Dress", "Skirt", "Shoes", "Hat", "Other"
//   ];

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!name || !category || !size || !color) {
//       alert("Please fill all required fields");
//       return;
//     }
//     if (photoFiles.length < 2) {
//       alert("Please add at least 2 photos (max 5)");
//       return;
//     }

//     setLoading(true);
//     let itemDoc = null;
//     try {
//       console.log("aaa");
//       console.log({ user, name, category, size, color, brand, material, description });

//       // 1. Upload images to Firebase Storage
//       const photoURLs = [];
//       for (let i = 0; i < photoFiles.length; i++) {
//         const file = photoFiles[i];
//         const options = { maxSizeMB: 0.2, maxWidthOrHeight: 800, useWebWorker: true };
//         const compressedFile = await imageCompression(file, options);
//         const ext = file.name.split('.').pop() || 'jpg';
//         const imageId = `photo${i+1}`;
//         const photoRef = ref(storage, `items/${user.uid}/${Date.now()}_${imageId}.${ext}`);
//         try {
//           await uploadBytes(photoRef, compressedFile);
//           const photoURL = await getDownloadURL(photoRef);
//           photoURLs.push(photoURL);
//         } catch (imgErr) {
//           throw imgErr;
//         }
//       }
//       // Place thumbnail first in array
//       const orderedPhotoURLs = [photoURLs[thumbnailIdx], ...photoURLs.filter((_, i) => i !== thumbnailIdx)];
//       // 2. Send item data to backend
//   const res = await fetch(`${BACKEND_URL}/item`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           ownerId: user.uid,
//           name,
//           category,
//           size,
//           color,
//           brand,
//           material,
//           description,
//           photoURLs: orderedPhotoURLs
//         })
//       });
//       if (!res.ok) throw new Error("Failed to add item");
//   setName("");
//   setCategory("");
//   setSize("");
//   setColor("");
//   setBrand("");
//   setMaterial("");
//   setDescription("");
//   setPhotoFiles([]);
//   setThumbnailIdx(0);
//   if (onItemAdded) onItemAdded();
//     } catch (error) {
//       console.error("Error adding clothing item: ", error);
//   // Optionally show error UI
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <form onSubmit={handleSubmit} style={{
//       maxWidth: 400,
//       margin: "0 auto",
//       background: "#fff",
//       borderRadius: 12,
//       boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
//       padding: 24,
//       display: "flex",
//       flexDirection: "column",
//       gap: 16
//     }}>
//       <h2 style={{ textAlign: "center", marginBottom: 16 }}>Add a Clothing Item</h2>

//       <input
//         type="text"
//   placeholder="Name (e.g. Green T-shirt)"
//         value={name}
//         onChange={(e) => setName(e.target.value)}
//         required
//         style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc", fontSize: 16 }}
//       />

//       <select
//         value={category}
//         onChange={e => setCategory(e.target.value)}
//         required
//         style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc", fontSize: 16 }}
//       >
//         <option value="" disabled>Category</option>
//         {categories.map(cat => (
//           <option key={cat} value={cat}>{cat}</option>
//         ))}
//       </select>

//       <input
//         type="text"
//         placeholder="Size (e.g. M, L, 42)"
//         value={size}
//         onChange={(e) => setSize(e.target.value)}
//         required
//         style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc", fontSize: 16 }}
//       />

//       <input
//         type="text"
//         placeholder="Color"
//         value={color}
//         onChange={(e) => setColor(e.target.value)}
//         required
//         style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc", fontSize: 16 }}
//       />

//       <input
//         type="text"
//         placeholder="Brand (optional)"
//         value={brand}
//         onChange={(e) => setBrand(e.target.value)}
//         style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc", fontSize: 16 }}
//       />

//       <input
//         type="text"
//         placeholder="Material (optional)"
//         value={material}
//         onChange={(e) => setMaterial(e.target.value)}
//         style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc", fontSize: 16 }}
//       />

//       <textarea
//         placeholder="Description (optional)"
//         value={description}
//         onChange={(e) => setDescription(e.target.value)}
//         style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc", fontSize: 16, minHeight: 60 }}
//       />

//       <div style={{ marginBottom: 12 }}>
//         <label style={{ fontWeight: 600, marginBottom: 4, display: "block" }}>Photos (2-5):</label>
//         <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
//           {photoFiles.map((file, idx) => (
//             <div key={idx} style={{ position: "relative", display: "inline-block" }}>
//               <img
//                 src={URL.createObjectURL(file)}
//                 alt={`preview-${idx}`}
//                 style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 12, border: idx === thumbnailIdx ? "2.5px solid var(--primary, #22c55e)" : "2px solid #ccc", cursor: "pointer" }}
//                 onClick={() => setThumbnailIdx(idx)}
//                 title={idx === thumbnailIdx ? "Thumbnail" : "Set as thumbnail"}
//               />
//               <button
//                 type="button"
//                 onClick={() => {
//                   const newFiles = photoFiles.filter((_, i) => i !== idx);
//                   setPhotoFiles(newFiles);
//                   if (thumbnailIdx === idx) setThumbnailIdx(0);
//                   else if (thumbnailIdx > idx) setThumbnailIdx(thumbnailIdx - 1);
//                 }}
//                 style={{
//                   position: "absolute",
//                   top: -8,
//                   right: -8,
//                   background: "#e53935",
//                   color: "#fff",
//                   border: "none",
//                   borderRadius: "50%",
//                   width: 20,
//                   height: 20,
//                   fontSize: 12,
//                   cursor: "pointer"
//                 }}
//                 title="Remove"
//               >×</button>
//               {idx === thumbnailIdx && (
//                 <div style={{ position: "absolute", bottom: -18, left: 0, right: 0, textAlign: "center", fontSize: 10, color: "var(--primary, #22c55e)" }}>Thumbnail</div>
//               )}
//             </div>
//           ))}
//           {photoFiles.length < 5 && (
//             <label style={{ display: "inline-block", cursor: "pointer" }}>
//               <span style={{
//                 display: "inline-block",
//                 width: 60,
//                 height: 60,
//                 borderRadius: 8,
//                 background: "#e3eafc",
//                 color: "var(--primary, #22c55e)",
//                 fontSize: 32,
//                 textAlign: "center",
//                 lineHeight: "60px",
//                 border: "2px dashed var(--primary, #22c55e)"
//               }}>+</span>
//               <input
//                 type="file"
//                 accept="image/*"
//                 style={{ display: "none" }}
//                 onChange={e => {
//                   if (!e.target.files[0]) return;
//                   if (photoFiles.length >= 5) return;
//                   setPhotoFiles([...photoFiles, e.target.files[0]]);
//                 }}
//               />
//             </label>
//           )}
//         </div>
//       </div>

//       <button
//         type="submit"
//         disabled={loading}
//         style={{
//           padding: 12,
//           borderRadius: 6,
//           border: "none",
//           background: loading ? "#ccc" : "var(--primary, #22c55e)",
//           color: "#fff",
//           fontSize: 18,
//           fontWeight: 600,
//           marginTop: 8,
//           cursor: loading ? "not-allowed" : "pointer",
//           transition: "background 0.2s"
//         }}
//       >
//         {loading ? "Adding..." : "Add Clothing Item"}
//       </button>
//     </form>
//   );
// }

// export default AddItem;
