/* eslint-disable react/prop-types */

export default function FileInput({ 
  label, 
  file, 
  setFile, 
  inputRef, 
  accept = ".csv,.txt",
  required = false,
  onFileRemove
}) {
  const handleFileChange = (e) => {
    if (e.target.files[0]) setFile(e.target.files[0]);
  };

  const removeFile = (e) => {
    e.stopPropagation();
    setFile(null);
    if (onFileRemove) onFileRemove();
  };

  return (
    <div className="file-input-wrapper">
      {file ? (
        <div className="file-input-selected">
          <span className="file-input-icon">📄</span>
          <div className="file-input-filename">{file.name}</div>
          <div className="file-input-size">
            {(file.size / 1024).toFixed(1)} Ko
          </div>
          <button
            className="file-input-remove"
            onClick={removeFile}
          >
            ✕ Retirer
          </button>
        </div>
      ) : (
        <div className="file-input-empty">
          <button
            className="file-input-button"
            onClick={() => inputRef.current.click()}
          >
            <div className="file-input-label">{label}</div>
            <div className="file-input-formats">
               {required && <span style={{ color: "#ef4444" }}>*</span>}
            </div>
          </button>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
    </div>
  );
}