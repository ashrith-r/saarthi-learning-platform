(() => {
 function initialize(){
  for(const form of document.querySelectorAll('main.studio form:not([method=get])')){
   if(form.querySelector('[data-form-status]')||form.closest('[data-test-player]'))continue;
   const status=document.createElement('p');status.className='save-status';status.dataset.formStatus='';status.setAttribute('role','status');status.textContent='';form.append(status);
  }
 }
 initialize();document.addEventListener('workspace:navigated',initialize);
 document.addEventListener('input',event=>{
  const form=event.target.closest('form');if(!form||form.method==='get'||!form.closest('main.studio'))return;
  form.dataset.dirty='true';const status=form.querySelector('[data-form-status]');if(status){status.textContent='Unsaved changes';status.dataset.state='unsaved';}
 });
 document.addEventListener('submit',event=>{
  const form=event.target;if(event.defaultPrevented||!form.checkValidity())return;
  if(form.dataset.submitting==='true'){event.preventDefault();return;}
  form.dataset.submitting='true';
  form.removeAttribute('data-dirty');const status=form.querySelector('[data-form-status]');if(status){status.textContent='Saving…';status.dataset.state='saving';}
 });
 addEventListener('pageshow',()=>{document.querySelectorAll('form[data-submitting]').forEach(form=>form.removeAttribute('data-submitting'));document.querySelectorAll('[data-form-status]').forEach(status=>{if(status.dataset.state==='saving')status.textContent='';});});
})();
