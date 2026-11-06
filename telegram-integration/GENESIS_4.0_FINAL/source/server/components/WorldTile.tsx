'use client';
import {ChevronRight} from 'lucide-react';

type TileWorld={id:string;title:string;description:string;intention?:string;_count?:{actions:number;memories:number}};

export default function WorldTile<W extends TileWorld>({world,index,onSelect}:{world:W;index:number;onSelect:(world:W)=>void}){
  const actions=world._count?.actions||0;
  const memories=world._count?.memories||0;
  return <button className="world-tile" onClick={()=>onSelect(world)} aria-label={world.title+'. '+actions+' действий, '+memories+' записей'}>
    <div className="world-number">{String(index+1).padStart(2,'0')} <span>WORLD</span></div>
    <div className="world-name">{world.title}</div>
    <p>{world.description}</p>
    <div className="world-bottom"><span>{actions} ACTIONS · {memories} NOTES</span><ChevronRight size={15} aria-hidden="true"/></div>
  </button>;
}
