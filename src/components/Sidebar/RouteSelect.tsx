import React from 'react';
import { IconType } from 'react-icons'
import { AiOutlineImport, AiOutlineLogout  } from "react-icons/ai";
import { useNavigate } from "react-router-dom";

import { FiHome } from 'react-icons/fi';

export const RouteSelect = () => {
    const navigate = useNavigate();

    function SingOut(){
        localStorage.removeItem("token");
        navigate("/login");
    }

    return (
        <div className='space-y-1'>
            <Route Icon={FiHome} selected={true} title="Resumo" />
            <Route Icon={AiOutlineImport } selected={false} title="Importar Pedido" />
            <Route Icon={AiOutlineLogout } selected={false} title="Sair" onClick={SingOut} />
        </div>
    );
}

const Route = ({selected, Icon, title, onClick }:{
    selected: boolean;
    Icon: IconType;
    title: string;
    onClick?: () => void;
}) => {
    return (<button onClick={onClick} className={`flex items-center justify-start gap-2 w-full rounded px-2 py-1.5 text-sm transition-[box-shadow, _background-color, _color] ${
        selected? 'bg-white font-medium text-stone-950 shadow':'hover:bg-stone-200 bg-transparent text-stone-500 shadow-none'
    }`}>
        <Icon className={selected ? 'text-violet-500' :''} />
        <span>{title}</span>
    </button>);
}