import React, { useRef, useState } from "react";
import { LuUser, LuUpload, LuTrash, LuCamera } from "react-icons/lu";

const ProfilePhotoSelector = ({ image, setImage, preview, setPreview }) => {
  const inputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImage(file);

      const preview = URL.createObjectURL(file);
      if (setPreview) {
        setPreview(preview);
      }
      setPreviewUrl(preview);
    }
  };

  const handleRemoveImage = (e) => {
    e.stopPropagation();
    setImage(null);
    setPreviewUrl(null);
    if (setPreview) {
      setPreview(null);
    }
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const onChooseFile = () => {
    inputRef.current?.click();
  };

  const currentPreview = preview || previewUrl;

  return (
    <div className="flex justify-center mb-6">
      <input
        type="file"
        accept="image/*"
        ref={inputRef}
        onChange={handleImageChange}
        className="hidden"
      />

      {!image && !currentPreview ? (
        <div 
          onClick={onChooseFile}
          className="w-24 h-24 flex flex-col items-center justify-center bg-[var(--color-surface)] border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-accent)] rounded-full relative cursor-pointer group transition-all duration-200 shadow-xs hover:shadow-md"
        >
          <div className="w-10 h-10 rounded-full bg-[var(--color-bg)] flex items-center justify-center text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)] transition-colors">
            <LuUser className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-medium text-[var(--color-text-muted)] mt-1 group-hover:text-[var(--color-accent)] transition-colors">
            Add Photo
          </span>

          <button
            type="button"
            className="w-7 h-7 flex items-center justify-center bg-[var(--color-accent)] text-white rounded-full absolute bottom-0 right-0 shadow-md ring-2 ring-[var(--color-surface)] group-hover:scale-110 transition-transform"
            onClick={(e) => {
              e.stopPropagation();
              onChooseFile();
            }}
            title="Upload photo"
          >
            <LuUpload className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div 
          onClick={onChooseFile}
          className="relative w-24 h-24 rounded-full cursor-pointer group"
        >
          <img
            src={currentPreview}
            alt="profile photo"
            className="w-24 h-24 rounded-full object-cover border-2 border-[var(--color-border)] shadow-md bg-[var(--color-surface)] transition-all duration-200 group-hover:border-[var(--color-accent)]"
          />
          
          {/* Subtle Hover overlay */}
          <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
            <LuCamera className="w-5 h-5" />
          </div>

          <button
            type="button"
            className="w-7 h-7 flex items-center justify-center bg-rose-500 hover:bg-rose-600 text-white rounded-full absolute bottom-0 right-0 shadow-md ring-2 ring-[var(--color-surface)] hover:scale-110 transition-transform z-10"
            onClick={handleRemoveImage}
            title="Remove photo"
          >
            <LuTrash className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfilePhotoSelector;
