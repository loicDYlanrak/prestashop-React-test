/* eslint-disable react/prop-types */

export default function ImportResult({ result }) {
  if (!result) return null;

  return (
    <div
      className={`alert ${result.success ? "alert--success" : "alert--error"}`}
    >
      <strong>{result.success ? " " : "❌ "}{result.message}</strong>
      {result.details && (
        <details style={{ marginTop: "10px" }}>
          <summary>Voir les détails</summary>
          <pre style={{ fontSize: "11px", marginTop: "8px", overflow: "auto" }}>
            {JSON.stringify(result.details, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}