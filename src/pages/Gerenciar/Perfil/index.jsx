import './style.css';
import { Sidebar } from '../../../components/Sidebar/Sidebar';
import { NovoPedido } from '../../../components/ImportePedido/NovoPedido';

function Perfil() {
  return (
    <main className="grid grid-cols-[220px_1fr] gap-4 p-4 h-screen">
      <Sidebar />
      <NovoPedido />
    </main>
  )
}

export default Perfil
