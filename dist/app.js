const Order = window.WROrder;
const bagDialog = document.querySelector('#bag-dialog');
const confirmationDialog = document.querySelector('#confirmation-dialog');
const noteDialog = document.querySelector('#note-dialog');
const message = document.querySelector('#message');
let savedSelection=null;
try {savedSelection=JSON.parse(sessionStorage.getItem('wr-prototype-selection')||'null');}catch{}
const order=Order.createDraft(savedSelection);
let orderStep='message';
function money(cents){return new Intl.NumberFormat('en-IE',{style:'currency',currency:'EUR',minimumFractionDigits:2,maximumFractionDigits:2}).format(cents/100);}
function persistSelection(){try{sessionStorage.setItem('wr-prototype-selection',JSON.stringify(order.selection));}catch{}}
function notify(text){const toast=document.querySelector('#bag-toast');toast.textContent=text;toast.classList.add('visible');clearTimeout(notify.timer);notify.timer=setTimeout(()=>toast.classList.remove('visible'),2600);}
function createImage(product, className) {
  const image = document.createElement('img');
  image.src = 'assets/' + product.image;
  image.alt = product.name;
  image.loading = 'lazy';
  if (className) image.className = className;
  return image;
}
function renderCatalogue(){
  const container=document.querySelector('#gift-catalogue');
  for(const [id,gift] of Object.entries(Order.giftSets)){
    const card=document.createElement('article');card.className='product preset-product';card.dataset.giftSet=id;
    const visual=document.createElement('div');visual.className='product-image';const image=createImage(gift);visual.append(image);
    const details=document.createElement('div');details.className='preset-copy';
    const tag=document.createElement('p');tag.className='eyebrow preset-kicker';tag.textContent=gift.tagline;
    const name=document.createElement('h3');name.className='product-label';name.textContent=gift.name;
    const description=document.createElement('p');description.className='product-description';description.textContent=gift.description;
    const list=document.createElement('ul');list.className='preset-contents';for(const text of gift.contents){const li=document.createElement('li');li.textContent=text;list.append(li);}
    const row=document.createElement('div');row.className='product-buy';const price=document.createElement('p');price.className='product-price';price.textContent=money(gift.price);
    if(gift.sample){const label=document.createElement('small');label.textContent='sample price';price.append(label);}
    const choose=document.createElement('button');choose.className='button choose-set';choose.dataset.chooseSet=id;choose.textContent='Choose this gift set';choose.onclick=()=>chooseGiftSet(id);row.append(price,choose);
    details.append(tag,name,description,list,row);card.append(visual,details);container.append(card);
  }
}
function renderOrder(){
  const summary=order.summary;
  document.querySelector('#bag-count').textContent=summary?'1':'0';
  document.querySelector('#bag-summary').hidden=!summary;
  document.querySelector('#bag-empty').hidden=!!summary;
  const reviewing=!!summary&&orderStep==='review'&&!!order.reviewedSummary;
  document.querySelector('#message-step').hidden=!summary||reviewing;
  document.querySelector('#review-step').hidden=!reviewing;
  document.querySelector('#bag-title').textContent=!summary?'Choose a gift set':reviewing?'Review your order summary':'Personalise your gift';
  document.querySelector('#confirm-order').disabled=!reviewing;
  document.querySelectorAll('[data-choose-set]').forEach(button=>{
    const selected=order.selection?.type==='set'&&order.selection.id===button.dataset.chooseSet;
    button.textContent=selected?'Selected · personalise':'Choose this gift set';button.setAttribute('aria-pressed',String(selected));
  });
  document.querySelector('#catalogue-status').textContent=summary?summary.name+' is selected. Choosing another set will replace it.':'Choose a gift set to begin. You can keep browsing for as long as you like.';
  document.querySelector('#message-character-count').textContent=order.message.length+' / 280';
  if(!summary)return;
  document.querySelector('#editing-gift-name').textContent=summary.name+' · '+money(summary.price);
  document.querySelector('#edit-message').textContent=summary.message.trim()?'Edit message':'Add a message (optional)';
  document.querySelector('#summary-image').src='assets/'+summary.image;document.querySelector('#summary-image').alt=summary.name;
  document.querySelector('#summary-name').textContent=summary.name;document.querySelector('#summary-description').textContent=summary.description;
  document.querySelector('#summary-price').textContent=money(summary.price);document.querySelector('#bag-total').textContent=money(summary.price);
  document.querySelector('#summary-price-note').textContent=summary.sample?'Sample price for this prototype.':'Price per gift set.';
  const list=document.querySelector('#summary-contents');list.replaceChildren();for(const text of summary.contents){const li=document.createElement('li');li.textContent=text;list.append(li);}
  document.querySelector('#summary-message').textContent=summary.message.trim()||'No personal message added.';
}
function openCart(){
  if(order.confirmation){showConfirmation(order.confirmation);return true;}
  orderStep=order.reviewedSummary?'review':'message';renderOrder();document.querySelector('#order-status').textContent='';bagDialog.showModal();bagDialog.scrollTop=0;document.querySelector('#bag-title').focus();return !!order.summary;
}
function chooseGiftSet(id){
  order.select({type:'set',id});orderStep='message';persistSelection();renderOrder();notify(Order.giftSets[id].name+' selected. One set per pretend order.');openCart();
}
function updateMessage(text,source){
  order.setMessage(text);orderStep='message';
  if(source!==message)message.value=order.message;
  const cartMessage=document.querySelector('#bag-message');if(source!==cartMessage)cartMessage.value=order.message;
  document.querySelector('#character-count').textContent=order.message.length+' / 280';
  document.querySelector('#note-status').textContent=order.message.trim()?'Choose “Review order summary” to check your gift and message before confirming.':'Your message is optional. You can continue without adding one.';
  renderOrder();
}
function reviewOrder(){
  if(!order.summary){openCart();document.querySelector('#order-status').textContent='Choose a gift set before reviewing your order.';return false;}
  const field=document.querySelector('#bag-message');
  if(field.value!==order.message)updateMessage(field.value,field);
  order.review();orderStep='review';renderOrder();document.querySelector('#order-status').textContent='';
  if(!bagDialog.open)bagDialog.showModal();bagDialog.scrollTop=0;document.querySelector('#bag-title').focus();return true;
}
function editMessage(){
  orderStep='message';renderOrder();document.querySelector('#order-status').textContent='Edit your message, then review the order summary again.';bagDialog.scrollTop=0;document.querySelector('#bag-message').focus();
}
function reviewFromNote(){
  updateMessage(message.value,message);
  if(!order.summary)document.querySelector('#note-status').textContent='Choose a gift set first. Your message will be kept for it.';
  return reviewOrder();
}
function browseCatalogue(){bagDialog.close();document.querySelector('#collection').scrollIntoView({behavior:'smooth'});}
function showConfirmation(confirmation){
  const gift=confirmation.gift;
  document.querySelector('#confirmation-reference').textContent='Demo reference: '+confirmation.reference;
  document.querySelector('#confirmation-name').textContent=gift.name;document.querySelector('#confirmation-price').textContent=money(gift.price);
  document.querySelector('#confirmation-image').src='assets/'+gift.image;document.querySelector('#confirmation-image').alt=gift.name;
  document.querySelector('#confirmation-message').textContent=gift.message.trim()||'No personal message added.';
  const list=document.querySelector('#confirmation-contents');list.replaceChildren();for(const text of gift.contents){const li=document.createElement('li');li.textContent=text;list.append(li);}
  bagDialog.close();confirmationDialog.showModal();document.querySelector('#confirmation-title').focus();
}
function confirmOrder(){
  if(!order.summary){document.querySelector('#order-status').textContent='Choose a gift set before confirming.';return false;}
  if(orderStep!=='review'||!order.reviewedSummary){document.querySelector('#order-status').textContent='Review your order summary before confirming.';return false;}
  showConfirmation(order.confirm());return true;
}
function downloadText(filename,text){const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function confirmationText(){const confirmation=order.confirmation;if(!confirmation)return null;const gift=confirmation.gift;return ['Wishes & Ribbons — DEMONSTRATION CONFIRMATION','No payment taken. No real order was sent to the business.','Reference: '+confirmation.reference,'Gift set: '+gift.name,'Quantity: 1','Price: '+money(gift.price),...gift.contents,'','Personal message:',gift.message.trim()||'No personal message added.'].join('\n');}
function startNewOrder(){order.reset();orderStep='message';persistSelection();updateMessage('');renderOrder();confirmationDialog.close();document.querySelector('#collection').scrollIntoView({behavior:'smooth'});}
function previewNote(){
  if(!message.value.trim()){document.querySelector('#note-status').textContent='Add a wish to preview a note, or leave it blank and continue with your gift set.';message.focus();return;}
  document.querySelector('#card-recipient').textContent='For someone special,';document.querySelector('#card-message').textContent=order.message;document.querySelector('#card-sender').textContent='With love';noteDialog.showModal();
}
function saveNote(){if(!order.message.trim()){previewNote();return;}downloadText('wishes-and-ribbons-gift-note.txt',order.message+'\n\nWishes & Ribbons');}
renderCatalogue();renderOrder();
document.querySelector('#open-bag').onclick=openCart;
document.querySelector('#browse-empty-cart').onclick=browseCatalogue;
document.querySelector('#close-empty-cart').onclick=()=>bagDialog.close();
document.querySelector('#change-gift').onclick=browseCatalogue;
document.querySelector('#continue-browsing').onclick=()=>bagDialog.close();
document.querySelector('#remove-gift').onclick=()=>{order.clear();persistSelection();renderOrder();document.querySelector('#empty-cart-message').textContent='Your selection was removed. Keep browsing until you find the right gift.';};
document.querySelector('#review-order').onclick=reviewOrder;
document.querySelector('#review-note-order').onclick=reviewFromNote;
document.querySelector('#edit-message').onclick=editMessage;
document.querySelector('#review-change-gift').onclick=browseCatalogue;
document.querySelector('#confirm-order').onclick=confirmOrder;
document.querySelector('#start-new-order').onclick=startNewOrder;
document.querySelector('#save-confirmation').onclick=()=>{const text=confirmationText();if(text)downloadText('wishes-and-ribbons-demo-confirmation.txt',text);};
message.addEventListener('input',()=>updateMessage(message.value,message));
document.querySelector('#bag-message').addEventListener('input',event=>updateMessage(event.target.value,event.target));
document.querySelector('#preview-note').onclick=previewNote;
document.querySelector('#review-note-preview').onclick=()=>{noteDialog.close();reviewFromNote();};
document.querySelector('#edit-note-preview').onclick=()=>{noteDialog.close();if(order.summary){if(!bagDialog.open)bagDialog.showModal();editMessage();}else{document.querySelector('#gift-note').scrollIntoView({behavior:'smooth'});message.focus();}};
document.querySelector('#save-note').onclick=saveNote;
document.querySelector('#download-preview').onclick=saveNote;
document.querySelector('#note-form').addEventListener('submit',event=>event.preventDefault());
document.querySelectorAll('dialog').forEach(dialog=>{
  dialog.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();});
});
document.querySelector('.menu-toggle').addEventListener('click',event=>{const open=event.currentTarget.getAttribute('aria-expanded')!=='true';event.currentTarget.setAttribute('aria-expanded',String(open));document.querySelector('#navigation').classList.toggle('open',open);});
document.querySelectorAll('#navigation a').forEach(link=>link.addEventListener('click',()=>{document.querySelector('#navigation').classList.remove('open');document.querySelector('.menu-toggle').setAttribute('aria-expanded','false');}));
document.querySelector('#year').textContent=new Date().getFullYear();
if(document.modelContext?.registerTool){
  const lifecycle=new AbortController();
  const tools=[{name:'read_gift_order',title:'Read selected gift set',description:'Read the single selected gift set and optional message for a pretend order. No real order or payment is made.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>({gift:order.summary,reviewedSummary:order.reviewedSummary,confirmation:order.confirmation,pretendOnly:true})},
  {name:'choose_gift_set',title:'Choose one gift set',description:'Replace the current selection with one catalogue gift set. Does not confirm even a pretend order.',inputSchema:{type:'object',properties:{giftSet:{type:'string',enum:Object.keys(Order.giftSets)}},required:['giftSet'],additionalProperties:false},annotations:{readOnlyHint:false},execute:input=>{if(!input||Object.keys(input).length!==1||!Object.hasOwn(Order.giftSets,input.giftSet))throw new Error('Choose a catalogue gift set.');chooseGiftSet(input.giftSet);return order.summary;}}];
  for(const tool of tools){try{Promise.resolve(document.modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}}
  window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}
