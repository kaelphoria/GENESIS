import {NextResponse} from 'next/server';
import {db} from '@/lib/db';
export const runtime='nodejs';
export async function GET(){try{await db.$queryRaw`SELECT 1`;return NextResponse.json({status:'ok',database:'reachable',aiConfigured:Boolean(process.env.OPENAI_API_KEY)},{headers:{'Cache-Control':'no-store'}})}catch{return NextResponse.json({status:'degraded',database:'unavailable',aiConfigured:Boolean(process.env.OPENAI_API_KEY)},{status:503,headers:{'Cache-Control':'no-store'}})}}
