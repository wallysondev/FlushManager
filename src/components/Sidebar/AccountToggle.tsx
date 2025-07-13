import { useState } from 'react'
import Api from '../../services/api'

export const AccountToggle = () => {
    const [username, setUsername] = useState(null);
    const [userrole, setUserrole] = useState(null);

    async function GetUsuario() {
        const token = localStorage.getItem('token');

        if (!token) {
            console.error("Token não encontrado no localStorage.");
            return;
        }

        try {
            const response = await Api.get('usuario', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            });
            
            // response.data.user é referente ao retorno da rota que tras o parametro user no json
            setUsername(response.data.user.nome);// ou use como preferir
            setUserrole(response.data.user.role);// ou use como preferir
            return response.data;
        } catch (error) {
            console.error("Erro na requisição:", error);
            return null;
        }
    }

    GetUsuario();

    return (
        <div className='border-b mb-4 mt-2 pb-4 border-stone-300'>
            <button className='flex p-0.5 hover:bg-stone-200 rouned transition-colors relative gap-2 w-full items-center'>
                <img src='http://localhost:5173/src/assets/logo-shopodonto.svg' alt='avatar' className='size-8 rounded shrink-0 bg-violet-500 shadow' />
                <div className='text-start'>
                    <span className='text-sm font-medium font-semibold block'>
                        {username}
                    </span>
                    <span className='text-xs font-medium block text-stone-500'>
                        {userrole}
                    </span>
                </div>
            </button>
        </div>
    );
}
