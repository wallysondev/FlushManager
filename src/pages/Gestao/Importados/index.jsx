import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, ChevronRight, CheckCircle, Clock, Ban, FileText, TrendingUp, Package, AlertCircle, Check, Truck, Warehouse, X, Info } from "lucide-react";
import { Sidebar } from '../../../components/Sidebar/Sidebar';
import Api from '../../../services/api';

export default function GerenciadorPedidos() {
  const [dadosItens, setDadosItens] = useState([]);
  const [pedidoSelecionado, setPedidoSelecionado] = useState(null);

  useEffect(() => {
    const GetAllPedidos = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Token não encontrado.');

        const response = await Api.get('/Pendencias', {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Normaliza os dados para garantir que não haverá chaves undefined
        const dadosNormalizados = response.data.map(item => ({
          ...item,
          pedido: item.PEDIDO || item.pedido,
          codprod: item.CODPROD || item.codprod,
          qtd: Number(item.QTD || item.qtd || 0),
          qtdautorizado: Number(item.QTDAUTORIZADO || item.qtdautorizado || 0),
          qtdentregue: Number(item.QTDENTREGUE || item.qtdentregue || 0),
          preco: Number(item.PRECO || item.preco || 0),
          custo: Number(item.CUSTO || item.custo || 0),
          produto: item.PRODUTO || item.produto || "",
          orgao: item.ORGAO || item.orgao || "",
          status: item.STATUS || item.status || "P",
          prioridade: item.PRIORIDADE || item.prioridade || 0,
          importado: item.IMPORTADO || item.importado || false
        }));

        setDadosItens(dadosNormalizados);
      } catch (error) {
        console.error('Erro ao carregar pedidos:', error);
      }
    };

    GetAllPedidos();
  }, []);

  // Função para enviar os dados ao Backend (Controller PendenciasController)
  const sincronizarComBackend = async (item) => {
    try {
      // 1. Define o novo status com base nas regras que você criou
      let novoStatus = 'P';
      const qtdEnt = Number(item.qtdentregue || 0);
      const qtdAut = Number(item.qtdautorizado || 0);

      if (qtdEnt >= qtdAut && qtdAut > 0) {
        novoStatus = 'C'; // Concluído
      } else if (qtdEnt > 0) {
        novoStatus = 'A'; // Em andamento/Atendido parcial
      } else if (qtdAut > 0) {
        novoStatus = 'E'; // Espera/Autorizado
      }

      const token = localStorage.getItem('token');
      if (!token) throw new Error('Token não encontrado.');

      // 2. Prepara o corpo do envio
      // Usamos o spread para garantir que codfilial, rca, etc., viajem junto
      const dadosParaEnvio = {
        ...item,
        status: novoStatus
      };

      // 3. Chamada para a API
      const response = await Api.put('/Pendencias', dadosParaEnvio, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
    } catch (err) {
      console.error("Erro ao salvar no backend:", err?.response?.data || err.message);
    }
  };

  // Sua função handleUpdateItem atualizada
  const handleUpdateItem = (numPedido, codProd, campo, valor) => {
    // 1. Localiza o item original
    const pedidoEncontrado = dadosItens.find(
      item => item.pedido === numPedido && item.codprod === codProd
    );

    if (!pedidoEncontrado) {
      console.log("Pedido não localizado.");
      return;
    }

    // 2. Cálculos e Validações
    const novoValor = valor === "" ? 0 : Number(valor);
    let valorFinal = novoValor;

    if (campo === 'qtdautorizado' && novoValor > Number(pedidoEncontrado.qtd)) {
      valorFinal = Number(pedidoEncontrado.qtd);
    } else if (campo === 'qtdentregue' && novoValor > Number(pedidoEncontrado.qtdautorizado)) {
      valorFinal = Number(pedidoEncontrado.qtdautorizado);
    }

    // 3. Cria o objeto atualizado EXATAMENTE como você queria
    const itemAtualizado = { ...pedidoEncontrado, [campo]: valorFinal };

    // 4. Envia a atualização para o winthor somente do item que foi ajustado
    sincronizarComBackend(itemAtualizado);

    // Atualiza os dados na tela baseado no item que foi ajustado
    const novosDados = dadosItens.map(item => 
      (item.pedido === numPedido && item.codprod === codProd) ? itemAtualizado : item
    );
    // Salva os dados na atualização da tela
    setDadosItens(novosDados);
  };

  // Atualiza o nivel de prioridade do item para cada estrelinha
  const alterarPrioridade = (item, novoNivel) => {
    const itemAtualizado = { ...item, prioridade: novoNivel };

    setDadosItens(prev => 
      prev.map(d => 
        (d.codprod === item.codprod && d.pedido === item.pedido) ? itemAtualizado : d
      )
    );

    sincronizarComBackend(itemAtualizado);
  };

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    //setFiltros(prev => ({ ...prev, [name]: value }));
  };

  const pedidosAgrupados = useMemo(() => {
    const grupos = dadosItens.reduce((acc, item) => {
      const idPedido = item.pedido;
      if (!acc[idPedido]) {
        acc[idPedido] = { 
          id: idPedido, 
          orgao: item.orgao, 
          valorTotal: 0, 
          itens: [],
          statusGrupo: 'P' // Status inicial do grupo
        };
      }
      acc[idPedido].itens.push(item);
      
      const preco = item.preco || 0;
      const qtdA = item.qtdautorizado || 0;
      acc[idPedido].valorTotal += (qtdA * preco);
      
      return acc;
    }, {});

    // Determina o status de cada grupo baseado nos itens
    return Object.values(grupos).map(grupo => {
      const total = grupo.itens.length;
      const concluidos = grupo.itens.filter(i => 
        i.qtdentregue >= i.qtdautorizado && i.qtdautorizado > 0
      ).length;
      
      const algumEntregue = grupo.itens.some(i => i.qtdentregue > 0);
      const algumAutorizado = grupo.itens.some(i => i.qtdautorizado > 0);

      let status = 'PENDENTE';
      if (concluidos === total && total > 0) {
        status = 'ENTREGUE';
      } else if (algumEntregue) {
        status = 'ANDAMENTO';
      } else if (algumAutorizado) {
        status = 'AUTORIZADO';
      }

      return {
        ...grupo,
        statusGrupo: status,
        totalItens: total,
        itensConcluidos: concluidos
      };
    });
  }, [dadosItens]);

  return (
    <main className="grid grid-cols-[220px_1fr] gap-4 p-4 h-screen overflow-hidden text-slate-900">
      <Sidebar />
      <div className="bg-stone-50 p-6 space-y-4 overflow-y-auto custom-scrollbar">

        {/* HEADER & KPIS */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
          <div className="space-y-1">
            <h1 className="font-bold text-lg text-gray-700 uppercase tracking-tight">Gestão de Pedidos</h1>
            <p className="text-slate-500 font-medium flex items-center gap-2 uppercase text-xs tracking-widest">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Gerencie pedidos de acordo com o status, Confirme entregas, autorizações etc...
            </p>
          </div>
        </div>

        <div className="flex gap-4 w-full">
          <KPI icon={<Package size={22} />} label="Pedidos Ativos" value={pedidosAgrupados.length} />
          <KPI icon={<TrendingUp size={22} />} label="Vlr Autorizado" value={`R$ ${pedidosAgrupados.reduce((a, b) => a + b.valorTotal, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
          <KPI icon={<Clock size={18} />} label="Pendentes" value={pedidosAgrupados.filter(d => d.posicao === 'P').length} />
          <KPI icon={<Truck size={18} />} label="Aguardando" value={pedidosAgrupados.filter(d => d.posicao === 'A').length} />
          <KPI icon={<Warehouse size={18} />} label="Estoque" value={pedidosAgrupados.filter(d => d.posicao === 'E').length} />
          <KPI icon={<CheckCircle size={18} />} label="Concluído" value={pedidosAgrupados.filter(d => d.posicao === 'C').length} />
          <KPI icon={<Ban size={18} />} label="Bloqueado" value={pedidosAgrupados.filter(d => d.posicao === 'B').length} />
        </div>

        {/* BARRA DE FILTROS */}
        <div className="bg-white p-6 shadow grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Filial</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
              <input name="codFilial" placeholder="Ex: 1, 2" onChange={handleFiltroChange} className="w-full bg-slate-50 border-none rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 outline-none transition-all placeholder:text-slate-300" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Nº Pedido</label>
            <input name="numPedido" placeholder="Digite os números..." onChange={handleFiltroChange} className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 outline-none transition-all placeholder:text-slate-300" />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Cód. Cliente</label>
            <input name="codCli" placeholder="Ex: 500, 501" onChange={handleFiltroChange} className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 outline-none transition-all placeholder:text-slate-300" />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Posição</label>
            {/*
            <select name="posicao" value={filtros.posicao} onChange={handleFiltroChange} className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 outline-none cursor-pointer appearance-none">
              <option value="T">TODAS AS POSIÇÕES</option>
              <option value="P">PENDENTE (P)</option>
              <option value="L">LIBERADO (L)</option>
              <option value="F">FATURADO (F)</option>
              <option value="B">BLOQUEADO (B)</option>
            </select>
            */}
          </div>
        </div>

        {/* ÁREA DE CONTEÚDO PRINCIPAL */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <Filter size={14} /> Pedidos Importados
              </h2>
              <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 font-bold">{pedidosAgrupados.length}</span>
            </div>

            <div className="space-y-4 overflow-y-auto max-h-[65vh] pr-2 custom-scrollbar">
              <AnimatePresence mode="popLayout">
                {pedidosAgrupados.length > 0 ? (
                  pedidosAgrupados.map(pedido => (
                    
                    <GroupedOrderCard
                      key={pedido.id}
                      pedido={pedido}
                      onClick={() => setPedidoSelecionado(pedido)}
                    />
                  ))
                ) : (
                  <div className="p-8 text-center bg-white border border-dashed border-slate-200">
                    <p className="text-sm font-bold text-slate-400 italic">Não foram importados pedidos</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* COLUNA DIREITA: DETALHES */}
          <div className="lg:col-span-2">
            {pedidoSelecionado ? (
              <div className="space-y-6">
                {/* Header do Pedido Selecionado */}
                <div className="flex items-center justify-between bg-white p-5 border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-600 text-white flex items-center justify-center font-black">
                      {pedidoSelecionado?.id?.toString().slice(-2) || "00"}
                    </div>
                    <div>
                      <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                        Visualizando Itens do Pedido
                      </h2>
                      <p className="font-black text-slate-800 uppercase">
                        #{pedidoSelecionado.id} — {pedidoSelecionado.orgao}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setPedidoSelecionado(null)}
                    className="text-[10px] font-black text-red-500 hover:bg-red-50 px-4 py-2 rounded-xl transition-all uppercase tracking-widest border border-transparent hover:border-red-100"
                  >
                    Fechar Detalhes
                  </button>
                </div>

                {/* Lista de Itens Filtrados */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {(dadosItens || [])
                    .filter((it) => it.pedido === pedidoSelecionado.id)
                    .map((item) => (
                      <OrderCard
                        key={`${item.pedido}-${item.codprod}`}
                        dados={item}
                        onImportar={(d) => alert(`Importando...`)}
                        onAlterarPrioridade={alterarPrioridade}
                        onUpdateItem={handleUpdateItem}
                      />
                    ))}
                </div>
              </div>
            ) : (
              /* Estado Vazio (Nenhum pedido selecionado) */
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-slate-300 border-4 border-dashed border-slate-100 p-12 text-center transition-all bg-slate-50/50">
                <div className="w-20 h-20 bg-white shadow-sm flex items-center justify-center mb-6">
                  <FileText size={40} className="opacity-20 text-slate-900" />
                </div>
                
                {(pedidosAgrupados?.length || 0) > 0 ? (
                  <>
                    <h3 className="font-black uppercase tracking-widest text-slate-400 text-sm">
                      Aguardando Seleção
                    </h3>
                    <p className="text-xs font-medium text-slate-400 mt-2 max-w-[250px]">
                      Selecione um pedido da lista à esquerda para gerenciar itens, prioridades e importações.
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="font-black uppercase tracking-widest text-slate-400 text-sm">
                      Sem pedido importado!
                    </h3>
                    <p className="text-xs font-medium text-slate-400 mt-2 max-w-[250px]">
                      Não há pedido para ser selecionado no momento.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

        </div>
      </div>

      <style jsx="true">{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #CBD5E1; }
      `}</style>
    </main>
  );
}

const KPI = ({ icon, label, value }) => (
  <div className="bg-white p-4 shadow flex items-center gap-4 flex-1">
    <div className="text-blue-600 bg-blue-50 p-3 rounded-xl">{icon}</div>
    <div>
      <h2 className="text-lg font-black text-slate-800 leading-none">{value}</h2>
      <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-wider">{label}</p>
    </div>
  </div>
);

const PriorityStars = ({ nivel, onChange }) => {
  const [hover, setHover] = useState(null);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          onClick={() => onChange?.(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(null)}
          className={`w-3.5 h-3.5 cursor-pointer transition-colors ${(hover || nivel) >= n ? "text-orange-400" : "text-gray-200"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.178c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.38-2.454a1 1 0 00-1.175 0l-3.38 2.454c-.784.57-1.838-.196-1.539-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.045 9.394c-.783-.57-.38-1.81.588-1.81h4.178a1 1 0 00.95-.69l1.286-3.967z" />
        </svg>
      ))}
    </div>
  );
};

const OrderCard = ({ dados, onAlterarPrioridade, onUpdateItem }) => {
  // 1. Unificando referências (usando as chaves minúsculas que normalizamos no useEffect)
  const qtdTotal = Number(dados.qtd || 0);
  const qtdAut = Number(dados.qtdautorizado || 0);
  const qtdEnt = Number(dados.qtdentregue || 0);

  const limitador = qtdAut > 0 ? qtdAut : qtdTotal;

  // 2. O percentual agora é baseado na ENTREGA sobre o TOTAL
  const percentual = limitador > 0 ? Math.min((qtdEnt / limitador) * 100, 100) : 0;
  
  const jaImportado = dados.status === 'C';
  const subtotal = qtdAut * (dados.preco || 0);

  // 3. Lógica de Status Visual (Opcional: você pode vincular a cor ao percentual)
  const mapStatus = (status) => {
    switch (status) {
      case 'P': return { label: 'PENDENTE', color: 'bg-orange-500' };
      case 'A': return { label: 'AGUARDANDO', color: 'bg-yellow-500' };
      case 'E': return { label: 'ESTOQUE', color: 'bg-violet-600' };
      case 'C': return { label: 'CONCLUÍDO', color: 'bg-green-500' };
      case 'B': return { label: 'BLOQUEADO', color: 'bg-red-600' };
      default: return { label: 'N/A', color: 'bg-gray-400' };
    }
  };

  // Se quiser que o selo de status mude conforme a barra:
  const statusEfetivo = percentual >= 100 ? 'C' : (qtdEnt > 0 ? 'A' : dados.status);
  const currentStatus = mapStatus(statusEfetivo);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-white border-2 ${jaImportado ? 'border-red-100 bg-red-50/10' : 'border-gray-100'} p-5 shadow-sm flex flex-col gap-4 group relative`}
    >
      {/* HEADER */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded border border-blue-200">
              Código: {dados.codprod}
            </span>
          </div>
          <div className="flex gap-1 flex-wrap">
            <span className={`text-[9px] font-black text-white ${currentStatus.color} px-2 py-0.5 rounded-full uppercase transition-colors duration-300`}>
              {currentStatus.label}
            </span>
          </div>
        </div>
        <PriorityStars nivel={dados.prioridade} onChange={(n) => !jaImportado && onAlterarPrioridade(dados, n)} />
      </div>

      {/* INFO PRODUTO */}
      <div>
        <h3 className={`text-sm font-black leading-tight line-clamp-2 uppercase ${jaImportado ? 'text-gray-400' : 'text-slate-800'}`}>
          {dados.produto}
        </h3>
        <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">{dados.orgao}</p>
      </div>

      {/* INPUTS E VALORES */}
      <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
        <div className="flex flex-col border-r border-slate-200 pr-2 gap-1">
          <span className="text-[8px] text-slate-400 font-black uppercase">Financeiro</span>
          <span className="text-[11px] font-black text-slate-900">Venda: R$ {Number(dados.preco || 0).toFixed(2)}</span>
          <div className="mt-1 pt-1 border-t border-slate-200">
             <span className="text-[8px] text-slate-400 font-black uppercase">Subtotal Autorizado</span>
             <p className="text-xs font-black text-emerald-600 font-mono">R$ {subtotal.toFixed(2)}</p>
          </div>
        </div>
        
        <div className="pl-1 flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[8px] text-slate-400 font-black uppercase tracking-tighter">Autorizada (Limite: {qtdTotal})</label>
            <input 
              type="number"
              value={dados.qtdautorizado}
              min="0"
              max={dados.qtd}
              disabled={jaImportado}
              onChange={(e) => onUpdateItem(dados.pedido, dados.codprod, 'qtdautorizado', e.target.value)}
              className={`w-24 p-1.5 text-xs border rounded font-bold outline-none transition-all focus:ring-2 
              ${dados.status === 'E' ? 'bg-violet-50 border-violet-200 text-violet-700 ring-violet-200' : 'bg-white border-slate-200 text-slate-700 focus:ring-blue-500'}`}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[8px] text-slate-400 font-black uppercase tracking-tighter">Qtd Entregue</label>
            <input 
              type="number"
              value={dados.qtdentregue}
              min="0"
              max={limitador}
              disabled={jaImportado}
              onChange={(e) => onUpdateItem(dados.pedido, dados.codprod, 'qtdentregue', e.target.value)}
              className={`w-24 p-1.5 text-xs border rounded font-bold outline-none transition-all focus:ring-2 
              ${dados.status === 'C' ? 'bg-green-50 border-green-200 text-green-700 ring-green-200' : 'bg-white border-slate-200 text-slate-700 focus:ring-blue-500'}`}
            />
          </div>
        </div>
      </div>

      {/* BARRA DE PROGRESSO (BASEADA NA ENTREGA) */}
      <div className="space-y-1.5 mt-auto">
        <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase">
          <span>Progresso de Entrega</span>
          <span className={percentual >= 100 ? "text-green-600" : ""}>
            {qtdEnt} / {qtdTotal} ({percentual.toFixed(0)}%)
          </span>
        </div>
        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentual}%` }}
            className={`h-full rounded-full transition-colors duration-500 ${percentual >= 100 ? 'bg-green-500' : 'bg-blue-600'}`}
          />
        </div>
      </div>
    </motion.div>
  );
};

const GroupedOrderCard = ({ pedido, onClick }) => {
  // O status agora vem pronto do useMemo
  const status = pedido.statusGrupo; 
  const percentualItens = pedido.totalItens > 0 
    ? (pedido.itensConcluidos / pedido.totalItens) * 100 
    : 0;

  const styles = {
    ENTREGUE: { border: 'border-l-green-500', bg: 'bg-green-50/30', text: 'text-green-600', badge: 'bg-green-500', progress: 'bg-green-500', icon: <CheckCircle size={10} /> },
    ANDAMENTO: { border: 'border-l-orange-500', bg: 'bg-orange-50/30', text: 'text-orange-600', badge: 'bg-orange-500', progress: 'bg-orange-500', icon: <Clock size={10} /> },
    AUTORIZADO: { border: 'border-l-purple-500', bg: 'bg-purple-50/30', text: 'text-purple-600', badge: 'bg-purple-500', progress: 'bg-purple-500', icon: <FileText size={10} /> },
    PENDENTE: { border: 'border-l-blue-500', bg: 'bg-white', text: 'text-blue-600', badge: 'bg-blue-600', progress: 'bg-blue-600', icon: <Info size={10} /> }
  };

  const currentStyle = styles[status] || styles.PENDENTE;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      onClick={onClick}
      className={`bg-white rounded-xl p-5 shadow-sm cursor-pointer border-l-4 transition-all ${currentStyle.border} ${currentStyle.bg} flex flex-col gap-2`}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black bg-slate-900 text-white px-2 py-1 rounded shadow-sm uppercase">
            #{pedido.id}
          </span>
          <span className={`flex items-center gap-1 text-[9px] font-black text-white px-2.5 py-1 rounded shadow-sm ${currentStyle.badge}`}>
            {currentStyle.icon} {status}
          </span>
        </div>
        <span className={`text-[11px] font-black ${currentStyle.text}`}>{percentualItens.toFixed(0)}%</span>
      </div>

      <div className="w-full bg-slate-100 h-1 rounded overflow-hidden -mt-1">
        <div 
          className={`h-full transition-all duration-500 ${currentStyle.progress}`} 
          style={{ width: `${percentualItens}%` }} 
        />
      </div>

      <h3 className="text-sm font-black text-slate-800 line-clamp-1 uppercase tracking-tight">
        {pedido.orgao}
      </h3>

      <div className="grid grid-cols-2 gap-2 bg-white/60 p-3 rounded-xl border border-slate-100">
        <div>
          <p className="text-[9px] text-slate-400 font-bold uppercase mb-0.5 leading-none">Concluídos</p>
          <p className="text-sm font-black text-slate-700">
            {pedido.itensConcluidos} <span className="text-slate-300 font-normal">/ {pedido.totalItens}</span>
          </p>
        </div>
        <div>
          <p className="text-[9px] text-slate-400 font-bold uppercase mb-0.5 leading-none">Vlr. Total</p>
          <p className={`text-sm font-black ${currentStyle.text}`}>
            R$ {pedido.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>
      {/* ... restante do componente */}
    </motion.div>
  );
};