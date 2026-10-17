// Photo/print textures are selectively retained from the supplied artwork.
// Text, controls, cards and people are excluded; those layers are authored separately.
const extras={
 '05-wabi':[[0,815,700,126],[1400,680,272,150]],
 '08-y2k':[[1180,100,300,157],[1550,160,122,280],[0,815,620,126],[1400,785,272,156],[760,850,160,91]],
 '09-isometric':[[628,225,450,490],[1320,595,352,346],[810,117,204,156],[1270,322,178,193],[1440,477,232,178],[0,838,615,103]],
 '10-anti':[[700,270,330,210],[810,90,700,530],[1130,710,542,231],[0,820,700,121],[1380,75,285,150]],
 '11-aurora':[[1320,580,352,361],[787,850,80,91]],
 '12-glass':[[0,775,715,166],[1300,625,340,180],[1375,825,297,116]],
 '13-clay':[[1430,357,218,255]],
 '16-neumo':[[0,843,420,98],[1420,790,252,151],[789,844,75,97]],
 '17-halftone':[[1390,459,245,302],[0,684,315,96],[1520,178,152,130]],
 '18-punk':[[0,95,149,222],[613,456,213,207],[941,657,689,228],[0,819,710,122],[1475,0,197,162],[1465,811,207,130]],
 '19-pixel':[[276,703,400,97],[1420,550,242,161]],
 '20-liquid':[[1410,728,262,213],[0,820,130,121],[1510,258,162,109]]
};
export function atmosphere(d,sourcePath){
 if(!extras[d.id])return '';
 const cut=(r,pad=24)=>{const [x,y,w,h,turn=0]=r;return `<rect x="${x-pad}" y="${y-pad}" width="${w+2*pad}" height="${h+2*pad}" ${turn?`transform="rotate(${turn} ${x+w/2} ${y+h/2})"`:''}/>`};
 const copy=[d.kicker,d.brand,d.headline,d.intro,d.actions].filter(Boolean);
 const right=Math.max(...copy.map(r=>r[0]+r[2]));
 const top=Math.min(...copy.map(r=>r[1]));
 const bottom=Math.max(...copy.map(r=>r[1]+r[3]));
 let holes=cut([0,top,right+8,bottom-top],26)+[d.profile,d.qual,d.search,d.benefits,d.hand].filter(Boolean).map(r=>cut(r)).join('');
 holes+=extras[d.id].map(r=>cut(r,16)).join('');
 return `<svg class="r-atmosphere" viewBox="0 0 1672 941" aria-hidden="true"><defs><filter id="atmo-soft"><feGaussianBlur stdDeviation="8"/></filter><filter id="atmo-tone" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncR data-tone-channel="0" type="table" tableValues="0 1"/><feFuncG data-tone-channel="1" type="table" tableValues="0 1"/><feFuncB data-tone-channel="2" type="table" tableValues="0 1"/></feComponentTransfer></filter><mask id="atmo-mask"><rect width="1672" height="941" fill="white"/><g fill="black" filter="url(#atmo-soft)"><rect x="-30" y="-30" width="1732" height="150"/>${holes}<path d="${sourcePath}" stroke="black" stroke-width="30"/></g></mask></defs><g mask="url(#atmo-mask)"><image class="r-atmosphere-colors" href="../assets/references/${d.id}.png" width="1672" height="941"/></g></svg>`;
}
