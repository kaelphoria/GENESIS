import {requireSameOrigin} from "@/lib/request-security";
import {NextRequest,NextResponse} from "next/server";
import {apiUser,jsonError} from "@/lib/auth";
import {db} from "@/lib/db";
function titleOf(s:string){const t=s.replace(/\s+/g," ").trim();return t.length>64?t.slice(0,61)+"…":t||"Новый диалог"}
export async function POST(req:NextRequest){
 const originFailure=requireSameOrigin(req);if(originFailure)return originFailure;
 const user=await apiUser(req);if(!user)return jsonError("Требуется вход.",401);
 try{
  const b=await req.json(),conversationId=typeof b.conversationId==="string"?b.conversationId:"",role=b.role==="assistant"||b.role==="user"?b.role:"",content=typeof b.content==="string"?b.content.trim():"";
  if(!conversationId||!role||!content||content.length>50000)return jsonError("Проверь диалог и текст сообщения. Максимум — 50 000 символов.",400);
  const conversation=await db.conversation.findFirst({where:{id:conversationId,userId:user.id},select:{id:true,title:true}});
  if(!conversation)return jsonError("Диалог не найден.",404);
  const message=await db.$transaction(async tx=>{
   const created=await tx.chatMessage.create({data:{userId:user.id,conversationId,role,content}});
   await tx.conversation.update({where:{id:conversationId},data:{updatedAt:new Date(),...(conversation.title==="Новый диалог"&&role==="user"?{title:titleOf(content)}:{})}});
   await tx.auditEvent.create({data:{userId:user.id,event:role==="user"?"MANUAL_ORACLE_PROMPT_SAVED":"MANUAL_ORACLE_REPLY_SAVED",metadata:{conversationId,messageId:created.id}}});
   return created;
  });
  return NextResponse.json({message},{status:201,headers:{"Cache-Control":"no-store"}});
 }catch(error){console.error("GENESIS manual chat save error",error);return jsonError("Не удалось сохранить сообщение.",500)}
}
