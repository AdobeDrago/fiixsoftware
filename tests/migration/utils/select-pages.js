function parsePositiveInteger(value, name) {
  if (value === undefined || value === '') return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new TypeError(`${name} must be a positive integer`);
  }
  return parsed;
}

function parseSlugList(value) {
  if (value === undefined || value === '') return null;
  const slugs = String(value).split(',').map((item) => item.trim()).filter(Boolean);
  if (!slugs.length) return null;
  return slugs;
}

function selectPages(allPages) {
  const slugs = parseSlugList(process.env.COMPARISON_SLUGS);
  const limit = parsePositiveInteger(process.env.COMPARISON_LIMIT, 'COMPARISON_LIMIT');
  const offset = parsePositiveInteger(process.env.COMPARISON_OFFSET, 'COMPARISON_OFFSET') || 0;

  let selected = allPages;
  if (slugs) {
    const slugSet = new Set(slugs);
    selected = allPages.filter((page) => slugSet.has(page.slug));
    const missing = slugs.filter((slug) => !allPages.some((page) => page.slug === slug));
    if (missing.length) {
      throw new TypeError(`Unknown COMPARISON_SLUGS: ${missing.join(', ')}`);
    }
  }

  if (limit === null) return selected.slice(offset);
  return selected.slice(offset, offset + limit);
}

module.exports = { parseSlugList, selectPages };
