
import { Box, Typography, Container } from '@mui/material';


import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';

export default function PrivacyPolicy() {
  const [text, setText] = useState('');

  useEffect(() => {
    fetch(process.env.PUBLIC_URL + '/PrivacyPolicy.md')
      .then(res => res.text())
      .then(setText)
      .catch(() => setText('Could not load privacy policy.'));
  }, []);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box>
        <Typography variant="h4" gutterBottom>
          Privacy Policy
        </Typography>
        <Box sx={{ mt: 2 }}>
          <ReactMarkdown>{text}</ReactMarkdown>
        </Box>
      </Box>
    </Container>
  );
}
