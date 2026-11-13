/** Passwordless email session using Supabase Auth REST.
 * Uses a PUBLIC publishable API key; NVIDIA credentials stay in Supabase Edge secrets.
 */
export const AUTH_URL='https://dtvbphnoqkbxlwdiivvv.supabase.co';
const API_KEY='sb_publishable_cSZm04y5hoZhfS_AaHl6jA_M8l0qTom';
const STORE='framecraft.auth.dtvbphnoqkbxlwdiivvv.v1';
export type AuthSession={
 access_token:string;refresh_token:string;expires_at:number;
 user:{id:string;email:string};
};
type Tokens={access_token:string;refresh_token:string;expires_in:number};
let cached:AuthSession|null=null;
const observers=new Set<(session:AuthSession|null)=>void>();
const headers={'apikey':API_KEY,'Content-Type':'application/json'};
function notify(){for(const callback of observers)callback(cached)}
function load():AuthSession|null{
 if(typeof window==='undefined')return null;
 try{const raw=localStorage.getItem(STORE);return raw?JSON.parse(raw) as AuthSession:null}catch{return null}
}
function setSession(s:AuthSession|null){
 cached=s;
 if(typeof window!=='undefined'){try{if(s)localStorage.setItem(STORE,JSON.stringify(s));else localStorage.removeItem(STORE)}catch{/* browser storage disabled */}}
 notify();
}
async function userFor(token:string):Promise<{id:string;email:string}|null>{
 const result=await fetch(AUTH_URL+'/auth/v1/user',{headers:{...headers,Authorization:'Bearer '+token},signal:AbortSignal.timeout(9000)});
 if(!result.ok)return null;
 const value=await result.json() as {id?:string;email?:string;email_confirmed_at?:string};
 return value.id&&value.email&&value.email_confirmed_at?{id:value.id,email:value.email}:null;
}
async function acceptTokens(tokens:Tokens):Promise<AuthSession>{
 const user=await userFor(tokens.access_token);
 if(!user)throw new Error('Sessão de e-mail não confirmada ou inválida.');
 const session={access_token:tokens.access_token,refresh_token:tokens.refresh_token,
  expires_at:Math.floor(Date.now()/1000)+tokens.expires_in,user};
 setSession(session);
 return session;
}
async function refresh(session:AuthSession):Promise<AuthSession|null>{
 try{
  const response=await fetch(AUTH_URL+'/auth/v1/token?grant_type=refresh_token',{
   method:'POST',headers,body:JSON.stringify({refresh_token:session.refresh_token}),signal:AbortSignal.timeout(9000)
  });
  if(!response.ok)throw new Error('Não foi possível renovar a sessão.');
  const tokens=await response.json() as Tokens;
  return await acceptTokens(tokens);
 }catch{setSession(null);return null}
}
export const auth={
 subscribe(cb:(session:AuthSession|null)=>void){observers.add(cb);return()=>observers.delete(cb)},
 async init():Promise<AuthSession|null>{
  if(typeof window==='undefined')return null;
  const params=new URLSearchParams(window.location.hash.replace(/^#/,''));
  const access_token=params.get('access_token'),refresh_token=params.get('refresh_token');
  if(access_token&&refresh_token){
   const expires_in=Number(params.get('expires_in')||3600);
   // Remove credentials from the URL before performing network calls.
   window.history.replaceState(null,'',window.location.pathname+window.location.search);
   try{return await acceptTokens({access_token,refresh_token,expires_in:Number.isFinite(expires_in)?expires_in:3600})}
   catch{setSession(null);return null}
  }
  cached=load();
  if(!cached){notify();return null}
  if(cached.expires_at<=Math.floor(Date.now()/1000)+90)return await refresh(cached);
  const verified=await userFor(cached.access_token).catch(()=>null);
  if(!verified){setSession(null);return null}
  cached={...cached,user:verified};notify();return cached;
 },
 async sendLink(email:string):Promise<void>{
  const clean=email.trim().toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean))throw new Error('Informe um e-mail válido.');
  const redirect=window.location.origin+import.meta.env.BASE_URL;
  const url=AUTH_URL+'/auth/v1/otp?redirect_to='+encodeURIComponent(redirect);
  const response=await fetch(url,{method:'POST',headers,body:JSON.stringify({email:clean,create_user:true})});
  if(!response.ok){
   const body=await response.json().catch(()=>({})) as {msg?:string;message?:string};
   throw new Error(body.msg||body.message||'Não foi possível enviar o e-mail de acesso.');
  }
 },
 async getToken():Promise<string|null>{
  const session=cached||load();
  if(!session)return null;
  if(session.expires_at<=Math.floor(Date.now()/1000)+90)return (await refresh(session))?.access_token||null;
  return session.access_token;
 },
 async signOut(){
  const token=await this.getToken();
  if(token)await fetch(AUTH_URL+'/auth/v1/logout',{method:'POST',headers:{...headers,Authorization:'Bearer '+token}}).catch(()=>null);
  setSession(null);
 }
};
