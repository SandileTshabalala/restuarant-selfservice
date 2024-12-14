import React, { useState, useEffect } from 'react';

const LazyImage = ({ src, alt, className, fallbackSrc }) => {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);

  useEffect(() => {
    // Reset states when src changes
    setError(false);
    setLoaded(false);
    setImageSrc(null);

    // Create a new image object
    const img = new Image();
    img.src = src;

    // Preload the image
    img.onload = () => {
      setImageSrc(src);
      setLoaded(true);
    };

    img.onerror = () => {
      setError(true);
      setImageSrc(fallbackSrc);
      setLoaded(true);
    };

    // Cleanup
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, fallbackSrc]);

  return (
    <div className={`relative ${className}`}>
      {/* Show skeleton loader while loading */}
      {!loaded && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse">
          <div className="w-full h-full bg-gradient-to-r from-gray-100 to-gray-200" />
        </div>
      )}
      
      {/* Show image once loaded */}
      {imageSrc && (
        <img
          src={imageSrc}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
          loading="lazy"
          decoding="async"
        />
      )}
    </div>
  );
};

export default LazyImage;
