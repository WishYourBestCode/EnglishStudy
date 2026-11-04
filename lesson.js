'use strict';

for (const form of document.querySelectorAll('[data-quiz]')) {
  const questions = Array.from(form.querySelectorAll('fieldset[data-answer]'));
  const score = form.querySelector('[data-score]');
  function clearFeedback() {
    score.textContent = '';
    for (const question of questions) {
      question.removeAttribute('data-result');
      question.querySelector('[data-feedback]').hidden = true;
    }
  }
  form.addEventListener('reset', clearFeedback);
  form.addEventListener('change', clearFeedback);
  form.addEventListener('submit', event => {
    event.preventDefault();
    let correct = 0;
    for (const question of questions) {
      const choice = question.querySelector('input:checked');
      const right = choice?.value === question.dataset.answer;
      if (right) correct++;
      const result = right ? 'Correct' : choice ? 'Review' : 'Unanswered';
      question.dataset.result = result;
      const feedback = question.querySelector('[data-feedback]');
      let label = feedback.querySelector('.feedback-label');
      if (!label) {
        label = document.createElement('strong');
        label.className = 'feedback-label';
        feedback.prepend(label);
      }
      label.textContent = right ? 'Correct. ' : result + '. Answer: ' + question.dataset.answer + '. ';
      feedback.hidden = false;
    }
    score.textContent = correct + ' of ' + questions.length + ' correct.';
  });
}

const draft = document.querySelector('textarea[data-draft]');
if (draft) {
  const status = document.querySelector('[data-save-status]');
  const storageKey = 'EnglishStudy.draft.v1:' + location.pathname;
  const unavailable = 'Browser storage is unavailable. Copy your draft before closing.';
  const report = message => {
    const text = draft.value.trim();
    const count = text ? text.split(/\s+/).length : 0;
    status.textContent = count + (count === 1 ? ' word. ' : ' words. ') + message;
  };
  try {
    draft.value = localStorage.getItem(storageKey) || '';
    report(draft.value ? 'Saved draft restored.' : 'Your draft saves in this browser.');
  } catch {
    report(unavailable);
  }
  draft.addEventListener('input', () => {
    try {
      localStorage.setItem(storageKey, draft.value);
      report('Saved in this browser.');
    } catch {
      report(unavailable);
    }
  });
}
