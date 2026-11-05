/* Essay Planner: plan an Issue essay in five minutes and turn the plan into an outline. */
(function () {
  'use strict';
  const KEY = 'gre-essay-planner.plans';
  // Turn a filled-in plan into a paragraph-by-paragraph outline.
  const outline = (p) => {
    const reasons = (p.reasons || []).filter((r) => r.point);
    const out = ['1. Introduction: ' + (p.position === 'agree' ? 'I agree' : p.position === 'disagree' ? 'I disagree' : 'I agree in part') + '. Thesis: ' + (p.thesis || '(write your thesis)')];
    reasons.forEach((r, i) => out.push((i + 2) + '. ' + r.point + (r.example ? ' Example: ' + r.example : ' (add a specific example)')));
    if (p.counter) out.push((reasons.length + 2) + '. Opposing view: ' + p.counter + (p.reply ? ' Reply: ' + p.reply : ''));
    out.push((out.length + 1) + '. Conclusion: restate the thesis in new words and say why it matters.');
    return out;
  };
  const problems = (p) => {
    const w = [];
    if (!p.thesis || SK.text.wordCount(p.thesis) < 8) w.push('Write a full thesis of at least one sentence.');
    if ((p.reasons || []).filter((r) => r.point).length < 2) w.push('Give at least two reasons.');
    if ((p.reasons || []).some((r) => r.point && !r.example)) w.push('Every reason needs a specific example.');
    if (!p.counter) w.push('Name the strongest opposing view so you can answer it.');
    return w;
  };
  const App = {
    about: 'Strong Issue essays are planned before they are written. This planner walks you through the five minutes that matter: choose a position, write a thesis, list reasons with examples, name the strongest objection and your reply. It then turns your plan into an outline you can write from.',
    how: ['Pick a prompt (or type your own) in **Plan**, then start the five-minute timer.', 'Fill in each box. Specific examples beat general claims.', 'Press **Make outline** and check the warnings.', 'Saved plans are listed in **Saved plans**.'],
    tabs: [
      { id: 'plan', label: 'Plan', render(el, ctx) {
        const prompts = ctx.data.issue_prompts.prompts;
        const p = { prompt: SK.pick(SK.rng(SK.seedNow()), prompts).text, position: 'qualify', thesis: '', reasons: [{}, {}, {}], counter: '', reply: '' };
        const input = (val, set, ph) => SK.h('input', { type: 'text', value: val || '', placeholder: ph, style: { width: '100%' }, oninput: (e) => set(e.target.value) });
        const out = SK.h('div', {});
        const timerBox = SK.h('span', {});
        el.appendChild(SK.card('Plan an essay',
          SK.field('Prompt', SK.h('textarea', { style: { minHeight: '70px' }, oninput: (e) => { p.prompt = e.target.value; } }, p.prompt)),
          SK.h('div', { class: 'sk-row', style: { margin: '8px 0' } }, SK.btn('Start 5-minute timer', (e) => { e.target.remove(); timerBox.appendChild(SK.timer(300, () => SK.clear(out).appendChild(SK.note('Five minutes are up. Start writing from your outline.', 'info'))).el); }, 'ghost small'), timerBox),
          SK.select([['agree', 'I agree'], ['disagree', 'I disagree'], ['qualify', 'I agree in part']], p.position, (v) => { p.position = v; }, 'Position'),
          SK.field('Thesis', input('', (v) => { p.thesis = v; }, 'One sentence: your position and the main reason')),
          p.reasons.map((r, i) => SK.h('div', { class: 'sk-split', style: { marginTop: '8px' } }, SK.field('Reason ' + (i + 1), input('', (v) => { r.point = v; }, 'A reason')), SK.field('Example', input('', (v) => { r.example = v; }, 'A specific example')))),
          SK.h('div', { class: 'sk-split', style: { marginTop: '8px' } }, SK.field('Strongest opposing view', input('', (v) => { p.counter = v; }, 'What would a thoughtful critic say?')), SK.field('Your reply', input('', (v) => { p.reply = v; }, 'Why your position still holds'))),
          SK.h('div', { class: 'sk-row', style: { marginTop: '12px' } }, SK.btn('Make outline', () => {
            SK.clear(out);
            const warn = problems(p);
            out.appendChild(SK.card('Outline', SK.h('ol', {}, outline(p).map((l) => SK.h('li', { text: l.replace(/^\d+\. /, '') })))));
            if (warn.length) out.appendChild(SK.note(warn.join(' '), 'wrong'));
            const all = SK.store.get(KEY, []); all.push(Object.assign({ at: Date.now() }, JSON.parse(JSON.stringify(p)))); SK.store.set(KEY, all.slice(-50));
            SK.logPractice(5, 'Essay plan');
          }, '', { 'data-auto': 'once' }))), out);
      } },
      { id: 'saved', label: 'Saved plans', render(el) {
        const all = SK.store.get(KEY, []).slice().reverse();
        const card = SK.card('Saved plans', all.length ? null : SK.h('p', { class: 'sk-muted', text: 'Plans you outline are saved here.' }));
        all.forEach((p) => card.appendChild(SK.h('details', { style: { borderTop: '1px solid var(--line)', padding: '8px 0' } }, SK.h('summary', { text: new Date(p.at).toLocaleDateString() + ' · ' + (p.prompt || '').slice(0, 80) }), SK.h('ol', {}, outline(p).map((l) => SK.h('li', { text: l.replace(/^\d+\. /, '') }))))));
        el.appendChild(card);
      } },
    ],
    outline, problems,
    checks: {
      'a full plan becomes a five-part outline with no warnings': (data, assert) => {
        const p = { position: 'agree', thesis: 'Universities should require broad study because it builds judgment.', reasons: [{ point: 'Breadth builds judgment', example: 'Engineers who studied ethics' }, { point: 'It helps choose a field', example: 'My switch from biology to economics' }, {}], counter: 'It wastes time', reply: 'Only if courses are poorly chosen' };
        assert.equal(outline(p).length, 5);
        assert.deepEqual(problems(p), []);
      },
      'an empty plan gets every warning': (data, assert) => { assert.equal(problems({ reasons: [{}, {}] }).length, 3); assert.equal(problems({ thesis: 'Short', reasons: [{ point: 'x' }, { point: 'y' }], counter: 'z' }).length, 2); },
    },
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = App; else SK.start(App);
})();
