import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { FiUploadCloud, FiFile, FiX, FiCheck } from 'react-icons/fi';

export default function FileUpload({ onFileSelect, isUploading }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
        onFileSelect(file);
      }
    }
  }, [onFileSelect]);

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      onFileSelect(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    onFileSelect(null);
  };

  return (
    <div className="w-full">
      {!selectedFile ? (
        <motion.label
          htmlFor="file-upload"
          className={`relative flex flex-col items-center justify-center w-full py-12 px-6 rounded-2xl cursor-pointer transition-all duration-300
            ${dragActive
              ? 'bg-primary/10 border-2 border-primary border-dashed scale-[1.02]'
              : 'glass border-2 border-dashed border-white/10 hover:border-primary/50 hover:bg-primary/5'
            }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <motion.div
            className="flex flex-col items-center gap-4"
            animate={dragActive ? { scale: 1.1 } : { scale: 1 }}
          >
            <div className={`p-4 rounded-2xl ${dragActive ? 'bg-primary/20' : 'bg-surface-light'}`}>
              <FiUploadCloud className={`w-10 h-10 ${dragActive ? 'text-primary' : 'text-text-muted'}`} />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-text">
                {dragActive ? 'Drop your PDF here' : 'Drag & drop your PDF here'}
              </p>
              <p className="text-sm text-text-muted mt-1">
                or <span className="text-primary font-medium">browse files</span>
              </p>
            </div>
            <p className="text-xs text-text-muted/60">
              Supports PDF files up to 10MB
            </p>
          </motion.div>
          <input
            id="file-upload"
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handleFileInput}
          />
        </motion.label>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/15">
                <FiFile className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-text font-medium text-sm truncate max-w-[260px]">
                  {selectedFile.name}
                </p>
                <p className="text-text-muted text-xs mt-0.5">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isUploading ? (
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <div className="p-1.5 rounded-full bg-risk-low/20">
                  <FiCheck className="w-4 h-4 text-risk-low" />
                </div>
              )}
              <button
                onClick={removeFile}
                className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                disabled={isUploading}
              >
                <FiX className="w-4 h-4 text-text-muted" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
