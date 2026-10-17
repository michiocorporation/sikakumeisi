(() => {
  'use strict';
  const referenceMode=new URLSearchParams(location.search).has('reference');
  const flat=document.body.dataset.design==='01-flat';
  if(new URLSearchParams(location.search).has('thumbnail')) document.documentElement.classList.add('thumbnail');
  const fallback = {
    business:'あなたの事務所',name:'あなたのお名前',qualification:'あなたの資格・職種',location:'あなたの活動エリア',
    headline:'あなたの専門性を、\n必要とする人へ。',intro:'ここに、あなたの言葉が入ります。仕事に込めた想いが伝わる、あなたらしいホームページへ。',
    value:'あなたの大切にしていること',service1:'ご相談内容をここに',service2:'あなたの業務をここに',service3:'伝えたいことをここに',
    profile:'あなたのプロフィールがここに入ります。ヒアリング画面で入力した内容を、同じ文章で比較できます。',services:'あなたの業務内容がここに入ります。',contact:'連絡先はヒアリング画面で設定できます。',address:''
  };
  function apply(data={}) {
    if(!data||typeof data!=='object')data={};
    if(referenceMode)data={};
    if(referenceMode)window.HearingPalettes.clear(document.body);
    else window.HearingPalettes.apply(document.body,data.palette);
    document.querySelectorAll('[data-bind]').forEach(el => {el.textContent = data[el.dataset.bind] || (el.hasAttribute('data-fallback')?el.dataset.fallback:fallback[el.dataset.bind]) || '';});
    const validImage = v => typeof v==='string' && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(v) && v.length < 3000000;
    document.querySelectorAll('[data-logo]').forEach(el=>{const valid=validImage(data.logo);el.hidden=!valid;if(valid)el.src=data.logo;else el.removeAttribute('src');});
    document.querySelectorAll('.brand-mark').forEach(el=>el.hidden=validImage(data.logo));
    document.querySelectorAll('[data-photo]').forEach(el=>{el.src=validImage(data.photo)?data.photo:(el.dataset.defaultPhoto||'../assets/sample-portrait.jpg');el.alt=validImage(data.photo)?'アップロードされた写真':'見本の人物写真';});
    document.querySelectorAll('[data-photo-note]').forEach(el=>el.hidden=validImage(data.photo));
    document.querySelector('#about').hidden=!!data.omitProfile;
    document.querySelector('#services').hidden=!!data.omitServices;
    window.ReferencePreview?.apply(data,validImage);
    if(flat){
      const hasLogo=validImage(data.logo),hasPhoto=validImage(data.photo),hasIdentity=!!(data.business||data.name||data.qualification);
      document.querySelector('.flat-default-logo').hidden=hasLogo||!!data.business;
      document.querySelector('.flat-custom-brand').hidden=hasLogo||!data.business;
      document.querySelector('.flat-artboard').classList.toggle('flat-brand-sample',!data.business);
      document.querySelector('.flat-avatar [data-photo]').hidden=!hasPhoto;
      document.querySelector('.flat-reference-avatar').hidden=hasPhoto;
      document.querySelector('.flat-reference-person').hidden=hasPhoto;
      document.querySelector('.flat-uploaded-person').hidden=!hasPhoto;
      document.querySelectorAll('[data-reference-only]').forEach(el=>el.hidden=hasIdentity);
      if(hasIdentity){
        if(!data.qualification)document.querySelectorAll('[data-bind="qualification"]').forEach(el=>el.textContent='資格・職種を入力');
        for(const [key,label] of Object.entries({name:'あなたのお名前',profile:'あなたのプロフィールが入ります。',location:'あなたの活動エリア',service1:'あなたの業務内容',contact:'あなたの連絡先'})){
          if(!data[key])document.querySelectorAll(`.flat-profile [data-bind="${key}"]`).forEach(el=>el.textContent=label);
        }
      }
      document.dispatchEvent(new Event('shikaku-content-updated'));
    }
  }
  window.addEventListener('message',event=>{
    if(event.source!==parent || event.origin!==location.origin) return;
    if(event.data?.type==='shikaku-preview') apply(event.data.payload);
  });
  if(parent!==window){apply();parent.postMessage({type:'shikaku-ready'},location.origin==='null'?'*':location.origin);}
  else {
    try {const stored=JSON.parse(localStorage.getItem('shikaku-preview-data')||'{}');apply(stored);}catch{apply();}
    window.addEventListener('storage',e=>{if(e.key==='shikaku-preview-data'){try{apply(JSON.parse(e.newValue||'{}'));}catch{}}});
  }
})();
