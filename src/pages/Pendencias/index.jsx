import React, { useState, useMemo, useEffect } from "react";
import { motion,useMotionValue, useTransform, animate, AnimatePresence } from "framer-motion";
import { Package, Truck, FileText, Clock,Ban,Warehouse,Handshake,CheckCircle,Trash2, X } from "lucide-react";
import { FiUpload } from "react-icons/fi";
import {BsCheck} from "react-icons/bs";
import * as XLSX from "xlsx";
import { Sidebar } from '../../components/Sidebar/Sidebar';
import './style.css';

const ITENS_LIMITE = 20;

function Pendencias() {
  const [aba, setAba] = useState("importar");
  const [dados, setDados] = useState([]);
  const [pagina, setPagina] = useState(1);

  const [modalAberto, setModalAberto] = useState(false);
  const [itemEditando, setItemEditando] = useState(null);

  const [loadingGrid, setLoadingGrid] = useState(true);
  // progresso do excel ao ser upado
  const [loadingExcel, setLoadingExcel] = useState(false);
  const [progresso, setProgresso] = useState(0);

  const [tab, setTab] = useState("importar");

  useEffect(() => {
    setLoadingGrid(true);
    const t = setTimeout(() => setLoadingGrid(false), 600);
    return () => clearTimeout(t);
  }, [aba]);

  useEffect(() => {
    if (tab === "importados") {
      /*
      fetch("/api/importados")
        .then(r => r.json())
        .then(data => setDados(data));
        */
    }
  }, [tab]);

  function importarPlanilha(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoadingExcel(true);
    setProgresso(0);
    setLoadingGrid(true);

    const reader = new FileReader();

    // 📊 progresso REAL de leitura do arquivo
    reader.onprogress = (evt) => {
      if (evt.lengthComputable) {
        const percent = Math.round((evt.loaded / evt.total) * 60);
        setProgresso(percent); // até 60%
      }
    };

    reader.onload = (evt) => {
      // pequena transição visual
      let fakeProgress = 60;
      const interval = setInterval(() => {
        fakeProgress += 5;
        setProgresso(fakeProgress);
        if (fakeProgress >= 90) clearInterval(interval);
      }, 50);

      setTimeout(() => {
        const wb = XLSX.read(evt.target.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws);

        // adiciona o status no excel, para importação
        const dataImport = json.map(item => ({
          ...item, IMPORTADO: false,
        }))

        setDados(dataImport);
        setPagina(1);

        setProgresso(100);
        setLoadingExcel(false);
        setLoadingGrid(false);  
      }, 400);
    };

    reader.readAsBinaryString(file);
  }

  const dadosFiltrados = useMemo(() => {
    if (tab === "importar") {
      return dados.filter(d => !d.IMPORTADO);
    }
    return dados.filter(d => d.IMPORTADO);
  }, [dados, tab]);

  const usarScroll = dados.length > ITENS_LIMITE;

  function salvarEdicao() {
    setDados(prev => prev.map(d => d === itemEditando.original ? itemEditando.editado : d));
    setModalAberto(false);
    setItemEditando(null);
  }

  function alterarPrioridade(item, novoNivel) {
    setDados(prev =>
      prev.map(d =>
        d === item ? { ...d, PRIORIDADE: novoNivel } : d
      )
    );
  }

  async function importarItem(item) {
    // 1️⃣ atualiza visualmente (otimista)
    setDados(prev =>
      prev.map(d => d.CODPROD === item.CODPROD && d.PEDIDO === item.PEDIDO ? { ...d, IMPORTADO: true } : d)
    );

    // 2️⃣ envia pro backend
    /*
    try {
      await fetch("/api/importar-item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
    } catch (e) {
      console.error("Erro ao importar item", e);
    }
      */
  }

  return (
      <>
      <main className="grid grid-cols-[220px_1fr] gap-4 p-4 h-screen">
        <Sidebar />
        <div className="bg-stone-50 p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="inline-flex items-center px-1 py-1 uppercase font-bold md:flex">
              <span className="font-bold text-lg text-gray-700">CONTROLE DE PENDENCIAS</span>
            </div>
          </div>
          <div className="pb-4 grid gap-2 grid-cols-12">
            <div className="col-span-12 p-4 bg-white shadow">
              <div className="flex pb-3 flex-col md:flex-row md:items-center md:justify-between">
                <div className="flex gap-6 border-b border-gray-200">
                  <button
                    onClick={() => setTab("importar")}
                    className={`pb-2 text-xs font-bold uppercase transition
                      ${
                        tab === "importar"
                          ? "border-b-2 border-blue-600 text-blue-600"
                          : "border-b-2 border-transparent text-gray-400 hover:text-gray-600"
                      }`}
                  >
                    A importar
                  </button>

                  <button
                    onClick={() => setTab("importados")}
                    className={`pb-2 text-xs font-bold uppercase transition
                      ${
                        tab === "importados"
                          ? "border-b-2 border-blue-600 text-blue-600"
                          : "border-b-2 border-transparent text-gray-400 hover:text-gray-600"
                      }`}
                  >
                    Importados
                  </button>
                </div>
              </div>
                  {tab === "importar" && (
                    <>
                      <div className="grid grid-cols-6 gap-4 py-5">
                        <KPI icon={<Package />} label="Total de itens" value={dados.filter(d => d.IMPORTADO === false).length} />
                        <KPI icon={<FileText />} label="Pedidos únicos" value={new Set(dados.filter(d => d.IMPORTADO === false).map(d => d.PEDIDO)).size} />
                        <KPI icon={<Clock />} label="Itens pendentes" value={dados.filter(d => d.STATUS === 'P' && d.IMPORTADO === false).length} />
                        <KPI icon={<Truck />} label="Itens aguardando" value={dados.filter(d => d.STATUS === 'A' && d.IMPORTADO === false).length} />
                        <KPI icon={<Ban />} label="Itens bloqueado" value={dados.filter(d => d.STATUS === 'B' && d.IMPORTADO === false).length} />
                        <KPI icon={<Warehouse />} label="Itens em estoque" value={dados.filter(d => d.STATUS === 'E' && d.IMPORTADO === false).length} />
                        <KPI icon={<Handshake />} label="Itens em negociação" value={dados.filter(d => d.STATUS === 'N' && d.IMPORTADO === false).length} />
                        <KPI icon={<CheckCircle />} label="Itens concluido" value={dados.filter(d => d.STATUS === 'C' && d.IMPORTADO === false).length} />
                        <KPI icon={<Trash2 />} label="Itens excluido" value={dados.filter(d => d.STATUS === 'X' && d.IMPORTADO === false).length} />
                      </div>
                      <div className="pb-4 ">
                        {aba === 'importar' && (
                          <label className="inline-flex gap-2 px-4 py-2 bg-blue-700 text-white text-sm font-semibold cursor-pointer hover:bg-blue-600">
                            <FiUpload className="text-base" />
                            Carregar arquivo
                            <input className="hidden"  type="file" accept=".xlsx,.xls" onChange={importarPlanilha} />
                          </label>
                        )}
                      </div>
                      <div className="grid-scroll w-full max-h-[600px] overflow-x-auto overflow-y-auto">
                        <table className="w-full table-auto">
                          <thead className="bg-gray-50 sticky top-0 z-10">
                            <tr className='text-sm text-stone-500 text-center align-middle'>
                              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Selecionar</th>
                              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Codprod</th>
                              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Produto</th>
                              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Orgao</th>
                              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Prioridade</th>
                              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Qtd</th>
                              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Qtd.Autorizada</th>
                              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">%Autorizado</th>
                              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Qtd.Entregue</th>
                              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Enbalagem</th>
                              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">custo</th>
                              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Preço</th>
                              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Oferta</th>
                            </tr>
                          </thead> 
                          <tbody>
                            {loadingExcel  ? (
                              <tr>
                                <td colSpan={99} className="py-10 text-center">
                                  <div className="w-full max-w-md mx-auto space-y-3">
                                    <div className="text-sm font-semibold text-gray-600">
                                      Carregando planilha… {progresso}%
                                    </div>

                                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                      <div
                                        className="h-3 bg-blue-600 transition-all duration-300"
                                        style={{ width: `${progresso}%` }}
                                      />
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              dadosFiltrados.map((r,i)=> (<ProdutoListado key={i} dados={r} onAlterarPrioridade={alterarPrioridade} onImportar={importarItem} />))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}

                  {tab === "importados" && (
                    <>
                      <div className="grid-scroll w-full max-h-[600px] overflow-x-auto overflow-y-auto">
                        <table className="w-full table-auto">
                          <thead className="bg-gray-50 sticky top-0 z-10">
                            <tr className='text-sm text-stone-500 text-center align-middle'>
                              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Vendedor</th>
                              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Departamento</th>
                              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Marca</th>
                              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Prioridade</th>
                              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Codprod</th>
                              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Produto</th>
                              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Qtd</th>
                              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Qtd.Autorizada</th>
                              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">%Autorizado</th>
                              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Qtd.Entregue</th>
                              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Orgao</th>
                              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Enbalagem</th>
                              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">custo</th>
                              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Preço</th>
                              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Oferta</th>
                              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Importar</th>
                            </tr>
                          </thead> 
                          <tbody>
                            {loadingExcel  ? (
                              <tr>
                                <td colSpan={99} className="py-10 text-center">
                                  <div className="w-full max-w-md mx-auto space-y-3">
                                    <div className="text-sm font-semibold text-gray-600">
                                      Carregando planilha… {progresso}%
                                    </div>

                                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                      <div
                                        className="h-3 bg-blue-600 transition-all duration-300"
                                        style={{ width: `${progresso}%` }}
                                      />
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              dadosFiltrados.map((r,i)=> (<ProdutoListado key={i} dados={r} onAlterarPrioridade={alterarPrioridade} onImportar={importarItem} />))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
            </div>
          </div>
        </div>
      </main>
        {/*
          <main className="grid grid-cols-[220px_1fr] gap-4 p-4 h-screen">
            <Sidebar />
            <div className="max-w-7xl mx-auto space-y-6">


              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <KPI icon={<Package />} label="Itens" value={dados.length} />
              <KPI icon={<FileText />} label="Pedidos" value={new Set(dados.map(d => d.pedido)).size} />
              <KPI icon={<Truck />} label="Pendentes" value={dados.filter(d => d.status === "PENDENTE").length} />
              </div>


              <div className="bg-white rounded-2xl shadow-xl p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h1 className="text-2xl font-semibold">WLITENSIMPORT</h1>
                  <div className="flex gap-2">
                    {['importar','pesquisa'].map(a => (
                      <button key={a} onClick={() => setAba(a)} className={`px-4 py-2 rounded-lg ${aba===a?'bg-blue-600 text-white':'bg-white border'}`}>
                        {a === 'importar' ? 'Importar' : 'Pesquisar'}
                      </button>
                    ))}
                  </div>
              </div>


              {aba === 'importar' && (
                <input type="file" accept=".xlsx,.xls" onChange={importarPlanilha} />
              )}


              <GridTable
              loading={loadingGrid}
              dados={dados}
              usarScroll={usarScroll}
              permitirEdicao={aba === 'pesquisa'}
              onEditar={(row) => {
              setItemEditando({ original: row, editado: { ...row } });
              setModalAberto(true);
              }}
              />
              </div>
            </div>
            <AnimatePresence>
            {modalAberto && itemEditando && (
            <motion.div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <motion.div className="bg-white rounded-2xl w-full max-w-3xl p-6 max-h-[80vh] overflow-y-auto" initial={{scale:0.95}} animate={{scale:1}} exit={{scale:0.95}}>
            <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Editar Produto</h2>
            <button onClick={() => setModalAberto(false)}><X /></button>
            </div>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.keys(itemEditando.editado).map(c => (
            <div key={c}>
            <label className="text-xs text-slate-500">{c}</label>
            <input
            className="w-full border rounded-lg px-3 py-2"
            value={itemEditando.editado[c] ?? ""}
            onChange={e => setItemEditando({
            ...itemEditando,
            editado: { ...itemEditando.editado, [c]: e.target.value }
            })}
            />
            </div>
            ))}
            </div>


            <div className="flex justify-end gap-2 mt-6">
            <button className="px-4 py-2 border rounded" onClick={() => setModalAberto(false)}>Cancelar</button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={salvarEdicao}>Salvar</button>
            </div>
            </motion.div>
            </motion.div>
            )}
            </AnimatePresence>
          </main>
          */}
      </>
  )
}

export default Pendencias 

function KPI({ icon, label, value }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, latest => Math.round(latest));

  useEffect(() => {
    const controls = animate(count, value, {
      duration: 1.2,
      ease: "easeOut",
    });

    return controls.stop;
  }, [value]);

  return (
    <div className="bg-white p-4 shadow">
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center text-2xl">
          {icon}
        </div>

        <div className="text-left">
          <motion.h2 className="text-xl font-bold">
            {rounded}
          </motion.h2>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

export const ProdutoListado = ({ dados, onEditar, onAlterarPrioridade, onImportar }) => {
  const STATUS_MAP = {
    P: {
      label: "PENDENTE",
      class: "bg-orange-300 text-orange-800",
    },
    A: {
      label: "AGUARDANDO",
      class: "bg-cyan-300 text-cyan-800",
    },
    B: {
      label: "BLOQUEADO",
      class: "bg-red-300 text-red-800",
    },
    E: {
      label: "EM ESTOQUE",
      class: "bg-lime-300 text-lime-800",
    },
    N: {
      label: "EM NEGOCIAÇÃO",
      class: "bg-fuchsia-300 text-fuchsia-800",
    },
    C: {
      label: "CONCLUÍDO",
      class: "bg-green-300 text-green-800",
    },
  };

  return (
    <tr className="text-center align-middle">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        {!dados.IMPORTADO && (
          <button
            onClick={() => onImportar?.(dados)}
            className="text-green-600 hover:text-green-800"
            title="Importar item"
          >
            <BsCheck className="w-5 h-5" />
          </button>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dados.CODPROD}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dados.PRODUTO}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dados.ORGAO}</td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-lg ${
            STATUS_MAP[dados.STATUS]?.class ??
            "bg-gray-200 text-gray-800"
          }`}
        >
          {STATUS_MAP[dados.STATUS]?.label ?? "EXCLUÍDO"}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <PriorityStars nivel={dados.PRIORIDADE} onChange={(novoNivel) => {onAlterarPrioridade?.(dados, novoNivel);}} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dados.QTD}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dados.QTDAUTORIZADO}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <div className="font-semibold">
          {(dados.QTD > 0 && dados.QTDAUTORIZADO > 0) ? ((dados.QTDAUTORIZADO / dados.QTD) * 100).toFixed(2) : 0}%
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
          <div className="h-2 rounded-full bg-blue-600 transition-all" style={{width: `${dados.QTD > 0 && dados.QTDAUTORIZADO > 0 ? Math.min((dados.QTDAUTORIZADO / dados.QTD) * 100, 100) : 0}%`}}/>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dados.QTDENTREGUE}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dados.EMBALAGEM}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dados.CUSTO.toFixed(2)}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dados.PRECO}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dados.NUMOF}</td>
      {/*
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <button className="text-indigo-600 hover:text-indigo-900"><BsCheck className="w-5 h-5" /></button>
      </td>
      */}
    </tr>
  );
};

function PriorityStars({ nivel, onChange }) {
  const [hover, setHover] = React.useState(null);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => {
        const active = hover ? n <= hover : n <= nivel;

        return (
          <svg
            key={n}
            viewBox="0 0 20 20"
            fill="currentColor"
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(null)}
            onClick={() => onChange?.(n)}
            className={`
              w-4 h-4 cursor-pointer transition-all
              ${active
                ? n <= 2
                  ? "text-yellow-300"
                  : n <= 4
                  ? "text-orange-400"
                  : "text-red-500"
                : "text-gray-300"
              }
              hover:scale-110
            `}
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.178c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.38-2.454a1 1 0 00-1.175 0l-3.38 2.454c-.784.57-1.838-.196-1.539-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.045 9.394c-.783-.57-.38-1.81.588-1.81h4.178a1 1 0 00.95-.69l1.286-3.967z" />
          </svg>
        );
      })}
    </div>
  );
}