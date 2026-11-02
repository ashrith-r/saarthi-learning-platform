(() => {
  function initialize(){
    try{const zone=Intl.DateTimeFormat().resolvedOptions().timeZone;document.cookie='studyTimeZone='+encodeURIComponent(zone)+';Path=/;SameSite=Lax;Max-Age=31536000';}catch{}
    try{const saved=sessionStorage.getItem('saarthi:last-save');if(saved){sessionStorage.removeItem('saarthi:last-save');const notice=document.createElement('p');notice.className='studio-card save-status';notice.setAttribute('role','status');notice.textContent=saved;document.querySelector('main.studio .study-heading')?.after(notice);}}catch{}
    for (const form of document.querySelectorAll('form[data-material-form]')) {
    if(form.dataset.uploadBound)continue;form.dataset.uploadBound='true';
    const kind = form.querySelector('[name=kind]'), file = form.querySelector('[name=pdf]');
    if(file && kind)file.addEventListener('change', () => { if (file.files.length) kind.value = 'document'; });
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const button = form.querySelector('[type=submit]') || form.querySelector('button');
      let feedback=form.querySelector('[data-save-feedback]');if(!feedback){feedback=document.createElement('p');feedback.setAttribute('role','status');form.append(feedback);}
      const previous = button.textContent; button.disabled = true; button.textContent = 'Saving material…'; feedback.hidden = false; feedback.textContent = 'Uploading and saving. Please keep this page open.';
      try {
        if (file?.files[0]?.size > 15 * 1024 * 1024) throw new Error('Choose a PDF smaller than 15 MB.');
        const response = await fetch(form.action, { method: 'POST', headers: { 'x-csrf-token': document.querySelector('meta[name=csrf-token]').content }, body: new FormData(form) });
        if (!response.ok){const text=await response.text();const doc=new DOMParser().parseFromString(text,'text/html');throw new Error(doc.querySelector('[data-error-message]')?.textContent||text);}
        form.removeAttribute('data-dirty');
        try{sessionStorage.setItem('saarthi:last-save','Material saved. Published changes are available to students.');}catch{}
        location.assign(response.url);
      } catch (error) { feedback.textContent = error.message; feedback.className = 'save-error'; form.dataset.dirty='true';button.disabled = false; button.textContent = previous; }
    });
  }

  }
  initialize();document.addEventListener('workspace:navigated',initialize);
  function revealActiveNavigation(){
    const nav=document.querySelector('.study-nav'),active=nav?.querySelector('.selected');
    if(nav&&active&&innerWidth<960)nav.scrollLeft=Math.max(0,active.offsetLeft-nav.offsetLeft-(nav.clientWidth-active.offsetWidth)/2);
  }
  document.addEventListener('workspace:navigated',()=>{revealActiveNavigation();version=Number(document.querySelector('meta[name=content-version]').content);dirty=false;});
  revealActiveNavigation();document.fonts?.ready.then(revealActiveNavigation);
  addEventListener('resize',revealActiveNavigation,{passive:true});
  let version = Number(document.querySelector('meta[name=content-version]')?.content || 0), dirty = false;
  document.addEventListener('input', event => { if(event.target.closest('form')?.method!=='get')dirty = true; });
  const refreshNotice = () => {
    if (document.getElementById('content-update')) return;
    const banner = document.createElement('div'); banner.id = 'content-update'; banner.className = 'content-update'; banner.setAttribute('role', 'status');
    const text = document.createElement('span'); text.textContent = 'New learning content is available. Your current work is safe.';
    const button = document.createElement('button'); button.className = 'studio-button'; button.textContent = 'Refresh content'; button.onclick = () => { if (!dirty || confirm('Your unsaved changes will be lost. Refresh this page?')) location.reload(); };
    banner.append(text, button); document.body.append(banner);
  };
  async function checkUpdates() {
    if (document.hidden || location.pathname.startsWith('/admin')) return;
    try {
      const response = await fetch('/api/content-version', { cache: 'no-store' }); if (!response.ok) return;
      const next = Number((await response.json()).revision); if (next <= version) return;
      const content = document.querySelector('.learning-content');
      if (content && !content.querySelector('iframe') && ![...content.querySelectorAll('video')].some(v => !v.paused)) {
        const page = await fetch(location.href, { cache: 'no-store' }); if (!page.ok) return;
        const replacement = new DOMParser().parseFromString(await page.text(), 'text/html').querySelector('.learning-content');
        if (replacement) { content.replaceWith(replacement); version = next; }
      } else if (content || dirty || location.pathname.includes('/practice/run/')) { refreshNotice(); version=next; }
      else location.reload();
    } catch { /* Retain existing content if the connection is temporarily unavailable. */ }
  }
  document.addEventListener('change',async event=>{if(event.target.id!=='csvFile')return;const file=event.target.files[0];if(file&&file.size<=200000)document.getElementById('csvText').value=await file.text();else alert('Choose a CSV smaller than 200 KB.');});
  setInterval(checkUpdates, 5000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) checkUpdates(); });
})();
