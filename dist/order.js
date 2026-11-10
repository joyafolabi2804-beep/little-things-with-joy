(function (root) {
  'use strict';
  const giftSets = {
    selfcare: {tagline: 'A LITTLE EVERYDAY CARE', name: 'Self-care gift set', price: 2800, image: 'self-care-gift-box-white.png', description: 'A face sheet mask, a brown ruffle and hand cream. A thoughtful little invitation to slow down.', contents: ['Face sheet mask', 'Brown ruffle', 'Hand cream'], sample: false},
    christmasHome: {tagline: 'A LITTLE CHRISTMAS WARMTH', name: 'A little Christmas at Home', price: 3665, image: 'a-little-christmas-at-home-original.jpg', description: 'A Christmas tree ornament, a napkin and a scented candle. A little festive comfort for the home.', contents: ['Christmas tree ornament', 'Napkin', 'Scented candle'], sample: false},
    teaBox: {tagline: 'A LITTLE KITCHEN RITUAL', name: 'Tea & spices gift set', price: 2230, image: 'tea-and-spices-gift-box-white.png', description: 'Addis black tea, rosemary and coriander spice tins. A little warmth for everyday kitchen rituals.', contents: ['Addis black tea', 'Rosemary spice tin', 'Coriander spice tin'], sample: true},
  };
  function cleanSelection(value) {
    if (!value) return null;
    if (value.type === 'set' && Object.hasOwn(giftSets, value.id)) return {type: 'set', id: value.id};
    return null;
  }
  const clone = value => value === null ? null : JSON.parse(JSON.stringify(value));
  function describe(selection, message) {
    if (!selection) return null;
    if (selection.type === 'set') return {...clone(giftSets[selection.id]), selection: clone(selection), message, quantity: 1};
    return null;
  }
  function createDraft(savedSelection = null) {
    let selection = cleanSelection(savedSelection), message = '', reviewed = null, confirmation = null;
    return {
      get selection() { return clone(selection); },
      get message() { return message; },
      get summary() { return describe(selection, message); },
      get confirmation() { return clone(confirmation); },
      get reviewedSummary() { return clone(reviewed); },
      select(value) {
        const next = cleanSelection(value);
        if (!next) throw new Error('Choose a valid gift set before continuing.');
        selection = next; reviewed = null; confirmation = null;
        return describe(selection, message);
      },
      setMessage(text) { message = String(text ?? '').slice(0, 280); reviewed = null; confirmation = null; return describe(selection, message); },
      clear() { selection = null; reviewed = null; confirmation = null; },
      reset() { selection = null; message = ''; reviewed = null; confirmation = null; },
      review() {
        if (!selection) throw new Error('Choose a gift set before reviewing your order.');
        reviewed = describe(selection, message);
        return clone(reviewed);
      },
      confirm(reference) {
        if (!selection) throw new Error('Choose a gift set before confirming your pretend order.');
        if (!reviewed) throw new Error('Review your order summary before confirming.');
        if (!confirmation) confirmation = {reference: reference || 'DEMO-' + Date.now().toString(36).toUpperCase(), demo: true, paymentTaken: false, orderSent: false, gift: clone(reviewed)};
        return clone(confirmation);
      }
    };
  }
  const api = {giftSets, cleanSelection, createDraft};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.WROrder = api;
})(typeof globalThis === 'undefined' ? this : globalThis);
