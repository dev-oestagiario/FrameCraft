/**
 * NVIDIA Build trial model router.
 * Curated fallback IDs are models marked "Free Endpoint" on build.nvidia.com.
 * GET /v1/models is only a discovery hint, not proof of entitlement or free credits:
 * an actual completion must succeed before a model is considered usable.
 */
export const FREE_TRIAL_CHAT_MODELS = [
  'nvidia/nemotron-3.5-lightning-30b-a3b',
  'nvidia/nemotron-3.5-bolt-e4b',
  'nvidia/nemotron-3.5-super-vl-120b-a12b',
] as const;

export type ModelDiagnostics = {
  mode: 'automatic' | 'preferred';
  selected: string | null;
  candidates: string[];
  catalogAccessible: boolean;
  catalogCheckedAt: number | null;
};

type ResponseChoice = {
  message?: {
    content?: string | Array<{type?:string; text?: string}> | null;
  };
  finish_reason?: string | null;
};
type ResponsePayload = {
  choices?: ResponseChoice[];
  error?: {message?: string};
};

type ChatResult = { content: string; model: string };

type ModelList = { data?: Array<{ id?: string }> };

export class NvidiaError extends Error {
  status: number;
  code: string;
  constructor(message: string, status: number = 502, code = 'upstream_error') {
    super(message);
    this.name = 'NvidiaError';
    this.status = status;
    this.code = code;
  }
}

export function getMessageContent(payload: ResponsePayload): {text: string; finishReason: string} {
  const choice = payload.choices?.[0];
  const content = choice?.message?.content;
  const text = typeof content === 'string'
    ? content.trim()
    : Array.isArray(content)
      ? content.filter(part => part.type === 'text' && typeof part.text === 'string').map(part => part.text).join('\n').trim()
      : '';
  return {text,finishReason:choice?.finish_reason ?? 'unknown'};
}

export function rankCandidates(available: string[], preferred = 'auto', active: string | null = null): string[] {
  const supported = new Set<string>(FREE_TRIAL_CHAT_MODELS);
  const discovered = FREE_TRIAL_CHAT_MODELS.filter(id => available.includes(id) && supported.has(id));
  // Model lists can be incomplete or unavailable. Keep known free-trial IDs as backups.
  return [...new Set([
    ...(active ? [active] : []),
    ...(preferred && preferred !== 'auto' ? [preferred] : []),
    ...discovered,
    ...FREE_TRIAL_CHAT_MODELS,
  ])].filter(Boolean);
}

export class NvidiaRouter {
  private catalogCheckedAt: number | null = null;
  private catalogAccessible = false;
  private availableModels: string[] = [];
  private selectedModel: string | null = null;
  private readonly key: string;
  private readonly baseUrl: string;
  private readonly preferred: string;
  private readonly request: typeof fetch;

  constructor(options: {apiKey?:string; endpoint?:string; preferred?:string; fetcher?:typeof fetch} = {}) {
    this.key = options.apiKey ?? process.env.NVIDIA_API_KEY ?? '';
    const endpoint = options.endpoint ?? process.env.NVIDIA_API_URL ?? 'https://integrate.api.nvidia.com/v1/chat/completions';
    if (!/^https:\/\/integrate\.api\.nvidia\.com\/v1\/chat\/completions$/.test(endpoint) &&
        !/^http:\/\/localhost:\d+\/v1\/chat\/completions$/.test(endpoint)) {
      throw new Error('NVIDIA_API_URL deve ser o endpoint NVIDIA oficial ou um proxy local.');
    }
    this.baseUrl = endpoint;
    this.preferred = options.preferred ?? process.env.NVIDIA_MODEL ?? 'auto';
    this.request = options.fetcher ?? fetch;
  }

  get configured() { return Boolean(this.key); }
  get selected() { return this.selectedModel; }

  diagnostics():ModelDiagnostics {
    return {
      mode: this.preferred === 'auto' ? 'automatic' : 'preferred',
      selected: this.selectedModel,
      candidates: rankCandidates(this.availableModels,this.preferred,this.selectedModel),
      catalogAccessible: this.catalogAccessible,
      catalogCheckedAt: this.catalogCheckedAt,
    };
  }

  async discover(force = false):Promise<ModelDiagnostics> {
    if (!this.configured) return this.diagnostics();
    if (!force && this.catalogCheckedAt && Date.now() - this.catalogCheckedAt < 5*60*1000) return this.diagnostics();
    this.catalogCheckedAt=Date.now();
    try {
      const resp = await this.request(this.baseUrl.replace('/chat/completions','/models'),{
        method:'GET', headers:{Authorization:`Bearer ${this.key}`,Accept:'application/json'},
        signal:AbortSignal.timeout(8000),
      });
      if (!resp.ok) throw new Error(`GET models: ${resp.status}`);
      const json = await resp.json() as ModelList;
      if (!Array.isArray(json.data)) throw new Error('Formato da lista desconhecido');
      this.availableModels = json.data.map(x=>x?.id).filter((id):id is string=>typeof id==='string');
      this.catalogAccessible = true;
    } catch {
      this.catalogAccessible = false;
      this.availableModels = [];
      // Some accounts/gateways do not implement GET /models; still try known endpoints.
    }
    return this.diagnostics();
  }

  private async completion(model:string,system:string,user:string,maxTokens:number, jsonMode:boolean):Promise<ChatResult>{
    const isNemotron = model.includes('nemotron');
    const payload = {
      model, stream:false, temperature:0.35, top_p:0.9,
      max_tokens:maxTokens,
      messages:[{role:'system',content:system},{role:'user',content:user}],
      ...(isNemotron ? {chat_template_kwargs:{enable_thinking:false}} : {}),
      ...(jsonMode ? {response_format:{type:'json_object'}} : {}),
    };
    let resp:Response;
    try {
      resp=await this.request(this.baseUrl,{
        method:'POST',signal:AbortSignal.timeout(60000),
        headers:{Authorization:`Bearer ${this.key}`,'Content-Type':'application/json',Accept:'application/json'},
        body:JSON.stringify(payload),
      });
    } catch(err) {
      const reason=err instanceof Error&&err.name==='TimeoutError'?'tempo limite':'conexão';
      throw new NvidiaError(`O modelo ${model} falhou por ${reason}.`,502,'network');
    }
    const raw=await resp.text();
    if (!resp.ok) {
      let detail='';
      try {detail=(JSON.parse(raw) as ResponsePayload).error?.message??''} catch{/* plain text */}
      const cleanDetail=detail.replace(/[\r\n]+/g,' ').slice(0,180);
      const code = resp.status===401?'invalid_key':resp.status===429?'quota':resp.status===403?'forbidden':'upstream';
      throw new NvidiaError(`HTTP ${resp.status} em ${model}${cleanDetail?`: ${cleanDetail}`:''}`,resp.status,code);
    }
    let decoded:ResponsePayload;
    try {decoded=JSON.parse(raw) as ResponsePayload;} catch {throw new NvidiaError(`O modelo ${model} retornou dados inesperados.`,502,'invalid_response')}
    const {text,finishReason}=getMessageContent(decoded);
    if (!text) {
      const reason=finishReason==='length'?'limite de tokens atingido':'resposta vazia';
      throw new NvidiaError(`${model}: ${reason}, sem texto final.`,502,'empty_content');
    }
    // Models may occasionally emit only thinking without a final response.
    if (/^<think>[\s\S]*$/i.test(text) && !/<\/think>/.test(text)) {
      throw new NvidiaError(`${model}: resposta incompleta de raciocínio.`,502,'empty_content');
    }
    return {content:text,model};
  }

  async chat(system:string,user:string,maxTokens=4000):Promise<ChatResult>{
    if(!this.configured) throw new NvidiaError('Configure NVIDIA_API_KEY no arquivo .env. A chave não pode ficar no frontend.',503,'missing_key');
    await this.discover();
    const candidates=rankCandidates(this.availableModels,this.preferred,this.selectedModel);
    const errors:string[]=[];
    // No credentials are tested against paid-only models. These are known free-trial endpoints.
    // Try at most three candidates so a broken service won't exhaust the trial quota.
    for(const model of candidates.slice(0,3)) {
      let error:NvidiaError | null=null;
      for(const jsonMode of [true,false]) {
        try {
          const response=await this.completion(model,system,user,maxTokens,jsonMode);
          this.selectedModel=model;
          return response;
        } catch(e) {
          error=e instanceof NvidiaError ? e : new NvidiaError('Erro desconhecido na API NVIDIA.');
          // Do not retry JSON/plain modes when credentials or quota is the problem.
          if(error.code==='invalid_key' || error.code==='quota') break;
          // Plain prompting may work if this model rejects response_format.
          if(!(error.status===400 || error.code==='empty_content' || error.code==='invalid_response')) break;
        }
      }
      if(error) errors.push(error.message);
      if (error?.code === 'invalid_key') throw new NvidiaError('Chave NVIDIA inválida. Gere uma nova chave em build.nvidia.com e atualize NVIDIA_API_KEY.',401,'invalid_key');
      if (error?.code === 'quota') throw new NvidiaError('A NVIDIA limitou as chamadas ou a cota gratuita acabou (HTTP 429). Aguarde a liberação da cota.',429,'quota');
      if(this.selectedModel === model) this.selectedModel = null;
    }
    throw new NvidiaError(`Nenhum modelo gratuito respondeu corretamente com esta chave. ${errors.join(' | ').slice(0,650)}`,502,'no_model');
  }
}
