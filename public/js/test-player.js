const panels = [...document.querySelectorAll('.test-question')];
const buttons = [...document.querySelectorAll('[data-jump]')];
const status = document.getElementById('saveStatus');
let current = 0, chain = Promise.resolve(), dirty = false, submitting = false, pending = 0;
let enteredAt=Date.now();
const timeSpent=Object.fromEntries(panels.map(p=>[p.dataset.question,Number(p.dataset.seconds)||0]));
function recordTime(){const id=panels[current]?.dataset.question;if(id)timeSpent[id]+=(Date.now()-enteredAt)/1000;enteredAt=Date.now();}
function navigate(index) { recordTime(); current = Math.max(0, Math.min(panels.length - 1, index)); panels.forEach((p, i) => p.hidden = i !== current); document.getElementById('previous').disabled = current === 0; document.getElementById('next').disabled = current === panels.length - 1; }
function payload() {
  const answers = {}, flags = [];
  panels.forEach((p, i) => { const selected = p.querySelector('input[type=radio]:checked'); if (selected) answers[p.dataset.question] = selected.value; if (p.querySelector('.flag').checked) flags.push(p.dataset.question); buttons[i].classList.toggle('answered', !!selected); buttons[i].classList.toggle('flagged', p.querySelector('.flag').checked); });
  recordTime(); return { answers, flags, timeSpent: {...timeSpent} };
}
function save() {
  const data = payload(); pending++; dirty = true; status.textContent = 'Saving…';
  chain = chain.catch(() => {}).then(async () => {
    const response = await fetch(location.pathname + '/save', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-csrf-token': document.querySelector('meta[name=csrf-token]').content }, body: JSON.stringify(data) });
    if(response.status===409){dirty=false;submitting=true;location.replace(location.pathname);return;}
    if (!response.ok) { const error = await response.json().catch(() => ({})); throw new Error(error.error || 'Save failed. Please retry before submitting.'); }
    pending--; dirty = pending > 0; status.textContent = dirty ? 'Saving…' : 'All answers saved';
  });
  chain.catch(e => { pending=Math.max(0,pending-1); dirty=true; status.textContent = e.message; });
  return chain;
}
buttons.forEach((b, i) => b.addEventListener('click', () => navigate(i)));
document.getElementById('previous').onclick = () => navigate(current - 1);
document.getElementById('next').onclick = () => navigate(current + 1);
panels.forEach(p => { p.addEventListener('change', save); p.querySelector('.clear-answer').onclick = () => { p.querySelectorAll('input[type=radio]').forEach(r => r.checked = false); save(); }; });
document.getElementById('finish').onclick = async () => {
  const count = Object.keys(payload().answers).length;
  if(submitting)return;
  let confirmation=document.getElementById('submitConfirmation');
  if(!confirmation){confirmation=document.createElement('section');confirmation.id='submitConfirmation';confirmation.className='studio-card';confirmation.setAttribute('role','region');confirmation.setAttribute('aria-label','Confirm test submission');document.getElementById('submitTest').before(confirmation);}
  confirmation.replaceChildren();
  const text=document.createElement('p');text.textContent=`Submit ${count} answered and ${panels.length-count} unanswered questions? Your test will be finalized.`;
  const submit=document.createElement('button');submit.type='button';submit.className='studio-button';submit.textContent='Submit test now';
  const cancel=document.createElement('button');cancel.type='button';cancel.className='studio-button secondary ms-3';cancel.textContent='Keep working';
  cancel.onclick=()=>{confirmation.remove();document.getElementById('finish').focus();};
  submit.onclick=async()=>{if(submitting)return;submitting=true;submit.disabled=true;try{await save();document.getElementById('submitTest').submit();}catch{submitting=false;submit.disabled=false;}};
  confirmation.append(text,submit,cancel);confirmation.scrollIntoView({block:'nearest'});submit.focus();
};
const deadline = Date.parse(document.getElementById('deadline').dataset.value);
function tick() {
  const seconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
  document.getElementById('timer').textContent = `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;
  if (!seconds && !submitting) { submitting = true; chain.catch(()=>{}).then(()=>document.getElementById('submitTest').submit()); }
}
window.addEventListener('beforeunload', e => { if (dirty && !submitting) { e.preventDefault(); e.returnValue = ''; } });
payload(); navigate(0); tick(); setInterval(tick, 1000);
