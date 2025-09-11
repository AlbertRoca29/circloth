import React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";

export default function ProgressBarButton({ progress = 0, children, sx = {}, ...props }) {
  const pct = Math.max(0, Math.min(100, progress));
  return (
    <Button
      variant="contained"
      fullWidth
      disableElevation
      sx={{
        position: 'relative',
        py: 1,
        fontSize: 14,
        borderRadius: 2,
        background: '#22c55e',
        color: '#fff',
        textTransform: 'none',
        overflow: 'hidden',
        '&:hover': { background: '#15803d' },
        ...sx
      }}
      {...props}
    >
      <Box sx={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${pct}%`, background: '#166232', transition: 'width 0.25s ease', zIndex: 1 }} />
      <Box sx={{ position: 'relative', zIndex: 2, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </Box>
    </Button>
  );
}
