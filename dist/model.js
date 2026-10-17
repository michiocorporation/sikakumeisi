(function(root){
  'use strict';
  const storageKey='shikaku-hearing-v1';
  const blockNames={profile:'自己紹介',services:'業務紹介',values:'大切にしていること'};
  const empty=()=>({version:1,step:3,fields:{business:'',name:'',qualification:'',location:'',address:'',headline:'',intro:'',email:'',phone:'',contactUrl:''},answers:{status:'',audience:'',contact:'',tone:'',value:''},materials:{profile:'',services:'',values:''},copy:{profile:{text:'',status:'empty'},services:{text:'',status:'empty'},values:{text:'',status:'empty'}},images:{logo:'',photo:''},preferences:{likes:[],avoids:[],reasons:{},delegate:false,palette:root.HearingPalettes.defaultId},updatedAt:null});
  const lines=v=>String(v||'').split(/\n+/).map(x=>x.trim().replace(/^[・\-•]\s*/, '')).filter(Boolean);
  function buildCopy(state,key,tone='standard'){
    const f=state.fields,m=state.materials,a=state.answers;
    if(key==='profile'){
      const base=[f.business, f.qualification&&f.name?`${f.qualification}の${f.name}`:f.name||f.qualification].filter(Boolean).join('、');
      const parts=[base?`${base}です。`:'',f.location?`活動エリアは${f.location}です。`:'',...lines(m.profile).map(v=>/[。！？]$/.test(v)?v:v+'。')].filter(Boolean);
      return (tone==='short'?parts.slice(0,2):parts).join(tone==='gentle'?'\n':'');
    }
    if(key==='services'){
      const items=lines(m.services);if(!items.length)return '';
      if(tone==='short')return items.join(' / ');
      return (tone==='gentle'?'お仕事の内容をご紹介します。\n':'対応業務は、以下のとおりです。\n')+items.map(v=>'・'+v).join('\n');
    }
    const values=[a.value&&a.value!=='お任せ'?a.value:'',...lines(m.values)].filter(Boolean);
    if(!values.length)return '';
    if(tone==='short')return values.join(' / ');
    return (tone==='formal'?'仕事において大切にしていることは、次のとおりです。\n':'大切にしていることをご紹介します。\n')+values.map(v=>'・'+v).join('\n');
  }
  function invalidate(state,keys=Object.keys(blockNames)) {for(const k of keys){const block=state.copy[k];if(block.text){block.status='review';delete block.approvedAt;delete block.approvedText;}}}
  function preview(state){const f=state.fields, c=state.copy, services=lines(state.materials.services);return {...f,...state.images,palette:root.HearingPalettes.normalize(state.preferences.palette),headline:f.headline,intro:f.intro||c.profile.text,profile:c.profile.status==='omitted'?'':c.profile.text,services:c.services.status==='omitted'?'':c.services.text,omitProfile:c.profile.status==='omitted',omitServices:c.services.status==='omitted',value:state.answers.value==='お任せ'?'':state.answers.value||lines(state.materials.values)[0],service1:services[0],service2:services[1],service3:services[2],contact:({email:f.email,phone:f.phone,both:[f.email,f.phone].filter(Boolean).join(' / '),url:f.contactUrl})[state.answers.contact]||'',email:undefined,phone:undefined,contactUrl:undefined};}
  function issues(state){const out=[];for(const [key,label] of [['business','屋号・事務所名'],['name','お名前'],['qualification','資格名・職種']])if(!state.fields[key].trim())out.push(label+'を入力してください。');for(const [key,label]of Object.entries(blockNames))if(state.copy[key].status!=='approved'&&state.copy[key].status!=='omitted')out.push(label+'の文章を承認するか「今回は掲載しない」を選んでください。');if(!state.preferences.delegate&&!state.preferences.likes.length)out.push('好きな雰囲気、または「お任せ」を選んでください。');if(!state.answers.contact)out.push('連絡方法を選んでください。');if(['email','both'].includes(state.answers.contact)&&!/^\S+@\S+\.\S+$/.test(state.fields.email))out.push('掲載用のメールアドレスを確認してください。');if(['phone','both'].includes(state.answers.contact)&&!/^[+\d\s()\-]{6,30}$/.test(state.fields.phone))out.push('掲載用の電話番号を確認してください。');if(state.answers.contact==='url'){try{if(!['https:','http:'].includes(new URL(state.fields.contactUrl).protocol))throw Error();}catch{out.push('お問い合わせURLを確認してください。');}}return out;}
  function exportData(state,final=false){return {schema:'shikakumeishi.hearing.v1',kind:final?'confirmed':'draft',exportedAt:new Date().toISOString(),fields:{...state.fields},answers:{...state.answers},materials:{...state.materials},copy:JSON.parse(JSON.stringify(state.copy)),images:{...state.images},designPreferences:{...JSON.parse(JSON.stringify(state.preferences)),palette:root.HearingPalettes.normalize(state.preferences.palette),paletteName:root.HearingPalettes.get(state.preferences.palette).name,paletteColors:Object.fromEntries(["base","main","accent"].map(key=>[key,root.HearingPalettes.get(state.preferences.palette).colors[key]]))},designUse:'preference-reference-only',notes:'選択した見本・配色はデザインの好みを把握する参考資料です。完成サイトのテンプレート指定ではありません。',unresolved:issues(state)};}
  root.HearingModel={storageKey,empty,lines,buildCopy,invalidate,preview,issues,exportData,blockNames};
})(typeof window!=='undefined'?window:globalThis);
