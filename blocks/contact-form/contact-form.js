// Static "Contact our team" form — visual match to the production Marketo form.
// Renders authored field rows; submit is a no-op placeholder (no backend).
export default function decorate(block) {
  const rows = [...block.children];
  const form = document.createElement('form');
  form.setAttribute('novalidate', '');

  rows.forEach((row) => {
    const cells = [...row.children];
    const type = (cells[0]?.textContent || '').trim().toLowerCase();
    const label = (cells[1]?.textContent || '').trim();
    const opts = (cells[2]?.textContent || '').trim();

    if (type === 'select') {
      const select = document.createElement('select');
      select.name = label;
      opts.split(',').forEach((o, i) => {
        const option = document.createElement('option');
        option.textContent = o.trim();
        if (i === 0) { option.value = ''; option.disabled = true; option.selected = true; }
        select.append(option);
      });
      form.append(select);
    } else if (type === 'textarea') {
      const ta = document.createElement('textarea');
      ta.placeholder = label;
      ta.rows = 4;
      form.append(ta);
    } else if (type === 'checkbox') {
      const wrap = document.createElement('label');
      wrap.className = 'contact-form-consent';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      const span = document.createElement('span');
      span.innerHTML = cells[1]?.innerHTML || label;
      wrap.append(cb, span);
      form.append(wrap);
    } else if (type === 'submit') {
      const btn = document.createElement('button');
      btn.type = 'submit';
      btn.className = 'button primary';
      btn.textContent = label || 'Submit';
      form.append(btn);
    } else if (type) {
      const input = document.createElement('input');
      input.type = type;
      input.placeholder = label;
      form.append(input);
    }
  });

  // Static visual match: prevent submission (not wired to a backend).
  form.addEventListener('submit', (e) => e.preventDefault());

  block.textContent = '';
  block.append(form);
}
