import { STORAGE_MODE } from './runtime-config.js';
import { act, advance, createState, migrateState, validState, PERSONALITIES } from './core/game.js';
const KEY = 'little-oddlings-save-v2';

function loadBrowser(){
  const raw = localStorage.getItem(KEY);
  if(!raw) return createState();
  try { const state=migrateState(JSON.parse(raw));if(!validState(state))throw new Error();return state; }
  catch { throw new Error('The browser save could not be read. Export or back up your browser data before resetting it.'); }
}
export async function update(action){
  if(STORAGE_MODE==='browser'){
    const transaction=()=>{
      const previous=loadBrowser();
      const state=action?act(previous,action):advance(previous,Date.now(),{ambient:true});
      localStorage.setItem(KEY,JSON.stringify(state));
      return {state,personalities:PERSONALITIES};
    };
    return navigator.locks ? navigator.locks.request('little-oddlings-save',transaction) : transaction();
  }
  const response=await fetch(action?'./api/action':'./api/state',action?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(action)}:{});
  const payload=await response.json();
  if(!response.ok)throw new Error(payload.error||'The nursery could not be saved.');
  return payload;
}
export const storageLabel=STORAGE_MODE==='browser'?'Saved in this browser':'Saved on this computer';
