import React, { useState } from "react";
import { storage } from "./firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import imageCompression from "browser-image-compression";
import BACKEND_URL from "./config";

import Box from "@mui/material/Box";
import { getCategoryEmoji } from "./utils/general";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import FormControl from "@mui/material/FormControl";
import Collapse from "@mui/material/Collapse";



const categories = [
  { key: 'tops', label: 'Tops' },
  { key: 'jackets_sweaters', label: 'Jackets & Sweaters' },
  { key: 'pants_shorts', label: 'Pants & Shorts' },
  { key: 'dresses_skirts', label: 'Dresses & Skirts' },
  { key: 'shoes', label: 'Shoes' },
  { key: 'accessories', label: 'Accessories' },
  { key: 'other', label: 'Other' },
];



const sizeOptions = {
  tops: [
    'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Other'
  ],
  jackets_sweaters: [
    'XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size', 'Other'
  ],
  pants_shorts: [
    '28-30', '32-34', '36-38', '40-42', '44+', 'S', 'M', 'L', 'XL', 'Other'
  ],
  dresses_skirts: [
    'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL','One Size', 'Other'
  ],
  shoes: [
    '35-37', '38-40', '41-43', '44-46', '47+','Other'
  ],
  accessories: [
    'One Size', 'S', 'M', 'L', 'XL'
  ],
  other: [
    'One Size', 'S', 'M', 'L', 'XL'
  ]
};


// App green color
const APP_GREEN = '#22c55e';
// Expanded and grouped color palette for clothing
const colorPalette = [
  // Neutrals
  '#FFFFFF', // White
  '#F3F4F6', // Light Gray
  '#BDBDBD', // Gray
  '#000000', // Black
  '#A1887F', // Brown
  '#D7CCC8', // Light Brown
  '#E0C097', // Beige
  '#F5E6CA', // Cream
  // Blues
  '#1E293B', // Navy
  '#3B82F6', // Denim Blue
  '#60A5FA', // Light Blue
  // Greens
  '#4B6043', // Olive
  '#A3B18A', // Sage
  '#81C784', // Light Green
  APP_GREEN, // App Green
  // Reds/Pinks
  '#E57373', // Soft Red
  '#B91C1C', // Deep Red
  '#F472B6', // Pink
  // Yellows/Oranges
  '#FFD54F', // Yellow
  '#F9A825', // Amber
  '#FF8A65', // Orange
  // Purples
  '#BA68C8', // Purple
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
  const [errorMsg, setErrorMsg] = useState("");

  // Track object URLs for previews
  const [objectURLs, setObjectURLs] = useState([]);
  React.useEffect(() => {
    // When photoFiles changes, update objectURLs
    // Clean up old URLs
    objectURLs.forEach(url => URL.revokeObjectURL(url));
    const newURLs = photoFiles.map(file => URL.createObjectURL(file));
    setObjectURLs(newURLs);
    return () => {
      newURLs.forEach(url => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoFiles]);

  const handleCategorySelect = (cat) => {
    setCategory(cat);
    setCategoryDialog(false);
    setSize('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!category || !size || !itemStory.trim()) {
  setErrorMsg("Please fill all required fields");
  return;
    }
    if (photoFiles.length < 2) {
  setErrorMsg("Please add at least 2 photos (max 5)");
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
      {errorMsg && (
        <Box sx={{ color: '#e53935', background: '#fff0f0', border: '1px solid #e53935', borderRadius: 2, p: 1.5, mb: 2, textAlign: 'center', fontWeight: 150, fontFamily: 'Geist, Geist Sans, Segoe UI, Arial, sans-serif' }}>
          {errorMsg}
        </Box>
      )}
      {!open && (
        <Button
          variant="contained"
          onClick={() => setOpen(true)}
          sx={{
            fontSize: 16,
            borderRadius: 2.5,
            px: 3.5,
            py: 1.4,
            background: '#22c55e',
            color: '#fff',
            boxShadow: '0 2px 8px rgba(34,197,94,0.10)',
            textTransform: 'none',
            fontWeight: 150,
            fontFamily: 'Geist, Geist Sans, Segoe UI, Arial, sans-serif',
            minWidth: 140,
            mb: 2.5,
            '&:hover': { background: '#15803d' }
          }}
        >
          + Add Item
        </Button>
      )}
      <Collapse in={open} sx={{ width: '100%', maxWidth: 500, mt: 0.5 }}>
        <Box component="form" onSubmit={handleSubmit} sx={{ bgcolor: '#fff', p: 2.5, borderRadius: 4, boxShadow: 3, position: 'relative', border: '1.5px solid #22c55e' }}>

          <Button onClick={() => setOpen(false)} sx={{ position: 'absolute', top: 8, right: 8 }}>×</Button>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 200, color: '#15803d', fontFamily: 'Geist, Geist Sans, Segoe UI, Arial, sans-serif' }}>Add New Item</Typography>


          <FormControl fullWidth sx={{ mb: 2 }}>
            {/* <Typography sx={{ mb: 0.5, fontWeight: 600, color: '#222', fontSize: 16 }}>Category</Typography> */}
            <Grid container spacing={1} sx={{ mb: 1, mt: 0.5, justifyContent: 'center', fontFamily: 'Geist, Geist Sans, Segoe UI, Arial, sans-serif', fontWeight: 100 }}>
              {categories.map(cat => (
                <Grid item xs={3} key={cat.key} sx={{ textAlign: 'center' }}>
                  <Button
                    onClick={() => handleCategorySelect(cat.key)}
                    sx={{
                      flexDirection: 'column',
                      borderRadius: 2,
                      border: category === cat.key ? `2.5px solid ${APP_GREEN}` : '1.5px solid #bdbdbd',
                      background: '#fff',
                      mb: 0.5,
                      minWidth: 0,
                      minHeight: 0,
                      width: 88,
                      height: 88,
                      boxShadow: category === cat.key ? `2px 2px 0px 1px ${APP_GREEN}` : 'none',
                      p: 0,
                      transition: 'border 0s, box-shadow 0.4s',
                      fontSize: 30,
                      color: '#28720dff',
                      fontFamily: 'Geist, Geist Sans, Segoe UI, Arial, sans-serif',
                      fontWeight: 100,
                      '&:hover': { background: '#F3F4F6', borderColor: '#166232ff' },
                    }}
                  >
                    <span style={{ fontSize: 32, lineHeight: 1 }}>{getCategoryEmoji(cat.key)}</span>
                    <span style={{ fontSize: 9.5, color: '#666', marginTop: 8, lineHeight: 1.2 }}>{cat.label}</span>
                  </Button>
                </Grid>
              ))}
            </Grid>



            {category && (
              <>
                <Box sx={{ mb: 1.7, mt: 1 }}>
                    <Typography
                        sx={{ mb: 1, fontWeight: 150, color: '#222', fontSize: 15, fontFamily: 'Geist, Geist Sans, Segoe UI, Arial, sans-serif' }}
                    >
                        Size
                    </Typography>
                    <Grid container spacing={1}>
                        {(sizeOptions[category] || []).map(opt => (
                        <Grid item xs={4} key={opt}>
                            <Button
                            variant={size === opt ? 'contained' : 'outlined'}
                            onClick={() => setSize(opt)}
                            sx={{
                                width: '100%',
                                borderRadius: 1.5,
                                minHeight: 32,
                                fontSize: 14,
                                py: 0.5
                            }}
                            >
                            {opt}
                            </Button>
                        </Grid>
                        ))}
                    </Grid>
                    </Box>

                <FormControl fullWidth sx={{ mb: 1 }}>
                  <Typography sx={{ mb: 0.2, fontWeight: 100, color: '#222', fontSize: 14, fontFamily: 'Geist, Geist Sans, Segoe UI, Arial, sans-serif' }}>Details of Size</Typography>
                  <TextField
                    value={sizeDetails}
                    onChange={e => setSizeDetails(e.target.value)}
                    placeholder="e.g. Oversized, fits small, etc."
                    fullWidth
                    size="small"
                    InputProps={{
                      sx: {
                        borderRadius: 2,
                        fontSize: 14,
                        py: 0.5,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderWidth: '1px',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor:  '#bcbcbcff',
                          borderWidth: '0.5px',
                        },
                      }
                    }}
                  />
                </FormControl>
              <Typography sx={{ mb: 1, fontWeight: 150, color: '#222', fontSize: 15, fontFamily: 'Geist, Geist Sans, Segoe UI, Arial, sans-serif' }}>Size</Typography>

                </>

            )}
            <Box sx={{ height: 20 }} />
            <FormControl fullWidth sx={{ mb: 1.5 }}>
              <Typography sx={{ mb: 0.4, fontWeight: 150, color: '#222', fontSize: 15, fontFamily: 'Geist, Geist Sans, Segoe UI, Arial, sans-serif' }}>Item Story 📝</Typography>
              <TextField
                value={itemStory}
                onChange={e => setItemStory(e.target.value)}
                placeholder="Describe your item, its story, why you love it..."
                fullWidth
                multiline
                minRows={2}
                sx={{
                    "& .MuiInputBase-inputMultiline": {
                    padding: "6px 0px"  // top/bottom, left/right
                    }
                }}
                required
                size="small"
                InputProps={{
                  sx: {
                    borderRadius: 2,
                    fontSize: 14,
                    py: 0.5,
                    background: '#FFFBEA',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderWidth: '1px',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#dede33ff',
                      borderWidth: '3px',
                    },
                  }
                }}
              />
            </FormControl>

            {/* Photos */}
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ mb: 1, fontWeight: 100, fontFamily: 'Geist, Geist Sans, Segoe UI, Arial, sans-serif' }}>Photos (2-5)</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {photoFiles.map((file, idx) => (
                  <Box key={idx} sx={{ position: 'relative' }}>
                    <img src={objectURLs[idx]} alt={`preview-${idx}`} loading="lazy" style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 12, border: idx === thumbnailIdx ? "2.5px solid #22c55e" : "2px solid #222", cursor: "pointer" }} onClick={() => setThumbnailIdx(idx)} />
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
              sx={{ mb: 1.5, borderRadius: 2, boxShadow: 1, background: '#fff', border: 'none', overflow: 'hidden' }}
            >
              <AccordionSummary
                sx={{ cursor: 'pointer', px: 1, py: 0.5, background: 'transparent', borderBottom: showAdvanced ? `1px solid #e5e7eb` : 'none', display: 'flex', alignItems: 'center', minHeight: 28 }}
              >
                <span style={{
                  display: 'inline-block',
                  transition: 'transform 0.2s',
                  transform: showAdvanced ? 'rotate(90deg)' : 'rotate(0deg)',
                  fontSize: 13,
                  marginRight: 6,
                  color: '#64748b',
                  fontWeight: 200,
                }}>▶</span>
                <Typography sx={{ fontWeight: 150, color: '#191919ff', fontSize: 13, letterSpacing: 0.01, fontFamily: 'Geist, Geist Sans, Segoe UI, Arial, sans-serif' }}>More details</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ background: '#fff', pt: 1, borderRadius: 2, px: 1.2, boxShadow: 'none', border: 'none' }}>
                {/* Color picker */}
                <Typography sx={{ mb: 0.5, fontWeight: 100, color: '#222', fontSize: 13, fontFamily: 'Geist, Geist Sans, Segoe UI, Arial, sans-serif' }}>Color</Typography>
                <Grid container spacing={0.5} sx={{ mb: 1.2 }}>
                  {colorPalette.map((c, idx) => (
                    <Grid item xs={3} key={c}>
                      <Box sx={{ position: 'relative', display: 'inline-block' }}>
                        <Button
                          variant="outlined"
                          onClick={() => setColor(c)}
                          sx={{
                            width: 34,
                            height: 34,
                            minWidth: 34,
                            minHeight: 34,
                            borderRadius: '50%',
                            background: c,
                            border: color === c ? `2.5px solid ${APP_GREEN}` : '1.5px solid #bdbdbd',
                            boxShadow: color === c ? `0 0 0 2px ${APP_GREEN}` : 'none',
                            p: 0,
                            position: 'relative',
                            transition: 'border 0.2s, box-shadow 0.2s',
                          }}
                        >
                          {color === c && (
                            <span style={{
                              position: 'absolute',
                              top: 4,
                              left: 10,
                              color: APP_GREEN,
                              fontWeight: 900,
                              fontSize: 15,
                              pointerEvents: 'none',
                            }}>✓</span>
                          )}
                        </Button>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
                <FormControl fullWidth sx={{ mb: 1 }}>
                  <Typography sx={{ mb: 0.2, fontWeight: 100, color: '#222', fontSize: 14, fontFamily: 'Geist, Geist Sans, Segoe UI, Arial, sans-serif' }}>Brand</Typography>
                  <TextField
                    value={brand}
                    onChange={e => setBrand(e.target.value)}
                    placeholder="e.g. Nike, Zara, Uniqlo"
                    fullWidth
                    size="small"
                    InputProps={{
                      sx: {
                        borderRadius: 2,
                        fontSize: 14,
                        py: 0.5,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderWidth: '1px',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor:  '#bcbcbcff',
                          borderWidth: '0.5px',
                        },
                      }
                    }}
                  />
                </FormControl>
                <FormControl fullWidth sx={{ mb: 1 }}>
                  <Typography sx={{ mb: 0.2, fontWeight: 100, color: '#222', fontSize: 14, fontFamily: 'Geist, Geist Sans, Segoe UI, Arial, sans-serif' }}>Material</Typography>
                  <TextField
                    value={material}
                    onChange={e => setMaterial(e.target.value)}
                    placeholder="e.g. 100% Cotton, Polyester"
                    fullWidth
                    size="small"
                    InputProps={{
                      sx: {
                        borderRadius: 2,
                        fontSize: 14,
                        py: 0.5,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderWidth: '1px',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#bcbcbcff',
                          borderWidth: '0.5px',
                        },
                      }
                    }}
                  />
                </FormControl>
                <FormControl fullWidth>
                  <Typography sx={{ mb: 0.2, fontWeight: 100, color: '#222', fontSize: 14, fontFamily: 'Geist, Geist Sans, Segoe UI, Arial, sans-serif' }}>Additional Info</Typography>
                  <TextField
                    value={additionalInfo}
                    onChange={e => setAdditionalInfo(e.target.value)}
                    placeholder="e.g. Slightly worn, limited edition, etc."
                    fullWidth
                    multiline
                    sx={{
                            "& .MuiInputBase-inputMultiline": {
                            padding: "6px 0px"  // top/bottom, left/right
                            }
                        }}
                    minRows={2}
                    size="small"
                    InputProps={{
                      sx: {
                        borderRadius: 2,
                        fontSize: 14,
                        py: 0.5,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderWidth: '1px',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor:  '#bcbcbcff',
                          borderWidth: '0.5px',
                        },
                      }
                    }}
                  />
                </FormControl>
              </AccordionDetails>
            </Accordion>

            <Button type="submit" variant="contained" fullWidth sx={{ py: 1.5, fontSize: 18, borderRadius: 3, background: '#22c55e', color: '#fff', fontWeight: 150, fontFamily: 'Geist, Geist Sans, Segoe UI, Arial, sans-serif', '&:hover': { background: '#15803d' } }} disabled={loading}>
              {loading ? "Adding..." : "Submit"}
            </Button>

          </FormControl>
        </Box>
      </Collapse>
    </Box>
  );
}

export default AddItem;
