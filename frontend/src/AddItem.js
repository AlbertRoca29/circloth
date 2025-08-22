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

// App green color
const APP_GREEN = '#22c55e';
const colorPalette = [
  '#FFFFFF', // White
  '#F3F4F6', // Light Gray
  '#000000', // Black
  '#E57373', // Soft Red
  '#F9A825', // Amber
  '#81C784', // Light Green
  APP_GREEN, // App Green
  '#BA68C8', // Purple
  '#FFD54F', // Yellow
  '#4DD0E1', // Teal
  '#A1887F', // Brown
  '#FF8A65', // Orange
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
            <Typography sx={{ mb: 0.5, fontWeight: 600, color: APP_GREEN, fontSize: 16 }}>Category</Typography>
            <Button
              variant="outlined"
              onClick={() => setCategoryDialog(true)}
              sx={{
                justifyContent: 'flex-start',
                borderRadius: 2,
                border: `2px solid ${APP_GREEN}`,
                background: '#F3F4F6',
                color: '#222',
                fontWeight: 600,
                fontSize: 15,
                px: 1.5,
                py: 0.7,
                minHeight: 36,
                boxShadow: '0 1px 4px rgba(34,197,94,0.07)',
                '&:hover': { background: '#E3E8EF', borderColor: '#15803d' },
                mt: 0.5,
              }}
              endIcon={<span style={{ fontSize: 16, marginLeft: 8 }}>▼</span>}
            >
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
                      <Button onClick={() => handleCategorySelect(cat.key)} sx={{ flexDirection: 'column', borderRadius: 2, border: `1.5px solid ${APP_GREEN}`, background: '#F3F4F6', mb: 1, '&:hover': { background: '#E3E8EF' } }}>
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
                <Box sx={{ mb: 1.2, mt: 1.2 }}>
                  <Typography sx={{ mb: 0.2, fontWeight: 600, color: '#222', fontSize: 15 }}>Size</Typography>
                  <Grid container spacing={1}>
                    {(sizeOptions[category] || []).map(opt => (
                      <Grid item xs={6} key={opt}>
                        <Button
                          variant={size === opt ? 'contained' : 'outlined'}
                          onClick={() => setSize(opt)}
                          sx={{ width: '100%', borderRadius: 2, minHeight: 32, fontSize: 14, py: 0.5 }}
                        >
                          {opt}
                        </Button>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
                <FormControl fullWidth sx={{ mb: 1 }}>
                  <Typography sx={{ mb: 0.2, fontWeight: 500, color: '#222', fontSize: 14 }}>Details of Size</Typography>
                  <TextField
                    value={sizeDetails}
                    onChange={e => setSizeDetails(e.target.value)}
                    placeholder="e.g. Oversized, fits small, etc."
                    fullWidth
                    size="small"
                    InputProps={{ sx: { borderRadius: 2, fontSize: 14, py: 0.5 } }}
                  />
                </FormControl>
              </>
            )}

            {/* Space between category/size and Item Story */}
            <Box sx={{ height: 10 }} />
            <FormControl fullWidth sx={{ mb: 1.5 }}>
              <Typography sx={{ mb: 0.2, fontWeight: 600, color: '#222', fontSize: 15 }}>Item Story</Typography>
              <TextField
                value={itemStory}
                onChange={e => setItemStory(e.target.value)}
                placeholder="Describe your item, its story, why you love it..."
                fullWidth
                multiline
                minRows={3}
                required
                size="small"
                InputProps={{ sx: { borderRadius: 2, fontSize: 14, py: 0.5 } }}
              />
            </FormControl>

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


            <Accordion
              expanded={showAdvanced}
              onChange={() => setShowAdvanced(!showAdvanced)}
              sx={{ mb: 1.5, borderRadius: 2, boxShadow: 1, background: '#F3F4F6', border: `1.5px solid ${APP_GREEN}`, overflow: 'hidden' }}
            >
              <AccordionSummary
                sx={{ cursor: 'pointer', px: 1.5, py: 1, background: '#E3E8EF', borderBottom: showAdvanced ? `1.5px solid ${APP_GREEN}` : 'none', display: 'flex', alignItems: 'center', minHeight: 36 }}
              >
                <span style={{
                  display: 'inline-block',
                  transition: 'transform 0.2s',
                  transform: showAdvanced ? 'rotate(90deg)' : 'rotate(0deg)',
                  fontSize: 16,
                  marginRight: 8,
                  color: APP_GREEN,
                  fontWeight: 700,
                }}>▶</span>
                <Typography sx={{ fontWeight: 600, color: APP_GREEN, fontSize: 15 }}>More Details</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ background: '#F9FAFB', pt: 1.2, borderRadius: 2, px: 1.5 }}>
                {/* Color picker */}
                <Typography sx={{ mb: 0.5, fontWeight: 500, color: APP_GREEN, fontSize: 14 }}>Color</Typography>
                <Grid container spacing={1} sx={{ mb: 1.5 }}>
                  {colorPalette.map(c => (
                    <Grid item xs={3} key={c}>
                      <Box sx={{ position: 'relative', display: 'inline-block' }}>
                        <Button
                          variant="outlined"
                          onClick={() => setColor(c)}
                          sx={{
                            width: 30,
                            height: 30,
                            minWidth: 30,
                            minHeight: 30,
                            borderRadius: '50%',
                            background: c,
                            border: color === c ? `3px solid ${APP_GREEN}` : '2px solid #bdbdbd',
                            boxShadow: color === c ? `0 0 0 2px ${APP_GREEN}` : 'none',
                            p: 0,
                            position: 'relative',
                            transition: 'border 0.2s, box-shadow 0.2s',
                          }}
                        >
                          {color === c && (
                            <span style={{
                              position: 'absolute',
                              top: 3,
                              left: 8,
                              color: APP_GREEN,
                              fontWeight: 900,
                              fontSize: 16,
                              pointerEvents: 'none',
                            }}>✓</span>
                          )}
                        </Button>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
                <FormControl fullWidth sx={{ mb: 1 }}>
                  <Typography sx={{ mb: 0.2, fontWeight: 500, color: '#222', fontSize: 14 }}>Brand</Typography>
                  <TextField
                    value={brand}
                    onChange={e => setBrand(e.target.value)}
                    placeholder="e.g. Nike, Zara, Uniqlo"
                    fullWidth
                    size="small"
                    InputProps={{ sx: { borderRadius: 2, fontSize: 14, py: 0.5 } }}
                  />
                </FormControl>
                <FormControl fullWidth sx={{ mb: 1 }}>
                  <Typography sx={{ mb: 0.2, fontWeight: 500, color: '#222', fontSize: 14 }}>Material</Typography>
                  <TextField
                    value={material}
                    onChange={e => setMaterial(e.target.value)}
                    placeholder="e.g. 100% Cotton, Polyester"
                    fullWidth
                    size="small"
                    InputProps={{ sx: { borderRadius: 2, fontSize: 14, py: 0.5 } }}
                  />
                </FormControl>
                <FormControl fullWidth>
                  <Typography sx={{ mb: 0.2, fontWeight: 500, color: '#222', fontSize: 14 }}>Additional Info</Typography>
                  <TextField
                    value={additionalInfo}
                    onChange={e => setAdditionalInfo(e.target.value)}
                    placeholder="e.g. Slightly worn, limited edition, etc."
                    fullWidth
                    multiline
                    minRows={2}
                    size="small"
                    InputProps={{ sx: { borderRadius: 2, fontSize: 14, py: 0.5 } }}
                  />
                </FormControl>
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
