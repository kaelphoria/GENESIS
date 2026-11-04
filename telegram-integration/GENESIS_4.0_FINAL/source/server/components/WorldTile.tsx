'use client';
import {ChevronRight} from 'lucide-react';

type TileWorld={id:string;title:string;description:string;_count?:{actions:number;memories:number}};

export default function WorldTile<W extends TileWorld>({world,index,onSelect}:{world:W;index:number;onSelect:(world:W)=>void}){
  return <button className="world-tile" onClick={()=>onSelect(world)}>
    <div className="world-number">{String(index+1).padStart(2,'0')} <span>WORLD</span></div>
    <div className="world-name">{world.title}</div>
    <p>{world.description}</p>
    <div className="world-bottom"><span>{world._count?.actions||0} ACTIONS · {world._count?.memories||0} NOTES</span><ChevronRight size={15}/></div>
  </button>;
}
