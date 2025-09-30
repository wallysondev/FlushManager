import React, { useState, useEffect  } from 'react';
import { BsFillTrashFill, BsArrowLeft, BsCheck } from "react-icons/bs";
import { AiFillMinusSquare, AiFillPlusSquare  } from "react-icons/ai";
import { MdRestore } from 'react-icons/md'; 
import { useNavigate } from 'react-router-dom';
import Api from '../../services/api'
import BotaoFlutuante from '../../components/Dashboard/BotaoFlutuante';
import { SCREENS } from '../../utils/Permissoes';
import { jwtDecode } from 'jwt-decode';

export const OrcamentoDetail = ({ orcamento }) => {
  const navigate = useNavigate();

  const [cab, setCabecalho] = useState(orcamento.cabecalho);
  const [itens, setItens] = useState(orcamento.itens || []);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // cálculo de paginação
  const totalPages = Math.ceil(itens.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItens = itens.slice(startIndex, endIndex);

  // Dentro do seu componente
  useEffect(() => {
    const valorTotalAtualizado = itens
      .filter(i => i.excluido !== "S")
      .reduce((acc, i) => acc + i.pvenda * i.quantia, 0);

    setCabecalho(prev => ({
      ...prev,
      vltotal: valorTotalAtualizado
    }));
  }, [itens]);

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

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  async function AprovarOrcamento(action, numorca){
    try {
      const dados = {
        numorca: numorca,
        aprovado: action // ou "N" se for restaurar
      };

      const token = localStorage.getItem('token');
      
      if (!token) throw new Error('Token não encontrado, faça login.');

      const res = await Api.patch('/Orcamento/cabecalho', dados, {
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
      });

      if (res.status !== 200) {
        throw new Error("Erro ao atualizar item.");
      }
      
      setCabecalho(prev => ({
        ...prev,
        aprovado: action
      }));

    } catch (err) {
      console.error(err);
    }
  }

  function GoToOrcamentos(){
    navigate(`/Principal`);
  }

  async function UpdateProduct(numorca, codprod, status, quantia) {
    try {
      const dados = {
        Numorca: numorca,
        Codprod: codprod,
        Excluido: status,
        Quantidade: quantia,
      };

      const token = localStorage.getItem('token');
      if (!token) throw new Error('Token não encontrado, faça login.');

      const res = await Api.patch('/Orcamento/item', dados, {
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
      });

      if (res.status !== 200) {
        throw new Error("Erro ao atualizar item.");
      }

      // 👉 Atualiza estado local
      setItens(prev =>
        prev.map(i =>
          i.numorca === numorca && i.codprod === codprod
            ? { ...i, excluido: status, quantia: quantia }
            : i
        )
      );
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <>
    <BotaoFlutuante onAction={(action) => AprovarOrcamento(action, cab.numorca)}  status = {cab.aprovado}/>

    <div className="rounded-xl min-h-screen">
      {/* Botão de retornar */}
      <div className="mb-4">
        <button onClick={GoToOrcamentos}  className="flex items-center gap-2 text-smpx-4 bg-sky-600 text-white px-4 py-2 hover:bg-sky-700">
          <BsArrowLeft /> Voltar
        </button>
      </div>
      <div className="bg-stone-50 rounded-xl shadow-lg min-h-screen p-6">
        <div className="w-full table-auto border-collapse bg-white rounded-xl p-8 shadow mb-6">
          <h1 className="text-2xl font-bold mb-4">Orçamento #{cab.numorca}</h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
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
            <div><strong>Valor de Entrada:</strong> R$ {cab.vlentrada.toFixed(2)}</div>
            <div><strong>% Desconto:</strong> {cab.perdesc.toFixed(2)}</div>
            <div><strong>Valor Total:</strong> R$ {cab.vltotal.toFixed(2)}</div>
          </div>
        </div>

        {/* Itens */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold mb-4">Itens do Orçamento</h2>
          <div className="overflow-x-auto">
            <table className="mx-auto w-full whitespace-nowrap rounded-lg bg-white divide-y divide-gray-300 overflow-hidden">
              <thead>
                <tr className="bg-stone-200 text-left text-sm font-semibold text-gray-700">
                  <th className="font-semibold text-sm uppercase px-6 py-4">Produto</th>
                  <th className="font-semibold text-sm uppercase px-6 py-4">Quantidade</th>
                  <th className="font-semibold text-sm uppercase px-6 py-4">Preço Venda</th>
                  <th className="font-semibold text-sm uppercase px-6 py-4">Preço Tabela</th>
                  <th className="font-semibold text-sm uppercase px-6 py-4">Data</th>
                  <th className="font-semibold text-sm uppercase px-6 py-4">Acao</th>
                </tr>
              </thead>
              <tbody>
                {itens.length > 0 ? (
                  itens.map((item, index) => {
                    const isExcluido = item.excluido === "S";
                    return (
                      <tr key={index} className={isExcluido ? "line-through text-gray-400" : ""}>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="inline-flex w-10 h-10">
                              <img 
                                className='w-10 h-10 object-cover rounded-full' 
                                alt={item.imagem} 
                                src={`/imagens/produtos/${item.imagem}`} 
                              />
                            </div>
                            <div>
                              <p>{item.descricao}</p>
                              <p className="text-gray-500 text-sm font-semibold tracking-wide">
                                {item.marca}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {!isExcluido && rolePermissao.find(p => p.permissao === SCREENS.ALTERARQUANTIDADE && p.status === 'A') && cab.aprovado === 'P' ? (
                            <input
                              type="text"
                              inputMode="numeric"   // abre teclado numérico em mobile
                              pattern="[0-9]*"      // força só números
                              className="w-20 rounded text-center text-sm border border-indigo-300 focus:outline-indigo-500 "
                              min={1}
                              value={item.quantia}
                              onChange={(e) => {
                                const novaQuantia = Math.max(Number(e.target.value.replace(/\D/g, "")), 1);
                                UpdateProduct(item.numorca, item.codprod, item.excluido, novaQuantia);
                              }}
                            />
                          ) : (
                            <span>{item.quantia}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">R$ {item.pvenda.toFixed(2)}</td>
                        <td className="px-6 py-4 text-center">R$ {item.ptabela.toFixed(2)}</td>
                        <td className="px-6 py-4 text-center">{formatDate(item.data)}</td>
                        <td className="px-6 py-4 text-center">
                          {!isExcluido && cab.aprovado?.toUpperCase() === "P" ? (rolePermissao.find(p => p.permissao === SCREENS.REMOVERPRODUTOS && p.status === 'A') &&
                            <button
                              onClick={() => UpdateProduct(item.numorca, item.codprod, 'S', item.quantia)}
                              className="text-xs uppercase font-semibold bg-red-400 text-white px-4 py-2 hover:bg-red-500"
                            >
                              <BsFillTrashFill />
                            </button>
                          ) : (isExcluido && cab.aprovado?.toUpperCase() === "P"  && rolePermissao.find(p => p.permissao === SCREENS.REATIVARPRODUTOS && p.status === 'A') &&
                            <button
                              onClick={() => UpdateProduct(item.numorca, item.codprod, 'N', item.quantia)}
                              className="text-xs uppercase font-semibold bg-green-400 text-white px-4 py-2 hover:bg-green-500"
                            >
                              <MdRestore />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
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
    </div>
    </>
  );
};
