import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';

const CharacterAvatar = ({ 
  pack, 
  state = 'idle', 
  onAnimationComplete,
  style = {}
}) => {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const animationRef = useRef(null);
  const containerRef = useRef(null);

  const animation = pack?.animations?.[state] || pack?.animations?.idle;

  useEffect(() => {
    if (!animation) return;

    // Reset state when animation changes
    let mounted = true;
    
    // Use microtask to avoid cascading render within effect
    queueMicrotask(() => {
      if (mounted) {
        setIsLoaded(false);
        setCurrentFrame(0);
      }
    });

    // Handle sprite sheet animation
    if (animation.type === 'spriteSheet') {
      const frameDuration = 1000 / animation.fps;
      let frame = 0;

      // Preload sprite sheet
      const img = new Image();
      img.onload = () => {
        if (mounted) setIsLoaded(true);
      };
      img.src = `character-packs/${pack.id}/${animation.spriteSheet}`;

      const animate = () => {
        frame = (frame + 1) % animation.frames;
        setCurrentFrame(frame);

        if (!animation.loop && frame === animation.frames - 1) {
          onAnimationComplete?.();
        } else {
          animationRef.current = setTimeout(animate, frameDuration);
        }
      };

      animationRef.current = setTimeout(animate, frameDuration);

      return () => {
        mounted = false;
        if (animationRef.current) {
          clearTimeout(animationRef.current);
        }
      };
    }

    // Handle frame-based animation
    if (animation.type === 'frames') {
      let frameIndex = 0;
      
      // Preload all frames
      Promise.all(
        animation.frames.map(frame => {
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = `character-packs/${pack.id}/${frame.image}`;
          });
        })
      ).then(() => {
        if (mounted) setIsLoaded(true);
      });

      const animate = () => {
        const currentFrameData = animation.frames[frameIndex];
        setCurrentFrame(frameIndex);

        frameIndex = (frameIndex + 1) % animation.frames.length;

        if (!animation.loop && frameIndex === 0) {
          onAnimationComplete?.();
        } else {
          animationRef.current = setTimeout(animate, currentFrameData.duration);
        }
      };

      animationRef.current = setTimeout(animate, animation.frames[0].duration);

      return () => {
        mounted = false;
        if (animationRef.current) {
          clearTimeout(animationRef.current);
        }
      };
    }
  }, [animation, pack, onAnimationComplete, state]);

  if (!pack || !animation) {
    return (
      <div 
        style={{
          ...style,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.5
        }}
      >
        No character loaded
      </div>
    );
  }

  const containerStyle = {
    width: pack.display.width,
    height: pack.display.height,
    position: 'relative',
    overflow: 'hidden',
    ...style
  };

  // Render sprite sheet animation
  if (animation.type === 'spriteSheet') {
    const direction = animation.direction || 'horizontal';
    const xOffset = direction === 'horizontal' 
      ? -(currentFrame * animation.frameWidth)
      : 0;
    const yOffset = direction === 'vertical'
      ? -(currentFrame * animation.frameHeight)
      : 0;

    return (
      <div ref={containerRef} style={containerStyle}>
        <div
          style={{
            width: animation.frameWidth,
            height: animation.frameHeight,
            backgroundImage: `url(character-packs/${pack.id}/${animation.spriteSheet})`,
            backgroundPosition: `${xOffset}px ${yOffset}px`,
            backgroundRepeat: 'no-repeat',
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out',
            imageRendering: 'pixelated' // Preserve pixel art sharpness
          }}
        />
      </div>
    );
  }

  // Render frame-based animation
  if (animation.type === 'frames') {
    const currentFrameData = animation.frames[currentFrame];

    return (
      <div ref={containerRef} style={containerStyle}>
        <img
          src={`character-packs/${pack.id}/${currentFrameData.image}`}
          alt={`${pack.name} - ${state}`}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out',
            imageRendering: 'pixelated'
          }}
        />
      </div>
    );
  }

  return null;
};

CharacterAvatar.propTypes = {
  pack: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    display: PropTypes.shape({
      width: PropTypes.number.isRequired,
      height: PropTypes.number.isRequired,
      anchorX: PropTypes.number,
      anchorY: PropTypes.number
    }).isRequired,
    animations: PropTypes.object.isRequired
  }),
  state: PropTypes.string,
  onAnimationComplete: PropTypes.func,
  style: PropTypes.object
};

export default CharacterAvatar;
