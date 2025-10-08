import React, { useEffect, useState } from 'react';
import { BsArrowRepeat, BsCheckLg  } from "react-icons/bs";

import { useNavigate, Navigate } from 'react-router-dom';
import { DropdownOpcoes } from '../Dashboard/DropdownOpcoes';
import { Search } from './Search';
import { DateFilter } from './DateFilter';
import Api from '../../services/api';
import { jwtDecode } from 'jwt-decode';
import { SCREENS } from '../../utils/Permissoes'

export const Grid = () => {
  const navigate = useNavigate();
  const [sincronizandoId, setSincronizandoId] = useState(null);

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal para importar pedidos
  const [modalImportar, setModalImportar] = useState(false);
  const [pedidoConfirm, setPedidoConfirm] = useState("");

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const today = new Date();
  const fiveDaysAgo = new Date();

  fiveDaysAgo.setDate(today.getDate() - 5);

  const [startDate, setStartDate] = useState(fiveDaysAgo.toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split("T")[0]);

  const token = localStorage.getItem('token');

  if (!token) {
      return <Navigate to="/Login" replace />;
  }

  const decodedToken = jwtDecode(token);
  const codusur = decodedToken.codusur;

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await Api.get(`/Orcamento`, {
          params: { codusur },
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(response.data.orcamentos || []);
      } catch (err) {
        setError(err.message || 'Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [codusur, token]);

  // Variavel utilizada para gerenciar as permissoes do usuario
  const [rolePermissao, setRolePermissao] = useState([]);

  // Carregar todos os perfis
  useEffect(() => {
    const carregarRoles = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Token não encontrado, faça login.');

        // Rota de perfis da API
        const resRoles = await Api.get('/Roles', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Filtrando somente os perfis que estão ativos na rota.
        const perfisAtivos = resRoles.data.perfis.filter(p => p.status === 'A');
        
        // Pega qual a role do usuario que esta no token
        const decodedToken = jwtDecode(token);

        // Atualiza os estados com os dados do token
        const perfildefault = perfisAtivos.find(p => p.role === decodedToken.role);

        // consulta as permissoes disponiveis do usuario
        const resRolePerm = await Api.post(`/RolePermissao`, 
          { rolename: perfildefault.role }, // corpo da requisição
          { headers: { Authorization: `Bearer ${token}` } } // headers
        );

        // Retorna todas as permissões do perfil do usuario
        const dataRolePerm = resRolePerm.data.permissoes;

        // Seta todas as permissões da role do usuario.
        setRolePermissao(dataRolePerm);
      } catch (error) {
        console.error('Erro ao carregar perfis:', error);
      }
    };
    carregarRoles();
  }, []);

  if (loading) return <div>Carregando...</div>;
  if (error) return <div className='col-span-12 p-4 bg-white rounded shadow'>{error}</div>;

  // Filtra dados pelo search e datas
  const filteredData = data.filter(item => {
    const searchMatch =
      item.numorca.toString().includes(searchTerm) ||
      item.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.cnpj.includes(searchTerm);

    const itemDate = new Date(item.dtinserido);
    const DataInsert = itemDate.toISOString().split("T")[0];
    
    const dateMatch = DataInsert >= startDate && DataInsert <= endDate;

    return searchMatch && dateMatch;
  });

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  const handleImportarPedido = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Token não encontrado, faça login.");

      const decodedToken = jwtDecode(token);
      const codusur = decodedToken.codusur;

      const dados = {
        numorca: pedidoConfirm,
        codusur: codusur,
      };

      // Recupera do endpoint os dados referente a requisição do orçamento
      const response = await Api.post(`/Pedido/Importe`, dados, {headers: { Authorization: `Bearer ${token}` },});

      // Insere no alerta de mensagem 
      const pedido = response.data.pedido;

      if (!pedido) throw new Error("Pedido nao encontrado");
      
      setData(e => [...e, pedido]);

      // Fecha o modal
      setModalImportar(false);
      setPedidoConfirm("");
    } catch (error: any) {
      if (error.response) {
        // Insere no alerta de mensagem 
        const data = error.response.data;
        // Fecha o modal
        setModalImportar(false);
        setPedidoConfirm("");
      }
    }
  };

  const handleExportarPedido = async (numorca) => {

    // Só pode sincronizar quando finalizar um
    if (sincronizandoId) return;

    // marca o orçamento clicado
    setSincronizandoId(numorca);
    
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Token não encontrado, faça login.");

      const dados = {
        numorca: numorca,
      };

      // Chamada real da API, aguarda o tempo que for necessário
      const response = await Api.post(`/Pedido/Exporte`, dados, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const orcadata = response.data.pedido;

      if (!orcadata)  throw new Error("Erro ao atualizar o orcamento.");

      // Atualiza o array de usuários na tabela
      setData(orcavenda => orcavenda.map(u => u.numorca === orcadata.numorca ? { ...u, sincronizado: orcadata.sincronizado } : u ));

      // Fecha o modal
      setModalImportar(false);
      setPedidoConfirm("");

    } finally {
      setSincronizandoId(null); // libera após terminar
    }
  };

  const getSigla = (nome) => {
    const partes = nome.trim().split(" ");
    return (partes[0]?.[0] || "") + (partes[1]?.[0] || "");
  };

  const getPositionColor = (status) => {
    switch (status) {
      case "P": return "bg-slate-600 hover:bg-slate-500";
      case "M": return "bg-violet-600 hover:bg-violet-500";
      case "B": return "bg-amber-600 hover:bg-amber-500";
      case "C": return "bg-red-600 hover:bg-red-500";
      case "F": return "bg-lime-600 hover:bg-lime-500";
      case "L": return "bg-blue-600 hover:bg-blue-500";
      default: return "bg-gray-400 hover:bg-gray-500";
    }
  };

  const getAprovado = (status) => {
    switch (status) {
      case "A":
        return { label: "Aprovado", color: "bg-emerald-500" };
      case "R":
        return { label: "Reprovado", color: "bg-red-500" };
      default:
        return { label: "Pendente", color: "bg-gray-400" };
    }
  }

  return (
    // Removi o <StatCards /> porque nao vi necessidade do resumo ainda 
    <>
      <div className="bg-stone-50 p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="inline-flex items-center px-1 py-1 uppercase font-bold md:flex">
            <span className="font-bold text-lg text-gray-700">Orçamentos importados</span>
          </div>
          {rolePermissao.find(p => p.permissao === SCREENS.IMPORTARPEDIDOS && p.status === 'A') && (<button 
            className="text-xs font-semibold uppercase bg-sky-500 text-white py-2 px-5 mb-3 hover:bg-sky-700"
            onClick={() => setModalImportar(true)}>
            Importar Novo Orcamento
          </button>)}
        </div>
        <div className='col-span-12 p-4 bg-white shadow'>
          <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-3'>
            <div className='flex flex-col md:flex-row gap-2'>
              <Search value={searchTerm} onChange={setSearchTerm} />
              <span className='py-2 px-5 mb-3 rounded flex items-center text-sm text-gray-700'>Data inicial:</span> <DateFilter value={startDate} onChange={setStartDate} />
              <span className='py-2 px-5 mb-3 rounded flex items-center text-sm text-gray-700'>Data Final:</span> <DateFilter value={endDate} onChange={setEndDate} />
            </div>
          </div>
    
          <table className='w-full table-auto md:table-fixed'>
            <thead className="bg-gray-50">
              <tr className='text-sm text-stone-500'>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orçamento</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">UF</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data Última Compra</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data do Orçamento</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Posicao</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Andamento</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                {rolePermissao.find(p => p.permissao === SCREENS.SINCRONIZARNOWINTHOR && p.status === 'A') && (<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sync</th>)}
              </tr>
            </thead>  
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((item, index) => {
                  const isandamento = getAprovado(item.aprovado);

                  return (
                    <tr key={index} className="text-sm text-gray-700">
                      <td className="p-4">
                        <div className="font-semibold text-xs text-gray-600">{item.numorca}</div>
                      </td>
                      <td>
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-600 text-white font-bold shrink-0">
                            {getSigla(item.cliente)}
                          </div>
                          <div>
                            <div className="font-semibold">{item.cliente}</div>
                            <div className="text-xs text-gray-500">{item.cnpj}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">{item.estado}</td>
                      <td className="p-4">R$ {item.vltotal.toFixed(2)}</td>
                      <td className="p-4">{formatDate(item.dtulpedido)}</td>
                      <td className="p-4">{formatDate(item.data)}</td>
                      <td className="p-4">
                        <button className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium ${getPositionColor(item.posicao)}`}>
                          {item.posicao}
                        </button>
                      </td>
                      <td className="p-4">
                        <button className={`flex items-center gap-2 py-1 px-2 rounded-full text-white font-medium ${isandamento.color}`}>
                          {isandamento.label}
                        </button>
                      </td>
                      <td className="p-4 items-center justify-center">
                        <DropdownOpcoes numorca={item.numorca} />
                      </td>
                      {rolePermissao.find(p => p.permissao === SCREENS.SINCRONIZARNOWINTHOR && p.status === 'A') && (
                        <td className="p-4 ">
                          <button onClick={() => { if (item.sincronizado === 'N') handleExportarPedido(item.numorca); }}  disabled= {sincronizandoId === item.numorca && item.sincronizado === 'N'} className= {`flex items-center gap-2 py-1 px-2 rounded-full text-white font-medium transition-colors ${sincronizandoId === item.numorca && item.sincronizado === 'N'? "bg-sky-500" : item.sincronizado === 'N'? "bg-amber-500 hover:bg-amber-600" : "bg-lime-500 hover:bg-lime-600" }`}>
                            {item.sincronizado === 'N' ? (<BsArrowRepeat className={`text-lg transition-transform duration-500 ${sincronizandoId === item.numorca ? "animate-spin" : ""}`}/>) : (<BsCheckLg className={`text-lg`}/>) }
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="text-sm text-center py-4 text-gray-500">
                    Nenhum orçamento encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>            
      </div>

      {modalImportar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setModalImportar(false)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-lg p-6 w-96 shadow-lg z-10">
            <h2 className="text-lg font-bold mb-4">Importar Orcamento</h2>
            <p className="text-sm mb-4">O processo de importação de orcamento realiza a integração com o ERP <b>Winthor</b>, recuperando os dados e disponibilizando-os nesta aplicação.</p>

              <input
                type="text"
                inputMode="numeric"   // abre teclado numérico em mobile
                pattern="[0-9]*"      // força só números
                className="w-full rounded px-3 py-2 text-sm border border-sky-300 focus:outline-sky-500 mb-4"
                placeholder="Número do orcamento"
                value={pedidoConfirm}
                onChange={(e) => setPedidoConfirm(e.target.value.replace(/\D/, ""))}
              />

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setModalImportar(false);
                    setPedidoConfirm("");
                  }}
                  className="px-4 py-2 bg-gray-200 rounded"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => { handleImportarPedido() }}
                  disabled={pedidoConfirm.length < 1}
                  className={`px-4 py-2  text-white rounded ${
                  pedidoConfirm.length > 0
                    ? "bg-lime-600 hover:bg-lime-700"
                    : "bg-lime-300 cursor-not-allowed"
                }`}
                >
                  Importar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
