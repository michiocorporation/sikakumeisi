(() => {
 const $=s=>document.querySelector(s),designs=window.DESIGNS;
 const options=designs.map(d=>{const o=document.createElement('option');o.value=d.id;o.textContent=d.id.slice(0,2)+' '+d.name;return o});$('#design').replaceChildren(...options);
 const resize=new ResizeObserver(entries=>entries.forEach(e=>{const f=e.target.querySelector('iframe');f.style.transform=`scale(${e.contentRect.width/1672})`;}));
 resize.observe($('#single'));
 function select(){const id=$('#design').value;$('#preview').src='previews/'+id+'.html?reference=1&thumbnail=1';$('#reference').src=id==='01-flat'?'assets/flat-reference.png':'assets/references/'+id+'.png';}
 let mode='html';
 function change(next){mode=next;for(const key of ['html','source','overlay','overview'])$('#'+key).setAttribute('aria-pressed',String(key===mode));$('#single').hidden=mode==='overview';$('#grid').hidden=mode!=='overview';$('#reference').hidden=mode==='html';$('#reference').style.opacity=mode==='overlay'?$('#opacity').value/100:1;$('#opacity-label').hidden=mode!=='overlay';}
 for(const key of ['html','source','overlay','overview'])$('#'+key).addEventListener('click',()=>change(key));
 $('#design').addEventListener('change',()=>{select();if(mode==='overview')change('html')});$('#opacity').addEventListener('input',()=>change('overlay'));
 for(const d of designs){const card=document.createElement('article'),stage=document.createElement('div'),frame=document.createElement('iframe'),title=document.createElement('h2');stage.className='stage';frame.title=d.name;frame.src='previews/'+d.id+'.html?reference=1&thumbnail=1';frame.loading='lazy';title.textContent=d.id.slice(0,2)+' '+d.name;stage.append(frame);card.append(stage,title);$('#grid').append(card);resize.observe(stage);}
 select();
})();
