'use client';
import {useCallback,useEffect,useRef,useState,type ReactNode} from 'react';

export type ConfirmOptions={message:string;title?:string;confirmLabel?:string;phrase?:string;danger?:boolean};
type Pending=ConfirmOptions&{resolve:(ok:boolean)=>void};

export function useConfirm():[(options:ConfirmOptions)=>Promise<boolean>,ReactNode]{
  const [pending,setPending]=useState<Pending|null>(null);
  const [typed,setTyped]=useState('');
  const restoreRef=useRef<HTMLElement|null>(null);
  const dialogRef=useRef<HTMLDivElement|null>(null);

  const ask=useCallback((options:ConfirmOptions)=>new Promise<boolean>(resolve=>{
    setPending(current=>{current?.resolve(false);return null;});
    restoreRef.current=document.activeElement instanceof HTMLElement?document.activeElement:null;
    setTyped('');
    setPending({...options,resolve});
  }),[]);

  const finish=useCallback((ok:boolean)=>{
    setPending(current=>{current?.resolve(ok);return null;});
  },[]);

  useEffect(()=>{
    if(!pending)return;
    const dialog=dialogRef.current;
    const initial=dialog?.querySelector<HTMLElement>('.gx-confirm-field input')
      ||dialog?.querySelector<HTMLElement>('.gx-confirm-actions button:not([disabled])');
    (initial||dialog)?.focus();
    const onKey=(event:KeyboardEvent)=>{
      if(event.key==='Escape'){event.preventDefault();finish(false);return;}
      if(event.key!=='Tab'||!dialog)return;
      const items=[...dialog.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled])')]
        .filter(el=>el.offsetParent!==null);
      if(!items.length){event.preventDefault();dialog.focus();return;}
      const first=items[0],last=items[items.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    };
    window.addEventListener('keydown',onKey);
    return()=>{
      window.removeEventListener('keydown',onKey);
      restoreRef.current?.focus?.();
    };
  },[pending,finish]);

  const allowed=!pending?.phrase||typed===pending.phrase;
  const node=pending?(
    <div className="modal-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget)finish(false)}}>
      <div ref={dialogRef} tabIndex={-1} className="modal gx-confirm" role="alertdialog" aria-modal="true" aria-label={pending.title||'Подтверждение'}>
        <div className="eyebrow">GENESIS / ПОДТВЕРЖДЕНИЕ</div>
        <h2>{pending.title||'Вы уверены?'}</h2>
        <p className="gx-confirm-text">{pending.message}</p>
        {pending.phrase&&<label className="gx-confirm-field">Введи <b>{pending.phrase}</b> для подтверждения<input autoComplete="off" autoCapitalize="characters" value={typed} onChange={event=>setTyped(event.target.value)}/></label>}
        <div className="gx-confirm-actions">
          <button type="button" className="text-btn" onClick={()=>finish(false)}>Отмена</button>
          <button type="button" className={pending.danger?'danger-btn':'primary-btn compact'} disabled={!allowed} onClick={()=>finish(true)}>{pending.confirmLabel||'Подтвердить'}</button>
        </div>
      </div>
    </div>
  ):null;
  return [ask,node];
}
