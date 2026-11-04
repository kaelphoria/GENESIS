'use client';
import { useEffect, useState } from 'react';
export default function TelegramMiniApp(){
 const [status,setStatus]=useState('Проверяем защищённое соединение');
 const [failed,setFailed]=useState(false);
 useEffect(()=>{
  let cancelled=false;
  const fail=(message:string)=>{if(!cancelled){setFailed(true);setStatus(message)}};
  const authenticate=async()=>{
   const tg=window.Telegram?.WebApp;
   if(!tg?.initData){fail('Открой GENESIS через приватного Telegram-бота.');return}
   tg.ready?.();tg.expand?.();tg.setHeaderColor?.('#090a0c');tg.setBackgroundColor?.('#090a0c');
   tg.HapticFeedback?.impactOccurred?.('light');
   try{
    const response=await fetch('/api/telegram/auth',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({initData:tg.initData}),credentials:'same-origin',cache:'no-store'});
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(data.error||'Не удалось подтвердить доступ.');
    if(!cancelled){setStatus('Доступ подтверждён. Загружаем твоё пространство');window.location.replace('/')}
   }catch(error){fail(error instanceof Error?error.message:'Ошибка безопасного входа.')}
  };
  const existing=document.querySelector<HTMLScriptElement>('script[data-telegram-webapp]');
  if(window.Telegram?.WebApp)void authenticate();
  else if(existing)existing.addEventListener('load',authenticate,{once:true});
  else{
   const script=document.createElement('script');script.src='https://telegram.org/js/telegram-web-app.js';script.async=true;script.dataset.telegramWebapp='true';
   script.onload=()=>void authenticate();script.onerror=()=>fail('Не удалось загрузить защищённый модуль Telegram.');document.head.appendChild(script);
  }
  return()=>{cancelled=true};
 },[]);
 return <main className="tg-gate"><div className="tg-gate-glow"/><section className="tg-gate-card">
  <div className="tg-gate-orbit"><span/><i/><b/></div><div className="tg-gate-kicker">PRIVATE INTELLIGENCE SYSTEM</div>
  <div className="tg-gate-wordmark">GENESIS</div><div className="tg-gate-rule"/>
  <div className={'tg-gate-indicator'+(failed?' error':'')}/>
  <p aria-live="polite">{status}</p>{failed&&<button className="tg-gate-retry" onClick={()=>window.location.reload()}>Повторить подключение</button>}
  <small>SECURE TELEGRAM SESSION · PRIVATE ACCESS</small>
 </section></main>
}
