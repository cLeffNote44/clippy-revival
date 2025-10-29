import React from 'react';
import PropTypes from 'prop-types';
import { Box, Skeleton, Card, CardContent } from '@mui/material';

/**
 * Skeleton loaders for different content types
 */

// Dashboard metric card skeleton
export const MetricCardSkeleton = React.memo(() => (
  <Card>
    <CardContent>
      <Skeleton variant="text" width="60%" height={24} />
      <Skeleton variant="text" width="40%" height={48} sx={{ mt: 1 }} />
      <Skeleton variant="text" width="80%" height={20} sx={{ mt: 1 }} />
    </CardContent>
  </Card>
));

// List item skeleton (for character packs, files, etc.)
export const ListItemSkeleton = React.memo(({ count }) => (
  <Box>
    {Array.from({ length: count }).map((_, index) => (
      <Box
        key={index}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          p: 2,
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Skeleton variant="circular" width={40} height={40} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="60%" height={24} />
          <Skeleton variant="text" width="40%" height={20} />
        </Box>
        <Skeleton variant="rectangular" width={80} height={32} />
      </Box>
    ))}
  </Box>
));

ListItemSkeleton.propTypes = {
  count: PropTypes.number
};

ListItemSkeleton.defaultProps = {
  count: 3
};

// Chart skeleton
export const ChartSkeleton = React.memo(() => (
  <Box sx={{ p: 2 }}>
    <Skeleton variant="text" width="40%" height={32} sx={{ mb: 2 }} />
    <Skeleton variant="rectangular" width="100%" height={300} />
  </Box>
));

// Settings form skeleton
export const SettingsFormSkeleton = React.memo(() => (
  <Box sx={{ p: 2 }}>
    <Skeleton variant="text" width="30%" height={32} sx={{ mb: 3 }} />
    {Array.from({ length: 4 }).map((_, index) => (
      <Box key={index} sx={{ mb: 3 }}>
        <Skeleton variant="text" width="20%" height={24} sx={{ mb: 1 }} />
        <Skeleton variant="rectangular" width="100%" height={56} />
      </Box>
    ))}
    <Skeleton variant="rectangular" width={120} height={40} sx={{ mt: 2 }} />
  </Box>
));

// Character pack card skeleton
export const CharacterCardSkeleton = React.memo(({ count }) => (
  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 2 }}>
    {Array.from({ length: count }).map((_, index) => (
      <Card key={index}>
        <Skeleton variant="rectangular" width="100%" height={200} />
        <CardContent>
          <Skeleton variant="text" width="70%" height={28} />
          <Skeleton variant="text" width="50%" height={20} sx={{ mt: 1 }} />
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <Skeleton variant="rectangular" width={80} height={32} />
            <Skeleton variant="rectangular" width={80} height={32} />
          </Box>
        </CardContent>
      </Card>
    ))}
  </Box>
));

CharacterCardSkeleton.propTypes = {
  count: PropTypes.number
};

CharacterCardSkeleton.defaultProps = {
  count: 3
};

export default {
  MetricCardSkeleton,
  ListItemSkeleton,
  ChartSkeleton,
  SettingsFormSkeleton,
  CharacterCardSkeleton
};
