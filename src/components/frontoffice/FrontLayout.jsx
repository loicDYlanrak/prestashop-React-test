import { Outlet } from 'react-router-dom'
import FrontHeader from './FrontHeader'
import './FrontLayout.css'

export default function FrontLayout() {
  return (
    <div className="front-layout">
      <FrontHeader />
      <main className="front-content">
        <Outlet />
      </main>
    </div>
  )
}