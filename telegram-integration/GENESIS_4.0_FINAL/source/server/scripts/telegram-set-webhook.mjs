const token=process.env.TELEGRAM_BOT_TOKEN,secret=process.env.TELEGRAM_WEBHOOK_SECRET,url=process.env.APP_URL;if(!token||!secret||!url?.startsWith('https://')){console.error('Set TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET and HTTPS APP_URL.');process.exit(1);}const r=await fetch(`https://api.telegram.org/bot${token}/setWebhook`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({url:`${url.replace(/\/$/,'')}/api/telegram/webhook`,secret_token:secret,allowed_updates:['message']})});const d=await r.json();if(!r.ok||!d.ok){console.error('Webhook registration failed:',d.description||r.status);process.exit(1);}console.log('Telegram webhook registered.');
// Нативные точки входа бота: меню команд и кнопка запуска Mini App.
try{
  const post=(method,payload)=>fetch(`https://api.telegram.org/bot${token}/${method}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)}).then(r=>r.json());
  await post('setMyCommands',{commands:[{command:'start',description:'Открыть GENESIS'},{command:'open',description:'Открыть Mini App'},{command:'help',description:'Помощь'}]});
  await post('setChatMenuButton',{menu_button:{type:'web_app',text:'GENESIS',web_app:{url:`${url.replace(/\/$/,'')}/telegram`}}});
  console.log('Telegram commands and menu button configured.');
}catch(error){console.error('Optional Telegram UI setup skipped:',error instanceof Error?error.message:'UNKNOWN_ERROR')}
