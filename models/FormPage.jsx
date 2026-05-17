import { useState } from "react";

export default function FormPage() {
  const [form, setForm] = useState({ name: "", email: "" });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Données soumises :", form);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" value={form.name} onChange={handleChange} placeholder="Nom" />
      <input name="email" value={form.email} onChange={handleChange} placeholder="Email" />
      <button type="submit">Envoyer</button>
    </form>
  );
}