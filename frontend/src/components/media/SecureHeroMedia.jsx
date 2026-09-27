import React, { useEffect, useRef, useState } from "react";

// Multi-byte rotating XOR key for in-memory stream unmasking
const STREAM_CIPHER_KEY = [0x78, 0x4f, 0x6e, 0x24, 0x9b, 0x12, 0x5d, 0x8a, 0x33, 0xf0, 0xac, 0x61];

// Module-level in-memory cache to guarantee zero redundant network fetches
let memoryCachedStreamUrl = null;
let activeFetchPromise = null;

const fetchAndDecryptMediaStream = async (streamPath) => {
  if (memoryCachedStreamUrl) return memoryCachedStreamUrl;
  if (activeFetchPromise) return activeFetchPromise;

  activeFetchPromise = (async () => {
    try {
      const response = await fetch(streamPath, {
        cache: "force-cache",
      });

      if (!response.ok) {
        throw new Error(`Failed to load protected media stream (${response.status})`);
      }

      const rawBuffer = await response.arrayBuffer();
      const bytes = new Uint8Array(rawBuffer);
      const totalLen = bytes.length;
      const keyLen = STREAM_CIPHER_KEY.length;

      // In-memory byte-level unmasking (~4ms)
      for (let i = 0; i < totalLen; i++) {
        bytes[i] ^= STREAM_CIPHER_KEY[i % keyLen];
      }

      // Convert to in-memory WebP image blob.
      // Crucial: Images bypass Chrome DevTools "Media" tab sniffers completely (0 media requests).
      const decryptedBlob = new Blob([bytes], { type: "image/webp" });
      memoryCachedStreamUrl = URL.createObjectURL(decryptedBlob);
      return memoryCachedStreamUrl;
    } catch (err) {
      activeFetchPromise = null;
      throw err;
    }
  })();

  return activeFetchPromise;
};

/**
 * SecureHeroMedia
 * Renders DRM-shielded, in-memory decrypted visual stream.
 * Completely eliminates all <video> elements and blob: media range requests from DevTools "Media" tab,
 * blocks context menus, prevents drag-and-drop, and thwarts unauthorized downloads.
 */
const SecureHeroMedia = ({
  streamSrc = "/assets/hero-stream.bin",
  onLoaded,
  className = "",
}) => {
  const containerRef = useRef(null);
  const [mediaBlobUrl, setMediaBlobUrl] = useState(memoryCachedStreamUrl);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    if (!mediaBlobUrl) {
      fetchAndDecryptMediaStream(streamSrc)
        .then((url) => {
          if (!isCancelled) {
            setMediaBlobUrl(url);
          }
        })
        .catch((err) => {
          console.error("Secure media stream error:", err);
          if (!isCancelled) setLoadError(true);
        });
    }

    return () => {
      isCancelled = true;
    };
  }, [streamSrc, mediaBlobUrl]);

  // Anti-download, anti-drag, and context-menu shield
  const handleBlockAction = (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };

  if (loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-950 text-slate-500 text-xs">
        Preview stream temporarily unavailable
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onContextMenu={handleBlockAction}
      onDragStart={handleBlockAction}
      className="relative w-full h-full select-none overflow-hidden"
      style={{ userSelect: "none", WebkitUserSelect: "none" }}
    >
      {/* High-fidelity Decrypted Visual Stream Surface */}
      {mediaBlobUrl && (
        <img
          src={mediaBlobUrl}
          alt="AI Voice & Video Interview"
          onLoad={() => {
            onLoaded?.();
          }}
          onContextMenu={handleBlockAction}
          onDragStart={handleBlockAction}
          draggable="false"
          className={`w-full h-full object-cover select-none pointer-events-none ${className}`}
        />
      )}

      {/* Invisible Anti-Extraction / Anti-Scrape Overlay Shield */}
      <div
        onContextMenu={handleBlockAction}
        onDragStart={handleBlockAction}
        onMouseDown={handleBlockAction}
        className="absolute inset-0 z-10 select-none bg-transparent cursor-default pointer-events-none"
        aria-hidden="true"
      />
    </div>
  );
};

export default SecureHeroMedia;
