import React, { useState, useRef } from 'react';
import './bulk-enroll-modal.css';

const BulkEnrollModal = ({ isOpen, onClose, onFileUpload }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState('No file chosen');
  const [errorText, setErrorText] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const isCsv = /\.csv$/i.test(file.name);
      if (!isCsv) {
        setSelectedFile(null);
        setFileName('No file chosen');
        setErrorText('Please upload a CSV file. Excel files (.xlsx/.xls) are not supported.');
        return;
      }
      setErrorText('');
      setSelectedFile(file);
      setFileName(file.name);
    }
  };

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = () => {
    if (!selectedFile) {
      setErrorText('Please choose a CSV file before uploading.');
      return;
    }
    if (selectedFile && onFileUpload) {
      onFileUpload(selectedFile);
      onClose();
    }
  };

  const handleDownloadFormat = () => {
    // Create a sample CSV content
    const csvContent = 'Name,Email,Phone,Class,School Name\nJohn Doe,john@example.com,1234567890,Grade 5,ABC School\nJane Smith,jane@example.com,0987654321,Grade 6,XYZ School';
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'student_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    setSelectedFile(null);
    setFileName('No file chosen');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="bulk-enroll-modal-overlay" onClick={handleClose}>
      <div className="bulk-enroll-modal" onClick={(e) => e.stopPropagation()}>
        <div className="bulk-enroll-modal-header">
          <h3>Import Students</h3>
        </div>
        
        <div className="bulk-enroll-modal-content">
          <div className="file-upload-section">
            <button 
              className="choose-files-button"
              onClick={handleChooseFile}
            >
              Choose files
            </button>
            <span className="file-name-text">{fileName}</span>
          </div>
          {errorText ? (
            <div style={{ color: '#b00020', marginTop: -12, marginBottom: 12, textAlign: 'center' }}>{errorText}</div>
          ) : null}
          
          <div className="download-format-section">
            <button 
              className="download-format-button"
              onClick={handleDownloadFormat}
            >
              Download Format
            </button>
          </div>
        </div>
        
        <div className="bulk-enroll-modal-footer">
          <button className="cancel-button" onClick={handleClose}>
            Cancel
          </button>
          <button 
            className="upload-button" 
            onClick={handleUpload}
            disabled={!selectedFile}
          >
            Upload
          </button>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
};

export default BulkEnrollModal;
