import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h1>404</h1>
      <h2>Oups ! Page introuvable.</h2>
      <p>La page que vous recherchez n&apos;existe pas ou a été déplacée.</p>
      <Link to="/" style={{ color: 'blue', textDecoration: 'underline' }}>
        Retourner à l&apos;accueil
      </Link>
    </div>
  );
}