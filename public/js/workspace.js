// Only script-free workspace pages share a persistent scene. Complex editors use native navigation.
(() => {
 const supported=path=>/^\/(dashboard|library|planner|practice|insights)$/.test(path)||/^\/admin(?:\/(?:materials|publishing|site-settings))?$/.test(path);
 let pending,sequence=0,currentUrl=location.href,leavePrompt;
 const dirty=()=>[...document.querySelectorAll('form[data-dirty=true]')].length>0;
 function confirmLeave(){
  if(!dirty())return Promise.resolve(true);
  if(leavePrompt)return Promise.resolve(false);
  return new Promise(resolve=>{
   const previous=document.activeElement,panel=document.createElement('section');leavePrompt=panel;panel.className='content-update';panel.setAttribute('role','region');panel.setAttribute('aria-label','Unsaved changes');
   const text=document.createElement('p');text.textContent='You have unsaved changes. Leave this page?';
   const leave=document.createElement('button');leave.className='studio-button';leave.textContent='Leave without saving';
   const stay=document.createElement('button');stay.className='studio-button secondary';stay.textContent='Keep editing';
   function finish(value){panel.remove();leavePrompt=null;if(value)document.querySelectorAll('form[data-dirty]').forEach(f=>f.removeAttribute('data-dirty'));else previous?.focus();resolve(value);}
   leave.onclick=()=>finish(true);stay.onclick=()=>finish(false);panel.append(text,leave,stay);document.body.append(panel);stay.focus();
  });
 }
 async function navigate(url,{historyMode='push'}={}){
  const ticket=++sequence;pending?.abort();pending=new AbortController();
  const current=document.querySelector('main.studio');if(!current)return location.assign(url);
  current.setAttribute('aria-busy','true');
  try{
   const response=await fetch(url,{signal:pending.signal,headers:{'X-Workspace-Navigation':'1'}});
   if(!response.ok||!supported(new URL(response.url).pathname))throw new Error('Native navigation required');
   const doc=new DOMParser().parseFromString(await response.text(),'text/html'),next=doc.querySelector('main.studio');
   if(!next||next.querySelector('script'))throw new Error('Native navigation required');
   if(ticket!==sequence)return;
   current.replaceWith(next);document.title=doc.title;
   for(const name of ['content-version','csrf-token'])document.querySelector(`meta[name=${name}]`).content=doc.querySelector(`meta[name=${name}]`).content;
   document.getElementById('flash-messages').innerHTML=doc.getElementById('flash-messages')?.innerHTML||'';
   document.getElementById('content-update')?.remove();
   if(historyMode==='push')history.pushState({},'',response.url);
   currentUrl=response.url;
   window.scrollTo({top:0,behavior:'instant'});
   next.setAttribute('tabindex','-1');next.focus({preventScroll:true});
   document.dispatchEvent(new CustomEvent('workspace:navigated'));
  }catch(error){if(error.name!=='AbortError'&&ticket===sequence)location.assign(url);}
  finally{if(ticket===sequence)document.querySelector('main.studio')?.removeAttribute('aria-busy');}
 }
 document.addEventListener('click',async event=>{
  const link=event.target.closest('a[href]');if(!link||event.defaultPrevented||event.button||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||link.target||link.hasAttribute('download'))return;
  const url=new URL(link.href,location.href);if(url.origin!==location.origin||!supported(url.pathname)||!supported(location.pathname)||url.hash)return;
  event.preventDefault();if(await confirmLeave())navigate(url.href);
 });
 document.addEventListener('submit',async event=>{
  const form=event.target;if(event.defaultPrevented||form.method!=='get'||form.target||!supported(location.pathname))return;
  const url=new URL(form.action,location.href);if(url.origin!==location.origin||!supported(url.pathname))return;
  url.search=new URLSearchParams(new FormData(form)).toString();event.preventDefault();if(await confirmLeave())navigate(url.href);else form.removeAttribute('data-submitting');
 });
 addEventListener('popstate',async()=>{if(!await confirmLeave()){history.pushState({},'',currentUrl);return;}if(supported(location.pathname)&&document.querySelector('main.studio'))navigate(location.href,{historyMode:'none'});else location.reload();});
 addEventListener('beforeunload',event=>{if(dirty()){event.preventDefault();event.returnValue='';}});
})();
