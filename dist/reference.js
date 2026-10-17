(() => {
  'use strict';
  const stage=document.querySelector('.reference-stage');
  if(!stage)return;
  const portrait=document.querySelector('.r-reference-person');
  const uploaded=document.querySelector('.r-uploaded-person');
  // The source-image clip stays in its measured coordinate system on mobile.
  const portraitBounds=stage.dataset.personBounds.split(',').map(Number);
  function fit(){
    const mobile=stage.clientWidth<=600;
    const [x,y,w,h]=portraitBounds;
    portrait.setAttribute('viewBox',mobile?`${x-30} ${y} ${w+60} ${h}`:'0 0 1672 941');
    document.querySelectorAll('[data-fit]').forEach(el=>{
      if(!el.dataset.baseFont)el.dataset.baseFont=el.style.fontSize||'css';
      if(el.dataset.baseFont==='css')el.style.removeProperty('font-size');else el.style.fontSize=el.dataset.baseFont;
      if(!el.getClientRects().length)return;
      if(mobile&&!el.classList.contains('r-business'))return;
      let size=parseFloat(getComputedStyle(el).fontSize);
      const min=mobile?19:Math.max(stage.clientWidth/1672*11,size*.38);
      while((el.scrollWidth>el.clientWidth+1||el.scrollHeight>el.clientHeight+1)&&size>min){size-=.5;el.style.fontSize=size+'px';}
      if(el.classList.contains('r-profile-copy')){
        const style=getComputedStyle(el),usable=el.clientHeight-parseFloat(style.paddingTop)-parseFloat(style.paddingBottom);
        el.style.webkitLineClamp=String(Math.max(1,Math.floor(usable/parseFloat(style.lineHeight))));
        el.title=el.textContent;
      }
    });
  }
  window.ReferencePreview={apply(data,validImage){
    const hasLogo=validImage(data.logo),hasPhoto=validImage(data.photo);
    const hasIdentity=!!(data.business||data.name||data.qualification);
    const colors=window.HearingPalettes.get(data.palette).colors;
    document.querySelectorAll('[data-tone-channel]').forEach(el=>{
      const offset=1+Number(el.dataset.toneChannel)*2;
      el.setAttribute('tableValues',['main','mid','tint','base'].map(key=>(parseInt(colors[key].slice(offset,offset+2),16)/255).toFixed(5)).join(' '));
    });
    stage.classList.toggle('is-custom-business',!!data.business);
    document.querySelector('.r-default-logo').hidden=hasLogo||!!data.business;
    document.querySelector('.r-custom-brand').hidden=hasLogo||!data.business;
    portrait.hidden=hasPhoto;uploaded.hidden=!hasPhoto;
    document.querySelectorAll('.r-sample-avatar').forEach(el=>el.hidden=hasPhoto);
    document.querySelectorAll('.r-avatar [data-photo]').forEach(el=>el.hidden=!hasPhoto);
    document.querySelectorAll('[data-reference-only]').forEach(el=>el.hidden=hasIdentity);
    document.querySelectorAll('.r-profile-copy').forEach(el=>el.hidden=!!data.omitProfile);
    const shortFeatures=document.body.dataset.design==='05-wabi'?['が伝わる','が育つ','が広がる']:document.body.dataset.design==='08-y2k'?['あなたの強みを見える化','実績と想いで伝わる','必要な人と出会える']:null;
    if(shortFeatures)shortFeatures.forEach((value,i)=>{const key='featureDescription'+(i+1);if(!data[key])document.querySelectorAll(`[data-bind="${key}"]`).forEach(el=>el.textContent=value);});
    if(['02-pop','07-brutal','10-anti','18-punk'].includes(document.body.dataset.design)){
      const headline=document.querySelector('.r-headline'),lines=headline.textContent.split('\n');
      headline.replaceChildren();
      lines.forEach((line,i)=>{const span=document.createElement('span');span.className='r-headline-line';span.textContent=line;headline.append(span);if(i<lines.length-1)headline.append(document.createTextNode('\n'));});
    }
    if(hasIdentity){
      for(const [key,label] of Object.entries({qualification:'資格・職種を入力',name:'あなたのお名前',profile:'あなたのプロフィールが入ります。',location:'あなたの活動エリア',contact:'お問い合わせ'})){
        if(!data[key])document.querySelectorAll(`.r-card [data-bind="${key}"]`).forEach(el=>el.textContent=label);
      }
    }
    fit();
  }};
  new ResizeObserver(fit).observe(stage);
  document.fonts.ready.then(fit);
})();
