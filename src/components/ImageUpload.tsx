'use client';

import { useState } from 'react';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label: string;
}

export default function ImageUpload({ value, onChange, label }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          const MAX_SIZE = 1920;

          const canvas = document.createElement('canvas');
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);
          }

          canvas.toBlob((blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
                type: 'image/webp',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          }, 'image/webp', 0.8); // Set to 0.8 (80%) as recommended for PageSpeed optimization
        };
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const originalFile = e.target.files?.[0];
    if (!originalFile) return;

    setUploading(true);
    
    try {
      // Compress before upload
      const file = await compressImage(originalFile);
      
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || data.error || `Server responded with ${res.status}`);
      }

      if (data.url) {
        onChange(data.url);
      } else {
        throw new Error('Server did not return image URL');
      }
    } catch (error: any) {
      console.error('Upload component error:', error);
      alert('Lỗi khi tải ảnh lên! \n\nChi tiết: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="form-group">
      <label>{label}</label>
      <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginTop: '8px' }}>
        {value && (
          <img 
            src={value} 
            alt="Preview" 
            style={{ width: '60px', height: '60px', objectFit: 'contain', borderRadius: '8px', border: '1px solid var(--border)', background: 'white' }} 
          />
        )}
        <div style={{ position: 'relative', flex: 1 }}>
          <input 
            type="file" 
            onChange={handleFileChange} 
            accept="image/*"
            style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer', zIndex: 2 }}
          />
          <div style={{ 
            padding: '10px 20px', 
            background: 'var(--primary)', 
            color: 'white', 
            borderRadius: '8px', 
            textAlign: 'center',
            fontSize: '14px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            {uploading ? '⌛ Đang tải...' : '🖼️ Chọn file từ máy tính'}
          </div>
        </div>
      </div>
      <input 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        placeholder="Hoặc nhập link ảnh trực tiếp tại đây..."
        style={{ marginTop: '10px', fontSize: '12px' }}
      />
    </div>
  );
}
