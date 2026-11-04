(() => {
  'use strict';
  const get = id => document.getElementById(id);
  const shelf = get('lessons');
  const builtIns = Array.from(shelf.children);
  const filter = get('subject-filter');
  const panel = get('add-panel');
  const form = get('lesson-form');
  const reader = get('reader');
  const frame = get('reader-frame');
  const key = 'EnglishStudy.shelf.v1';
  const fileLimit = 1024 * 1024;
  let published = [];
  let saved = [];

  function readSaved() {
    const raw = localStorage.getItem(key);
    if (raw === null) return [];
    const entries = JSON.parse(raw);
    if (!Array.isArray(entries)) throw new Error('Invalid shelf data');
    return entries;
  }

  function safeLink(value, base) {
    try {
      const link = new URL(value, base);
      return ['http:', 'https:'].includes(link.protocol) && !link.username && !link.password ? link : null;
    } catch {
      return null;
    }
  }

  function element(tag, className, text) {
    const item = document.createElement(tag);
    if (className) item.className = className;
    if (text) item.textContent = text;
    return item;
  }

  function isLesson(item) {
    return item && typeof item.title === 'string' && item.title.trim()
      && typeof item.subject === 'string' && item.subject.trim()
      && (item.kind === 'file' ? typeof item.html === 'string' && item.html.length > 0 : safeLink(item.url));
  }

  function openFile(item) {
    get('reader-title').textContent = item.title;
    frame.title = item.title;
    frame.srcdoc = item.html;
    reader.showModal();
  }

  function lessonControl(item, className, label) {
    if (item.kind === 'file') {
      const button = element('button', className + ' card-button', label);
      button.type = 'button';
      button.addEventListener('click', () => openFile(item));
      return button;
    }
    const link = element('a', className, label);
    link.href = item.url;
    return link;
  }

  function removeLesson(item) {
    if (!window.confirm('Remove “' + item.title + '” from this browser’s shelf?')) return;
    try {
      const updated = readSaved().filter(entry => entry && entry.id !== item.id);
      localStorage.setItem(key, JSON.stringify(updated));
      saved = updated;
      render();
      get('status').textContent = 'Removed “' + item.title + '”.';
      filter.focus();
    } catch {
      get('status').textContent = 'The browser could not remove that lesson. Check browser storage permissions and try again.';
    }
  }

  function makeCard(item, index, personal) {
    const card = element('article', 'card');
    card.dataset.subject = item.subject;
    const top = element('div', 'card-top');
    const folio = element('span', 'folio', String(index).padStart(2, '0'));
    folio.setAttribute('aria-hidden', 'true');
    top.append(element('span', 'tag', item.subject), folio);
    const heading = element('h3');
    heading.append(lessonControl(item, 'card-title', item.title));
    const source = personal ? (item.kind === 'file' ? 'HTML file saved in this browser.' : 'Study link saved in this browser.') : 'From the shared study collection.';
    const actions = element('div', 'card-foot');
    const open = lessonControl(item, 'open-lesson', 'Open lesson →');
    open.setAttribute('aria-label', 'Open ' + item.title);
    actions.append(open);
    if (personal) {
      const remove = element('button', 'text-button', 'Remove');
      remove.type = 'button';
      remove.setAttribute('aria-label', 'Remove ' + item.title);
      remove.addEventListener('click', () => removeLesson(item));
      actions.append(remove);
    }
    card.append(top, heading, element('p', '', source), actions);
    return card;
  }

  function keyFor(value) { return value.trim().toLowerCase(); }

  function filterCards() {
    const cards = Array.from(shelf.children);
    const value = filter.value;
    let count = 0;
    for (const card of cards) {
      card.hidden = !!value && keyFor(card.dataset.subject) !== value;
      if (!card.hidden) count++;
    }
    get('lesson-count').textContent = value ? count + ' of ' + cards.length : cards.length + (cards.length === 1 ? ' lesson' : ' lessons');
  }

  function render() {
    const currentFilter = filter.value;
    const cards = [...builtIns];
    for (const item of published) cards.push(makeCard(item, cards.length + 1, false));
    for (const item of saved.filter(isLesson)) cards.push(makeCard(item, cards.length + 1, true));
    shelf.replaceChildren(...cards);
    const subjects = new Map();
    for (const card of cards) {
      const value = card.dataset.subject;
      if (!subjects.has(keyFor(value))) subjects.set(keyFor(value), value);
    }
    filter.replaceChildren(new Option('All subjects', ''));
    const suggestions = get('subject-ideas');
    suggestions.replaceChildren();
    for (const [id, label] of Array.from(subjects.entries()).sort((a, b) => a[1].localeCompare(b[1]))) {
      filter.add(new Option(label, id));
      suggestions.append(new Option(label, label));
    }
    if (subjects.has(currentFilter)) filter.value = currentFilter;
    filterCards();
  }

  function setSource() {
    const useFile = get('lesson-kind').value === 'file';
    get('url-field').hidden = useFile;
    get('file-field').hidden = !useFile;
    get('lesson-url').disabled = useFile;
    get('lesson-file').disabled = !useFile;
    get('lesson-file').required = useFile;
    get('form-error').hidden = true;
  }

  function closeForm() {
    form.reset();
    setSource();
    panel.open = false;
    panel.querySelector('summary').focus();
  }

  function error(message) {
    get('form-error').textContent = message;
    get('form-error').hidden = false;
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const submit = form.querySelector('[type=submit]');
    const title = get('lesson-title').value.trim();
    const subject = get('lesson-subject').value.trim();
    if (!title || !subject) return error('Enter a title and a subject.');
    const item = {id: String(Date.now()) + Math.random().toString(36).slice(2), title, subject, kind: get('lesson-kind').value};
    submit.disabled = true;
    try {
      if (item.kind === 'file') {
        const file = get('lesson-file').files[0];
        if (!file || !/\.html?$/i.test(file.name) || file.size > fileLimit) return error('Choose an .html or .htm file of 1 MB or less.');
        try { item.html = await file.text(); }
        catch { return error('The file could not be read. Please select it again.'); }
        if (!item.html.trim()) return error('The selected file is empty.');
      } else {
        const link = safeLink(get('lesson-url').value.trim());
        if (!link) return error('Enter a full website address beginning with https:// or http://.');
        item.url = link.href;
      }
      const updated = [...readSaved(), item];
      localStorage.setItem(key, JSON.stringify(updated));
      saved = updated;
      filter.value = '';
      render();
      closeForm();
      get('status').textContent = 'Saved “' + title + '” to this browser’s shelf.';
    } catch (err) {
      error(err.name === 'QuotaExceededError' ? 'This browser’s shelf is full. Remove a saved lesson or save a website link instead.' : 'The browser could not save this lesson. Check browser storage permissions and try again.');
    } finally {
      submit.disabled = false;
    }
  });

  get('lesson-kind').addEventListener('change', setSource);
  get('cancel-add').addEventListener('click', closeForm);
  get('reader-close').addEventListener('click', () => reader.close());
  reader.addEventListener('close', () => frame.removeAttribute('srcdoc'));
  filter.addEventListener('change', filterCards);
  window.addEventListener('storage', event => {
    if (event.key === null || event.key === key) {
      try { saved = readSaved(); render(); }
      catch { get('status').textContent = 'Saved lessons could not be loaded in this browser.'; }
    }
  });

  setSource();
  try {
    saved = readSaved();
  } catch {
    get('status').textContent = 'Saved lessons could not be loaded in this browser. The shared lessons are available below.';
  }
  render();
  get('filter-tools').hidden = false;
  panel.hidden = false;

  if (['http:', 'https:'].includes(location.protocol)) {
    fetch('./catalog.json').then(async response => {
      if (!response.ok) return;
      const catalog = await response.json();
      if (!Array.isArray(catalog)) return;
      published = [];
      for (const entry of catalog) {
        if (!entry || typeof entry.url !== 'string') continue;
        const link = safeLink(entry.url, document.baseURI);
        if (!link || link.origin !== location.origin) continue;
        const item = {title: entry.title, subject: entry.subject, url: link.href, kind: 'url'};
        if (isLesson(item)) published.push(item);
      }
      render();
    }).catch(() => {});
  }
})();
