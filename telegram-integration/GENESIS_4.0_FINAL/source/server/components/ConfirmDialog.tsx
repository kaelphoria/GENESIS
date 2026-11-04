'use client';
import {useCallback,useEffect,useState,type ReactNode} from 'react';

export type ConfirmOptions={message:string;title?:string;confirmLabel?:string;phrase?:string;danger?:boolean};
type Pending=ConfirmOptions&{resolve:(ok:boolean)=>void};

/** Замена window.confirm/prompt: промис-диалог в стиле GENESIS. phrase — слово, которое нужно ввести. */
export function useConfirm():[(options:ConfirmOptions)=>Promise<boolean>,ReactNode]{
  const [pending,setPending]=useState<Pending|null>(null);
  const [typed,setTyped]=useState('');
  const ask=useCallback((options:ConfirmOptions)=>new Promise<boolean>(resolve=>{setTyped('');setPending({...options,resolve})}),[]);
  const finish=useCallback((ok:boolean)=>{setPending(current=>{current?.resolve(ok);return null})},[]);
  useEffect(()=>{
    if(!pending)return;
    const onKey=(event:KeyboardEvent)=>{if(event.key==='Escape')finish(false)};
    window.addEventListener('keydown',onKey);
    return()=>window.removeEventListener('keydown',onKey);
  },[pending,finish]);
  const allowed=!pending?.phrase||typed===pending.phrase;
  const node=pending?(
    <div className="modal-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget)finish(false)}}>
      <div className="modal gx-confirm" role="alertdialog" aria-modal="true" aria-label={pending.title||'Подтверждение'}>
        <div className="eyebrow">GENESIS / ПОДТВЕРЖДЕНИЕ</div>
        <h2>{pending.title||'Вы уверены?'}</h2>
        <p className="gx-confirm-text">{pending.message}</p>
        {pending.phrase&&<label className="gx-confirm-field">Введи <b>{pending.phrase}</b> для подтверждения<input autoFocus autoComplete="off" autoCapitalize="characters" value={typed} onChange={event=>setTyped(event.target.value)}/></label>}
        <div className="gx-confirm-actions">
          <button type="button" className="text-btn" onClick={()=>finish(false)}>Отмена</button>
          <button type="button" className={pending.danger?'danger-btn':'primary-btn compact'} disabled={!allowed} onClick={()=>finish(true)}>{pending.confirmLabel||'Подтвердить'}</button>
        </div>
      </div>
    </div>
  ):null;
  return [ask,node];
}
