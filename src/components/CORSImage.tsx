import React, { useState, useEffect } from 'react';

export const getImageUrl = (nft: any) => {
  // Try different image sources in order of preference
  const imageSources = [
    nft.image_url,
    nft.image,
    nft.image_url_shrunk,
    nft.old_image_url
  ].filter(Boolean);
  return imageSources[0] || '';
};

// CORS-friendly image component
export const CORSImage: React.FC<{ src: string; alt: string; style?: React.CSSProperties }> = ({ src, alt, style }) => {
  const [imageSrc, setImageSrc] = useState(src);
  const [showFallback, setShowFallback] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Reset when src changes
  useEffect(() => {
    setImageSrc(src);
    setShowFallback(false);
    setRetryCount(0);
  }, [src]);

  const handleError = () => {
    if (retryCount === 0) {
      // First retry: try without crossOrigin
      setImageSrc(src);
      setRetryCount(1);
    } else if (retryCount === 1) {
      // Second retry: try with a different proxy
      setImageSrc(`https://images.weserv.nl/?url=${encodeURIComponent(src)}`);
      setRetryCount(2);
    } else {
      // Final fallback
      setShowFallback(true);
    }
  };

  if (showFallback) {
    return (
      <div 
        style={{ 
          ...style,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          color: '#666',
          backgroundColor: '#f0f0f0',
          width: style?.width || '100%',
          height: style?.height || '150px',
        }}
      >
        Image not available
      </div>
    );
  }

  return (
    <img 
      src={imageSrc}
      alt={alt}
      style={style}
      crossOrigin={retryCount === 0 ? "anonymous" : undefined}
      onError={handleError}
    />
  );
}; 