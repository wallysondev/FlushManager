import { Sidebar } from '../../components/Sidebar/Sidebar';
import './style.css';

const ITENS_LIMITE = 20;

function Bancodepreco() {
  return (
    <main className="grid grid-cols-[220px_1fr] gap-4 p-4 h-screen">
      <Sidebar />
    </main>
  )
}

export default Bancodepreco 