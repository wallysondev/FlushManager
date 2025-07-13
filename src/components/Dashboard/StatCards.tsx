import React from 'react'

export const StatCards = () => {
  return (
    <>
      <div className='col-span-12'>
        <div className='flex items-center justify-between'>
          <h3 className='flex items-center gap-1.5 text-[30px] font-bold text-stone-400'>
            Resumo de operações do dia
          </h3>
          {/* Você pode manter o Search ou outro conteúdo aqui, se houver */}
        </div>

        <p className="mb-2 text-sm text-gray-500">
          Total de orçamentos realizados!
        </p>
      </div>

      <Card title='Orçamentos' value='0' pilltext='Em pedidos' color='bg-green-300'/>
      <Card title='Orçamentos' value='0' pilltext='Em andamento' color='bg-orange-300'/>
      <Card title='Orçamentos' value='0' pilltext='Cancelados' color='bg-red-300'/>
      <Card title='Orçamentos' value='0' pilltext='Digitados' color='bg-neutral-300' />
    </>
  )
}

const Card = ({title, value, pilltext, color,}: {
    title: string;
    value: string;
    pilltext: string;
    color: string;
}) => {
    return <div className= {`col-span-3 p-5 rounded ${color}`}>
      <div className='flex mb-8 items-start justify-between'>
        <div>
          <h3 className='text-shadow-2xs text-stone-50 font-bold text-sm'>{title}</h3>
          <h5 className='text-shadow-2xs text-[30px] text-stone-50 font-semibold'>{pilltext}</h5>
          <p className='text-shadow-2xs text-[50px] text-stone-50 align-center font-semibold'>{value}</p>
        </div>

      </div>

    </div>
}