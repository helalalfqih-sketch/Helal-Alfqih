const fs = require('fs');
fetch('https://firebasestorage.googleapis.com/v0/b/smartcontentcreator-d49f2.firebasestorage.app/o/catalogs%2Fglobal%2Fcatalog.csv?alt=media&token=d24eb6f3-c890-417c-acb5-7355250ba171&ext=.csv').then(r => r.text()).then(t => {
  const lines = t.split('\n');
  const headers = lines[0].split(',');
  const parsed = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    // VERY simple CSV parse (not handling quotes, but enough to count columns)
    const cols = [];
    let cur = ''; let inQuote = false;
    for (let c = 0; c < lines[i].length; c++) {
      const char = lines[i][c];
      if (char === '\"') inQuote = !inQuote;
      else if (char === ',' && !inQuote) { cols.push(cur); cur = ''; }
      else cur += char;
    }
    cols.push(cur);
    const obj = {};
    headers.forEach((h, idx) => obj[h.trim()] = cols[idx]);
    parsed.push(obj);
  }
  const validTitled = parsed.filter(p => p.title && p.title.trim() !== '');
  console.log('rows:', parsed.length);
  console.log('valid titled rows:', validTitled.length);
  console.log('skipped:', parsed.length - validTitled.length);
  const addImg = validTitled.filter(p => {
    let hasAdd = false;
    for(let k in p) if (k.startsWith('additional_image_link') && p[k]) hasAdd = true;
    return hasAdd;
  });
  console.log('additional-image products:', addImg.length);
  const videos = validTitled.filter(p => {
    let hasVid = false;
    for(let k in p) if (k.startsWith('video[') && p[k]) hasVid = true;
    return hasVid;
  });
  console.log('video products:', videos.length);
  const both = validTitled.filter(p => addImg.includes(p) && videos.includes(p));
  console.log('multiple-images-and-video products:', both.length);
});
