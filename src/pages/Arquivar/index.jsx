import React from 'react'
import './style.css';

import { Sidebar } from '../../components/Sidebar/Sidebar';

function Arquivar() {
  return (
    <main className="grid grid-cols-[220px_1fr] gap-4 p-4 h-screen">
      <Sidebar />
    </main>
  )
}

export default Arquivar
