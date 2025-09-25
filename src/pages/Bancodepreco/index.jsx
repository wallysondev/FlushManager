import React from 'react';
import { Sidebar } from '../../components/Sidebar/Sidebar';
import './style.css';

function Bancodepreco() {
  return (
    <main className="grid grid-cols-[220px_1fr] gap-4 p-4 h-screen">
      <Sidebar />
    <div className="bg-stone-50 p-6 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="inline-flex items-center px-1 py-1 uppercase font-bold md:flex">
          <span className="font-bold text-lg text-gray-700">Banco de Preço de Fornecedores</span>
        </div>
      </div>
      <div className='col-span-12 p-4 bg-white shadow'>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-2 md:mt-0 mb-5">
              <div className="flex gap-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => setModalCadastrar(true)}
                    className="text-xs uppercase font-bold bg-sky-600 text-white px-4 py-2 hover:bg-sky-700"
                  >
                    Novo
                  </button>
                  <button
                    onClick={() => setModalImportar(true)}
                    className="text-xs uppercase font-bold bg-lime-600 text-white px-4 py-2 hover:bg-lime-700"
                  >
                    Importar
                  </button>
                </div>
              </div>
              <input
                type="text"
                placeholder="Pesquisar funcionario ou email..."
                value=""
                className="w-full sm:w-64 px-3 py-2 shadow-sm text-sm border border-indigo-300 focus:outline-indigo-500"
              />
            </div>
        <table className='w-full table-auto md:table-fixed'>
          <TableHead />
          <tbody>
            <tr>
              <td colSpan={8} className="text-sm text-center py-4 text-gray-500">
                Nenhum orçamento encontrado.
              </td>
            </tr>
          </tbody>
        </table>
      </div>            
    </div>
    </main>
  )
}

export default Bancodepreco 

const TableHead = () => (
  <thead className="bg-gray-50">
    <tr className='text-sm text-stone-500'>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orçamento</th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">UF</th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data Última Compra</th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data do Orçamento</th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Posicao</th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Andamento</th>
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
