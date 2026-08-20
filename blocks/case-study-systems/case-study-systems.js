/**
 * Builds the compact systems-and-user-count panel used in case studies.
 *
 * Authoring format:
 *
 * | Systems used before Fiix |
 * | icon | System name |
 * | icon | System name |
 * | Number of users | 71 |
 *
 * @param {Element} block The case-study-systems block element
 */
export default function decorate(block) {
  const rows = [...block.children];
  const userCountIndex = rows.findIndex((row) => (
    /number of users/i.test(row.textContent)
  ));
  const [headingRow] = rows;

  if (!headingRow || userCountIndex < 1) {
    block.replaceChildren();
    return;
  }

  const heading = document.createElement('h2');
  heading.className = 'case-study-systems-heading';
  heading.textContent = headingRow.textContent.trim();

  const systems = document.createElement('ul');
  systems.className = 'case-study-systems-list';

  rows.slice(1, userCountIndex).forEach((row) => {
    const [iconCell, labelCell] = [...row.children];
    const image = iconCell?.querySelector('picture, img');
    const label = labelCell?.textContent.trim();
    if (!image || !label) return;

    const item = document.createElement('li');
    item.className = 'case-study-systems-item';

    const icon = document.createElement('div');
    icon.className = 'case-study-systems-icon';
    icon.append(image.closest('picture') || image);

    const name = document.createElement('p');
    name.className = 'case-study-systems-name';
    name.textContent = label;

    item.append(icon, name);
    systems.append(item);
  });

  const [usersLabelCell, usersValueCell] = [...rows[userCountIndex].children];
  const usersLabel = usersLabelCell?.textContent.trim();
  const usersValue = usersValueCell?.textContent.trim();
  const users = document.createElement('dl');
  users.className = 'case-study-systems-users';

  if (usersLabel && usersValue) {
    const statistic = document.createElement('div');
    const label = document.createElement('dt');
    const value = document.createElement('dd');
    label.textContent = usersLabel;
    value.textContent = usersValue;
    statistic.append(label, value);
    users.append(statistic);
  }

  block.replaceChildren(heading, systems, users);
}
