// src/utils/htmlAttributes.js

const globalAttributes = [
  'class', 'id', 'style', 'title', 'lang', 'dir', 'hidden', 'tabindex', 'accesskey', 
  'draggable', 'contenteditable', 'spellcheck', 'translate', 'role', 'part', 'exportparts', 
  'inert', 'itemscope', 'itemtype', 'itemprop', 'itemid', 'itemref', 'data'
];

const ariaAttributes = [
  'aria-activedescendant', 'aria-atomic', 'aria-autocomplete', 'aria-busy', 'aria-checked', 
  'aria-colcount', 'aria-colindex', 'aria-colspan', 'aria-controls', 'aria-current', 
  'aria-describedby', 'aria-description', 'aria-details', 'aria-disabled', 'aria-dropeffect', 
  'aria-errormessage', 'aria-expanded', 'aria-flowto', 'aria-grabbed', 'aria-haspopup', 
  'aria-hidden', 'aria-invalid', 'aria-keyshortcuts', 'aria-label', 'aria-labelledby', 
  'aria-level', 'aria-live', 'aria-modal', 'aria-multiline', 'aria-multiselectable', 
  'aria-orientation', 'aria-owns', 'aria-placeholder', 'aria-posinset', 'aria-pressed', 
  'aria-readonly', 'aria-relevant', 'aria-required', 'aria-roledescription', 'aria-rowcount', 
  'aria-rowindex', 'aria-rowspan', 'aria-selected', 'aria-setsize', 'aria-sort', 
  'aria-valuemax', 'aria-valuemin', 'aria-valuenow', 'aria-valuetext'
];

// Mapping specific tags to their unique attributes
const tagSpecificAttributes = {
  a: ['href', 'target', 'rel', 'download', 'ping', 'hreflang', 'type', 'referrerpolicy'],
  img: ['src', 'alt', 'width', 'height', 'loading', 'fetchpriority', 'decoding', 'srcset', 'sizes', 'crossorigin', 'usemap', 'ismap'],
  input: ['type', 'value', 'name', 'placeholder', 'required', 'disabled', 'readonly', 'min', 'max', 'step', 'maxlength', 'minlength', 'pattern', 'autocomplete', 'autofocus', 'form', 'checked', 'multiple', 'accept', 'list', 'dirname', 'size', 'inputmode', 'popovertarget', 'popovertargetaction'],
  form: ['action', 'method', 'enctype', 'novalidate', 'target', 'rel', 'accept-charset'],
  button: ['type', 'disabled', 'name', 'value', 'form', 'formaction', 'formmethod', 'formenctype', 'formnovalidate', 'formtarget', 'popovertarget', 'popovertargetaction'],
  video: ['src', 'controls', 'autoplay', 'loop', 'muted', 'preload', 'poster', 'playsinline', 'crossorigin', 'width', 'height'],
  audio: ['src', 'controls', 'autoplay', 'loop', 'muted', 'preload', 'crossorigin'],
  iframe: ['src', 'srcdoc', 'name', 'allow', 'allowfullscreen', 'loading', 'sandbox', 'referrerpolicy', 'width', 'height'],
  textarea: ['name', 'rows', 'cols', 'placeholder', 'disabled', 'readonly', 'required', 'maxlength', 'minlength', 'wrap', 'form', 'autofocus', 'autocomplete', 'spellcheck'],
  select: ['name', 'multiple', 'required', 'disabled', 'size', 'form', 'autofocus'],
  option: ['value', 'label', 'selected', 'disabled'],
  optgroup: ['label', 'disabled'],
  details: ['open'],
  dialog: ['open'],
  meta: ['name', 'content', 'charset', 'http-equiv'],
  link: ['href', 'rel', 'type', 'sizes', 'media', 'integrity', 'crossorigin', 'referrerpolicy', 'fetchpriority', 'as'],
  script: ['src', 'type', 'async', 'defer', 'integrity', 'crossorigin', 'referrerpolicy', 'nomodule', 'nonce'],
  style: ['media', 'nonce', 'type'],
  source: ['src', 'srcset', 'sizes', 'type', 'media', 'width', 'height'],
  track: ['default', 'kind', 'label', 'src', 'srclang'],
  area: ['alt', 'coords', 'download', 'href', 'hreflang', 'ping', 'referrerpolicy', 'rel', 'shape', 'target'],
  map: ['name'],
  table: ['border', 'bgcolor', 'align', 'width', 'cellpadding', 'cellspacing'], // Note: Some are legacy but supported
  th: ['colspan', 'rowspan', 'headers', 'scope', 'abbr'],
  td: ['colspan', 'rowspan', 'headers'],
  col: ['span'],
  colgroup: ['span'],
  time: ['datetime'],
  data: ['value'],
  meter: ['value', 'min', 'max', 'low', 'high', 'optimum'],
  progress: ['value', 'max'],
  output: ['for', 'form', 'name'],
  fieldset: ['disabled', 'form', 'name'],
  object: ['data', 'type', 'name', 'form', 'width', 'height'],
  embed: ['src', 'type', 'width', 'height'],
  base: ['href', 'target'],
  bdo: ['dir'],
  q: ['cite'],
  blockquote: ['cite'],
  ins: ['cite', 'datetime'],
  del: ['cite', 'datetime']
};

export const getAttributesForTag = (tagName) => {
  const specific = tagSpecificAttributes[tagName] || [];
  // Returns a sorted array of all valid attributes for the given tag
  return [...specific, ...globalAttributes, ...ariaAttributes].sort();
};