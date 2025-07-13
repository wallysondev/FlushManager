import React from 'react'
import { FiMoreHorizontal } from 'react-icons/fi'
import { Search } from './Search'

export const RecentTransactions = () => {
  return (
    <div className='col-span-12 p-4 bg-white rounded shadow'>
        <div className='flex items-center justify-between'>
            <h3 className='flex items-center gap-1.5 text-[30px] font-bold text-stone-400'>
                Ultimos orçamentos digitados
            </h3>
            <Search />
        </div>
        <p className="mb-4 text-sm text-gray-500">
            Só será possível enviar o orçamento para transformação de pedido no ERP após a confirmação por parte do cliente.
        </p>
        <table className='w-full table-auto md:table-fixed'>
            <TableHead />
            <tbody>
                <TableRow cliente='Odonto Shop' cgc='05730714386' uf='PI' valor='32540,20' dtultcompra='01/01/2025' dtultorcamento='11/06/2025' />
                <TableRow cliente='Naiara Odontologia' cgc='34.005.468/0001-90' uf='PI' valor='1240,20' dtultcompra='01/01/2025' dtultorcamento='11/06/2025' />
                <TableRow cliente='Odonto Shop' cgc='05730714386' uf='PI' valor='32540,20' dtultcompra='01/01/2025' dtultorcamento='11/06/2025' />
                <TableRow cliente='Odonto Shop' cgc='05730714386' uf='PI' valor='32540,20' dtultcompra='01/01/2025' dtultorcamento='11/06/2025' />
                <TableRow cliente='Odonto Shop' cgc='05730714386' uf='PI' valor='32540,20' dtultcompra='01/01/2025' dtultorcamento='11/06/2025' />
            </tbody>
        </table>
    </div>
  )
}
 
const TableHead = () => {
    return (
        <thead>
            <tr className='text-sm font-normal text-stone-500'>
                <th className='text-start p-1.5'>Cliente</th>
                <th className='text-start p-1.5'>UF</th>
                <th className='text-start p-1.5'>Valor</th>
                <th className='text-start p-1.5'>Data Ultima Compra</th>
                <th className='text-start p-1.5'>Data do Orçamento</th>
                <th className='w-8'></th>
            </tr>
        </thead>
    )
}

const TableRow = ({cliente, cgc, uf, valor, dtultcompra, dtultorcamento,}: {cliente: string; cgc: string; uf: string; valor: string; dtultcompra: string; dtultorcamento: string; }) => {
  const getSigla = (nome: string) => {
    const partes = nome.trim().split(" ");
    const primeiraLetra = partes[0]?.[0] || "";
    const segundaLetra = partes[1]?.[0] || "";
    return (primeiraLetra + segundaLetra).toUpperCase();
  };

  const sigla = getSigla(cliente);

    return (<tr className="text-sm text-gray-700">
      <td className="p-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-400 text-white font-bold">
            {sigla}
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
      <td className="w-8">
        <button className='hover:bg-stone-200 transition-colors grid place-content-center rounded text-sm size-8'>
            <FiMoreHorizontal />
        </button>
      </td>
    </tr>);
}