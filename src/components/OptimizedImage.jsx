import { useState, useEffect, useRef, useCallback } from "react";
import { Box, Skeleton } from "@mui/material";
import PropTypes from "prop-types";

// Create a persistent cache for images that persists between renders
const imageCache = new Map();

// Function to preload common images
const preloadImage = (url) => {
  if (!url || imageCache.has(url)) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = url;
    img.onload = () => {
      imageCache.set(url, url);
      resolve(url);
    };
    img.onerror = reject;
  });
};

// Preload common images for faster rendering
const preloadImages = (urls) => {
  if (!urls || !Array.isArray(urls)) return;
  urls.forEach((url) => preloadImage(url));
};

// Preload the logo (WebP version) and placeholder image
preloadImages([
  "/nutribyte_logo.webp",
  "/placeholder_feature_image.webp",
  "/hero_image.webp",
  "/nutribyte_favicon.png",
]);

/**
 * Optimized image component with lazy loading, caching, and fallback
 *
 * @param {Object} props Component props
 * @param {string} props.src Image source URL
 * @param {string} props.alt Image alt text
 * @param {Object} props.sx MUI styling object
 * @param {string} props.fallbackSrc Optional fallback image source
 * @param {Object} props.imgProps Additional img element props
 * @param {boolean} props.priority Whether this image should load with priority (no lazy loading)
 * @param {number} props.width Optional explicit width in pixels
 * @param {number} props.height Optional explicit height in pixels
 * @returns {JSX.Element} The image component
 */
const OptimizedImage = ({
  src,
  alt,
  sx = {},
  fallbackSrc = "/placeholder_feature_image.webp",
  priority = false,
  width,
  height,
  ...imgProps
}) => {
  // Automatically use WebP if available (for images in our control)
  let webpSrc = src;
  if (src?.includes(".png")) {
    webpSrc = src.replace(".png", ".webp");
  } else if (src?.includes(".jpg") || src?.includes(".jpeg")) {
    webpSrc = src.replace(/\.(jpg|jpeg)$/, ".webp");
  }
  const [loading, setLoading] = useState(!imageCache.has(webpSrc || src));
  const [imgSrc, setImgSrc] = useState(
    imageCache.get(webpSrc || src) || webpSrc || src
  );
  const imageRef = useRef(null);
  const observerRef = useRef(null);

  // Error handler callback
  const handleImageError = useCallback(() => {
    setLoading(false);
    setImgSrc(fallbackSrc);
  }, [fallbackSrc]);

  // Load success handler callback
  const handleImageLoad = useCallback(() => {
    setLoading(false);
    // Cache the successful image load
    if (!imageCache.has(src)) {
      imageCache.set(src, src);
    }
  }, [src]);

  // Load the image
  const loadImage = useCallback(
    (imageSrc) => {
      if (imageCache.has(imageSrc)) {
        setLoading(false);
        return;
      }

      preloadImage(imageSrc)
        .then(() => handleImageLoad())
        .catch(() => handleImageError());
    },
    [handleImageLoad, handleImageError]
  );

  // Setup and cleanup intersection observer
  useEffect(() => {
    // Reset state when src changes
    const sourceSrc = webpSrc || src;
    setImgSrc(imageCache.get(sourceSrc) || sourceSrc);
    if (!imageCache.has(sourceSrc)) {
      setLoading(true);
    } else {
      setLoading(false);
      return; // Image already in cache, no need to observe or load
    }

    // Priority images load immediately
    if (priority) {
      loadImage(webpSrc || src);
      return;
    }

    // For non-priority images, use intersection observer
    if (imageRef.current && "IntersectionObserver" in window) {
      // Cleanup previous observer if it exists
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      // Create new observer
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            loadImage(webpSrc || src);
            observerRef.current.disconnect();
          }
        },
        { rootMargin: "200px", threshold: 0.1 } // Start loading when 20% visible and within 200px of viewport
      );

      observerRef.current.observe(imageRef.current);
    } else {
      // Fallback for browsers without IntersectionObserver
      loadImage(src);
    }

    // Cleanup function
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [src, webpSrc, priority, loadImage]);

  return (
    <Box position="relative" sx={{ ...sx }}>
      {loading && (
        <Skeleton
          variant="rectangular"
          animation="wave"
          width={width || "100%"}
          height={height || "100%"}
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
          }}
        />
      )}
      <picture>
        {/* If source is PNG/JPG and we have a WebP version available */}
        {(imgSrc?.includes(".png") ||
          imgSrc?.includes(".jpg") ||
          imgSrc?.includes(".jpeg")) && (
          <source
            srcSet={imgSrc.replace(/\.(png|jpg|jpeg)$/, ".webp")}
            type="image/webp"
          />
        )}
        <img
          ref={imageRef}
          src={imgSrc}
          alt={alt || "Image"}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading={priority ? "eager" : "lazy"}
          width={width}
          height={height}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          style={{
            width: width ? "auto" : "100%",
            height: height ? "auto" : "100%",
            objectFit: "cover",
            visibility: loading ? "hidden" : "visible",
            transition: "opacity 0.3s ease-in-out",
            opacity: loading ? 0 : 1,
          }}
          {...imgProps}
        />
      </picture>
    </Box>
  );
};

// PropTypes validation
OptimizedImage.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string,
  sx: PropTypes.object,
  fallbackSrc: PropTypes.string,
  priority: PropTypes.bool,
  width: PropTypes.number,
  height: PropTypes.number,
  imgProps: PropTypes.object,
};

export default OptimizedImage;
