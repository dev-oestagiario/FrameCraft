import {describe,expect,it} from 'vitest';
import {NvidiaRouter, getMessageContent, rankCandidates} from '../server/nvidia';

function json(data:unknown,status=200):Response{return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json'}})}

describe('NVIDIA automatic free-trial model routing',()=>{
 it('extracts plain and segmented text, never reasoning_content',()=>{
   expect(getMessageContent({choices:[{message:{content:'{"ok":true}'},finish_reason:'stop'}]}).text).toBe('{"ok":true}');
   expect(getMessageContent({choices:[{message:{content:[{type:'text',text:'abc'}]}}]}).text).toBe('abc');
   expect(getMessageContent({choices:[{message:{content:null}}]}).text).toBe('');
 });
 it('keeps only curated free-trial models from discovery',()=>{
   expect(rankCandidates(['paid/unsupported','nvidia/nemotron-3.5-lightning-30b-a3b'])[0]).toBe('nvidia/nemotron-3.5-lightning-30b-a3b');
 });
 it('chooses another model when the first model produces empty content',async()=>{
   const calls:string[]=[];
   const fake:typeof fetch=async (_url, init)=>{
     if(init?.method==='GET')return json({data:[{id:'nvidia/nemotron-3.5-lightning-30b-a3b'},{id:'nvidia/nemotron-3.5-bolt-e4b'}]});
     const body=JSON.parse(String(init?.body)) as {model:string;chat_template_kwargs?:{enable_thinking:boolean}};
     calls.push(body.model);
     expect(body.chat_template_kwargs?.enable_thinking).toBe(false);
     if(body.model.includes('lightning'))return json({choices:[{message:{content:''},finish_reason:'length'}]});
     return json({choices:[{message:{content:'{"result":true}'},finish_reason:'stop'}]});
   };
   const router=new NvidiaRouter({apiKey:'test-secret',fetcher:fake});
   const result=await router.chat('json only','hello',700);
   expect(result.model).toContain('bolt');
   expect(router.selected).toContain('bolt');
   expect(calls.length).toBe(3);
 });
 it('retries a model without response_format when the backend rejects JSON mode',async()=>{
   const calls:unknown[]=[];
   const fake:typeof fetch=async (_url, init)=>{
     if(init?.method==='GET')return json({data:[]});
     const body=JSON.parse(String(init?.body)) as {response_format?:unknown};
     calls.push(body.response_format);
     return body.response_format
       ? json({error:{message:'unsupported response_format'}},400)
       : json({choices:[{message:{content:'{"ok":true}'}}]});
   };
   const router=new NvidiaRouter({apiKey:'test-secret',fetcher:fake});
   const result=await router.chat('json only','hello',700);
   expect(result.content).toBe('{"ok":true}');
   expect(calls).toHaveLength(2);
 });
 it('does not quietly switch to an unavailable paid model',async()=>{
   const router=new NvidiaRouter({apiKey:'',preferred:'auto'});
   await expect(router.chat('system','test')).rejects.toThrow('NVIDIA_API_KEY');
 });
});
