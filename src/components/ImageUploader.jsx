import React, { useRef, useState } from 'react';
import { UploadCloud, X } from 'lucide-react';

export default function ImageUploader({ images, setImages, maxImages = 3, maxSizeMB = 3 }) {
  const fileInputRef = useRef(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    setError('');
    const files = Array.from(e.target.files);
    
    if (images.length + files.length > maxImages) {
      setError(`You can only upload up to ${maxImages} images.`);
      return;
    }

    const validFiles = [];
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed.');
        return;
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`Image size must be less than ${maxSizeMB}MB.`);
        return;
      }
      // Create preview URL
      file.preview = URL.createObjectURL(file);
      validFiles.push(file);
    }

    setImages([...images, ...validFiles]);
  };

  const removeImage = (index) => {
    const newImages = [...images];
    if (newImages[index].preview) {
      URL.revokeObjectURL(newImages[index].preview);
    }
    newImages.splice(index, 1);
    setImages(newImages);
  };

  return (
    <div className="image-uploader">
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        {images.map((img, idx) => (
          <div key={idx} style={{
            position: 'relative', width: 72, height: 72, borderRadius: 2, 
            overflow: 'hidden', border: '1px solid #2C2C26', background: '#1C1C17'
          }}>
            <img 
              src={img.preview || img.url} 
              alt="preview" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
            <button
              type="button"
              onClick={() => removeImage(idx)}
              style={{
                position: 'absolute', top: 4, right: 4, background: 'rgba(17,17,17,0.7)',
                border: 'none', color: '#fff', borderRadius: '50%', width: 20, height: 20,
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
              }}
            >
              <X size={12} />
            </button>
          </div>
        ))}
        {images.length < maxImages && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: 72, height: 72, borderRadius: 2, border: '1px dashed #6B6055',
              background: 'transparent', color: '#C9A96E', display: 'flex',
              flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'border-color 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9A96E'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#6B6055'; }}
          >
            <UploadCloud size={20} />
            <span style={{ fontSize: 10, marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>Upload</span>
          </button>
        )}
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg, image/png, image/webp"
        multiple
        style={{ display: 'none' }}
      />
      {error && <p style={{ fontSize: 12, color: '#C0392B', fontFamily: "'DM Sans', sans-serif" }}>{error}</p>}
      <p style={{ fontSize: 11, color: '#6B6055', fontFamily: "'DM Sans', sans-serif", marginTop: 4 }}>
        Max {maxImages} images, {maxSizeMB}MB each. JPG, PNG, WEBP.
      </p>
    </div>
  );
}
