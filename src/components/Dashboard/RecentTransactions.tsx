import React, { useEffect, useState } from 'react';
import { UNSAFE_getPatchRoutesOnNavigationFunction, useNavigate } from 'react-router-dom';
import { DropdownOpcoes } from '../Dashboard/DropdownOpcoes';
import { Search } from './Search';
import { DateFilter } from './DateFilter';
import Api from '../../services/api';
import { jwtDecode } from 'jwt-decode';

export const RecentTransactions = () => {
  const navigate = useNavigate();

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const today = new Date();
  const fiveDaysAgo = new Date();
  fiveDaysAgo.setDate(today.getDate() - 5);

  const [startDate, setStartDate] = useState(fiveDaysAgo.toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split("T")[0]);

  const token = localStorage.getItem('token');
  if (!token) {
    navigate('/login');
    return null;
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

  if (loading) return <div>Carregando...</div>;
  if (error) return <div className='col-span-12 p-4 bg-white rounded shadow'>{error}</div>;

  // Filtra dados pelo search e datas
  const filteredData = data.filter(item => {
    const searchMatch =
      item.numorca.toString().includes(searchTerm) ||
      item.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.cnpj.includes(searchTerm);

    const itemDate = new Date(item.dtinserido);
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dateMatch = itemDate >= start && itemDate <= end;

    return searchMatch && dateMatch;
  });

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  return (
    <div className='col-span-12 p-4 bg-white rounded shadow'>
      <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-3'>
        <h3 className='flex items-center gap-1.5 text-[30px] font-bold text-stone-400'>
          Últimos orçamentos importados
        </h3>
        <div className='flex flex-col md:flex-row gap-2'>
          <Search value={searchTerm} onChange={setSearchTerm} />
          <DateFilter value={startDate} onChange={setStartDate} />
          <DateFilter value={endDate} onChange={setEndDate} />
        </div>
      </div>

      <p className="mb-4 mt-2 text-sm text-gray-500">
        Só será possível enviar o orçamento para transformação de pedido no ERP após a confirmação por parte do cliente.
      </p>

      <table className='w-full table-auto md:table-fixed'>
        <TableHead />
        <tbody>
          {filteredData.length > 0 ? (
            filteredData.map((item, index) => (
              <TableRow
                key={index}
                numorca={item.numorca}
                cliente={item.cliente}
                cgc={item.cnpj}
                uf={item.estado}
                valor={item.vltotal}
                dtultcompra={formatDate(item.dtulpedido)}
                dtultorcamento={formatDate(item.data)}
                status={item.posicao}
                andamento = {item.aprovado}
              />
            ))
          ) : (
            <tr>
              <td colSpan={8} className="text-center py-4 text-gray-500">
                Nenhum orçamento encontrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

const TableHead = () => (
  <thead>
    <tr className='text-sm font-normal text-stone-500'>
      <th className='text-start p-1.5'>Orçamento</th>
      <th className='text-start p-1.5'>Cliente</th>
      <th className='text-start p-1.5'>UF</th>
      <th className='text-start p-1.5'>Valor</th>
      <th className='text-start p-1.5'>Data Última Compra</th>
      <th className='text-start p-1.5'>Data do Orçamento</th>
      <th className='text-start p-1.5'>Posicao</th>
      <th className='text-start p-3'>Andamento</th>
      <th className='w-8'></th>
    </tr>
  </thead>
);

const TableRow = ({ numorca, cliente, cgc, uf, valor, dtultcompra, dtultorcamento, status, andamento }) => {
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

  const isandamento = getAprovado(andamento);

  return (
    <tr className="text-sm text-gray-700">
      <td className="p-4">
        <div className="font-semibold text-xs text-gray-600">{numorca}</div>
      </td>
      <td>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-600 text-white font-bold shrink-0">
            {getSigla(cliente)}
          </div>
          <div>
            <div className="font-semibold">{cliente}</div>
            <div className="text-xs text-gray-500">{cgc}</div>
          </div>
        </div>
      </td>
      <td className="p-4">{uf}</td>
      <td className="p-4">R$ {valor}</td>
      <td className="p-4">{dtultcompra}</td>
      <td className="p-4">{dtultorcamento}</td>
      <td className="p-4">
        <button className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium ${getPositionColor(status)}`}>
          {status}
        </button>
      </td>
      <td className="p-4">
        <button className={`flex items-center gap-2 py-1 px-2 rounded-full text-white font-medium ${isandamento.color}`}>
          {isandamento.label}
        </button>
      </td>
      <td className="w-8">
        <DropdownOpcoes numorca={numorca} />
      </td>
    </tr>
  );
};
