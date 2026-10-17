import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import vm from 'node:vm';
const context={window:{},URL};
vm.runInNewContext(await readFile(new URL('../dist/palettes.js',import.meta.url),'utf8'),context);
vm.runInNewContext(await readFile(new URL('../dist/model.js',import.meta.url),'utf8'),context);
vm.runInNewContext(await readFile(new URL('../dist/catalog.js',import.meta.url),'utf8'),context);
const M=context.window.HearingModel;
const P=context.window.HearingPalettes;
test('new hearings and retired or missing palette selections use the blue default',()=>{
  const s=M.empty();assert.equal(s.preferences.palette,'blue');assert.equal(P.list.length,20);assert.ok(!P.list.some(p=>p.id==='original'));
  delete s.preferences.palette;assert.equal(M.preview(s).palette,'blue');
  for(const id of ['original','unknown','url(javascript:alert(1))']){s.preferences.palette=id;assert.equal(M.preview(s).palette,'blue');assert.equal(M.exportData(s).designPreferences.palette,'blue');}
  assert.equal(P.normalize('green'),'sage');assert.equal(P.normalize('beige'),'latte');assert.equal(P.normalize('mono'),'minimal');
});
test('all twenty base/main/accent triples match the supplied color cheat sheet in order',()=>{
  const expected=['F8F7F3/242B2B/C67C59','F6F3EB/587365/DCA86B','FAF5F0/304B62/CF8C91','131516/EEE9DD/C8A96D','F4F7FD/173A8A/4B7CF5','F5F3EE/0038A8/FF6B45','F7F7F5/1D1D1B/CB3B31','F4EDE4/604A3F/B87855','F5F7EE/355A43/C5AD67','FFF8F5/805D66/D99B9A','F1F8F8/176C73/E5A66A','0E1420/DFE8F5/65E5C1','FFF5E9/722E40/FF713D','F7F4FF/4E3D83/B49AF5','F8F3E7/655B43/D06B4E','EFF8FA/1D5B73/5EC2BE','F8F2EE/5B263B/BA9367','FFF9EE/4D6684/FFA768','F5F1E8/343F38/A74C46','151521/F2F0FF/D7FF45'];
  P.list.forEach((p,i)=>assert.equal(p.swatches.map(c=>c.slice(1)).join('/'),expected[i]));
});
test('chosen palette is shared by previews and handoff without changing text, images or approvals',()=>{
  const s=M.empty();s.fields.business='山田相談室';s.images.logo='data:image/png;base64,abcd';s.copy.profile={text:'本人の文章',status:'approved'};
  for(const p of P.list){s.preferences.palette=p.id;assert.equal(M.preview(s).palette,p.id);assert.equal(M.exportData(s).designPreferences.palette,p.id);assert.equal(M.exportData(s).designPreferences.paletteName,p.name);assert.equal(M.exportData(s).designPreferences.paletteColors.accent,p.colors.accent);assert.equal(M.preview(s).logo,s.images.logo);assert.equal(M.preview(s).business,'山田相談室');assert.equal(s.copy.profile.status,'approved');}
});
test('light/dark switching resets all colors and source-image comparison can clear them',()=>{
  const properties=new Map(),element={dataset:{},style:{setProperty:(k,v)=>properties.set(k,v),removeProperty:k=>properties.delete(k)},removeAttribute:k=>delete element.dataset[k==='data-palette-tone'?'paletteTone':'palette']};
  P.apply(element,'midnight');assert.equal(element.dataset.paletteTone,'dark');assert.equal(properties.get('--theme-paper'),'#0E1420');
  P.apply(element,'blue');assert.equal(element.dataset.paletteTone,'light');assert.equal(properties.get('--theme-primary'),'#173A8A');assert.equal(properties.get('--theme-accent'),'#4B7CF5');
  P.clear(element);assert.equal(properties.size,0);assert.equal(element.dataset.palette,undefined);assert.equal(element.dataset.paletteTone,undefined);
});
test('curated button and text color pairs meet 4.5:1 contrast',()=>{
  const lum=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
  const ratio=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
  for(const p of P.list)for(const [fg,bg] of [['on-accent','accent'],['on-accent','accent-hover'],['on-main','main'],['on-main','strong'],['ink','paper'],['muted','paper'],['primary','soft']])assert.ok(ratio(p.colors[fg],p.colors[bg])>=4.5,p.id+' '+fg+'/'+bg+' '+ratio(p.colors[fg],p.colors[bg]));
});
test('blank information never becomes fictional facts or exported sample data',()=>{
  const s=M.empty();assert.equal(M.buildCopy(s,'profile'),'');assert.equal(M.buildCopy(s,'services'),'');
  const data=M.exportData(s);assert.equal(data.fields.name,'');assert.equal(data.images.photo,'');assert.equal(data.kind,'draft');assert.equal(data.designUse,'preference-reference-only');
});
test('copy uses supplied facts without inventing qualifications, prices or experience',()=>{
  const s=M.empty();s.fields.name='テスト 花子';s.fields.qualification='行政書士';s.materials.profile='2026年開業\n福岡市で活動';s.materials.services='許認可申請\n書類作成';
  assert.match(M.buildCopy(s,'profile'),/行政書士のテスト 花子/);assert.match(M.buildCopy(s,'profile'),/2026年開業/);assert.match(M.buildCopy(s,'services'),/許認可申請/);
  assert.doesNotMatch(M.buildCopy(s,'profile'),/実績|経験豊富|円|税理士/);
});
test('editing source material invalidates only dependent approvals',()=>{
  const s=M.empty();for(const key of Object.keys(M.blockNames))s.copy[key]={text:key,status:'approved',approvedAt:'2026-10-13',approvedText:key};
  M.invalidate(s,['profile']);assert.equal(s.copy.profile.status,'review');assert.equal(s.copy.profile.approvedAt,undefined);assert.equal(s.copy.profile.approvedText,undefined);assert.equal(s.copy.services.status,'approved');
});
test('a complete hearing needs approved or explicitly omitted copy and preferences',()=>{
  const s=M.empty();Object.assign(s.fields,{business:'テスト事務所',name:'テスト 花子',qualification:'行政書士'});s.answers.contact='none';for(const key of Object.keys(M.blockNames))s.copy[key]={text:'',status:'omitted'};s.preferences.delegate=true;
  assert.equal(M.issues(s).length,0);s.copy.profile.status='review';assert.ok(M.issues(s).some(x=>x.includes('自己紹介')));s.copy.profile.status='omitted';s.preferences.delegate=false;assert.ok(M.issues(s).some(x=>x.includes('雰囲気')));
});
test('contact validation follows the selected method and rejects unsafe URLs',()=>{
  const s=M.empty();s.answers.contact='url';s.fields.contactUrl='javascript:alert(1)';assert.ok(M.issues(s).some(x=>x.includes('URL')));s.fields.contactUrl='https://example.jp/contact';assert.ok(!M.issues(s).some(x=>x.includes('URL')));s.answers.contact='email';s.fields.email='bad';assert.ok(M.issues(s).some(x=>x.includes('メール')));
});
test('the same user text and images are passed verbatim to every design',()=>{
  const s=M.empty();s.fields.business='株式会社 <テスト> & 相談室';s.fields.headline='一行目\n二行目';s.images.logo='data:image/png;base64,abcd';const p=M.preview(s);assert.equal(p.business,s.fields.business);assert.equal(p.headline,s.fields.headline);assert.equal(p.logo,s.images.logo);
});
test('explicitly omitted copy is excluded from the preview sections',()=>{
  const s=M.empty();s.copy.profile={text:'公開しないプロフィール',status:'omitted'};s.copy.services={text:'公開しない業務紹介',status:'omitted'};const p=M.preview(s);assert.equal(p.profile,'');assert.equal(p.services,'');assert.equal(p.omitProfile,true);assert.equal(p.omitServices,true);
});
test('there are 20 unique, individually accessible UTF-8 HTML designs',async()=>{
  const d=context.window.DESIGNS;assert.equal(d.length,20);assert.equal(new Set(d.map(x=>x.id)).size,20);assert.equal(new Set(d.map(x=>x.layout)).size,20);
  const files=await readdir(new URL('../dist/previews/',import.meta.url));assert.equal(files.filter(f=>f.endsWith('.html')).length,20);
  for(const design of d){const html=await readFile(new URL('../dist/previews/'+design.id+'.html',import.meta.url),'utf8');assert.ok(html.includes('<meta charset="UTF-8">'));assert.ok(html.includes('data-bind="headline"'));assert.ok(html.includes('data-logo'));assert.ok(html.includes('data-photo'));assert.ok(html.includes(`layout-${design.layout}`));assert.ok(html.includes('../palette.css'));assert.ok(html.includes('../palettes.js'));assert.ok(!html.includes('\ufffd'));}
});
