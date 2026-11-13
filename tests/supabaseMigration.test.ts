import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
const read=(path:string)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const REF='dtvbphnoqkbxlwdiivvv';
const OLD='kbezscxuhqculdvraqun';

describe('Supabase migration to FrameCraft dedicated project',()=>{
 it('uses new project for passwordless login',()=>{
  const auth=read('src/lib/auth.ts');
  expect(auth).toContain('https://'+REF+'.supabase.co');
  expect(auth).toContain("framecraft.auth."+REF+".v1");
  expect(auth).not.toContain(OLD);
  expect(auth).toContain('sb_publishable_');
 });
 it('deploys frontend to the correct Edge Function, without override from stale GitHub variable',()=>{
  const workflow=read('.github/workflows/pages.yml');
  expect(workflow).toContain('https://'+REF+'.supabase.co/functions/v1/framecraft-api');
  expect(workflow).not.toContain(OLD);
  expect(workflow).not.toContain('vars.FRAMECRAFT_API_URL');
  const cfg=read('supabase/config.toml');
  expect(cfg).toContain('project_id = "'+REF+'"');
 });
 it('uses new project from Supabase Edge Function',()=>{
  const code=read('supabase/functions/framecraft-api/index.ts');
  expect(code).toContain('https://'+REF+'.supabase.co');
  expect(code).not.toContain(OLD);
  expect(code).toContain('authenticatedUser(req)');
  expect(code).toContain('takeQuota(userId,action)');
 });
 it('automatically invalidates a cached endpoint pointing to old Supabase',()=>{
  const api=read('src/lib/apiConnection.ts');
  expect(api).toContain(OLD+'.supabase.co');
  expect(api).toContain('window.localStorage.removeItem(STORAGE_KEY)');
  expect(api).toContain('(^|\\.)github\\.io');
 });
});