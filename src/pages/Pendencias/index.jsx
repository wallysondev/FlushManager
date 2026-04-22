import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Truck, FileText, Clock, Ban, Warehouse, CheckCircle, X, ChevronRight, Info, Filter } from "lucide-react";
import { FiUpload } from "react-icons/fi";
import { BsCheck } from "react-icons/bs";
import * as XLSX from "xlsx";
import { Sidebar } from '../../components/Sidebar/Sidebar';
import './style.css';

function Pendencias() {
  const [dados, setDados] = useState([]);
  const [loadingExcel, setLoadingExcel] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [tab, setTab] = useState("importar");
  const [pedidoSelecionado, setPedidoSelecionado] = useState(null);

  // filtro a ser carregado na tela.
  const [filtroStatus, setFiltroStatus] = useState("TODOS");

  // --- IMPORTAÇÃO ---
  function importarPlanilha(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoadingExcel(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target.result, { type: "binary" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(ws);
      setDados(json.map(item => ({
        ...item, 
        IMPORTADO: false,
        PRIORIDADE: item.PRIORIDADE || 0,
        CUSTO: Number(item.CUSTO) || 0,
        QTDENTREGUE: item.QTDENTREGUE || 0 // Garantindo que o campo exista
      })));
      setLoadingExcel(false);
    };
    reader.readAsBinaryString(file);
  }

  // --- LÓGICA DE FILTROS E AGRUPAMENTO ---
  const itensAImportar = useMemo(() => dados.filter(d => !d.IMPORTADO), [dados]);

  // Função auxiliar para determinar o status de um grupo de itens
  const getStatusPedido = (itens) => {
      const totalItens = itens.length;
      const concluidos = itens.filter(it => it.STATUS === 'C').length;
      const temEntrega = itens.some(it => (Number(it.QTDENTREGUE) || 0) > 0);
      const temAutorizacao = itens.some(it => (Number(it.QTDAUTORIZADO) || 0) > 0);

      if (totalItens > 0 && concluidos === totalItens) return 'ENTREGUE';
      if (temEntrega) return 'ANDAMENTO';
      if (temAutorizacao) return 'AUTORIZADO';
      return 'PENDENTE';
    };

  const pedidosAgrupados = useMemo(() => {
      const importados = dados.filter(d => d.IMPORTADO);
      const grupos = {};
      
      importados.forEach(item => {
        if (!grupos[item.PEDIDO]) {
          grupos[item.PEDIDO] = { id: item.PEDIDO, orgao: item.ORGAO, itens: [], valorTotal: 0 };
        }
        grupos[item.PEDIDO].itens.push(item);
        grupos[item.PEDIDO].valorTotal += (Number(item.PRECO) || 0) * (Number(item.QTDAUTORIZADO) || 0);
      });

      const listaAgrupada = Object.values(grupos).map(p => ({
        ...p,
        statusCalculado: getStatusPedido(p.itens)
      }));

      // Aplicação do Filtro de Badge
      if (filtroStatus === "TODOS") return listaAgrupada;
      return listaAgrupada.filter(p => p.statusCalculado === filtroStatus);
    }, [dados, filtroStatus]);

  // AJUSTE: Memo para manter os dados do Modal sempre sincronizados com o estado 'dados'
  const pedidoParaExibir = useMemo(() => {
      if (!pedidoSelecionado) return null;
      // Buscamos nos dados brutos e agrupamos na hora para garantir sincronia total
      const itensDoPedido = dados.filter(d => d.PEDIDO === pedidoSelecionado.id && d.IMPORTADO);
      return {
          ...pedidoSelecionado,
          itens: itensDoPedido,
          valorTotal: itensDoPedido.reduce((acc, it) => acc + (it.QTDAUTORIZADO * it.PRECO), 0)
      };
    }, [dados, pedidoSelecionado]);

  // AJUSTE: Função movida para dentro do componente para funcionar o setDados
  const atualizarQuantidades = (pedidoId, codProd, campo, valor) => {
    const v = valor === "" ? 0 : Number(valor);
    setDados(prev => prev.map(d => {
      if (d.PEDIDO === pedidoId && d.CODPROD === codProd) {
        const novoDado = { ...d, [campo]: v };
        
        // Lógica de Status
        if (novoDado.QTDAUTORIZADO > 0 && novoDado.QTDENTREGUE >= novoDado.QTDAUTORIZADO) {
          novoDado.STATUS = 'C';
        } else if (novoDado.QTDENTREGUE > 0) {
          novoDado.STATUS = 'A';
        } else {
          novoDado.STATUS = 'P';
        }
        return novoDado;
      }
      return d;
    }));
  };

  const alterarPrioridade = (item, novoNivel) => {
    setDados(prev => prev.map(d => (d.CODPROD === item.CODPROD && d.PEDIDO === item.PEDIDO) ? { ...d, PRIORIDADE: novoNivel } : d));
  };

  const importarItem = (item) => {
    setDados(prev => prev.map(d => (d.CODPROD === item.CODPROD && d.PEDIDO === item.PEDIDO) ? { ...d, IMPORTADO: true } : d));
  };

  return (
    <main className="grid grid-cols-[220px_1fr] gap-4 p-4 h-screen overflow-hidden text-slate-900">
      <Sidebar />
      <div className="bg-stone-50 p-6 space-y-4 overflow-y-auto custom-scrollbar">
        <span className="font-bold text-lg text-gray-700 uppercase tracking-tight">Controle de Pendências</span>

        <div className="p-4 bg-white shadow-sm rounded-lg">
          <div className="flex gap-6 border-b border-gray-200 mb-4 text-xs font-bold uppercase">
            <button onClick={() => setTab("importar")} className={`pb-2 transition ${tab === "importar" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-400"}`}>A importar</button>
            <button onClick={() => setTab("importados")} className={`pb-2 transition ${tab === "importados" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-400"}`}>Importados (Agrupados)</button>
          </div>

          {tab === "importar" && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-9 gap-3 py-4">
              <KPI icon={<Package size={18}/>} label="Total" value={itensAImportar.length} />
              <KPI icon={<Clock size={18}/>} label="Pendentes" value={itensAImportar.filter(d => d.STATUS === 'P').length} />
              <KPI icon={<Truck size={18}/>} label="Aguardando" value={itensAImportar.filter(d => d.STATUS === 'A').length} />
              <KPI icon={<Warehouse size={18}/>} label="Estoque" value={itensAImportar.filter(d => d.STATUS === 'E').length} />
              <KPI icon={<CheckCircle size={18}/>} label="Concluído" value={itensAImportar.filter(d => d.STATUS === 'C').length} />
              <KPI icon={<Ban size={18}/>} label="Bloqueado" value={itensAImportar.filter(d => d.STATUS === 'B').length} />
            </div>
          )}

          {tab === "importados" && (
            <div className="flex items-center gap-2 mb-6 p-2 bg-slate-50 rounded-lg border border-slate-100">
              <div className="flex items-center gap-2 px-3 border-r border-slate-200 mr-2 text-slate-400">
                <Filter size={14} />
                <span className="text-[10px] font-bold uppercase">Filtrar:</span>
              </div>
              <FilterBtn label="Todos" active={filtroStatus === "TODOS"} color="bg-slate-500" onClick={() => setFiltroStatus("TODOS")} />
              <FilterBtn label="Entregue" active={filtroStatus === "ENTREGUE"} color="bg-green-500" onClick={() => setFiltroStatus("ENTREGUE")} />
              <FilterBtn label="Em Andamento" active={filtroStatus === "ANDAMENTO"} color="bg-orange-500" onClick={() => setFiltroStatus("ANDAMENTO")} />
              <FilterBtn label="Autorizado" active={filtroStatus === "AUTORIZADO"} color="bg-purple-500" onClick={() => setFiltroStatus("AUTORIZADO")} />
              <FilterBtn label="Pendente" active={filtroStatus === "PENDENTE"} color="bg-blue-600" onClick={() => setFiltroStatus("PENDENTE")} />
            </div>
          )}

          <div className="flex justify-between items-center mb-6">
            {tab === "importar" && (
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white text-sm font-semibold rounded hover:bg-blue-600 cursor-pointer transition-colors">
                <FiUpload /> Carregar arquivo
                <input className="hidden" type="file" accept=".xlsx,.xls" onChange={importarPlanilha} />
              </label>
            )}
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                {tab === "importar" ? `Exibindo ${itensAImportar.length} itens` : `${pedidosAgrupados.length} pedidos prontos`}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-10">
            {tab === "importar" ? (
              itensAImportar.map((item, i) => (
                <OrderCard key={i} dados={item} onImportar={importarItem} onAlterarPrioridade={alterarPrioridade} />
              ))
            ) : (
              pedidosAgrupados.map((pedido) => (
                <GroupedOrderCard key={pedido.id} pedido={pedido} onClick={() => setPedidoSelecionado(pedido)} />
              ))
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {pedidoParaExibir && (
          <ModalPedido 
            pedido={pedidoParaExibir} 
            onClose={() => setPedidoSelecionado(null)} 
            onUpdateItem={atualizarQuantidades} 
          />
        )}
      </AnimatePresence>
    </main>
  );
}

// --- COMPONENTES AUXILIARES ---
// Botão de Filtro Pequeno
const FilterBtn = ({ label, active, color, onClick }) => (
  <button 
    onClick={onClick}
    className={`px-3 py-1 rounded-full text-[10px] font-black transition-all uppercase ${
      active ? `${color} text-white shadow-md` : 'bg-white text-slate-400 hover:bg-slate-100 border border-slate-200'
    }`}
  >
    {label}
  </button>
);

const ModalPedido = ({ pedido, onClose, onUpdateItem }) => {
  const itensConcluidos = pedido.itens.filter(it => it.STATUS === 'C').length;
  const totalItens = pedido.itens.length;
  const percentualConclusao = (itensConcluidos / totalItens) * 100;
  
  // REGRA: Se 100% concluído, o modo é apenas visualização
  const isReadOnly = percentualConclusao === 100;

  const mapStatus = (status) => {
    switch (status) {
      case 'P': return { label: 'PENDENTE', color: 'bg-blue-600' };
      case 'A': return { label: 'AGUARDANDO', color: 'bg-orange-500' };
      case 'E': return { label: 'ESTOQUE', color: 'bg-emerald-600' };
      case 'C': return { label: 'CONCLUÍDO', color: 'bg-green-500' };
      case 'B': return { label: 'BLOQUEADO', color: 'bg-red-600' };
      default: return { label: 'N/A', color: 'bg-gray-400' };
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        
        {/* HEADER */}
        <div className="p-6 border-b flex justify-between bg-slate-50 items-center">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-black text-slate-800 tracking-tight">PEDIDO #{pedido.id}</h2>
              {isReadOnly && (
                <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-1 rounded flex items-center gap-1 border border-amber-200">
                   MODO APENAS LEITURA
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase">{pedido.orgao}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isReadOnly ? 'bg-green-500 text-white shadow-sm' : 'bg-blue-100 text-blue-700'}`}>
                    {itensConcluidos} / {totalItens} ITENS CONCLUÍDOS ({percentualConclusao.toFixed(0)}%)
                </span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={24} /></button>
        </div>

        {/* TABELA DE ITENS */}
        <div className="p-6 overflow-y-auto flex-1">
          <table className="w-full text-left text-xs">
            <thead className="text-[10px] text-gray-400 uppercase border-b">
              <tr>
                <th className="pb-2">Produto / Status</th>
                <th className="pb-2 w-24">Qtd Total</th>
                <th className="pb-2 w-32">Autorizado</th>
                <th className="pb-2 w-32">Entregue</th>
                <th className="pb-2 w-20 text-center">%</th>
                <th className="pb-2 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pedido.itens.map((it, idx) => {
                const statusInfo = mapStatus(it.STATUS);
                const percItem = it.QTDAUTORIZADO > 0 ? (it.QTDENTREGUE / it.QTDAUTORIZADO) * 100 : 0;
                
                return (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4">
                        <div className="flex flex-col gap-1">
                            <p className="font-bold uppercase text-slate-700">{it.PRODUTO}</p>
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-[9px] text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">{it.CODPROD}</span>
                                <span className={`text-[8px] font-black text-white ${statusInfo.color} px-1.5 py-0.5 rounded-full uppercase`}>
                                    {statusInfo.label}
                                </span>
                            </div>
                        </div>
                    </td>
                    <td className="py-4 font-semibold text-slate-400">{it.QTD}</td>
                    
                    {/* INPUTS COM TRAVA DE LEITURA */}
                    <td className="py-4 px-1">
                        <input 
                            type="number" 
                            disabled={isReadOnly}
                            className={`w-24 p-1.5 border rounded font-bold outline-none transition-all ${
                              isReadOnly ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200' : 'text-slate-700 focus:ring-2 focus:ring-blue-500'
                            }`}
                            value={it.QTDAUTORIZADO || 0}
                            onChange={(e) => onUpdateItem(pedido.id, it.CODPROD, 'QTDAUTORIZADO', e.target.value)}
                        />
                    </td>
                    <td className="py-4 px-1">
                        <input 
                            type="number" 
                            disabled={isReadOnly}
                            className={`w-24 p-1.5 border rounded font-bold outline-none transition-all ${
                              isReadOnly 
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200' 
                                : it.STATUS === 'C' ? 'bg-green-50 border-green-200 text-green-700' : 'text-slate-700 focus:ring-2 focus:ring-blue-500'
                            }`}
                            value={it.QTDENTREGUE || 0}
                            onChange={(e) => onUpdateItem(pedido.id, it.CODPROD, 'QTDENTREGUE', e.target.value)}
                        />
                    </td>

                    <td className="py-4 text-center">
                        <span className={`text-[10px] font-black ${percItem >= 100 ? 'text-green-600' : 'text-orange-500'}`}>
                            {percItem.toFixed(0)}%
                        </span>
                    </td>
                    <td className="py-4 text-right font-black text-slate-900">
                        R$ {((it.QTDAUTORIZADO || 0) * (it.PRECO || 0)).toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* FOOTER CONDICIONAL */}
        <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
          <div className="flex gap-10">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Total Autorizado</p>
              <p className="text-xl font-black text-green-400">R$ {pedido.valorTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Status Final</p>
              <p className="text-xl font-black uppercase">{isReadOnly ? '✅ Pedido Entregue' : '⏳ Processando'}</p>
            </div>
          </div>
          
          {/* Só mostra o botão de salvar se não estiver concluído */}
          {!isReadOnly ? (
            <button onClick={onClose} className="bg-blue-600 hover:bg-blue-500 px-8 py-2.5 rounded-xl font-bold text-sm uppercase transition-all shadow-lg active:scale-95">
              Salvar Alterações
            </button>
          ) : (
            <button onClick={onClose} className="bg-slate-700 hover:bg-slate-600 px-8 py-2.5 rounded-xl font-bold text-sm uppercase transition-all">
              Fechar Visualização
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const OrderCard = ({ dados, onImportar, onAlterarPrioridade }) => {
  const percentual = dados.QTD > 0 ? Math.min((dados.QTDAUTORIZADO / dados.QTD) * 100, 100) : 0;
  const jaImportado = dados.IMPORTADO === true;

  const mapStatus = (status) => {
    switch (status) {
      case 'P': return { label: 'PENDENTE', color: 'bg-blue-600' };
      case 'A': return { label: 'AGUARDANDO', color: 'bg-orange-500' };
      case 'E': return { label: 'ESTOQUE', color: 'bg-emerald-600' };
      case 'C': return { label: 'CONCLUÍDO', color: 'bg-green-500' };
      case 'B': return { label: 'BLOQUEADO', color: 'bg-red-600' };
      default: return { label: 'N/A', color: 'bg-gray-400' };
    }
  };

  const currentStatus = mapStatus(dados.STATUS);

  return (
    <motion.div 
      layout 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className={`bg-white border-2 ${jaImportado ? 'border-red-100 bg-red-50/5' : 'border-gray-100'} rounded-2xl p-5 shadow-sm flex flex-col gap-4 group relative`}
    >
      {/* HEADER: Pedido e Código em Destaque */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black bg-slate-900 text-white px-2 py-1 rounded shadow-sm">
              PEDIDO: {dados.PEDIDO}
            </span>
            <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded border border-blue-200">
              REF: {dados.CODPROD}
            </span>
          </div>
          
          <div className="flex gap-1 flex-wrap">
            <span className={`text-[9px] font-black text-white ${currentStatus.color} px-2 py-0.5 rounded-full uppercase`}>
               {currentStatus.label}
            </span>
            {jaImportado && (
              <span className="text-[9px] font-black text-red-600 bg-red-100 px-2 py-0.5 rounded-full uppercase">
                JÁ IMPORTADO
              </span>
            )}
          </div>
        </div>
        
        <PriorityStars nivel={dados.PRIORIDADE} onChange={(n) => !jaImportado && onAlterarPrioridade(dados, n)} />
      </div>

      {/* PRODUTO */}
      <div>
        <h3 className={`text-sm font-black leading-tight line-clamp-2 uppercase tracking-tight ${jaImportado ? 'text-gray-400' : 'text-slate-800'}`}>
          {dados.PRODUTO}
        </h3>
        <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase">{dados.ORGAO}</p>
      </div>

      {/* FINANCEIRO (PREÇO E CUSTO) E QUANTIDADE */}
      <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
        <div className="flex flex-col border-r border-slate-200 pr-2">
          <span className="text-[8px] text-gray-400 font-bold uppercase leading-none mb-1">Preços</span>
          <div className="flex flex-col">
            <span className={`text-sm font-black ${jaImportado ? 'text-gray-400' : 'text-slate-900'}`}>
              Venda: R$ {Number(dados.PRECO || 0).toFixed(2)}
            </span>
            <span className="text-[10px] font-bold text-red-400">
              Custo: R$ {Number(dados.CUSTO || 0).toFixed(2)}
            </span>
          </div>
        </div>
        
        <div className="pl-2 flex flex-col justify-center">
            <p className="text-[8px] text-gray-400 font-bold uppercase leading-none mb-1">Autorizada / Total</p>
            <p className={`text-sm font-black ${jaImportado ? 'text-gray-400' : 'text-blue-600'}`}>
                {dados.QTDAUTORIZADO || 0} <span className="text-slate-300 font-normal">/ {dados.QTD}</span>
            </p>
        </div>
      </div>

      {/* PROGRESSO */}
      <div className="space-y-1.5 mt-auto">
        <div className="flex justify-between text-[10px] font-black text-gray-500 uppercase">
          <span>Cobertura do Pedido</span> 
          <span className={percentual >= 100 ? "text-green-600" : ""}>{percentual.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${jaImportado ? 'bg-gray-300' : percentual >= 100 ? 'bg-green-500' : 'bg-blue-600'}`} 
            style={{ width: `${percentual}%` }} 
          />
        </div>
      </div>

      {/* BOTÃO */}
      <button 
        disabled={jaImportado}
        onClick={() => onImportar(dados)} 
        className={`w-full py-3 text-xs font-black rounded-xl flex items-center justify-center gap-2 transition-all uppercase ${
          jaImportado 
            ? 'bg-gray-100 text-gray-300 cursor-not-allowed border border-gray-200' 
            : 'bg-slate-900 hover:bg-blue-600 text-white shadow-lg active:scale-[0.97]'
        }`}
      >
        {jaImportado ? (
          <><Ban size={14} /> Importação Bloqueada</>
        ) : (
          <><BsCheck size={20} /> Importar Item</>
        )}
      </button>
    </motion.div>
  );
};

const GroupedOrderCard = ({ pedido, onClick }) => {
  const itensConcluidos = pedido.itens.filter(it => it.STATUS === 'C').length;
  const totalItens = pedido.itens.length;
  // Cálculo do percentual de conclusão baseado na contagem de itens
  const percentualItens = totalItens > 0 ? (itensConcluidos / totalItens) * 100 : 0;

  const isTotalmenteEntregue = percentualItens === 100;
  const temEntregaFisica = pedido.itens.some(it => it.QTDENTREGUE > 0);
  const temAutorizacao = pedido.itens.some(it => it.QTDAUTORIZADO > 0);

  const status = useMemo(() => {
    if (isTotalmenteEntregue) return 'ENTREGUE';
    if (temEntregaFisica) return 'ANDAMENTO';
    if (temAutorizacao) return 'AUTORIZADO';
    return 'PENDENTE';
  }, [isTotalmenteEntregue, temEntregaFisica, temAutorizacao]);

  const styles = {
    ENTREGUE: { border: 'border-l-green-500', bg: 'bg-green-50/30', text: 'text-green-600', badge: 'bg-green-500', progress: 'bg-green-500' },
    ANDAMENTO: { border: 'border-l-orange-500', bg: 'bg-orange-50/30', text: 'text-orange-600', badge: 'bg-orange-500', progress: 'bg-orange-500' },
    AUTORIZADO: { border: 'border-l-purple-500', bg: 'bg-purple-50/30', text: 'text-purple-600', badge: 'bg-purple-500', progress: 'bg-purple-500' },
    PENDENTE: { border: 'border-l-blue-500', bg: 'bg-white', text: 'text-blue-600', badge: 'bg-blue-600', progress: 'bg-blue-600' }
  };

  const currentStyle = styles[status];

  return (
    <motion.div 
      whileHover={{ y: -4 }} 
      onClick={onClick} 
      className={`bg-white rounded-2xl p-5 shadow-sm cursor-pointer border-l-4 transition-all ${currentStyle.border} ${currentStyle.bg} flex flex-col gap-3`}
    >
      {/* HEADER: Pedido e Badge na mesma linha */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black bg-slate-900 text-white px-2 py-1 rounded shadow-sm uppercase tracking-wider whitespace-nowrap">
            #{pedido.id}
          </span>
          
          <span className={`flex items-center gap-1 text-[9px] font-black text-white px-2.5 py-1 rounded-full shadow-sm whitespace-nowrap ${currentStyle.badge}`}>
            {status === 'ENTREGUE' ? <CheckCircle size={10} /> : <Clock size={10} />}
            {status === 'ENTREGUE' ? 'ENTREGUE' : status}
          </span>
        </div>
        
        {/* PERCENTUAL DE ITENS CONCLUÍDOS NO TOPO */}
        <div className="text-right">
          <span className={`text-[11px] font-black ${currentStyle.text}`}>
            {percentualItens.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* BARRA DE PROGRESSO DE ITENS */}
      <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden -mt-1">
        <div 
          className={`h-full transition-all duration-500 ${currentStyle.progress}`}
          style={{ width: `${percentualItens}%` }}
        />
      </div>

      <div className="mt-1">
        <h3 className="text-sm font-black text-slate-800 line-clamp-1 uppercase tracking-tight">
          {pedido.orgao}
        </h3>
      </div>
      
      <div className="grid grid-cols-2 gap-3 bg-white/60 p-3 rounded-xl border border-slate-100">
          <div>
            <p className="text-[9px] text-gray-400 font-bold uppercase mb-0.5">Itens Concluídos</p>
            <p className="text-sm font-black text-slate-700">
              {itensConcluidos} <span className="text-slate-300 font-normal">/ {totalItens}</span>
            </p>
          </div>
          <div>
            <p className="text-[9px] text-gray-400 font-bold uppercase mb-0.5">Total Autorizado</p>
            <p className={`text-sm font-black ${currentStyle.text}`}>
              R$ {pedido.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
      </div>

      <div className="mt-1 pt-3 border-t border-slate-100 flex justify-between items-center">
        <span className={`text-[10px] font-black uppercase tracking-widest ${currentStyle.text}`}>
          {isTotalmenteEntregue ? "Visualizar Pedido" : "Gerenciar Entrega"}
        </span>
        <ChevronRight size={16} className={currentStyle.text} />
      </div>
    </motion.div>
  );
};

function KPI({ icon, label, value }) {
  return (
    <div className="bg-white p-3 border border-gray-100 rounded shadow-sm flex items-center gap-3">
      <div className="text-blue-600 bg-blue-50 p-2 rounded">{icon}</div>
      <div><h2 className="text-sm font-black text-gray-800">{value}</h2><p className="text-[9px] text-gray-400 font-bold uppercase leading-none">{label}</p></div>
    </div>
  );
}

function PriorityStars({ nivel, onChange }) {
  const [hover, setHover] = useState(null);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} onClick={() => onChange?.(n)} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(null)}
          className={`w-3 h-3 cursor-pointer transition-colors ${ (hover || nivel) >= n ? "text-orange-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.178c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.38-2.454a1 1 0 00-1.175 0l-3.38 2.454c-.784.57-1.838-.196-1.539-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.045 9.394c-.783-.57-.38-1.81.588-1.81h4.178a1 1 0 00.95-.69l1.286-3.967z" />
        </svg>
      ))}
    </div>
  );
}

export default Pendencias;