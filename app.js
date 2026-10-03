(function(){
  const menuBtn=document.querySelector('[data-menu]');
  const mobileNav=document.querySelector('[data-mobile-nav]');
  if(menuBtn&&mobileNav){menuBtn.addEventListener('click',()=>mobileNav.classList.toggle('open'));}
  document.querySelectorAll('[data-inquiry]').forEach(el=>el.addEventListener('click',()=>document.querySelector('.drawer')?.classList.add('open')));
  document.querySelectorAll('[data-drawer-close],.drawer-backdrop').forEach(el=>el.addEventListener('click',()=>document.querySelector('.drawer')?.classList.remove('open')));
  const search=document.querySelector('[data-breed-search]');
  if(search){search.addEventListener('submit',e=>{e.preventDefault();const v=(search.querySelector('input').value||'').toLowerCase();if(v.includes('cav')) location.href=(document.body.dataset.depth==='2'?'../../':'')+'breeds/cavapoo/';else document.querySelector('[data-inquiry]')?.click();});}
  const filterRoot=document.querySelector('[data-filter-root]');
  if(filterRoot){
    const cards=[...filterRoot.querySelectorAll('[data-card]')];
    const inputs=[...document.querySelectorAll('[data-filter]')];
    const run=()=>{const q=(document.querySelector('[data-filter="q"]')?.value||'').toLowerCase();const breed=document.querySelector('[data-filter="breed"]')?.value||'';const sex=document.querySelector('[data-filter="sex"]')?.value||'';cards.forEach(c=>{const okQ=!q||c.dataset.name.includes(q)||c.dataset.breed.includes(q);const okB=!breed||c.dataset.breed===breed;const okS=!sex||c.dataset.sex===sex;c.style.display=(okQ&&okB&&okS)?'block':'none';});};
    inputs.forEach(i=>i.addEventListener('input',run));
  }
})();