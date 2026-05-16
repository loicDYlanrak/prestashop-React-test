/* eslint-disable react/prop-types */

export default function FileSummary({ file1, file2, file3, zipFile }) {
  return (
    <div className="export-summary" style={{ marginTop: "16px" }}>
      <div className="export-summary-row">
        <span> Fichier 1:</span>
        <strong>{file1 ? file1.name : "Non sélectionné"}</strong>
      </div>
      <div className="export-summary-row">
        <span> Fichier 2:</span>
        <strong>{file2 ? file2.name : "Non sélectionné"}</strong>
      </div>
      <div className="export-summary-row">
        <span> Fichier 3:</span>
        <strong>{file3 ? file3.name : "Non sélectionné"}</strong>
      </div>
      <div className="export-summary-row">
        <span> Images ZIP:</span>
        <strong>{zipFile ? zipFile.name : "Non sélectionné"}</strong>
      </div>
    </div>
  );
}