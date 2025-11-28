import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';


import './style.css';
import { Sidebar } from '../../components/Sidebar/Sidebar';
import { OrcamentoDetail } from '../../components/ShowOrcamento/OrcamentoDetail';
import Api from '../../services/api';

function VisualizarOrcamento() {
  const { numorca } = useParams(); // pega o parâmetro da URL
  const navigate = useNavigate();
  const [orcamento, setOrcamento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchOrcamento() {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Token não encontrado, faça login.');

        // 1 - Buscar orçamento
        const response = await Api.get(`/Orcamento/${numorca}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const data = response.data;
        if (!data.cabecalho) throw new Error('Orçamento não encontrado.');

        // 2 - Buscar observação do pedido (tratando 404)
        let observacao = null;
        try {
          const obsResponse = await Api.get(`/Orcamento/Obs/${numorca}`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          observacao = obsResponse.data?.observacao || null;

        } catch (err) {
          // Se a API retornou 404, continuar normalmente
          if (err.response?.status === 404) {
            observacao = null;
          } else {
            throw err; // outros erros devem ser tratados como erros reais
          }
        }

        // 3 - Buscar todos os produtos
        const resProd = await Api.get(`/produto`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const produtosJson = resProd.data;
        if (!produtosJson.produtos) throw new Error('Lista de produtos não encontrada.');
        const produtos = produtosJson.produtos;

        // 4 - Atualizar itens com descrição do produto
        const Itens = data.itens;
        const itensAtualizados = Itens?.map(item => {
          const produto = produtos.find(p => p.codprod === item.codprod);
          return { ...item, descricao: produto ? produto.descricao : '' };
        }) || [];

        // 5 - Agora adicionamos a OBS no objeto do orçamento
        setOrcamento({ 
          ...data, 
          itens: itensAtualizados,
          observacao: observacao
        });

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchOrcamento();
  }, [numorca]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">      
        <button type="button" className="bg-sky-500 text-white font-bold py-2 px-4 rounded flex items-center" disabled >
          <svg className="animate-spin h-5 w-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Carregando...
        </button>
      </div>
    );
  }


  if (error) {
    return (
      <div className="p-4 text-red-600">
        <p>Erro: {error}</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Voltar
        </button>
      </div>
    );
  }

  if (!orcamento) {
    return (
      <div className="p-4">
        <p>Orçamento não encontrado.</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Voltar
        </button>
      </div>
    );
  }

  // Exemplo de exibição simples
  return (
    <main className="grid grid-cols-[220px_1fr] gap-4 p-4">
      <Sidebar />
      <OrcamentoDetail orcamento={orcamento} />
    </main>
  );
}

export default VisualizarOrcamento;
