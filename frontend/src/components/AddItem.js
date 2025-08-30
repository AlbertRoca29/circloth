import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { v4 as uuidv4 } from 'uuid';

import { showToast } from "../utils/toast";
import { storage } from "../utils/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import imageCompression from "browser-image-compression";
import BACKEND_URL from "../config";
import { getCategoryEmoji } from "../utils/general";
import { CATEGORIES } from "../constants/categories";
import { getSizeOptions } from "../utils/general";
import { COLORS } from "../constants/theme";
import { FastAverageColor } from 'fast-average-color';
import Button from "@mui/material/Button";
import { PlusIcon } from '../utils/svg';
import ProgressBarButton from "./ProgressBarButton";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import FormControl from "@mui/material/FormControl";
import Collapse from "@mui/material/Collapse";

function AddItem({ user, onItemAdded }) {
  const { t } = useTranslation();
  // Use global categories and size options
  const categories = CATEGORIES.map(cat => ({ key: cat.key, label: t(cat.labelKey) }));
  const APP_GREEN = COLORS.appGreen;
  // Build size options as array of { key, label }
  const rawSizeOptions = getSizeOptions(t);
  const sizeOptions = Object.fromEntries(
    Object.entries(rawSizeOptions).map(([cat, opts]) => [
      cat,
      opts.map(opt => ({ key: opt, label: opt }))
    ])
  );
  const [open, setOpen] = useState(false);
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [category, setCategory] = useState('');
  const [size, setSize] = useState('');
  const [sizeDetails, setSizeDetails] = useState('');
  const [itemStory, setItemStory] = useState('');
  // Color state is computed from main image
  const [color, setColor] = useState('');
  const [brand, setBrand] = useState('');
  const [material, setMaterial] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [photoFiles, setPhotoFiles] = useState([]);
  const [thumbnailIdx, setThumbnailIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  // For demo: fake progress state
  const [progress, setProgress] = useState(0);
  // const [errorMsg, setErrorMsg] = useState("");

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
  showToast(t('please_fill_required_fields'), { type: "warning" });
      return;
    }
    if (photoFiles.length < 2) {
  showToast(t('please_add_photos'), { type: "warning" });
      return;
    }
  setLoading(true);
  setProgress(0);
    try {
      const photoURLs = [];
      for (let i = 0; i < photoFiles.length; i++) {
        setProgress(Math.round(((i + 1) / photoFiles.length) * 80)); // Simulate progress
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

      // Compute main color from the main image (thumbnail)
      let mainColor = '';
      try {
        const fac = new FastAverageColor();
        // Create a temporary image element to read the color
        const img = document.createElement('img');
        img.crossOrigin = 'Anonymous';
        img.src = objectURLs[thumbnailIdx];
        // Wait for image to load
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
        const colorObj = fac.getColor(img);
        mainColor = colorObj.hex;
      } catch (err) {
        mainColor = '#cccccc'; // fallback color
      }

      const newItem = {
        id: uuidv4(),
        ownerId: user.uid,
        category,
        size,
        sizeDetails,
        itemStory,
        color: mainColor,
        brand,
        material,
        additionalInfo,
        photoURLs: orderedPhotoURLs
      };

      const res = await fetch(`${BACKEND_URL}/item`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem)
      });
      if (!res.ok) throw new Error("Failed to add item");

      // Update cached items in localStorage
      const cachedItems = JSON.parse(localStorage.getItem(`items_${user.id}`)) || [];
      const updatedItems = [...cachedItems, newItem];
      localStorage.setItem(`items_${user.id}`, JSON.stringify(updatedItems));

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
      setProgress(100);
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 500);
    }
  }

  // Ensure the AddItem button is always fixed and independent of other elements
  const floatingButtonStyle = {
    position: "fixed",
    bottom: "25%",
    right: "25%",
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    backgroundColor: "#15803d", // App green color
    color: "white",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    cursor: "pointer",
    border: "none",
    zIndex: 1000,
  };

  return (
    <Box sx={{ mt: open ? 1 : 0, display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 2 }}>
      {/* Toast notifications will show errors instead of inline errorMsg */}
      {!open && (
        <div style={{
          display: 'flex',
          width: '10%',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: "fixed",
          bottom: "13vh",
          right: "13vh",
          textAlign: 'center',
        }}>
          <span style={{
            marginBottom: 4,
            fontWeight: 150,
            color: '#15803ca8',
            fontFamily: 'Geist, Geist Sans, Segoe UI, Arial, sans-serif',
            fontSize: 11,
            width: '100%',
            textAlign: 'center',
            display: 'block',
          }}>{t('add_item') || 'Add Item'}</span>
          <button
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #22c55e 60%, #15803d 100%)",
              color: "white",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              boxShadow: "0 4px 10px 0 rgba(34,197,94,0.18), 0 1px 2px 0 rgba(0,0,0,0.08)",
              cursor: "pointer",
              border: "none",
              zIndex: 1000,
              transition: "box-shadow 0.2s, transform 0.1s, background 0.2s",
              outline: 'none',
            }}
            onClick={() => setOpen(true)}
            title={t("add_item")}
            aria-label={t('add_item') || 'Add Item'}
          >
            <PlusIcon style={{ transform: "scale(1.3)" }} />
          </button>
        </div>
      )}
      <Collapse in={open} sx={{ width: '100%' , p:1}}>
        <Box component="form" onSubmit={handleSubmit} sx={{ bgcolor: '#fff', p: 1.5, borderRadius: 2, boxShadow: 10, position: 'relative', border: '1px solid #22c55e' }}>
          <Button onClick={() => setOpen(false)} sx={{ position: 'absolute', top: 4, right: 4, minWidth: 0, fontSize: 28, p: 0, lineHeight: 1, color: '#888' }}>×</Button>
          <Typography sx={{ mb: 1, fontWeight: 200, fontSize:14, color: '#15803d', fontFamily: 'Geist, Geist Sans, Segoe UI, Arial, sans-serif' }}>{t('add_item')}</Typography>


          <FormControl fullWidth sx={{ mb: 1 }}>
            {/* <Typography sx={{ mb: 0.5, fontWeight: 600, color: '#222', fontSize: 16 }}>Category</Typography> */}
            <Typography sx={{ mb: 0.2, fontWeight: 150, color: '#222', fontSize: 12, fontFamily: 'Geist, Geist Sans, Segoe UI, Arial, sans-serif' }}>{t('category')} <span style={{ color: 'red', marginLeft: 4 }}>*</span></Typography>
            <Grid container spacing={0.7} sx={{ mb: 0.5, mt: 0.2, justifyContent: 'center', fontFamily: 'Geist, Geist Sans, Segoe UI, Arial, sans-serif', fontWeight: 100 }}>
              {categories.map(cat => (
                <Grid item xs={3} key={cat.key} sx={{ textAlign: 'center' }}>
                  <Button
                    onClick={() => handleCategorySelect(cat.key)}
                    sx={{
                      flexDirection: 'column',
                      borderRadius: 1.2,
                      border: category === cat.key ? `2px solid ${APP_GREEN}` : '1px solid #bdbdbd',
                      background: '#fff',
                      mb: 0.2,
                      minWidth: 0,
                      minHeight: 0,
                      width: 68,
                      height: 68,
                      boxShadow: category === cat.key ? `1px 1px 0px 1px ${APP_GREEN}` : 'none',
                      p: 3,
                      transition: 'border 0s, box-shadow 0.4s',
                      fontSize: 22,
                      color: '#28720dff',
                      fontFamily: 'Geist, Geist Sans, Segoe UI, Arial, sans-serif',
                      fontWeight: 100,
                      '&:hover': { background: '#F3F4F6' },
                    }}
                  >
                    <span style={{ fontSize: 18, lineHeight: 1 }}>{getCategoryEmoji(cat.key)}</span>
                    <span style={{ fontSize: 8, color: '#666', marginTop: 4, lineHeight: 1.2 }}>{cat.label}</span>
                  </Button>
                </Grid>
              ))}
            </Grid>



            {category && (
              <>
        <Box sx={{ mb: 1, mt: 0.5 }}>
          <Typography sx={{ mb: 0.5, fontWeight: 150, color: '#222', fontSize: 12, fontFamily: 'Geist, Geist Sans, Segoe UI, Arial, sans-serif' }}>{t('size')} <span style={{ color: 'red', marginLeft: 4 }}>*</span></Typography>
                    <Grid container spacing={0.6}>
            {(sizeOptions[category] || []).map(opt => (
              <Grid item xs={4} key={opt.key}>
                <Button
                  onClick={() => setSize(opt.key)}
                  sx={{
                    width: '100%',
                    borderRadius: 2,
                    height: 28,
                    fontSize: 11.5,
                    fontFamily: 'Geist, Geist Sans, Segoe UI, Arial, sans-serif',
                    fontWeight: 150,
                    py: 0.5,
                    background: size === opt.key ? APP_GREEN : '#f6f6f6ff',
                    color: size === opt.key ? '#fff' : '#166232',
                    border: size === opt.key ? `1.5px solid ${APP_GREEN}` : '1px solid #bdbdbd',
                    transition: 'all 0.2s',
                  }}
                >
                  {opt.label}
                </Button>
              </Grid>
            ))}
                    </Grid>
                    </Box>

                {/* <FormControl fullWidth sx={{ mb: 0.5 }}>
                  <Typography sx={{ mb: 0.1, fontWeight: 150, color: '#222', fontSize: 10, fontFamily: 'Geist, Geist Sans, Segoe UI, Arial, sans-serif' }}>{t('details_of_size')}</Typography>
                  <TextField
                    value={sizeDetails}
                    onChange={e => setSizeDetails(e.target.value)}
                    placeholder={t('placeholder_size_details')}
                    fullWidth
                    size="small"
                    InputProps={{
                      sx: {
                        borderRadius: 1.2,
                        fontSize: 11,
                        py: 0.2,
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
                </FormControl> */}
                </>

            )}
            <Box sx={{ height: 10 }} />
            <FormControl fullWidth sx={{ mb: 1 }}>
              <Typography sx={{ mb: 0.5, fontWeight: 150, color: '#222', fontSize: 12, fontFamily: 'Geist, Geist Sans, Segoe UI, Arial, sans-serif' }}>{t('item_story')} <span style={{ color: 'red', marginLeft: 4 }}>*</span></Typography>
              <TextField
                value={itemStory}
                onChange={e => setItemStory(e.target.value)}
                placeholder={t('placeholder_item_story')}
                fullWidth
                multiline
                minRows={2}
                sx={{
                    "& .MuiInputBase-inputMultiline": {
                    padding: "3px 0px"  // top/bottom, left/right
                    }
                }}
                required
                size="small"
                InputProps={{
                  sx: {
                    borderRadius: 1.2,
                    fontSize: 12,
                    py: 0.5,
                    background: '#e5fbe4ff',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderWidth: '1px',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#13c70dff',
                      borderWidth: '2px',
                    },
                  }
                }}
              />
            </FormControl>

            {/* Photos */}
            <Box sx={{ mb: 1 }}>
              <Typography sx={{ mb: 0.5, fontWeight: 150, color: '#222', fontSize: 12, fontFamily: 'Geist, Geist Sans, Segoe UI, Arial, sans-serif' }}>{t('photos_2_5')} <span style={{ color: 'red', marginLeft: 4 }}>*</span></Typography>
              <Box sx={{ display: 'flex', gap: 1.75, flexWrap: 'wrap' }}>
                {photoFiles.map((file, idx) => (
                  <Box key={idx} sx={{ position: 'relative' }}>
                    <img src={objectURLs[idx]} alt={`preview-${idx}`} loading="lazy" style={{ width: 50, height: 50, objectFit: "cover", borderRadius: 7, border: idx === thumbnailIdx ? "3px solid #22c55e" : "1.2px solid #222", cursor: "pointer" }} onClick={() => setThumbnailIdx(idx)} />
                    <Button size="small" onClick={() => {
                      const newFiles = photoFiles.filter((_, i) => i !== idx);
                      setPhotoFiles(newFiles);
                      if (thumbnailIdx === idx) setThumbnailIdx(0);
                      else if (thumbnailIdx > idx) setThumbnailIdx(thumbnailIdx - 1);
                    }} sx={{ position: "absolute", top: -10, right: -9, minWidth: 0, padding: 0, fontSize: 15, color: '#888' }}>×</Button>
                  </Box>
                ))}
                {photoFiles.length < 5 && (
                  <label style={{ display: "inline-block", cursor: "pointer" }}>
                    <span style={{ display: "inline-block", width: 50, height: 50, borderRadius: 5, background: "#f5f5f5", color: "#22c55e", fontSize: 28, fontWeight: 200, textAlign: "center", lineHeight: "48px", border: "1.7px dashed #22c55e" }}>+</span>
                    <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => { if (!e.target.files[0]) return; setPhotoFiles([...photoFiles, e.target.files[0]]); }} />
                  </label>
                )}
              </Box>
            </Box>



            <Accordion
              expanded={showAdvanced}
              onChange={() => setShowAdvanced(!showAdvanced)}
              sx={{ mb: 0,  borderRadius: 1.2, boxShadow: 0, background: '#fff', border: 'none', overflow: 'hidden' }}
            >
              <AccordionSummary
                sx={{ cursor: 'pointer', px: 0.5, py: 0, background: 'transparent', borderBottom: showAdvanced ? `1px solid #e5e7eb` : 'none', display: 'flex', alignItems: 'center' }}
              >
                <span style={{
                  display: 'inline-block',
                  transition: 'transform 0.2s',
                  transform: showAdvanced ? 'rotate(90deg)' : 'rotate(0deg)',
                  fontSize: 11,
                  marginRight: 9,
                  color: '#64748b',
                  fontWeight: 200,
                }}>▶</span>
                <Typography sx={{ fontWeight: 150, color: '#545454ff', fontSize: 12, letterSpacing: 0.2, fontFamily: 'Geist, Geist Sans, Segoe UI, Arial, sans-serif' }}>{t('more_details')}</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ background: '#fff', pt: 0.7, px: 0.7, boxShadow: 'none', border: 'none' }}>
                <FormControl fullWidth sx={{ mb: 1 }}>
                  <Typography sx={{ mb: 0.1, fontWeight: 150, color: '#222', fontSize: 11, fontFamily: 'Geist, Geist Sans, Segoe UI, Arial, sans-serif' }}>{t('brand')}</Typography>
                  <TextField
                    value={brand}
                    onChange={e => setBrand(e.target.value)}
                    placeholder={t('placeholder_brand')}
                    fullWidth
                    size="small"
                    InputProps={{
                      sx: {
                        borderRadius: 1.2,
                        fontSize: 11,
                        py: 0.2,
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
                  <Typography sx={{ mb: 0.1, fontWeight: 150, color: '#222', fontSize: 11, fontFamily: 'Geist, Geist Sans, Segoe UI, Arial, sans-serif' }}>{t('material')}</Typography>
                  <TextField
                    value={material}
                    onChange={e => setMaterial(e.target.value)}
                    placeholder={t('placeholder_material')}
                    fullWidth
                    size="small"
                    InputProps={{
                      sx: {
                        borderRadius: 1.2,
                        fontSize: 11,
                        py: 0.2,
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
                  <Typography sx={{ mb: 0.1, fontWeight: 150, color: '#222', fontSize: 11, fontFamily: 'Geist, Geist Sans, Segoe UI, Arial, sans-serif' }}>{t('additional_info')}</Typography>
                  <TextField
                    value={additionalInfo}
                    onChange={e => setAdditionalInfo(e.target.value)}
                    placeholder={t('placeholder_additional_info')}
                    fullWidth
                    multiline
                    sx={{
                            "& .MuiInputBase-inputMultiline": {
                            padding: "3px 0px"  // top/bottom, left/right
                            }
                        }}
                    minRows={2}
                    size="small"
                    InputProps={{
                      sx: {
                        borderRadius: 1.2,
                        fontSize: 11,
                        py: 0.2,
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


            {loading ? (
              <Box sx={{ width: '100%', height: 32 }}>
                <ProgressBarButton progress={progress} />
              </Box>
            ) : (
              <Button type="submit" variant="contained" fullWidth sx={{ py: 0.7, fontSize: 12, borderRadius: 2, background: '#22c55e', color: '#fff', mt:1, fontWeight: 150, fontFamily: 'Geist, Geist Sans, Segoe UI, Arial, sans-serif', '&:hover': { background: '#15803d' } }}>
                {t('submit') || 'Submit'}
              </Button>
            )}

          </FormControl>
        </Box>
      </Collapse>
    </Box>
  );
}
export default AddItem;
