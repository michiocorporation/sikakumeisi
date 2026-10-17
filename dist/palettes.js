(function(root){
  'use strict';
  // Base / main / accent are transcribed from チートシート_配色.png.
  // Supporting shades preserve each design's depth without recoloring image files.
  const mix=(a,b,weight)=>'#'+[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-weight)+parseInt(b.slice(i,i+2),16)*weight).toString(16).padStart(2,'0')).join('');
  const luminance=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
  const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
  const onColor=bg=>contrast('#131516',bg)>=contrast('#ffffff',bg)?'#131516':'#ffffff';
  const alpha=(hex,a)=>`rgba(${[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)).join(',')},${a})`;
  function scheme(id,name,description,base,main,accent){
    const dark=luminance(base)<.15,onAccent=onColor(accent),onMain=onColor(main);
    let muted=mix(main,base,.22);
    for(let i=0;i<20&&contrast(muted,base)<4.5;i++)muted=mix(muted,main,.2);
    const colors={base,main,accent,primary:main,strong:mix(main,dark?'#ffffff':'#000000',.18),ink:main,muted,paper:base,surface:base,white:'#ffffff',soft:mix(base,main,.02),tint:mix(base,main,.12),mid:mix(base,main,.42),shadow:mix(base,main,.22),secondary:mix(accent,main,.28),'accent-soft':mix(base,accent,.2),'on-accent':onAccent,'on-main':onMain,'accent-hover':mix(accent,onAccent==='#ffffff'?'#000000':'#ffffff',.12),glass:alpha(base,.78),'glass-faint':alpha(base,.5),highlight:mix(base,'#ffffff',dark?.1:.6)};
    return {id,name,description,dark,colors,swatches:[base,main,accent]};
  }
  const list=[
    scheme('minimal','ミニマル・オフホワイト','静けさ / 余白 / 洗練','#F8F7F3','#242B2B','#C67C59'),
    scheme('sage','北欧セージ','自然 / 安らぎ / やさしさ','#F6F3EB','#587365','#DCA86B'),
    scheme('french','フレンチ・ダスティ','品格 / 柔和 / 上質','#FAF5F0','#304B62','#CF8C91'),
    scheme('luxury','モダン・ラグジュアリー','重厚 / 特別感 / 上品','#131516','#EEE9DD','#C8A96D'),
    scheme('blue','ネイビー×エレクトリック','信頼 / 先進 / スマート','#F4F7FD','#173A8A','#4B7CF5'),
    scheme('cobalt','コバルト×コーラル','大胆 / 明快 / クリエイティブ','#F5F3EE','#0038A8','#FF6B45'),
    scheme('editorial','エディトリアル・レッド','都会 / 意志 / メリハリ','#F7F7F5','#1D1D1B','#CB3B31'),
    scheme('latte','ラテ＆クレイ','温もり / 素朴 / 居心地','#F4EDE4','#604A3F','#B87855'),
    scheme('forest','フォレスト＆ハニー','健康的 / 誠実 / 自然','#F5F7EE','#355A43','#C5AD67'),
    scheme('rose','ローズ・ニュアンス','繊細 / 親密 / エレガンス','#FFF8F5','#805D66','#D99B9A'),
    scheme('mint','ミント・クリニック','清潔 / 安心 / 親しみ','#F1F8F8','#176C73','#E5A66A'),
    scheme('midnight','ミッドナイト・ミント','未来感 / 精密 / クール','#0E1420','#DFE8F5','#65E5C1'),
    scheme('sunset','サンセット・ピーチ','活気 / 明るさ / 遊び心','#FFF5E9','#722E40','#FF713D'),
    scheme('lilac','ライラック・モード','軽やか / 知性 / 透明感','#F7F4FF','#4E3D83','#B49AF5'),
    scheme('craft','クラフト・アース','手仕事 / 温かさ / 伝統','#F8F3E7','#655B43','#D06B4E'),
    scheme('ocean','オーシャン・ブルー','爽快 / 開放感 / 信頼','#EFF8FA','#1D5B73','#5EC2BE'),
    scheme('bordeaux','ボルドー＆シャンパン','格式 / 気品 / 落ち着き','#F8F2EE','#5B263B','#BA9367'),
    scheme('pastel','パステル・プレイ','親しみ / 明朗 / やさしさ','#FFF9EE','#4D6684','#FFA768'),
    scheme('sumi','墨色×朱赤','和 / 端正 / 現代的','#F5F1E8','#343F38','#A74C46'),
    scheme('neon','ネオン・ライム','挑戦 / 個性 / インパクト','#151521','#F2F0FF','#D7FF45')
  ];
  const defaultId='blue';
  const aliases={green:'sage',beige:'latte',mono:'minimal'};
  const normalize=id=>list.some(p=>p.id===id)?id:(Object.hasOwn(aliases,id)?aliases[id]:defaultId);
  const get=id=>list.find(p=>p.id===normalize(id));
  const tokens=Object.keys(list[0].colors);
  function apply(element,id){
    const p=get(id);
    for(const token of tokens)element.style.setProperty('--theme-'+token,p.colors[token]);
    element.dataset.palette=p.id;
    element.dataset.paletteTone=p.dark?'dark':'light';
  }
  // Source-image comparison is separate from customer palette choices.
  function clear(element){for(const token of tokens)element.style.removeProperty('--theme-'+token);element.removeAttribute('data-palette');element.removeAttribute('data-palette-tone');}
  root.HearingPalettes={list,defaultId,normalize,get,apply,clear};
})(typeof window!=='undefined'?window:globalThis);
