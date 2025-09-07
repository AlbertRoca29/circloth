import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { v4 as uuidv4 } from 'uuid';

import { showToast } from "../utils/toast";
import { storage } from "../utils/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import imageCompression from "browser-image-compression";
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
import { setItemsToLocalStorage, getItemsFromLocalStorage } from '../utils/general';
import { addItem } from "../api/userItemsApi";

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
  const [color, setColor] = useState('');
  const [brand, setBrand] = useState('');
  const [material, setMaterial] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [photoFiles, setPhotoFiles] = useState([]);
  const [thumbnailIdx, setThumbnailIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [progress, setProgress] = useState(0);

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
    if (photoFiles.length < 1) {
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

      await addItem(newItem);

      // Save to localStorage
      const existingItems = getItemsFromLocalStorage(user.id);
      const updatedItems = [...existingItems, newItem];
      console.log('Updated items to be saved to localStorage:', updatedItems);
      setItemsToLocalStorage(user.id, updatedItems);

      // Notify parent component
      onItemAdded(newItem);

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
    bottom: "10%", // Adjusted for better reachability on mobile
    right: "10%",
    width: "70px", // Increased size for touch-friendliness
    height: "70px",
    borderRadius: "50%",
    backgroundColor: "#15803d",
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
      {!open && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'fixed',
            bottom: '20vh',
            right: '15vw',
            textAlign: 'center',
            zIndex: 1000,
            width: 'auto',
          }}
        >
          <span
            style={{
              marginBottom: 4,
              fontWeight: 150,
              color: '#15803ca8',
              fontFamily: 'Geist, Geist Sans, Segoe UI, Arial, sans-serif',
              fontSize: 13,
              width: '100%',
              textAlign: 'center',
              display: 'block',
            }}
          >
            {t('add_item') || 'Add Item'}
          </span>
          <button
            style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #22c55e 60%, #15803d 100%)',
              color: 'white',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              boxShadow: '0 4px 10px 0 rgba(34,197,94,0.18), 0 1px 2px 0 rgba(0,0,0,0.08)',
              cursor: 'pointer',
              border: 'none',
              zIndex: 1000,
              transition: 'box-shadow 0.2s, transform 0.1s, background 0.2s',
              outline: 'none',
            }}
            onClick={() => setOpen(true)}
            title={t('add_item')}
            aria-label={t('add_item') || 'Add Item'}
          >
            <PlusIcon style={{ transform: 'scale(1.3)' }} />
          </button>
        </div>
      )}
      <Collapse
        in={open}
        sx={theme => ({
          position: 'fixed',
          top: '10dvh',
          left: '2.5vw',
          width: '100vw',
          height: '100%',
          zIndex: 1200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.04)',
          m: 0,
          p: 0,
        })}
      >
        <div style={{
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 3px 7px rgba(0, 0, 0, 0.2)',
          width: '92vw',
          maxWidth: 480,
          height: '78vh',
          minHeight: 420,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          top: 0
        }}>
        {/* Header */}
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#22c55e',
            padding: '11px 0 9px 0',
            position: 'relative',
        }}>
            <div style={{
            fontWeight: 150,
            fontSize: 18,
            color: '#fff',
            flex: 1,
            textAlign: 'center',
            letterSpacing: 0.2,
            }}>
                {t('add_item', 'Add Item')}
            </div>
            <button
            onClick={() => setOpen(false)}
            aria-label="Close add item view"
            style={{
                position: 'absolute',
                right: 12,
                top: 4,
                border: 'none',
                background: 'transparent',
                fontSize: 26,
                fontFamily: 'Geist',
                fontWeight: 100,
                cursor: 'pointer',
                color: '#fff',
                padding: '-1px 8px',
                borderRadius: 8,
                boxShadow: '0 1px 4px rgba(0, 0, 0, 0)',
                transition: 'background 0.18s',
            }}
            onMouseOver={e => e.currentTarget.style.background = '#fff4'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
            >
            ×
            </button>
        </div>

  {/* Form Content */}
  <Box component="form" onSubmit={handleSubmit} sx={{
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    padding: '12px 16px',
    display: 'flex',
    fontFamily: 'Geist',
    flexDirection: 'column',
    gap: 2,
    background: '#f8f8f8',
    height: '100%',
    maxHeight: 'calc(78vh - 56px)',
  }}>
    <FormControl fullWidth>
      <Typography sx={{
        mb: 1,
        fontWeight: 150,
        fontSize: 14,
        color: '#333',
        fontFamily:'Geist'
      }}>{t('category')} <span style={{ color: 'red' }}>*</span></Typography>
      <Grid container spacing={1} sx={{ justifyContent: 'center' }}>
        {categories.map(cat => (
          <Grid item xs={4} key={cat.key} sx={{ textAlign: 'center' }}>
            <Button
              onClick={() => handleCategorySelect(cat.key)}
              sx={{
                flexDirection: 'column',
                borderRadius: 1.2,
                border: category === cat.key ? `3px solid ${APP_GREEN}` : '1px solid #ddd',
                background: category === cat.key ? '#c8f7d6ff' : '#fdfdfd',
                width: '25vw',
                aspectRatio: '1.35',
                fontSize: 15,
                color: '#28720d',
                '&:hover': { background: '#f3f3f3' },
              }}
            >
              <span style={{ fontSize: 27, textShadow: '0 1px 2px rgba(0, 0, 0, 0.6)' }}>{getCategoryEmoji(cat.key)}</span>
              <span style={{ fontSize: 11.5, fontFamily:'Geist', fontWeight: category === cat.key ? 150 : 100, color: '#555', marginTop: 1, lineHeight: 1.3, height: '46%' }}>{cat.label}</span>
            </Button>
          </Grid>
        ))}
      </Grid>
    </FormControl>

    {category && (
      <FormControl fullWidth>
        <Typography sx={{
          mb: 1,
          fontWeight: 150,
          fontFamily: 'Geist',
          fontSize: 14,
          color: '#333',
        }}>{t('size')} <span style={{ color: 'red' }}>*</span></Typography>
        <Grid container spacing={1}>
          {(sizeOptions[category] || []).map(opt => (
            <Grid item xs={4} key={opt.key}>
              <Button
                onClick={() => setSize(opt.key)}
                sx={{
                  width: '100%',
                  borderRadius: 1.5,
                  fontFamily: 'Geist',
                  fontWeight: 125,
                  height: 40,
                  fontSize: size === opt.key ? 15 : 13,
                  background: size === opt.key ? APP_GREEN : '#f6f6f6',
                  color: size === opt.key ? '#fff' : '#166232',
                  border: size === opt.key ? `1.5px solid ${APP_GREEN}` : '1px solid #ddd',
                }}
              >
                {opt.label}
              </Button>
            </Grid>
          ))}
        </Grid>
      </FormControl>
    )}

    <FormControl fullWidth>
      <Typography sx={{
        mb: 1,
        fontWeight: 150,
        fontFamily: 'Geist',
        fontSize: 14,
        color: '#333',
      }}>{t('item_story')} <span style={{ color: 'red' }}>*</span></Typography>
      <TextField
        value={itemStory}
        onChange={e => setItemStory(e.target.value)}
        placeholder={t('placeholder_item_story')}
        fullWidth
        multiline
        minRows={3}
        sx={{
          fontFamily: 'Geist',
          fontSize: '0.8125rem', // Converted from 13px
          borderRadius: 1.2,
          background: '#f9f9f9',
        }}
        required
      />
    </FormControl>

    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Typography sx={{
        fontWeight: 150,
        fontFamily: 'Geist',
        fontSize: 14,
        color: '#333',
  }}>{t('photos_1_5')} <span style={{ color: 'red' }}>*</span></Typography>
      <Box sx={{ display: 'flex', gap: 2.25, flexWrap: 'wrap', justifyContent: 'center' }}>
        {photoFiles.map((file, idx) => (
          <Box key={idx} sx={{ position: 'relative' }}>
            <img
              src={objectURLs[idx]}
              alt={`preview-${idx}`}
              loading="lazy"
              style={{
                width: '13.5vw',
                aspectRatio: 1,
                objectFit: "cover",
                borderRadius: 7,
                border: idx === thumbnailIdx ? "3px solid #22c55e" : "1.2px solid #ddd",
                cursor: "pointer",
              }}
              onClick={() => setThumbnailIdx(idx)}
            />
            <Button
              size="small"
              onClick={() => {
                const newFiles = photoFiles.filter((_, i) => i !== idx);
                setPhotoFiles(newFiles);
                if (thumbnailIdx === idx) setThumbnailIdx(0);
                else if (thumbnailIdx > idx) setThumbnailIdx(thumbnailIdx - 1);
              }}
              sx={{
                position: "absolute",
                top: -14,
                right: -11,
                minWidth: 0,
                padding: 0,
                fontSize: 18,
                color: '#888',
              }}
            >×</Button>
          </Box>
        ))}
        {photoFiles.length < 5 && (
          <label style={{ display: "inline-block", cursor: "pointer" }}>
            <span style={{
              display: "inline-block",
              width: '13.5vw',
              aspectRatio: 1,
              borderRadius: 5,
              background: "#f5f5f5",
              color: "#22c55e",
              fontSize: 38,
              fontWeight: 150,
              textAlign: "center",
              lineHeight: "0.65in",
              border: "1.7px dashed #22c55e",
            }}>+</span>
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={e => {
                if (!e.target.files[0]) return;
                setPhotoFiles([...photoFiles, e.target.files[0]]);
              }}
            />
          </label>
        )}
      </Box>
    </Box>

    <Accordion
      expanded={showAdvanced}
      onChange={() => setShowAdvanced(!showAdvanced)}
      sx={{
        mb: 2,
        borderRadius: 1.2,
        boxShadow: 0,
        background: '#f9f9f9',
        border: '1px solid #ddd',
      }}
    >
      <AccordionSummary
        sx={{
          cursor: 'pointer',
          px: 1,
          py: 0,
          background: 'transparent',
          borderBottom: showAdvanced ? `1px solid #ddd` : 'none',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <span style={{
          display: 'inline-block',
          transition: 'transform 0.2s',
          transform: showAdvanced ? 'rotate(90deg)' : 'rotate(0deg)',
          fontSize: 12,
          marginRight: 8,
          fontWeight: 150,
          fontFamily: 'Geist',
          color: '#666',
        }}>▶</span>
        <Typography sx={{
          fontWeight: 150,
          fontFamily: 'Geist',
          fontSize: 14,
          color: '#333',
        }}>{t('more_details')}</Typography>
      </AccordionSummary>
      <AccordionDetails sx={{
        pt: 1,
        px: 1,
        background: '#fff',
        borderRadius: 1.2,
      }}>
        <FormControl fullWidth sx={{ mb: 1 }}>
          <Typography sx={{
            mb: 0.5,
            fontSize: 14,
            fontWeight: 125,
            fontFamily: 'Geist',
            color: '#333',
          }}>{t('brand')}</Typography>
          <TextField
            value={brand}
            onChange={e => setBrand(e.target.value)}
            placeholder={t('placeholder_brand')}
            fullWidth
            size="small"
            sx={{
              fontSize: 14,
              borderRadius: 1.2,
              background: '#f9f9f9',
            }}
          />
        </FormControl>
        <FormControl fullWidth sx={{ mb: 1 }}>
          <Typography sx={{
            mb: 0.5,
            fontWeight: 125,
            fontFamily: 'Geist',
            fontSize: 14,
            color: '#333',
          }}>{t('material')}</Typography>
          <TextField
            value={material}
            onChange={e => setMaterial(e.target.value)}
            placeholder={t('placeholder_material')}
            fullWidth
            size="small"
            sx={{
              fontSize: 14,
              borderRadius: 1.2,
              background: '#f9f9f9',
            }}
          />
        </FormControl>
        <FormControl fullWidth>
          <Typography sx={{
            mb: 0.5,
            fontSize: 14,
            fontWeight: 125,
            fontFamily: 'Geist',
            color: '#333',
          }}>{t('additional_info')}</Typography>
          <TextField
            value={additionalInfo}
            onChange={e => setAdditionalInfo(e.target.value)}
            placeholder={t('placeholder_additional_info')}
            fullWidth
            multiline
            minRows={2}
            sx={{
              fontSize: 14,
              borderRadius: 1.2,
              background: '#f9f9f9',
            }}
          />
        </FormControl>
      </AccordionDetails>
    </Accordion>

    {loading ? (
      <Box sx={{ width: '100%', height: 40 }}>
        <ProgressBarButton progress={progress} />
      </Box>
    ) : (
      <Button
        type="submit"
        variant="contained"
        fullWidth
        sx={{
          py: 1,
          fontSize: 14,
          borderRadius: 2,
          background: '#22c55e',
          color: '#fff',
          mt: 2,
          '&:hover': { background: '#15803d' },
        }}
      >
        {t('submit') || 'Submit'}
      </Button>
    )}
  </Box>
    </div>
  </Collapse>
    </Box>
  );
}
export default AddItem;
