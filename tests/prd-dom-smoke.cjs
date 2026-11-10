// Limited DOM-control check: this does not render CSS or replace browser visual testing.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
class Element {
 constructor(tag,attrs={}) {this.style={};this.tagName=tag;this.attrs={...attrs};this.children=[];this.listeners={};this.dataset={};for(const [k,v]of Object.entries(attrs))if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=v;this.value=attrs.value||'';this.checked='checked'in attrs;this.hidden='hidden'in attrs;this.disabled='disabled'in attrs;this.open=false;this.className=attrs.class||'';this.id=attrs.id||'';this.classList={toggle:(name,force)=>{const s=new Set(this.className.split(' '));const add=force===undefined?!s.has(name):force;add?s.add(name):s.delete(name);this.className=[...s].join(' ');},add:name=>this.classList.toggle(name,true),remove:name=>this.classList.toggle(name,false)};}
 append(...nodes){for(const n of nodes){this.children.push(n);if(n instanceof Element)n.parent=this;}}
 prepend(...nodes){this.children.unshift(...nodes);for(const n of nodes)if(n instanceof Element)n.parent=this;}
 replaceChildren(...nodes){this.children=[];this.append(...nodes);}
 set textContent(s){this.children=[String(s)];}get textContent(){return this.children.map(n=>typeof n==='string'?n:n.textContent).join('');}
 setAttribute(k,v){this.attrs[k]=String(v);if(k==='id')this.id=v;}getAttribute(k){return this.attrs[k]??null;}
 addEventListener(type,fn){(this.listeners[type]||=[]).push(fn);}
 click(){if(this.disabled)return;const e={target:this,currentTarget:this,preventDefault(){}};if(this.onclick)this.onclick(e);for(const fn of this.listeners.click||[])fn(e);}
 dispatch(type){for(const fn of this.listeners[type]||[])fn({target:this,currentTarget:this});}
 focus(){}scrollIntoView(){}setCustomValidity(s){this.invalid=s;}reportValidity(){return !this.invalid&&(!('required'in this.attrs)||this.value.trim().length>0)&&(!this.attrs.pattern||new RegExp('^'+this.attrs.pattern+'$').test(this.value));}
 showModal(){this.open=true;}close(){this.open=false;}getBoundingClientRect(){return {left:0,right:100,top:0,bottom:100};}
 remove(){if(this.parent)this.parent.children=this.parent.children.filter(x=>x!==this);}
 matches(sel){let checked=sel.endsWith(':checked');if(checked){sel=sel.slice(0,-8);if(!this.checked)return false;}
  if(sel.startsWith('#'))return this.id===sel.slice(1);if(sel.startsWith('.'))return this.className.split(' ').includes(sel.slice(1));
  const a=sel.match(/^([\w-]*)?\[([\w-]+)(?:="([^"]*)")?\]$/);if(a)return (!a[1]||this.tagName===a[1])&&(a[2].startsWith('data-')?this.dataset[a[2].slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]!==undefined&&(!a[3]||this.dataset[a[2].slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]===a[3]):this.attrs[a[2]]!==undefined&&(!a[3]||this.attrs[a[2]]===a[3]));return this.tagName===sel;}
 querySelectorAll(sel){const split=sel.indexOf(' ');if(split>=0)return this.querySelectorAll(sel.slice(0,split)).flatMap(n=>n.querySelectorAll(sel.slice(split+1)));const found=[];for(const n of this.children){if(!(n instanceof Element))continue;if(n.matches(sel))found.push(n);found.push(...n.querySelectorAll(sel));}return found;}
 querySelector(sel){return this.querySelectorAll(sel)[0]||null;}
}
function fromJSON(n){if(typeof n==='string')return n;const e=new Element(n.tag,n.attrs);e.append(...n.children.map(fromJSON));return e;}
const document=fromJSON(JSON.parse(require('node:child_process').execFileSync('python3',[__dirname+'/html-fixture.py'],{encoding:'utf8'})));document.createElement=tag=>new Element(tag);document.body=document.querySelector('body');
const store=new Map();const context=vm.createContext({window:{WROrder:require(process.cwd()+'/dist/order.js'),addEventListener(){}},document,sessionStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},console,Intl,Date,setTimeout:()=>1,clearTimeout(){},AbortController,URL,Blob});
vm.runInContext(fs.readFileSync('dist/app.js','utf8'),context);
const $=s=>document.querySelector(s),run=src=>vm.runInContext(src,context);
const choose=id=>document.querySelectorAll('[data-choose-set]').find(x=>x.dataset.chooseSet===id).click();
const typeWish=text=>{$('#bag-message').value=text;$('#bag-message').dispatch('input');};
assert.equal(document.querySelectorAll('.preset-product').length,Object.keys(context.window.WROrder.giftSets).length);
assert.deepEqual(document.querySelectorAll('.preset-product').map(x=>x.dataset.giftSet),['selfcare','christmasHome','teaBox']);
assert.equal($('#build-a-box'),null);assert.equal($('#fulfilment'),null);
assert.equal($('#bag-count').textContent,'0');assert.equal($('#confirmation-dialog').open,false);
// Empty guard, including an attempted jump straight to review or confirmation.
$('#open-bag').click();assert.equal($('#bag-summary').hidden,true);assert.equal($('#bag-empty').hidden,false);assert.equal($('#confirm-order').disabled,true);assert.equal(run('confirmOrder()'),false);assert.equal(run('reviewOrder()'),false);assert.equal($('#confirmation-dialog').open,false);$('#close-empty-cart').click();
// Choosing a set opens the editable message step, not the final confirmation action.
choose('selfcare');assert.equal($('#message-step').hidden,false);assert.equal($('#review-step').hidden,true);assert.equal($('#confirm-order').disabled,true);assert.equal(run('confirmOrder()'),false);
typeWish('Happy birthday!');assert.equal($('#message').value,'Happy birthday!');assert.equal($('#message-character-count').textContent,'15 / 280');assert.equal($('#review-step').hidden,true);assert.equal($('#confirmation-dialog').open,false);
$('#review-order').click();assert.equal($('#message-step').hidden,true);assert.equal($('#review-step').hidden,false);assert.equal($('#bag-title').textContent,'Review your order summary');assert.equal($('#summary-name').textContent,'Self-care gift set');assert.equal($('#bag-total').textContent,'€28.00');assert.equal($('#summary-message').textContent,'Happy birthday!');assert.equal($('#confirm-order').disabled,false);assert.equal($('#confirmation-dialog').open,false);
// Explicit edit returns to the field with its existing message, then requires a new review.
$('#edit-message').click();assert.equal($('#message-step').hidden,false);assert.equal($('#review-step').hidden,true);assert.equal($('#bag-message').value,'Happy birthday!');assert.equal($('#confirm-order').disabled,true);assert.equal(run('confirmOrder()'),false);
typeWish('A revised wish, with love.');assert.equal(run('order.reviewedSummary'),null);$('#review-order').click();assert.equal($('#summary-message').textContent,'A revised wish, with love.');assert.equal($('#review-step').hidden,false);assert.equal($('#confirmation-dialog').open,false);
// Changing the gift also requires the message/review sequence, and keeps only one set.
$('#review-change-gift').click();choose('teaBox');assert.equal($('#bag-count').textContent,'1');assert.equal($('#bag-message').value,'A revised wish, with love.');assert.equal($('#review-step').hidden,true);assert.equal($('#confirm-order').disabled,true);$('#review-order').click();assert.equal($('#summary-name').textContent,'Tea & spices gift set');assert.equal($('#bag-total').textContent,'€22.30');
$('#confirm-order').click();assert.equal($('#confirmation-dialog').open,true);assert.equal($('#confirmation-name').textContent,'Tea & spices gift set');assert.equal($('#confirmation-price').textContent,'€22.30');assert.equal($('#confirmation-message').textContent,'A revised wish, with love.');assert.ok($('#confirmation-reference').textContent.includes('DEMO-'));
// Optional blank message uses the same visible review step before confirmation.
$('#start-new-order').click();choose('selfcare');assert.equal($('#bag-message').value,'');$('#review-order').click();assert.equal($('#review-step').hidden,false);assert.equal($('#summary-message').textContent,'No personal message added.');assert.equal($('#edit-message').textContent,'Add a message (optional)');assert.equal($('#confirmation-dialog').open,false);$('#confirm-order').click();assert.equal($('#confirmation-price').textContent,'€28.00');assert.equal($('#confirmation-message').textContent,'No personal message added.');
// The page-level message form now has a direct route to the complete order summary.
$('#start-new-order').click();choose('christmasHome');$('#continue-browsing').click();$('#message').value='Merry Christmas, with love!';$('#message').dispatch('input');$('#review-note-order').click();assert.equal($('#bag-dialog').open,true);assert.equal($('#review-step').hidden,false);assert.equal($('#summary-name').textContent,'A little Christmas at Home');assert.equal($('#bag-total').textContent,'€36.65');assert.equal($('#summary-message').textContent,'Merry Christmas, with love!');assert.equal($('#confirmation-dialog').open,false);
for(const item of ['Christmas tree ornament','Napkin','Scented candle'])assert.ok($('#summary-contents').textContent.includes(item));
// Removing a previously written wish is an edit, and its blank value reaches review.
$('#edit-message').click();typeWish('');$('#review-order').click();assert.equal($('#summary-message').textContent,'No personal message added.');$('#confirm-order').click();assert.equal($('#confirmation-name').textContent,'A little Christmas at Home');assert.equal($('#confirmation-message').textContent,'No personal message added.');
// Note-preview users also get visible edit and review actions, without an auto-confirm.
$('#start-new-order').click();choose('selfcare');$('#continue-browsing').click();$('#message').value='Enjoy this little gift.';$('#message').dispatch('input');$('#preview-note').click();assert.equal($('#note-dialog').open,true);$('#edit-note-preview').click();assert.equal($('#note-dialog').open,false);assert.equal($('#message-step').hidden,false);assert.equal($('#bag-message').value,'Enjoy this little gift.');$('#continue-browsing').click();$('#preview-note').click();$('#review-note-preview').click();assert.equal($('#note-dialog').open,false);assert.equal($('#review-step').hidden,false);assert.equal($('#summary-message').textContent,'Enjoy this little gift.');assert.equal($('#confirmation-dialog').open,false);
$('#edit-message').click();$('#remove-gift').click();assert.equal($('#bag-summary').hidden,true);assert.equal($('#bag-count').textContent,'0');assert.equal($('#confirm-order').disabled,true);
console.log('Control regression checks passed: message → separate review → explicit confirmation; edit/re-review; replacement; blank/removable wishes; both page and note-preview entry points; Christmas in the middle; current prices and no optional shopping features.');
