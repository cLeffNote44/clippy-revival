import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { useAppStore } from '../store/appStore';
import CharacterAvatar from '../components/CharacterAvatar';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:43110';

// Temporary Clippy SVG as a placeholder
const ClippySVG = ({ state = 'idle' }) => (
  <svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    {/* Simple Clippy placeholder */}
    <g transform={state === 'wave' ? 'rotate(-10 60 60)' : ''}>
      {/* Body */}
      <path 
        d="M 40 30 Q 40 20 50 20 L 70 20 Q 80 20 80 30 L 80 80 Q 80 90 70 90 L 50 90 Q 40 90 40 80 Z" 
        fill="#FFD700"
        stroke="#B8860B"
        strokeWidth="2"
      />
      
      {/* Eyes */}
      <circle cx="50" cy="40" r="8" fill="white" />
      <circle cx="70" cy="40" r="8" fill="white" />
      <circle 
        cx={state === 'think' ? '52' : '50'} 
        cy="40" 
        r="4" 
        fill="black"
        style={{
          animation: state === 'think' ? 'think 2s infinite' : 'none'
        }}
      />
      <circle 
        cx={state === 'think' ? '68' : '70'} 
        cy="40" 
        r="4" 
        fill="black"
        style={{
          animation: state === 'think' ? 'think 2s infinite' : 'none'
        }}
      />
      
      {/* Eyebrows */}
      {state === 'think' && (
        <>
          <path d="M 45 32 L 55 30" stroke="black" strokeWidth="2" fill="none" />
          <path d="M 65 30 L 75 32" stroke="black" strokeWidth="2" fill="none" />
        </>
      )}
      
      {/* Paper clip wire */}
      <path 
        d="M 35 35 Q 30 30 30 25 Q 30 15 40 15 L 45 15" 
        fill="none" 
        stroke="#B8860B" 
        strokeWidth="3"
        strokeLinecap="round"
      />
      
      {/* Mouth */}
      {state === 'speak' ? (
        <ellipse cx="60" cy="65" rx="8" ry="6" fill="black" />
      ) : (
        <path 
          d={state === 'idle' ? 'M 50 60 Q 60 65 70 60' : 'M 50 65 Q 60 60 70 65'}
          fill="none" 
          stroke="black" 
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}
    </g>
    
    <style>{`
      @keyframes think {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(2px); }
        75% { transform: translateX(-2px); }
      }
    `}</style>
  </svg>
);

function BuddyWindow() {
  const { characterState, assistantPaused } = useAppStore();
  const [isDragging, setIsDragging] = useState(false);
  const [clickThrough, setClickThrough] = useState(false);
  const [characterPack, setCharacterPack] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load active character pack
    const loadCharacter = async () => {
      try {
        const activeId = localStorage.getItem('activeCharacterPack') || 'clippy-classic';
        const response = await axios.get(`${API_BASE}/characters/${activeId}`);
        setCharacterPack(response.data);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to load character:', err);
        // Fall back to placeholder on error
      } finally {
        setLoading(false);
      }
    };

    loadCharacter();

    // Listen for character changes
    const handleCharacterChange = () => {
      loadCharacter();
    };
    window.addEventListener('characterChanged', handleCharacterChange);

    return () => {
      window.removeEventListener('characterChanged', handleCharacterChange);
    };
  }, []);

  useEffect(() => {
    // Make window draggable    
    const handleMouseDown = (e) => {
      if (e.target.closest('.character-container')) {
        setIsDragging(true);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const handleDoubleClick = () => {
      // Toggle click-through mode
      const newClickThrough = !clickThrough;
      setClickThrough(newClickThrough);
      
      if (window.electronAPI) {
        window.electronAPI.setBuddyClickThrough(newClickThrough);
      }
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('dblclick', handleDoubleClick);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('dblclick', handleDoubleClick);
    };
  }, [clickThrough]);

  return (
    <Box 
      className="character-container"
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: isDragging ? 'grabbing' : 'grab',
        opacity: clickThrough ? 0.5 : (assistantPaused ? 0.7 : 1),
        transition: 'opacity 0.3s',
        userSelect: 'none',
        WebkitAppRegion: 'drag',
        position: 'relative',
      }}
    >
      {loading ? (
        <Box sx={{ color: 'white', fontSize: 12 }}>Loading...</Box>
      ) : characterPack ? (
        <CharacterAvatar 
          pack={characterPack} 
          state={characterState || 'idle'}
        />
      ) : (
        <ClippySVG state={characterState || 'idle'} />
      )}
      
      {/* Status indicator */}
      {assistantPaused && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 10,
            right: 10,
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: 'orange',
            animation: 'pulse 2s infinite',
          }}
        />
      )}
      
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        
        body {
          margin: 0;
          padding: 0;
          overflow: hidden;
          background: transparent;
        }
      `}</style>
    </Box>
  );
}

export default BuddyWindow;