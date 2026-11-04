import fs from "node:fs";import path from "node:path";
const dash=path.join(process.cwd(),"components","Dashboard.tsx"),cssPath=path.join(process.cwd(),"app","globals.css");
let s=fs.readFileSync(dash,"utf8");const imp="import ExecutionWorkspace from '@/components/ExecutionWorkspace';";
if(!s.includes("import ManualOracle from '@/components/ManualOracle';")){if(!s.includes(imp))throw Error("Dashboard import anchor not found; no changes made.");s=s.replace(imp,imp+"import ManualOracle from '@/components/ManualOracle';")}
const a=s.indexOf("{tab==='oracle'&&"),b=s.indexOf("{(tab==='worlds'||tab==='universe')&&",a);
if(a<0||b<0)throw Error("Oracle block anchors not found; no changes made.");
s=s.slice(0,a)+"{tab==='oracle'&&<ManualOracle/>}"+s.slice(b);fs.writeFileSync(dash,s);
const add=fs.readFileSync(path.join(process.cwd(),"GENESIS_FUTURE_INTERFACE.css"),"utf8");let c=fs.readFileSync(cssPath,"utf8");
if(!c.includes("GENESIS FUTURE INTERFACE"))fs.writeFileSync(cssPath,c+"\n\n"+add+"\n");
console.log("Patch applied. Run npm run typecheck and npm run build.");
