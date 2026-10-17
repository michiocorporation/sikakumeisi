(() => {
  // Only the dedicated reference page uses this layout code.
  const stage=document.querySelector('.flat-artboard');
  function fit(){
    const mobile=stage.clientWidth<=600;
    document.querySelectorAll('[data-fit]').forEach(el=>{
      el.style.fontSize='';
      if(el.classList.contains('flat-name'))el.classList.toggle('is-long',el.textContent.length>8);
      if(mobile){if(el.classList.contains('flat-name')&&el.textContent.length>8)el.style.fontSize=Math.max(25,Math.min(38,325/Math.min(12,el.textContent.length)))+'px';return;}
      let size=parseFloat(getComputedStyle(el).fontSize);const minimum=el.classList.contains('flat-name')?stage.clientWidth*.014:stage.clientWidth*.0085;
      while((el.scrollWidth>el.clientWidth+1||el.scrollHeight>el.clientHeight+1)&&size>minimum){size-=.5;el.style.fontSize=size+'px';}
    });
  }
  new ResizeObserver(fit).observe(stage);
  document.addEventListener('shikaku-content-updated',fit);
  document.fonts.ready.then(fit);
})();
