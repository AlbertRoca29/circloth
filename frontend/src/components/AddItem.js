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
import { COLORS, COLOR_PALETTE } from "../constants/theme";
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
  const colorPalette = COLOR_PALETTE;
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
      const newItem = {
        id: uuidv4(),
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
    <Box sx={{ mt: open ? 0.5 : 2, display: 'flex', flexDirection: 'column', alignItems: 'center'  }}>
      {/* Toast notifications will show errors instead of inline errorMsg */}
      {!open && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: "fixed",bottom: "20%",right: "20%" }}>
          <span style={{
            marginBottom: 8,
            fontWeight: 150,
            color: '#15803ca8',
            fontFamily: 'Geist, Geist Sans, Segoe UI, Arial, sans-serif',
            fontSize: 10,
            userSelect: 'none',
            pointerEvents: 'none',
          }}>{t('add_item') || 'Add Item'}</span>
          <button
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #22c55e 60%, #15803d 100%)",
              color: "white",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              boxShadow: "0 6px 18px 0 rgba(34,197,94,0.25), 0 2px 4px 0 rgba(0,0,0,0.10)",
              cursor: "pointer",
              border: "none",
              zIndex: 1000,
              transition: "box-shadow 0.2s, transform 0.1s, background 0.2s",
              outline: 'none',
            }}
            onClick={() => setOpen(true)}
            title={t("add_item")}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.96)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            tabIndex={0}
            aria-label={t('add_item') || 'Add Item'}
          >
            <PlusIcon style={{ transform: "scale(1.35)" }} />
          </button>
        </div>
      )}
      <Collapse in={open} sx={{ width: '100%', maxWidth: 500, mt: 0.5 }}>
        <Box component="form" onSubmit={handleSubmit} sx={{ bgcolor: '#fff', p: 2.5, borderRadius: 4, boxShadow: 3, position: 'relative', border: '1.5px solid #22c55e' }}>
          <Button onClick={() => setOpen(false)} sx={{ position: 'absolute', top: 8, right: 8 }}>×</Button>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 200, color: '#15803d', fontFamily: 'Geist, Geist Sans, Segoe UI, Arial, sans-serif', fontSize: 16 }}>{t('add_item')}</Typography>


          <FormControl fullWidth sx={{ mb: 2 }}>
            {/* <Typography sx={{ mb: 0.5, fontWeight: 600, color: '#222', fontSize: 16 }}>Category</Typography> */}
            <Typography sx={{ mb: 0.5, fontWeight: 150, color: '#222', fontSize: 13, fontFamily: 'Geist, Geist Sans, Segoe UI, Arial, sans-serif' }}>{t('category')} <span style={{ color: 'red', marginLeft: 4 }}>*</span></Typography>
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
                    <span style={{ fontSize: 10, color: '#666', marginTop: 8, lineHeight: 1.2 }}>{cat.label}</span>
                  </Button>
                </Grid>
              ))}
            </Grid>



            {category && (
              <>
        <Box sx={{ mb: 1.7, mt: 1 }}>
          <Typography sx={{ mb: 1, fontWeight: 150, color: '#222', fontSize: 13, fontFamily: 'Geist, Geist Sans, Segoe UI, Arial, sans-serif' }}>{t('size')} <span style={{ color: 'red', marginLeft: 4 }}>*</span></Typography>
                    <Grid container spacing={1}>
            {(sizeOptions[category] || []).map(opt => (
              <Grid item xs={4} key={opt.key}>
                <Button
                  onClick={() => setSize(opt.key)}
                  sx={{
                    width: '100%',
                    borderRadius: 1.5,
                    minHeight: 32,
                    fontSize: 13,
                    fontFamily: 'Geist, Geist Sans, Segoe UI, Arial, sans-serif',
                    fontWeight: 150,
                    py: 0.5,
                    background: size === opt.key ? APP_GREEN : '#f3f4f6',
                    color: size === opt.key ? '#fff' : '#166232',
                    border: size === opt.key ? `2px solid ${APP_GREEN}` : '1.5px solid #bdbdbd',
                    boxShadow: size === opt.key ? `0 2px 8px rgba(34,197,94,0.10)` : 'none',
                    '&:hover': {
                      background: size === opt.key ? '#15803d' : '#e6f7ec',
                      borderColor: '#15803d',
                      color: '#15803d',
                    },
                    transition: 'all 0.2s',
                  }}
                >
                  {opt.label}
                </Button>
              </Grid>
            ))}
                    </Grid>
                    </Box>

                <FormControl fullWidth sx={{ mb: 1 }}>
                  <Typography sx={{ mb: 0.2, fontWeight: 150, color: '#222', fontSize: 13, fontFamily: 'Geist, Geist Sans, Segoe UI, Arial, sans-serif' }}>{t('details_of_size')}</Typography>
                  <TextField
                    value={sizeDetails}
                    onChange={e => setSizeDetails(e.target.value)}
                    placeholder={t('placeholder_size_details')}
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
                </>

            )}
            <Box sx={{ height: 20 }} />
            <FormControl fullWidth sx={{ mb: 1.5 }}>
              <Typography sx={{ mb: 0.4, fontWeight: 150, color: '#222', fontSize: 13, fontFamily: 'Geist, Geist Sans, Segoe UI, Arial, sans-serif' }}>{t('item_story')} <span style={{ color: 'red', marginLeft: 4 }}>*</span></Typography>
              <TextField
                value={itemStory}
                onChange={e => setItemStory(e.target.value)}
                placeholder={t('placeholder_item_story')}
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
              <Typography sx={{ mb: 1, fontWeight: 150, color: '#222', fontSize: 13, fontFamily: 'Geist, Geist Sans, Segoe UI, Arial, sans-serif' }}>{t('photos_2_5')} <span style={{ color: 'red', marginLeft: 4 }}>*</span></Typography>
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
              sx={{ mb: 1.5,  borderRadius: 2, boxShadow: 1, background: '#fff', border: 'none', overflow: 'hidden' }}
            >
              <AccordionSummary
                sx={{ cursor: 'pointer', px: 1, py: 0.5, background: 'transparent', borderBottom: showAdvanced ? `1.5px solid #e5e7eb` : 'none', display: 'flex', alignItems: 'center', minHeight: 28 }}
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
                <Typography sx={{ fontWeight: 150, color: '#545454ff', fontSize: 14, letterSpacing: 0.3, fontFamily: 'Geist, Geist Sans, Segoe UI, Arial, sans-serif' }}>{t('more_details')}</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ background: '#fff', pt: 1, borderRadius: 2, px: 1.2, boxShadow: 'none', border: 'none' }}>
                {/* Color picker */}
                <Typography sx={{ mb: 0.5, fontWeight: 150, color: '#222', fontSize: 13, fontFamily: 'Geist, Geist Sans, Segoe UI, Arial, sans-serif' }}>{t('color')}</Typography>
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
                  <Typography sx={{ mb: 0.2, fontWeight: 150, color: '#222', fontSize: 13, fontFamily: 'Geist, Geist Sans, Segoe UI, Arial, sans-serif' }}>{t('brand')}</Typography>
                  <TextField
                    value={brand}
                    onChange={e => setBrand(e.target.value)}
                    placeholder={t('placeholder_brand')}
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
                  <Typography sx={{ mb: 0.2, fontWeight: 150, color: '#222', fontSize: 13, fontFamily: 'Geist, Geist Sans, Segoe UI, Arial, sans-serif' }}>{t('material')}</Typography>
                  <TextField
                    value={material}
                    onChange={e => setMaterial(e.target.value)}
                    placeholder={t('placeholder_material')}
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
                  <Typography sx={{ mb: 0.2, fontWeight: 150, color: '#222', fontSize: 13, fontFamily: 'Geist, Geist Sans, Segoe UI, Arial, sans-serif' }}>{t('additional_info')}</Typography>
                  <TextField
                    value={additionalInfo}
                    onChange={e => setAdditionalInfo(e.target.value)}
                    placeholder={t('placeholder_additional_info')}
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


            {loading ? (
              <Box sx={{ width: '100%', height: 48 }}>
                <ProgressBarButton progress={progress} />
              </Box>
            ) : (
              <Button type="submit" variant="contained" fullWidth sx={{ py: 1.5, fontSize: 18, borderRadius: 3, background: '#22c55e', color: '#fff', mt:2, fontWeight: 150, fontFamily: 'Geist, Geist Sans, Segoe UI, Arial, sans-serif', '&:hover': { background: '#15803d' } }}>
                Submit
              </Button>
            )}

          </FormControl>
        </Box>
      </Collapse>
    </Box>
  );
}
export default AddItem;
