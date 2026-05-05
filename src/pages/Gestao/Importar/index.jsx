import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, CheckCircle, Clock, 
  Ban, Package, Truck, Warehouse, 
  Download, RefreshCw, Calendar
} from "lucide-react";
import { Sidebar } from '../../../components/Sidebar/Sidebar';
import Api from '../../../services/api'; 

// --- SUB-COMPONENTES ---
const KPI = ({ icon, label, value, colorClass = "text-blue-600", bgColorClass = "bg-blue-50" }) => (
  <div className="bg-white p-4 border border-gray-100 rounded-2xl shadow-sm flex items-center gap-4 flex-1 min-w-[140px]">
    <div className={`${colorClass} ${bgColorClass} p-3 rounded-xl`}>{icon}</div>
    <div>
      <h2 className="text-lg font-black text-slate-800 leading-none">{value}</h2>
      <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-wider">{label}</p>
    </div>
  </div>
);

const GroupedOrderCard = ({ pedido, onImportar }) => {
  const itensConcluidos = pedido.itens.filter(it => it.status === 'C').length;
  const totalItens = pedido.itens.length;
  const percentual = totalItens > 0 ? (itensConcluidos / totalItens) * 100 : 0;

  return (
    <motion.div 
      layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="text-[10px] font-black bg-slate-900 text-white px-3 py-1 rounded-lg uppercase shadow-sm">
            Pedido #{pedido.id}
          </span>
          <h3 className="text-sm font-black text-slate-800 uppercase mt-3 tracking-tight group-hover:text-blue-600 transition-colors line-clamp-1">
            {pedido.orgao}
          </h3>
        </div>
        <span className="text-[10px] font-bold text-slate-400 uppercase">Filial {pedido.itens[0]?.codfilial}</span>
      </div>

      <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50 mb-4">
        <div>
          <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">Itens</p>
          <p className="text-sm font-black text-slate-700">{itensConcluidos} / {totalItens}</p>
        </div>
        <div>
          <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">Vlr. Autorizado</p>
          <p className="text-sm font-black text-blue-600">R$ {pedido.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      <button 
        onClick={() => onImportar(pedido.id)}
        className="w-full py-3 bg-slate-900 hover:bg-blue-600 text-white text-[10px] font-black rounded-xl flex items-center justify-center gap-2 transition-all uppercase shadow-lg active:scale-95"
      >
        <Download size={14} /> Importar Pedido
      </button>
    </motion.div>
  );
};

// --- COMPONENTE PRINCIPAL ---
export default function GerenciadorPedidos() {
  const [pedidosBrutos, setPedidosBrutos] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Estado de Filtros expandido para Datas
  const [filtros, setFiltros] = useState({ 
    codFilial: '', 
    numPedido: '', 
    codCli: '', 
    posicao: 'T',
    tipoData: 'M', // 'M' para Meses (Retroativo), 'I' para Intervalo (Início/Fim)
    meses: 12,
    mesInicio: 12,
    mesFim: 0
  });

  // FUNÇÃO DE BUSCA MANUAL
  const handleSearch = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Montagem dos parâmetros respeitando a lógica do Controller C#
      const params = {
        codFilial: filtros.codFilial || undefined,
        numPed: filtros.numPedido || undefined,
        codCli: filtros.codCli || undefined,
        posicao: filtros.posicao === 'T' ? undefined : filtros.posicao,
      };

      // Adiciona filtros de data conforme a escolha do usuário
      if (filtros.tipoData === 'M') {
        params.meses = filtros.meses;
      } else {
        params.mesInicio = filtros.mesInicio;
        params.mesFim = filtros.mesFim;
      }

      const response = await Api.get('/Pcpedc', {
        headers: { Authorization: `Bearer ${token}` },
        params: params
      });

      console.log(response.data);

      setPedidosBrutos(response.data || []);
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
      alert("Erro ao consultar dados. Verifique a conexão.");
    } finally {
      setLoading(false);
    }
  };

  const pedidosAgrupados = useMemo(() => {
    const grupos = pedidosBrutos.reduce((acc, item) => {
      const idPed = item.pedido;
      if (!acc[idPed]) {
        acc[idPed] = { id: idPed, orgao: item.orgao, valorTotal: 0, itens: [] };
      }
      acc[idPed].itens.push(item);
      acc[idPed].valorTotal += (item.qtdautorizado * item.preco);
      return acc;
    }, {});
    return Object.values(grupos);
  }, [pedidosBrutos]);

// Dentro do componente GerenciadorPedidos

  const handleImportarPedido = async (idPedido) => {
    // 1. Localiza o pedido agrupado e seus itens
    const pedidoParaImportar = pedidosAgrupados.find(p => p.id === idPedido);
    
    if (!pedidoParaImportar || !pedidoParaImportar.itens.length) {
      alert("Erro: Itens do pedido não encontrados.");
      return;
    }

    const confirmar = window.confirm(
      `Deseja importar os ${pedidoParaImportar.itens.length} itens do Pedido #${idPedido}?`
    );

    if (!confirmar) return;

    setLoading(true);
    const token = localStorage.getItem('token');
    let sucessos = 0;
    let erros = 0;

    try {
      // 2. Itera sobre cada item do pedido e envia para o seu Controller C#
      // Usamos for...of para evitar sobrecarga simultânea e garantir a ordem
      for (const item of pedidoParaImportar.itens) {
        try {
          await Api.post('/Pendencias', item, {
            headers: { Authorization: `Bearer ${token}` }
          });
          sucessos++;
        } catch (err) {
          console.error(`Erro ao importar item ${item.codprod}:`, err);
          erros++;
        }
      }

      alert(`Processo concluído!\nSucessos: ${sucessos}\nFalhas: ${erros}`);
      
      // Opcional: Remover o pedido da lista após importar com sucesso total
      if (erros === 0) {
        setPedidosBrutos(prev => prev.filter(p => p.pedido !== idPedido));
      }

    } catch (error) {
      console.error("Erro crítico na importação:", error);
      alert("Ocorreu um erro ao processar a importação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid grid-cols-[220px_1fr] gap-4 p-4 h-screen overflow-hidden text-slate-900">
      <Sidebar />
      <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
          <div className="flex flex-col gap-1">
            <h1 className="font-bold text-lg text-gray-700 uppercase tracking-tight">Importar Pedidos</h1>
            <p className="text-slate-500 font-medium flex items-center gap-2 uppercase text-xs tracking-widest">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>Traga informações de pedidos do seu ERP para essa plafatorma e gerencie o status de cada item.
            </p>
          </div>
          
          <button 
            onClick={handleSearch}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase flex items-center gap-3 shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? <RefreshCw size={18} className="animate-spin" /> : <Search size={18} />}
            {loading ? "Consultando..." : "Consultar Pedidos"}
          </button>
        </div>

        {/* KPIS */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          <KPI icon={<Package size={18}/>} label="Itens Encontrados" value={pedidosBrutos.length} />
          <KPI icon={<Clock size={18}/>} label="Pendentes" value={pedidosBrutos.filter(d => d.status === 'P').length} colorClass="text-amber-600" bgColorClass="bg-amber-50" />
          <KPI icon={<Truck size={18}/>} label="Aguardando" value={pedidosBrutos.filter(d => d.status === 'A').length} colorClass="text-blue-600" bgColorClass="bg-blue-50" />
          <KPI icon={<Warehouse size={18}/>} label="Estoque" value={pedidosBrutos.filter(d => d.status === 'E').length} colorClass="text-indigo-600" bgColorClass="bg-indigo-50" />
          <KPI icon={<CheckCircle size={18}/>} label="Concluído" value={pedidosBrutos.filter(d => d.status === 'C').length} colorClass="text-emerald-600" bgColorClass="bg-emerald-50" />
          <KPI icon={<Ban size={18}/>} label="Bloqueado" value={pedidosBrutos.filter(d => d.status === 'B').length} colorClass="text-rose-600" bgColorClass="bg-rose-50" />
        </div>

        {/* INPUTS DE FILTRO */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-8">
          
          {/* Seção 1: Dados Gerais */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Filial</label>
              <input type="number" placeholder="Filial" value={filtros.codFilial} onChange={(e) => setFiltros({...filtros, codFilial: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Pedido</label>
              <input type="number" placeholder="Nº PCPEDI" value={filtros.numPedido} onChange={(e) => setFiltros({...filtros, numPedido: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Cliente</label>
              <input type="number" placeholder="Cód. Cliente" value={filtros.codCli} onChange={(e) => setFiltros({...filtros, codCli: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Posição</label>
              <select value={filtros.posicao} onChange={(e) => setFiltros({...filtros, posicao: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 font-bold text-slate-700 outline-none cursor-pointer">
                <option value="L">LIBERADO</option>
                <option value="M">MONTADO</option>
                <option value="B">BLOQUEADO</option>
                <option value="F">FATURADO</option>
                <option value="P">PENDENTE</option>
                <option value="A">AGUARDANDO</option>
                <option value="E">ESTOQUE</option>
                <option value="C">CONCLUÍDO</option>
              </select>
            </div>
          </div>

          {/* Seção 2: Filtros de Data (Acordeão/Toggle Interno) */}
          <div className="pt-6 border-t border-slate-50">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="w-full md:w-64 space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2">
                  <Calendar size={14}/> Modo de Data
                </label>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button 
                    onClick={() => setFiltros({...filtros, tipoData: 'M'})}
                    className={`flex-1 py-2 text-[9px] font-black uppercase rounded-lg transition-all ${filtros.tipoData === 'M' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
                  >
                    Retroativo
                  </button>
                  <button 
                    onClick={() => setFiltros({...filtros, tipoData: 'I'})}
                    className={`flex-1 py-2 text-[9px] font-black uppercase rounded-lg transition-all ${filtros.tipoData === 'I' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
                  >
                    Intervalo
                  </button>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                {filtros.tipoData === 'M' ? (
                  <div className="space-y-1.5 col-span-full">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Últimos {filtros.meses} meses</label>
                    <input 
                      type="range" min="1" max="24" step="1"
                      value={filtros.meses}
                      onChange={(e) => setFiltros({...filtros, meses: e.target.value})}
                      className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600 mt-4"
                    />
                    <div className="flex justify-between text-[8px] font-bold text-slate-300 mt-1 uppercase">
                      <span>1 mês</span>
                      <span>12 meses</span>
                      <span>24 meses</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Mês Início (Retroativo)</label>
                      <input type="number" placeholder="Ex: 12" value={filtros.mesInicio} onChange={(e) => setFiltros({...filtros, mesInicio: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Mês Fim (Retroativo)</label>
                      <input type="number" placeholder="Ex: 0" value={filtros.mesFim} onChange={(e) => setFiltros({...filtros, mesFim: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ÁREA DE RESULTADOS */}
        <div className="space-y-4">
          {pedidosAgrupados.length > 0 && (
             <div className="flex items-center gap-2 px-2 text-slate-400">
               <Filter size={14} />
               <h2 className="text-[10px] font-black uppercase tracking-[0.2em]">
                 Resultados ({pedidosAgrupados.length} pedidos encontrados)
               </h2>
             </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
            {loading ? (
              <div className="col-span-full py-20 flex flex-col items-center bg-white rounded-[2rem] border border-dashed border-slate-200">
                <RefreshCw size={32} className="text-blue-500 animate-spin mb-4" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Consultando Oracle...</p>
              </div>
            ) : pedidosAgrupados.length === 0 ? (
              <div className="col-span-full py-20 flex flex-col items-center bg-slate-100/50 rounded-[2rem] border border-dashed border-slate-200">
                <Search size={32} className="text-slate-300 mb-4" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Use os filtros acima e clique em Consultar.
                </p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {pedidosAgrupados.map(pedido => (
                  <GroupedOrderCard 
                    key={pedido.id} 
                    pedido={pedido} 
                    onImportar={handleImportarPedido}
                  />
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}