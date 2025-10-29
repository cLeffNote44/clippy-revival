import React from 'react';
import PropTypes from 'prop-types';
import { Box, CircularProgress, Typography } from '@mui/material';

/**
 * Loading spinner component with optional message
 */
const LoadingSpinner = ({ message, size, fullScreen }) => {
  const content = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        ...(fullScreen && {
          minHeight: '100vh',
          width: '100%'
        })
      }}
    >
      <CircularProgress size={size} />
      {message && (
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      )}
    </Box>
  );

  return content;
};

LoadingSpinner.propTypes = {
  message: PropTypes.string,
  size: PropTypes.number,
  fullScreen: PropTypes.bool
};

LoadingSpinner.defaultProps = {
  message: null,
  size: 40,
  fullScreen: false
};

export default LoadingSpinner;
