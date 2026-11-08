// Start independently of framework hydration and surface failed module loads.
const root=document.querySelector('#app');
function showFailure(){
  if(document.documentElement.dataset.careerosReady==='true')return;
  const main=document.createElement('main');main.id='main';main.className='initial-loading';
  const title=document.createElement('h1');title.textContent='CareerOS couldn’t finish opening.';
  const message=document.createElement('p');message.textContent='Reload this page to try again. If the issue continues, check the latest GitHub Pages deployment.';
  const retry=document.createElement('button');retry.className='button primary';retry.textContent='Try again';retry.addEventListener('click',()=>location.reload());
  main.append(title,message,retry);root.replaceChildren(main);
}
const timer=setTimeout(showFailure,25000);
try{await import('./app.mjs');}catch(error){console.error('CareerOS startup failed:',error?.name??'ModuleError');showFailure();}finally{clearTimeout(timer);}
