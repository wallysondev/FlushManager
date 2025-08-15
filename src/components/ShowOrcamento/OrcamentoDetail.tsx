import React from 'react';

export const OrcamentoDetail = ({ orcamento }) => {
  const cab = orcamento.cabecalho; // objeto único
  const itens = orcamento.itens || [];

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  return (
    <div className="bg-stone-50 rounded-xl shadow-lg min-h-screen p-6">
      <div className="w-full table-auto border-collapse bg-white rounded-xl p-8 shadow mb-6">
        <h1 className="text-2xl font-bold mb-4">Orçamento #{cab.numorca}</h1>

        <div className="grid grid-cols-4 gap-1 mb-10">
          <div><strong>Código Cliente:</strong> {cab.codcli}</div>
          <div><strong>Data:</strong> {formatDate(cab.data)}</div>
          <div><strong>Validade:</strong> {formatDate(cab.dtvalidade)}</div>
          <div><strong>Data Última Compra:</strong> {formatDate(cab.dtulpedido)}</div>
          <div><strong>Cliente:</strong> {cab.cliente}</div>
          <div><strong>CPF/CNPJ:</strong> {cab.cnpj}</div>
          <div><strong>Endereço:</strong> {cab.endereco}</div>
          <div><strong>UF:</strong> {cab.estado}</div>
          <div><strong>Bairro:</strong> {cab.bairro}</div>
          <div><strong>Telefone:</strong> {cab.telefone}</div>
          <div><strong>IE:</strong> {cab.ie}</div>
          <div><strong>Cidade:</strong> {cab.cidade}</div>
          <div><strong>Origem Pedido:</strong> {cab.origemped}</div>
          <div><strong>Código Cob:</strong> {cab.codcob}</div>
          <div><strong>Cód. Plano Pagamento:</strong> {cab.codplpag}</div>
          <div><strong>Observação:</strong> {cab.obs}</div>
        </div>
        <div className="ml-auto grid grid-cols-1 gap-1 text-right">
          <div><strong>Valor de Entrada:</strong> R$ {cab.vlentrada}</div>
          <div><strong>% Desconto:</strong> {cab.perdesc}</div>
          <div><strong>Valor Total:</strong> R$ {cab.vltotal}</div>
        </div>
      </div>

      {/* Itens */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-bold mb-4">Itens do Orçamento</h2>
        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="bg-stone-200 text-left text-sm font-semibold text-gray-700">
                <th className="p-2 border">Produto</th>
                <th className="p-2 border">Quantidade</th>
                <th className="p-2 border">Preço Venda</th>
                <th className="p-2 border">Preço Tabela</th>
                <th className="p-2 border">Data</th>
                <th className="p-2 border">Posição</th>
              </tr>
            </thead>
            <tbody>
              {itens.length > 0 ? (
                itens.map((item, index) => (
                  <tr key={index} className="text-sm text-gray-700 hover:bg-stone-50">
                    <td className="p-2 border">{item.descricao}</td>
                    <td className="p-2 border">{item.quantia}</td>
                    <td className="p-2 border">R$ {item.pvenda.toFixed(2)}</td>
                    <td className="p-2 border">R$ {item.ptabela.toFixed(2)}</td>
                    <td className="p-2 border">{formatDate(item.data)}</td>
                    <td className="p-2 border">{item.posicao}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={14} className="p-4 text-center text-gray-500">
                    Nenhum item encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
