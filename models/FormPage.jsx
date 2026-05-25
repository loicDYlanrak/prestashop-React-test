import { useState } from "react";

export default function FormPage() {
  // 1. Déclaration de tous les states individuels
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [age, setAge] = useState(""); // type="number"
  const [birthDate, setBirthDate] = useState(""); // type="date"
  const [appointmentTime, setAppointmentTime] = useState(""); // type="time"
  const [website, setWebsite] = useState(""); // type="url"
  const [search, setSearch] = useState(""); // type="search"
  const [color, setColor] = useState("#000000"); // type="color"
  const [satisfaction, setSatisfaction] = useState(50); // type="range"
  
  const [gender, setGender] = useState(""); // type="radio"
  const [acceptTerms, setAcceptTerms] = useState(false); // type="checkbox" (unique)
  const [hobbies, setHobbies] = useState([]); // type="checkbox" (multiples)
  
  const [country, setCountry] = useState(""); // select (unique)
  const [bio, setBio] = useState(""); // textarea
  const [profilePic, setProfilePic] = useState(null); // type="file"

  // 2. Les fonctions "Handler" spécifiques pour chaque comportement

  // Handler standard (texte, email, password, date, color, range, select, etc.)
  const handleTextChange = (setter) => (e) => setter(e.target.value);

  // Handler pour le type="number" (conversion en nombre)
  const handleNumberChange = (e) => setAge(Number(e.target.value));

  // Handler pour une checkbox unique (booléen)
  const handleCheckboxChange = (e) => setAcceptTerms(e.target.checked);

  // Handler pour des checkboxes multiples (tableau de valeurs)
  const handleMultiCheckboxChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setHobbies([...hobbies, value]);
    } else {
      setHobbies(hobbies.filter((hobby) => hobby !== value));
    }
  };

  // Handler spécifique pour le type="file"
  const handleFileChange = (e) => {
    setProfilePic(e.target.files[0]); // On récupère le premier fichier
  };

  // 3. Soumission du formulaire
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // On regroupe tout dans un objet pour le log ou l'envoi API
    const formData = {
      name, email, password, age, birthDate, appointmentTime,
      website, search, color, satisfaction, gender,
      acceptTerms, hobbies, country, bio,
      profilePic: profilePic ? profilePic.name : null // On affiche juste le nom pour le log
    };

    console.log("Données soumises :", formData);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px", maxWidth: "400px", margin: "20px auto" }}>
      
      {/* Inputs Texte & Dérivés */}
      <label>Nom : <input type="text" value={name} onChange={handleTextChange(setName)} placeholder="Nom" /></label>
      <label>Email : <input type="email" value={email} onChange={handleTextChange(setEmail)} placeholder="Email" /></label>
      <label>Mot de passe : <input type="password" value={password} onChange={handleTextChange(setPassword)} placeholder="Mot de passe" /></label>
      <label>Site Web : <input type="url" value={website} onChange={handleTextChange(setWebsite)} placeholder="https://..." /></label>
      <label>Recherche : <input type="search" value={search} onChange={handleTextChange(setSearch)} placeholder="Rechercher..." /></label>

      {/* Numérique et Sliders */}
      <label>Âge : <input type="number" value={age} onChange={handleNumberChange} placeholder="Âge" /></label>
      <label>Satisfaction (Range) : <input type="range" min="0" max="100" value={satisfaction} onChange={handleTextChange(setSatisfaction)} /> {satisfaction}%</label>

      {/* Dates, Heures & Couleurs */}
      <label>Date de naissance : <input type="date" value={birthDate} onChange={handleTextChange(setBirthDate)} /></label>
      <label>Heure de rendez-vous : <input type="time" value={appointmentTime} onChange={handleTextChange(setAppointmentTime)} /></label>
      <label>Couleur préférée : <input type="color" value={color} onChange={handleTextChange(setColor)} /></label>

      {/* Boutons Radio (Choix unique) */}
      <div>
        <p style={{ margin: "0 0 5px 0" }}>Genre :</p>
        <label><input type="radio" name="gender" value="Homme" checked={gender === "Homme"} onChange={handleTextChange(setGender)} /> Homme</label>
        <label><input type="radio" name="gender" value="Femme" checked={gender === "Femme"} onChange={handleTextChange(setGender)} /> Femme</label>
      </div>

      {/* Checkbox Unique */}
      <label>
        <input type="checkbox" checked={acceptTerms} onChange={handleCheckboxChange} /> J&apos;accepte les conditions
      </label>

      {/* Checkboxes Multiples */}
      <div>
        <p style={{ margin: "0 0 5px 0" }}>Loisirs :</p>
        <label><input type="checkbox" value="Sport" checked={hobbies.includes("Sport")} onChange={handleMultiCheckboxChange} /> Sport</label>
        <label><input type="checkbox" value="Musique" checked={hobbies.includes("Musique")} onChange={handleMultiCheckboxChange} /> Musique</label>
        <label><input type="checkbox" value="Code" checked={hobbies.includes("Code")} onChange={handleMultiCheckboxChange} /> Code</label>
      </div>

      {/* Balise Select / Option */}
      <label>
        Pays :
        <select value={country} onChange={handleTextChange(setCountry)}>
          <option value="">-- Choisir un pays --</option>
          <option value="France">France</option>
          <option value="Canada">Canada</option>
          <option value="Belgique">Belgique</option>
        </select>
      </label>

      {/* Zone de texte (Textarea) */}
      <label>Biographie : <textarea value={bio} onChange={handleTextChange(setBio)} placeholder="Parlez-nous de vous..." /></label>

      {/* Fichier (File) */}
      <label>Photo de profil : <input type="file" onChange={handleFileChange} /></label>

      {/* Bouton de soumission */}
      <button type="submit" style={{ padding: "10px", backgroundColor: "#0070f3", color: "white", border: "none", cursor: "pointer" }}>Envoyer</button>
    </form>
  );
}