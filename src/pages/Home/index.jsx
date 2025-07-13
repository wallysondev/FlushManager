import { Dashboard } from '../../components/Dashboard/Dashboard';
import { Sidebar } from '../../components/Sidebar/Sidebar';
import './style.css';

function Home() {
  return (
    <main className="grid grid-cols-[220px_1fr] gap-4 p-4 h-screen">
      <Sidebar />
      <Dashboard />
    </main>
  )
}

export default Home
