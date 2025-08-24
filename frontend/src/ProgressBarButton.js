import React from "react";
import Box from "@mui/material/Box";

export default function ProgressBarButton({ progress = 0, children, ...props }) {
  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
        borderRadius: 3,
        overflow: "hidden",
        background: "#e0e0e0"
      }}
    >
      <Box
        sx={{
          position: "absolute",
          left: 0,
          top: 0,
          height: "100%",
          width: `${progress}%`,
          background: "#22c55e",
          transition: "width 0.3s",
          zIndex: 1
        }}
      />
      <Box
        sx={{
          position: "relative",
          zIndex: 2,
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: progress < 50 ? "#222" : "#fff",
          fontWeight: 500
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
