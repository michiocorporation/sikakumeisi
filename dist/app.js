(() => {
  'use strict';
  const M=window.HearingModel, P=window.HearingPalettes, designs=window.DESIGNS, $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  let state=M.empty(), filter='all', modalDesign=null, device='desktop', saveTimer, toastTimer, storageAvailable=true;
  try {
    const stored=JSON.parse(localStorage.getItem(M.storageKey)||'null');
    if(stored?.version===1) {
      for(const key of ['fields','answers','materials','images'])for(const name of Object.keys(state[key]))if(typeof stored[key]?.[name]==='string')state[key][name]=stored[key][name];
      for(const key of Object.keys(M.blockNames))if(typeof stored.copy?.[key]?.text==='string'&&['empty','review','draft','approved','omitted'].includes(stored.copy[key].status))state.copy[key]=stored.copy[key];
      const ids=new Set(designs.map(d=>d.id));
      state.preferences.likes=[...new Set((stored.preferences?.likes||[]).filter(id=>ids.has(id)))].slice(0,3);
      state.preferences.avoids=[...new Set((stored.preferences?.avoids||[]).filter(id=>ids.has(id)&&!state.preferences.likes.includes(id)))];
      state.preferences.delegate=!!stored.preferences?.delegate;
      state.preferences.palette=P.normalize(stored.preferences?.palette);
      for(const id of state.preferences.likes)state.preferences.reasons[id]=(stored.preferences?.reasons?.[id]||[]).filter(v=>['配色','余白','文字の雰囲気','写真の見せ方','情報の配置'].includes(v));
      state.step=[1,2,3,4].includes(stored.step)?stored.step:3;
      if(state.preferences.delegate)state.preferences.likes=[];
    }
  }catch{storageAvailable=false;}
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function toast(message){$('#toast').textContent=message;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,3500);}
  function save(){
    clearTimeout(saveTimer);state.updatedAt=new Date().toISOString();
    try{localStorage.setItem(M.storageKey,JSON.stringify(state));localStorage.setItem('shikaku-preview-data',JSON.stringify(M.preview(state)));storageAvailable=true;$('#save-state').innerHTML='<i></i> このブラウザに保存済み';}
    catch{storageAvailable=false;$('#save-state').textContent='保存できません：確認画面からダウンロード';}
  }
  function changed({copyKeys=[],sync=true}={}){
    if(copyKeys.length){M.invalidate(state,copyKeys);for(const key of copyKeys){const badge=$(`[data-copy="${key}"] .status-badge`);if(badge){badge.textContent=statuses[state.copy[key].status];badge.className='status-badge '+state.copy[key].status;}}}
    $('#review-consent').checked=false;if(sync)syncPreviews();clearTimeout(saveTimer);saveTimer=setTimeout(save,250);if(state.step===4)renderReview();
  }
  function syncPreviews(){const payload=M.preview(state);$$('iframe[data-preview]').forEach(frame=>{try{frame.contentWindow?.postMessage({type:'shikaku-preview',payload},location.origin==='null'?'*':location.origin);}catch{}});}
  function sendFrame(frame){try{frame.contentWindow?.postMessage({type:'shikaku-preview',payload:M.preview(state)},location.origin==='null'?'*':location.origin);}catch{}}
  window.addEventListener('message',event=>{
    if(event.origin!==location.origin||event.data?.type!=='shikaku-ready')return;
    const frame=$$('iframe[data-preview]').find(f=>f.contentWindow===event.source);if(frame)sendFrame(frame);
  });
  function makeFrame(id,{lazy=false,compact=false}={}){
    const f=document.createElement('iframe');f.src='previews/'+id+'.html'+(compact?'?thumbnail=1':'');f.title=designs.find(d=>d.id===id).name+'のデザイン見本';f.dataset.preview=id;f.loading=lazy?'lazy':'eager';
    if(compact){f.tabIndex=-1;f.setAttribute('aria-hidden','true');}
    f.addEventListener('load',()=>{sendFrame(f);f.parentElement?.classList.add('loaded');});return f;
  }
  const resizeObserver=new ResizeObserver(entries=>{for(const entry of entries){const iframe=$('iframe',entry.target);if(iframe)iframe.style.transform=`scale(${entry.contentRect.width/Number(iframe.dataset.canvasWidth||1080)})`;}});
  function mountThumb(container,id,lazy=true){const f=makeFrame(id,{lazy,compact:true});f.dataset.canvasWidth='1672';f.style.width='1672px';f.style.height='941px';container.style.aspectRatio='1672 / 941';container.prepend(f);resizeObserver.observe(container);}
  function setStep(step,{scroll=true}={}){
    state.step=step;$$('[data-panel]').forEach(p=>p.hidden=Number(p.dataset.panel)!==step);$$('[data-step]').forEach(b=>{if(Number(b.dataset.step)===step)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});
    $('#previous-step').hidden=step===1;$('#previous-step span').textContent=['','','基本情報へ','掲載する文章へ','デザインの好みへ'][step];
    $('#next-step').hidden=step===4;$('#next-step').innerHTML=(['','掲載する文章へ','デザインの好みへ','好みを確認して、次へ'][step]||'')+' <span>→</span>';
    $('#footer-progress').textContent=`STEP 0${step} / 04`;
    if(step===2)renderCopy();if(step===4)renderReview();if(step===3)requestAnimationFrame(syncPreviews);save();
    if(scroll){window.scrollTo({top:0,behavior:'instant'});const h=$(`[data-panel="${step}"] h1`);h.tabIndex=-1;h.focus({preventScroll:true});}
  }
  $$('[data-step]').forEach(b=>b.addEventListener('click',()=>setStep(Number(b.dataset.step))));
  document.addEventListener('click',e=>{const goto=e.target.closest('[data-goto]');if(goto)setStep(Number(goto.dataset.goto));});
  $('#previous-step').addEventListener('click',()=>setStep(Math.max(1,state.step-1)));$('#next-step').addEventListener('click',()=>setStep(Math.min(4,state.step+1)));
  $$('[data-field]').forEach(input=>{
    const key=input.dataset.field;input.value=state.fields[key]||'';
    input.addEventListener('input',()=>{state.fields[key]=input.value;$$(`[data-field="${key}"]`).forEach(peer=>{if(peer!==input)peer.value=input.value;});changed({copyKeys:['business','name','qualification','location'].includes(key)?['profile']:[]});});
  });
  const questionDefinitions=[
    {key:'status',title:'現在の開業状況は？',target:'#basic-questions',options:['開業を準備中','開業して1年以内','開業して1年以上','副業・兼業で活動','まだ決まっていない']},
    {key:'audience',title:'どんな方に見てほしいですか？',target:'#basic-questions',options:['個人のお客様','法人のお客様','個人事業主','個人・法人どちらも','まだ決まっていない']},
    {key:'contact',title:'掲載したい連絡方法は？',target:'#contact-question',options:[['email','メール'],['phone','電話'],['both','メールと電話'],['url','予約・問い合わせURL'],['none','今回は掲載しない']]},
    {key:'tone',title:'文章はどんな印象にしたいですか？',target:'#writing-questions',options:['きちんと・誠実','やさしい・親しみやすい','落ち着いた・上品','簡潔・わかりやすい','お任せ']},
    {key:'value',title:'仕事でいちばん大切にしていることは？',target:'#writing-questions',options:['わかりやすい説明','一緒に考える姿勢','丁寧な対応','早めの返信','お任せ']}
  ];
  questionDefinitions.forEach(q=>{
    const fieldset=document.createElement('fieldset');fieldset.className='question';fieldset.innerHTML=`<legend>${q.title}</legend><div class="choice-grid">${q.options.map((o,i)=>{const[value,label]=Array.isArray(o)?o:[o,o];return `<label class="choice-item"><input type="radio" name="${q.key}" value="${esc(value)}" ${state.answers[q.key]===value?'checked':''}><span>${esc(label)}</span></label>`;}).join('')}</div>`;
    $(q.target).append(fieldset);fieldset.addEventListener('change',e=>{state.answers[q.key]=e.target.value;if(q.key==='contact')updateContactFields();changed({copyKeys:q.key==='value'?['values']:q.key==='tone'?Object.keys(M.blockNames):[]});});
  });
  function updateContactFields(){const a=state.answers.contact;$('#email-label').hidden=!['email','both'].includes(a);$('#phone-label').hidden=!['phone','both'].includes(a);$('#url-label').hidden=a!=='url';}
  updateContactFields();
  $$('[data-material]').forEach(el=>{el.value=state.materials[el.dataset.material];el.addEventListener('input',()=>{state.materials[el.dataset.material]=el.value;changed({copyKeys:[el.dataset.material]});});});
  function currentTone(){return {'やさしい・親しみやすい':'gentle','落ち着いた・上品':'formal','簡潔・わかりやすい':'short'}[state.answers.tone]||'standard';}
  $('#generate-copy').addEventListener('click',()=>{
    let count=0;for(const key of Object.keys(M.blockNames)){if(state.copy[key].status==='approved'||state.copy[key].status==='omitted')continue;const text=M.buildCopy(state,key,currentTone());state.copy[key]={text,status:text?'draft':'empty'};if(text)count++;}
    changed();renderCopy();toast(count?'文章案を作りました。内容を確認して承認してください。':'作成する文章の材料を追加してください。承認済みの文章は保持します。');
  });
  const statuses={empty:'未作成',draft:'文章案作成済み',review:'本人確認中・再承認が必要',approved:'本人承認済み',omitted:'今回は掲載しない'};
  function renderCopy(){
    $('#copy-sections').innerHTML=Object.entries(M.blockNames).map(([key,label])=>{const b=state.copy[key];return `<section class="copy-block" data-copy="${key}"><div class="copy-block-header"><h2>${label}</h2><span class="status-badge ${b.status}">${statuses[b.status]}</span></div><label class="visually-hidden" for="copy-${key}">${label}の文章</label><textarea id="copy-${key}" data-copy-text="${key}" maxlength="1500" rows="4" placeholder="材料を入力して、文章案を作成してください。">${esc(b.text)}</textarea><div class="copy-controls"><button data-copy-action="approve" ${!b.text.trim()?'disabled':''}>✓ この文章の掲載を承認</button><button data-copy-action="short">もっと短く</button><button data-copy-action="gentle">やさしい表現</button><button data-copy-action="formal">落ち着いた表現</button><button data-copy-action="materials">材料を修正</button><button data-copy-action="omit" aria-pressed="${b.status==='omitted'}">今回は掲載しない</button></div><p class="copy-approval-note">${key==='profile'?'<button class="inline-link" data-copy-action="use-intro">この文章を見本の紹介文にも使う ↗</button>':''}入力した材料や文章を変更した場合、承認を解除して再確認します。</p></section>`;}).join('');
  }
  $('#copy-sections').addEventListener('input',e=>{if(!e.target.dataset.copyText)return;const key=e.target.dataset.copyText;state.copy[key].text=e.target.value;M.invalidate(state,[key]);if(!state.copy[key].text.trim())state.copy[key].status='empty';const block=e.target.closest('.copy-block');const badge=$('.status-badge',block);badge.textContent=statuses[state.copy[key].status];badge.className='status-badge '+state.copy[key].status;$('[data-copy-action="approve"]',block).disabled=!e.target.value.trim();$('[data-copy-action="omit"]',block).setAttribute('aria-pressed','false');changed();});
  $('#copy-sections').addEventListener('click',e=>{
    const button=e.target.closest('[data-copy-action]');if(!button)return;const key=button.closest('[data-copy]').dataset.copy,action=button.dataset.copyAction;
    if(action==='materials'){$(`[data-material="${key}"]`).focus();return;}
    if(action==='use-intro'){state.fields.intro=state.copy[key].text;$$('[data-field="intro"]').forEach(el=>el.value=state.fields.intro);changed();toast('見本の紹介文に反映しました。');return;}
    if(action==='approve'){state.copy[key].status='approved';state.copy[key].approvedAt=new Date().toISOString();state.copy[key].approvedText=state.copy[key].text;}
    else if(action==='omit'){state.copy[key].status=state.copy[key].status==='omitted'?(state.copy[key].text?'review':'empty'):'omitted';delete state.copy[key].approvedAt;delete state.copy[key].approvedText;}
    else{const text=M.buildCopy(state,key,action);if(!text){toast('先に文章の材料を入力してください。');return;}state.copy[key]={text,status:'review'};}
    changed();renderCopy();
  });
  function updateImageUI(kind){const data=state.images[kind];const spot=$(`[data-upload-preview="${kind}"]`);spot.replaceChildren();if(data){const img=document.createElement('img');img.src=data;img.alt='選択済みの'+(kind==='logo'?'ロゴ':'写真');spot.append(img);}else spot.textContent='＋';$(`[data-upload-label="${kind}"]`).textContent=data?'画像を変更':'画像を選ぶ';$(`[data-remove="${kind}"]`).hidden=!data;$('#sample-photo-hint').hidden=!!state.images.photo;}
  async function processImage(file){
    if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw new Error('PNG・JPG・WebPの画像を選んでください。');
    if(file.size>5*1024*1024)throw new Error('画像は5MB以下にしてください。');
    const url=URL.createObjectURL(file);try{const img=new Image();img.src=url;await img.decode();if(img.naturalWidth*img.naturalHeight>50000000)throw new Error('画像の縦横サイズが大きすぎます。縮小した画像を選んでください。');const ratio=Math.min(1,1200/Math.max(img.naturalWidth,img.naturalHeight)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.naturalWidth*ratio));canvas.height=Math.max(1,Math.round(img.naturalHeight*ratio));canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);return canvas.toDataURL('image/webp',.88);}catch(error){throw new Error(error.message.includes('大きすぎ')?error.message:'画像を読み込めませんでした。別の画像を選んでください。');}finally{URL.revokeObjectURL(url);}
  }
  $$('[data-upload]').forEach(input=>input.addEventListener('change',async()=>{const file=input.files[0];if(!file)return;const kind=input.dataset.upload;try{state.images[kind]=await processImage(file);updateImageUI(kind);changed();save();toast(storageAvailable?'画像を20のデザインに反映しました。':'画像は反映しましたが保存できません。確認画面からダウンロードしてください。');}catch(error){toast(error.message);}input.value='';}));
  $$('[data-remove]').forEach(button=>button.addEventListener('click',()=>{state.images[button.dataset.remove]='';updateImageUI(button.dataset.remove);changed();}));
  ['logo','photo'].forEach(updateImageUI);
  function swatches(p){return `<span class="palette-swatches" aria-hidden="true">${p.swatches.map(color=>`<i style="background:${color}"></i>`).join('')}</span>`;}
  function renderPalettePicker(){
    const section=document.createElement('section');section.className='palette-picker';section.setAttribute('aria-labelledby','palette-heading');
    section.innerHTML=`<div class="palette-heading"><div><span class="mini-label">COLOR MOOD · 20 PALETTES</span><h2 id="palette-heading">好きな色合いで、見比べる。</h2></div><span class="palette-badge">20の見本に一括反映</span></div><p class="palette-guide">チートシートの20配色から選べます。色の並びは、背景・メイン・アクセント。</p><fieldset class="palette-options"><legend class="visually-hidden">見本に反映する配色・20種類</legend>${P.list.map((p,i)=>`<label class="palette-option" title="${p.description}"><input type="radio" name="palette" value="${p.id}" ${state.preferences.palette===p.id?'checked':''}><span class="palette-number" aria-hidden="true">${String(i+1).padStart(2,'0')}${p.id===P.defaultId?' · 初期設定':''}</span>${swatches(p)}<span class="palette-name">${p.name}</span><span class="palette-check" aria-hidden="true">✓</span></label>`).join('')}</fieldset><p class="palette-scroll-hint">スクロールして、すべての配色を見る ↓</p><p class="palette-description" id="palette-description" aria-live="polite"></p><p class="palette-note">色だけ変えて、雰囲気を比較できます。ロゴ・写真の画像自体は変更しません。</p>`;
    $('.gallery-area').prepend(section);
    section.addEventListener('change',e=>{if(e.target.name!=='palette')return;state.preferences.palette=P.normalize(e.target.value);updatePaletteDescription();changed();});
    updatePaletteDescription();
  }
  function updatePaletteDescription(){const p=P.get(state.preferences.palette);$('#palette-description').textContent=p.name+'：'+p.description;}
  function renderGallery(){
    $$('.card-preview').forEach(p=>resizeObserver.unobserve(p));const visible=designs.filter(d=>filter==='all'||d.group===filter);
    $('#result-count').textContent=`${visible.length}のデザイン`;
    $('#design-gallery').innerHTML=visible.map(d=>`<article class="design-card" data-id="${d.id}"><div class="card-preview"><div class="preview-loading">${esc(d.en)}</div><button class="preview-open" data-open="${d.id}" aria-label="${esc(d.name)}を拡大して見る"><span>拡大して見る ↗</span></button></div><div class="card-body"><div class="card-title-line"><span class="design-number">${d.id.slice(0,2)}</span><div><h3>${esc(d.name)}</h3><span class="design-en">${esc(d.en)}</span></div></div><div class="card-tags">${d.tags.map(t=>`<span>${t}</span>`).join('')}</div><div class="card-actions"><button class="preference-button like" data-preference="like" aria-label="${esc(d.name)}が好き" aria-pressed="false"><span>♡</span> 好き</button><button class="preference-button avoid" data-preference="avoid" aria-label="${esc(d.name)}は避けたい" aria-pressed="false"><span>−</span> 避けたい</button></div></div><div class="card-feedback"></div></article>`).join('');
    $$('.design-card').forEach((card,i)=>{mountThumb($('.card-preview',card),card.dataset.id,i>3);updateCard(card);});
  }
  function updateCard(card){
    const id=card.dataset.id,liked=state.preferences.likes.includes(id),avoided=state.preferences.avoids.includes(id);
    card.classList.toggle('is-liked',liked);card.classList.toggle('is-avoided',avoided);$('[data-preference="like"]',card).setAttribute('aria-pressed',String(liked));$('[data-preference="like"] span',card).textContent=liked?'♥':'♡';$('[data-preference="avoid"]',card).setAttribute('aria-pressed',String(avoided));
    $('.card-feedback',card).innerHTML=liked?`<div class="reason-box"><p>どんなところが好きですか？ <span>（任意・複数可）</span></p><div class="reason-options">${['配色','余白','文字の雰囲気','写真の見せ方','情報の配置'].map(reason=>`<button data-reason="${reason}" aria-pressed="${(state.preferences.reasons[id]||[]).includes(reason)}">${reason}</button>`).join('')}</div></div>`:avoided?'<div class="avoid-note">この雰囲気は避けたい、と制作担当者に伝えます。</div>':'';
  }
  function togglePreference(id,type){
    const p=state.preferences,key=type==='like'?'likes':'avoids',other=type==='like'?'avoids':'likes';
    if(p[key].includes(id)){p[key]=p[key].filter(x=>x!==id);if(type==='like')delete p.reasons[id];}
    else{if(type==='like'&&p.likes.length>=3){toast('好きな雰囲気は3つまで選べます。選択を外して入れ替えられます。');return;}p[key].push(id);p[other]=p[other].filter(x=>x!==id);if(type==='like'){p.delegate=false;$('#delegate-choice').checked=false;}else delete p.reasons[id];}
    const card=$(`.design-card[data-id="${id}"]`);if(card)updateCard(card);updateFavorites();updateModalButtons();changed({sync:false});
  }
  $('#design-gallery').addEventListener('click',e=>{
    const open=e.target.closest('[data-open]');if(open){openPreview(open.dataset.open);return;}
    const pref=e.target.closest('[data-preference]');if(pref){togglePreference(pref.closest('[data-id]').dataset.id,pref.dataset.preference);return;}
    const reason=e.target.closest('[data-reason]');if(reason){const id=reason.closest('[data-id]').dataset.id,value=reason.dataset.reason,items=state.preferences.reasons[id]||[];state.preferences.reasons[id]=items.includes(value)?items.filter(v=>v!==value):[...items,value];reason.setAttribute('aria-pressed',String(state.preferences.reasons[id].includes(value)));changed({sync:false});}
  });
  $$('[data-filter]').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.filter;$$('[data-filter]').forEach(el=>{el.classList.toggle('active',el===b);el.setAttribute('aria-pressed',String(el===b));});renderGallery();}));
  function updateFavorites(){
    $('#like-count').textContent=state.preferences.likes.length;
    $('#favorites-list').innerHTML=state.preferences.likes.length?state.preferences.likes.map(id=>`<div class="favorite-item"><span>${id.slice(0,2)} &nbsp; ${esc(designs.find(d=>d.id===id).name)}</span><button data-unlike="${id}" aria-label="${esc(designs.find(d=>d.id===id).name)}の好きを解除">×</button></div>`).join(''):'<p class="empty-favorites">見本の「好き」を押してみましょう。</p>';
    $('#compare-button').disabled=state.preferences.likes.length<2;$('#delegate-choice').checked=state.preferences.delegate;
  }
  $('#favorites-list').addEventListener('click',e=>{const b=e.target.closest('[data-unlike]');if(b)togglePreference(b.dataset.unlike,'like');});
  $('#delegate-choice').addEventListener('change',e=>{state.preferences.delegate=e.target.checked;if(e.target.checked){state.preferences.likes=[];state.preferences.reasons={};$$('.design-card').forEach(updateCard);}updateFavorites();changed({sync:false});});
  function showDialog(id){$(id).showModal();document.body.classList.add('dialog-open');}
  $$('dialog').forEach(d=>d.addEventListener('close',()=>{if(d.id==='compare-dialog'){$$('.compare-frame',d).forEach(p=>resizeObserver.unobserve(p));$('#compare-grid').replaceChildren();}if(d.id==='preview-dialog')$('#modal-canvas').replaceChildren();if(!$$('dialog[open]').length)document.body.classList.remove('dialog-open');}));
  $$('[data-close]').forEach(b=>b.addEventListener('click',()=>document.getElementById(b.dataset.close).close()));
  $('#help-button').addEventListener('click',()=>showDialog('#help-dialog'));
  function openPreview(id){
    modalDesign=id;const d=designs.find(d=>d.id===id);$('#modal-index').textContent='DESIGN '+d.id.slice(0,2)+' / 20';$('#modal-title').textContent=d.name;$('#modal-description').textContent=d.desc;$('#modal-canvas').replaceChildren(makeFrame(id));setDevice(device);updateModalButtons();if(!$('#preview-dialog').open)showDialog('#preview-dialog');
  }
  function setDevice(value){device=value;$('#modal-canvas').classList.toggle('mobile',value==='mobile');$$('[data-device]').forEach(b=>{b.classList.toggle('active',b.dataset.device===value);b.setAttribute('aria-pressed',String(b.dataset.device===value));});}
  $$('[data-device]').forEach(b=>b.addEventListener('click',()=>setDevice(b.dataset.device)));
  function updateModalButtons(){if(!modalDesign)return;const liked=state.preferences.likes.includes(modalDesign),avoided=state.preferences.avoids.includes(modalDesign);$('#modal-like').textContent=liked?'♥ 好きに追加済み':'♡ この雰囲気が好き';$('#modal-like').setAttribute('aria-pressed',String(liked));$('#modal-avoid').textContent=avoided?'− 避けたいに追加済み':'避けたい';$('#modal-avoid').setAttribute('aria-pressed',String(avoided));}
  $('#modal-like').addEventListener('click',()=>togglePreference(modalDesign,'like'));$('#modal-avoid').addEventListener('click',()=>togglePreference(modalDesign,'avoid'));
  $('#compare-button').addEventListener('click',()=>{
    const items=state.preferences.likes.map(id=>designs.find(d=>d.id===id));$('#compare-grid').style.gridTemplateColumns=`repeat(${items.length},minmax(0,1fr))`;
    $('#compare-grid').innerHTML=items.map(d=>`<article class="compare-item"><div class="compare-frame" data-compare-id="${d.id}"></div><h3>${d.id.slice(0,2)} ${esc(d.name)}</h3><p>${esc(d.desc)}</p><button class="secondary-button" data-compare-open="${d.id}">拡大して見る ↗</button></article>`).join('');showDialog('#compare-dialog');$$('[data-compare-id]').forEach(el=>mountThumb(el,el.dataset.compareId,false));
  });
  $('#compare-grid').addEventListener('click',e=>{const b=e.target.closest('[data-compare-open]');if(b){$('#compare-dialog').close();openPreview(b.dataset.compareOpen);}});
  function renderReview(){
    const f=state.fields,p=state.preferences,contactLabels={email:'メール',phone:'電話',both:'メールと電話',url:'予約・問い合わせURL',none:'今回は掲載しない'};
    const row=(a,b)=>`<dt>${a}</dt><dd>${esc(b||'未入力')}</dd>`;
    $('#review-content').innerHTML=`<section class="review-section"><h2>基本情報 <button data-goto="1">編集する ↗</button></h2><dl class="review-dl">${row('屋号・事務所名',f.business)}${row('お名前',f.name)}${row('資格・職種',f.qualification)}${row('活動エリア',f.location)}${row('所在地',f.address)}${row('開業状況',state.answers.status)}${row('対象のお客様',state.answers.audience)}${row('連絡方法',contactLabels[state.answers.contact])}${['email','both'].includes(state.answers.contact)?row('メール',f.email):''}${['phone','both'].includes(state.answers.contact)?row('電話',f.phone):''}${state.answers.contact==='url'?row('URL',f.contactUrl):''}</dl></section><section class="review-section"><h2>掲載する文章 <button data-goto="2">確認・承認する ↗</button></h2>${Object.entries(M.blockNames).map(([key,label])=>`<div class="review-subtitle"><b>${label}</b><span class="status-badge ${state.copy[key].status}">${statuses[state.copy[key].status]}</span></div><p class="review-copy">${esc(state.copy[key].status==='omitted'?'今回は掲載しません。':state.copy[key].text||'未作成')}</p>`).join('')}</section><section class="review-section"><h2>デザインの好み <button data-goto="3">編集する ↗</button></h2><p class="muted">完成形の指定ではなく、デザイナーが個別制作するときの参考として記録します。</p>${p.delegate?'<p>デザインはお任せ</p>':p.likes.length?p.likes.map(id=>`<div class="review-preference"><b>♡ ${esc(designs.find(d=>d.id===id).name)}</b><small>${esc((p.reasons[id]||[]).join('・')||'好きな理由：指定なし')}</small></div>`).join(''):'<p class="muted">まだ選択していません。</p>'}<div class="review-subtitle">避けたい雰囲気</div><p class="muted">${esc(p.avoids.map(id=>designs.find(d=>d.id===id).name).join('、')||'指定なし')}</p><div class="review-subtitle">プレビュー用の見出し・紹介文</div><p class="muted">この欄はプレビュー用です。掲載前の原稿確認が必要です。</p><dl class="review-dl">${row('見出し',f.headline||'指定なし')}${row('紹介文',f.intro||'自己紹介の文章案を使用')}</dl><div class="review-images">${['logo','photo'].filter(k=>state.images[k]).map(k=>`<figure><img data-review-image="${k}" alt="アップロードされた${k==='logo'?'ロゴ':'写真'}"><figcaption>${k==='logo'?'ロゴ':'プロフィール写真'}</figcaption></figure>`).join('')}</div></section>`;
    const palette=P.get(p.palette),paletteRow=document.createElement('div');paletteRow.className='review-palette';paletteRow.innerHTML=`<div><span class="mini-label">COLOR MOOD</span><p>希望する色合い：<b>${palette.name}</b></p></div>${swatches(palette)}`;$('#review-content .review-section:last-child').insertBefore(paletteRow,$('#review-content .review-section:last-child .muted').nextSibling);
    $$('[data-review-image]').forEach(el=>el.src=state.images[el.dataset.reviewImage]);
    const issues=M.issues(state);$('#completion-issues').innerHTML=issues.length?`確認する項目が${issues.length}件あります。<ul>${issues.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>`:'';$('#export-final').disabled=issues.length>0||!$('#review-consent').checked;
  }
  $('#review-consent').addEventListener('change',()=>$('#export-final').disabled=M.issues(state).length>0||!$('#review-consent').checked);
  function download(final){
    if(final&&(M.issues(state).length||!$('#review-consent').checked)){toast('内容の確認と文章の承認を完了してください。');return;}
    save();const data=M.exportData(state,final);data.designPreferences.likes=data.designPreferences.likes.map(id=>({id,name:designs.find(d=>d.id===id).name,reasons:state.preferences.reasons[id]||[]}));
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`シカクメイシ_ヒアリング_${final?'確認済み':'下書き'}_${new Date().toISOString().slice(0,10)}.json`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);$('#export-status').textContent='保存用ファイルをダウンロードしました。制作担当者へは自動送信されていません。';toast(final?'確認済みのヒアリング結果を保存しました。':'途中の内容を保存しました。');
  }
  $('#export-final').addEventListener('click',()=>download(true));$('#export-draft').addEventListener('click',()=>download(false));$('#print-review').addEventListener('click',()=>window.print());
  $('#reset-data').addEventListener('click',()=>$('#reset-confirm').hidden=false);$('#cancel-reset').addEventListener('click',()=>$('#reset-confirm').hidden=true);$('#confirm-reset').addEventListener('click',()=>{state=M.empty();save();location.reload();});
  window.addEventListener('pagehide',save);
  renderPalettePicker();renderGallery();updateFavorites();renderCopy();setStep(state.step,{scroll:false});
})();
