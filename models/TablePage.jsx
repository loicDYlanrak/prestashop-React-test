import { useState } from "react";

const data = [
  { id: 1, name: "Alice", age: 28 },
  { id: 2, name: "Bob", age: 32 },
];

export default function TablePage() {
  const [filter, setFilter] = useState("");

  const filteredData = data.filter((row) =>
    row.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div>
      <input placeholder="Filtrer par nom" value={filter} onChange={(e) => setFilter(e.target.value)} />
      <table border="1">
        <thead>
          <tr><th>Nom</th><th>Âge</th></tr>
        </thead>
        <tbody>
          {filteredData.map((row) => (
            <tr key={row.id}>
              <td>{row.name}</td>
              <td>{row.age}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}