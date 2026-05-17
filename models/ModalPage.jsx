import { useState } from "react";

export default function ModalPage() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setIsOpen(true)}>Ouvrir modal</button>

      {isOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)" }}>
          <div style={{ background: "white", margin: "20% auto", padding: 20, width: 300 }}>
            <h2>Mon modal</h2>
            <button onClick={() => setIsOpen(false)}>Fermer</button>
          </div>
        </div>
      )}
    </div>
  );
}