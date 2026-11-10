const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const Order=require('../dist/order.js');
test('PRD catalogue: each set has an image, description, contents and integer EUR price',()=>{
 assert.ok(Object.keys(Order.giftSets).length>=2);
 for(const gift of Object.values(Order.giftSets)){assert.ok(fs.existsSync('dist/assets/'+gift.image));assert.ok(gift.description.length>20);assert.ok(gift.contents.length);assert.ok(Number.isInteger(gift.price)&&gift.price>0);}
 assert.equal(Order.giftSets.selfcare.price,2800);assert.equal(Order.giftSets.teaBox.price,2230);assert.equal(Order.giftSets.christmasHome.price,3665);
});
test('PRD guard: no order summary or confirmation before choosing a set',()=>{
 const draft=Order.createDraft();assert.equal(draft.summary,null);assert.equal(draft.confirmation,null);assert.throws(()=>draft.confirm(),/Choose a gift set/);assert.throws(()=>draft.select({type:'set',id:'unknown'}));assert.equal(draft.summary,null);
});
test('PRD optional message: confirmation works with no message or an entered message',()=>{
 for(const message of ['', 'Happy birthday! Enjoy a little care.']){const d=Order.createDraft();d.select({type:'set',id:'selfcare'});d.setMessage(message);assert.equal(d.summary.message,message);assert.equal(d.confirmation,null);d.review();const c=d.confirm('DEMO-OPTIONAL');assert.equal(c.gift.message,message);assert.equal(c.gift.price,2800);}
});
test('PRD replacement: choosing another gift replaces the selection and preserves the wish',()=>{
 const d=Order.createDraft();d.select({type:'set',id:'selfcare'});d.setMessage('For you.');d.select({type:'set',id:'teaBox'});assert.equal(d.summary.name,'Tea & spices gift set');assert.equal(d.summary.price,2230);assert.equal(d.summary.quantity,1);assert.deepEqual(d.selection,{type:'set',id:'teaBox'});assert.equal(d.summary.message,'For you.');
});
test('PRD edits: summary immediately reflects set/message changes without confirming',()=>{
 const d=Order.createDraft();d.select({type:'set',id:'teaBox'});d.setMessage('First message');assert.equal(d.summary.message,'First message');d.setMessage('Revised message');d.select({type:'set',id:'selfcare'});assert.equal(d.summary.message,'Revised message');assert.equal(d.summary.price,2800);assert.equal(d.confirmation,null);
});
test('PRD confirmation: explicit confirmation produces a demo snapshot, never a real order',()=>{
 const d=Order.createDraft();d.select({type:'set',id:'teaBox'});d.setMessage('With love');assert.equal(d.confirmation,null);d.review();const c=d.confirm('DEMO-TEST');assert.equal(c.demo,true);assert.equal(c.paymentTaken,false);assert.equal(c.orderSent,false);assert.equal(c.gift.quantity,1);assert.equal(c.gift.message,'With love');assert.deepEqual(d.confirm('DEMO-SECOND'),c);c.gift.price=1;assert.equal(d.confirmation.gift.price,2230);d.setMessage('New wish');assert.equal(d.confirmation,null);
});
test('PRD browsing: a customer can clear a selection and continue without an account',()=>{
 const d=Order.createDraft();d.select({type:'set',id:'selfcare'});d.clear();assert.equal(d.summary,null);assert.equal(d.confirmation,null);d.select({type:'set',id:'teaBox'});d.reset();assert.equal(d.summary,null);assert.equal(d.message,'');
});
test('disabled custom selections cannot be restored or chosen',()=>{
 const value={type:'custom',packing:'box',contents:{mask:2,tea:1},boxColor:'white',fillerColor:'kraft'};
 assert.equal(Order.createDraft(value).summary,null);
 const d=Order.createDraft();d.select({type:'set',id:'selfcare'});assert.throws(()=>d.select(value));assert.equal(d.summary.selection.id,'selfcare');
});
test('selection restoration does not bypass explicit confirmation or the one-set rule',()=>{
 const d=Order.createDraft({type:'set',id:'teaBox',quantity:50});assert.equal(d.summary.quantity,1);assert.equal(d.confirmation,null);assert.equal(Order.createDraft({type:'set',id:'unknown'}).summary,null);assert.equal(Order.createDraft({type:'custom',packing:'box',contents:{mask:1},boxColor:'invalid',fillerColor:'ivory'}).summary,null);
});

test('confirmation requires a current review and editing invalidates the reviewed message',()=>{
 const d=Order.createDraft();d.select({type:'set',id:'selfcare'});d.setMessage('Original wish');assert.throws(()=>d.confirm(),/Review your order summary/);
 const first=d.review();assert.equal(first.message,'Original wish');assert.equal(d.confirmation,null);
 d.setMessage('Edited wish');assert.equal(d.reviewedSummary,null);assert.throws(()=>d.confirm(),/Review your order summary/);
 const revised=d.review();assert.equal(revised.message,'Edited wish');assert.equal(d.confirm('DEMO-EDITED').gift.message,'Edited wish');
 d.select({type:'set',id:'teaBox'});assert.equal(d.reviewedSummary,null);assert.throws(()=>d.confirm(),/Review your order summary/);
});
