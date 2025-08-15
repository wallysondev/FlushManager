import { useState, useEffect } from 'react'; // Importe useEffect
import Api from '../../services/api';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

export const AccountToggle = () => {
    const navigate = useNavigate();
    
    // Inicialize os estados com valores nulos para evitar erros na primeira renderização
    const [username, setUsername] = useState(null);
    const [userrole, setUserrole] = useState(null);

    // Use o useEffect para executar a lógica de decodificação do token
    useEffect(() => {
        const token = localStorage.getItem('token');

        // verifica se o token nao existe mais
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            // Decodifica o token
            const decodedToken = jwtDecode(token);

            // Atualiza os estados com os dados do token
            setUsername(decodedToken.unique_name);
            setUserrole(decodedToken.role);

        } catch (error) {
            console.error("Falha ao decodificar o token:", error);
            // Se o token for inválido, redirecione para o login
            navigate('/login');
        }

    }, [navigate]); // O array de dependências garante que o efeito só rode quando o 'navigate' mudar

    // Se username ainda for null, você pode renderizar um estado de carregamento
    if (!username) {
        return <div>Carregando...</div>;
    }

    return (
        <div className='border-b mb-4 mt-2 pb-4 border-stone-300'>
            <button className='flex p-0.5 hover:bg-stone-200 rouned transition-colors relative gap-2 w-full items-center'>
                <img src='http://localhost:5173/src/assets/logo-shopodonto.svg' alt='avatar' className='size-8 rounded shrink-0 bg-violet-500 shadow' />
                <div className='text-start'>
                    <span className='text-sm font-medium block'>
                        {username}
                    </span>
                    <span className='text-xs font-medium block text-stone-500'>
                        {userrole}
                    </span>
                </div>
            </button>
        </div>
    );
};