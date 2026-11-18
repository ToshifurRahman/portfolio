import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  achievements,
  caseStudies,
  certificates,
  education,
  experience,
  owner,
  skills,
  type Certificate,
} from '../../src/content';

/* vitest runs from the repository root, where public/ lives. */
const root = process.cwd();

function webpSize(file: string): { width: number; height: number } {
  const buf = readFileSync(file);
  expect(buf.toString('ascii', 0, 4)).toBe('RIFF');
  expect(buf.toString('ascii', 8, 12)).toBe('WEBP');
  expect(buf.toString('ascii', 12, 16)).toBe('VP8 ');
  const width = buf.readUInt16LE(26) & 0x3fff;
  const height = buf.readUInt16LE(28) & 0x3fff;
  return { width, height };
}

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

describe('owner', () => {
  it('fills the contact facts the CV supplies', () => {
    expect(owner.location).toBe('Chattogram, Bangladesh');
    expect(owner.email).toBe('tfrtasin11@gmail.com');
    expect(owner.linkedin).toBe('https://www.linkedin.com/in/toshifur-rahman');
    expect(owner.cv).toBe('/cv/Toshifur-Rahman-CV.pdf');
  });

  it('has no phone field', () => {
    expect(Object.keys(owner)).not.toContain('phone');
  });
});

describe('no phone number in the site source', () => {
  /* Ten or more digits, optionally starting with + and optionally grouped by
     single spaces or dashes. The guard describes the shape, never the number. */
  const phoneShaped = /(?<!\d)(?:\+\d{1,3}[ -]?)?(?:\d[ -]?){9,14}\d(?!\d)/;

  const noPhone = (text: string, where: string) => {
    const match = text.match(phoneShaped);
    expect(match?.[0], `${where} contains a phone-shaped string`).toBeUndefined();
  };

  it('catches phone-shaped strings, so the guard is not vacuous', () => {
    expect(phoneShaped.test('1234567890')).toBe(true);
    expect(phoneShaped.test('+1 555 123 4567')).toBe(true);
    expect(phoneShaped.test('call 555-123-4567 now')).toBe(true);
    expect(phoneShaped.test('Toshifur Rahman')).toBe(false);
    expect(phoneShaped.test('Aug 2026 – Present')).toBe(false);
    expect(phoneShaped.test('Chattogram, Bangladesh')).toBe(false);
  });

  it('keeps phone-shaped text out of content.ts', () => {
    noPhone(readFileSync(join(root, 'src', 'content.ts'), 'utf8'), 'src/content.ts');
  });

  it('keeps it out of every text file the site ships', () => {
    const files = [...walk(join(root, 'src')), ...walk(join(root, 'public')), join(root, 'index.html')].filter(
      (file) => existsSync(file) && !/\.(pdf|png|webp|woff2?|ico)$/i.test(file),
    );

    expect(files.length).toBeGreaterThan(0);
    for (const file of files) noPhone(readFileSync(file, 'utf8'), file);
  });

  it('keeps it out of the certificates, whose PDFs are scanned as text', () => {
    const pdfs = walk(join(root, 'public', 'certificates')).filter((file) => file.endsWith('.pdf'));
    expect(pdfs.length).toBeGreaterThan(0);

    for (const file of pdfs) {
      const text = execFileSync('pdftotext', ['-layout', file, '-'], { encoding: 'utf8' });
      noPhone(text, file);
    }
  });

  it('allows it only inside the CV PDF, where the owner put it', () => {
    const cv = join(root, 'public', 'cv', 'Toshifur-Rahman-CV.pdf');
    const text = execFileSync('pdftotext', ['-layout', cv, '-'], { encoding: 'utf8' });
    /* The CV is the one place the number lives; this pins the exception. */
    expect(phoneShaped.test(text)).toBe(true);
  });
});

describe('experience', () => {
  it('has the three roles from the CV, in order, with organization, dates and bullets', () => {
    expect(experience).toHaveLength(3);
    expect(experience.map((r) => r.title)).toEqual([
      'Web Developer',
      'Undergraduate Teaching Assistant',
      'Trainer & Mentor',
    ]);
    expect(experience.map((r) => r.organization)).toEqual([
      'Taibah Academy',
      'Department of CSE, IIUC',
      'IIUC Competitive Programming Society (IIUCCPS)',
    ]);
    expect(experience.map((r) => r.period)).toEqual([
      'Aug 2026 – Present',
      'Aug 2024 – Aug 2025',
      'Aug 2023 – Dec 2025',
    ]);
    for (const role of experience) {
      expect(role.bullets.length).toBeGreaterThan(0);
      for (const bullet of role.bullets) expect(bullet.length).toBeGreaterThan(0);
    }
  });

  it('quotes the CV bullet text word for word', () => {
    expect(experience[0].bullets[0]).toBe(
      'Performed Software Quality Assurance (SQA) testing on the live production website, identifying and reporting functional bugs and UI issues before they affected users.',
    );
    expect(experience[2].bullets[1]).toBe(
      'Also served as Bootcamp Coordinator and Finance Secretary of IIUCCPS.',
    );
  });
});

describe('education', () => {
  it('has both degrees with institution and dates', () => {
    expect(education).toHaveLength(2);
    expect(education[0]).toMatchObject({
      degree: 'M.Engg. in Computer Science and Engineering',
      institution: 'Chittagong University of Engineering and Technology (CUET)',
      period: 'Aug 2026 – Present',
    });
    expect(education[1]).toMatchObject({
      degree: 'B.Sc. in Computer Science and Engineering',
      institution: 'International Islamic University Chittagong (IIUC)',
      period: 'Aug 2021 – Dec 2025',
    });
  });
});

describe('achievements', () => {
  const texts = achievements.map((a) => a.text);
  const find = (needle: string) => achievements.find((a) => a.text.includes(needle));

  it('carries the CV figures and links', () => {
    expect(texts.join(' ')).toMatch(/1,600\+ problems/);
    expect(texts.join(' ')).toMatch(/100\+ online and onsite contests/);
    /* Since 2026-11-16 the lead item's one line is the handles, so each link
       carries the name the owner goes by there as well as the profile URL. */
    expect(find('Codeforces')?.links).toContainEqual({
      label: 'Codeforces',
      handle: 'ToshifurRahman',
      href: 'https://codeforces.com/profile/ToshifurRahman',
    });
    expect(find('CodeChef')?.links).toContainEqual({
      label: 'CodeChef',
      handle: 'tasin_021',
      href: 'https://www.codechef.com/users/tasin_021',
    });
    expect(find('1290')).toBeDefined();
    expect(find('1461')).toBeDefined();
    expect(find('1st Runner-up')?.text).toBe(
      '1st Runner-up, IIUC Intra-University Programming Contest (Spring 2023).',
    );
    expect(find('Best Mentor Award')?.text).toBe(
      'Best Mentor Award, IIUCCPS Competitive Programming Bootcamps (Autumn 2023 and Spring 2024).',
    );
  });
});

describe('certificates', () => {
  it('has eight entries with every required field', () => {
    expect(certificates).toHaveLength(8);
    const required: (keyof Certificate)[] = ['slug', 'title', 'issuer', 'file', 'preview', 'width', 'height', 'alt'];
    for (const cert of certificates) {
      for (const field of required) expect(cert[field], `${cert.slug}.${field}`).toBeTruthy();
      expect(cert.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(cert.file).toMatch(/^\/certificates\/files\/[a-z0-9-]+\.(pdf|png)$/);
      expect(cert.preview).toBe(`/certificates/previews/${cert.slug}.webp`);
    }
  });

  it('points every file and preview at a file on disk', () => {
    for (const cert of certificates) {
      expect(existsSync(join(root, 'public', cert.file)), cert.file).toBe(true);
      expect(existsSync(join(root, 'public', cert.preview)), cert.preview).toBe(true);
    }
  });

  it('has a preview under 80 KB per entry', () => {
    for (const cert of certificates) {
      const bytes = statSync(join(root, 'public', cert.preview)).size;
      expect(bytes <= 80 * 1024, `${cert.preview} is ${bytes} bytes`).toBe(true);
    }
  });

  it('records the real preview dimensions and a width of at most 800 px', () => {
    for (const cert of certificates) {
      const { width, height } = webpSize(join(root, 'public', cert.preview));
      expect({ width, height }, cert.slug).toEqual({ width: cert.width, height: cert.height });
      expect(width <= 800).toBe(true);
    }
  });

  it('leads with coding and problem solving, newest first inside each group', () => {
    /* Owner's order (2026-11-15): programming contests, algorithms, TypeScript
       and mentoring first; olympiads and the Hult Prize after. Within a group
       the newer certificate comes first. Slug order put 2018 high-school
       Botany and Chemistry at positions 2 and 3, ahead of the 2025 software
       engineering certificates. */
    const order = certificates.map((c) => c.slug);
    expect(order).toEqual([
      'beginners-typescript',
      'frontend-masters-algorithms',
      'iiuccps-best-mentor',
      'pu-contest',
      'cu-contest',
      'hult-prize',
      'chemistry-olympiad',
      'botany-olympiad',
    ]);

    /* And the grouping itself, not just this one list: every programming,
       algorithm, TypeScript or mentoring entry precedes every olympiad and
       the Hult Prize. */
    const lead = (slug: string) => (slug === 'botany-olympiad' || slug === 'chemistry-olympiad' || slug === 'hult-prize' ? 1 : 0);
    const groups = certificates.map((c) => lead(c.slug));
    expect(groups).toEqual([...groups].sort((a, b) => a - b));
  });

  it('keeps a date only when the file states one', () => {
    const stated = /^(?:\d{1,2} )?[A-Z][a-z]+ \d{4}$|^\d{4}$/;
    for (const cert of certificates) {
      if (cert.date !== undefined) expect(cert.date, cert.slug).toMatch(stated);
    }
    /* Only the files that print a day give one. */
    expect(certificates.find((c) => c.slug === 'cu-contest')?.date).toBe('2024');
    expect(certificates.find((c) => c.slug === 'botany-olympiad')?.date).toBe('2018');
  });

  it('serves the CV byte for byte, checked against a committed checksum', () => {
    const cv = join(root, 'public', 'cv', 'Toshifur-Rahman-CV.pdf');
    const digest = createHash('sha256').update(readFileSync(cv)).digest('hex');
    expect(digest).toBe('8b77620f0d84dcd03b27d89d52fa6a60c8736f4eaee0c1460067a7002acbb799');
  });
});

describe('case-study facts checked against the repositories', () => {
  const relay = caseStudies.find((s) => s.slug === 'relay')!;
  const results = relay.sections.find((s) => s.id === 'results')!;
  const text = JSON.stringify(results);

  it('states the Lighthouse gate in plain words, with no command name', () => {
    /* The owner's wording (2026-11-15): "0.9" read as a failing 0.9/100 score
       to a recruiter, and the label exposed an internal CLI command. */
    expect(text).toContain('"value":"90+"');
    expect(text).toContain('minimum Lighthouse score in all four categories, on six pages');
    expect(text).not.toContain('"value":"0.9"');
    expect(text).not.toContain('bun run lighthouse');
    expect(text).not.toContain('`');
  });

  it('counts the test files the repository has', () => {
    expect(text).toContain('"value":"120"');
    expect(text).not.toContain('"value":"119"');
  });

  it('opens each Results section with a plain sentence from the docs', () => {
    for (const study of caseStudies) {
      const first = study.sections.find((s) => s.id === 'results')!.blocks[0];
      expect(first.kind, study.slug).toBe('p');
      expect((first as { kind: 'p'; text: string }).text.length, study.slug).toBeGreaterThan(40);
      expect((first as { kind: 'p'; text: string }).text, study.slug).toMatch(/\.$/);
    }
  });
});

describe('owner headline and summary', () => {
  it('states the role and degree from the CV', () => {
    expect(owner.headline).toBe('Web Developer at Taibah Academy · M.Engg. CSE, CUET');
  });

  it('summarises in one plain sentence without inventing anything', () => {
    /* One sentence: no full stop followed by a new capitalised sentence. */
    expect(owner.summary).toMatch(/\.$/);
    expect(owner.summary).not.toMatch(/\. [A-Z]/);
    expect(owner.summary).toMatch(/Chattogram, Bangladesh/);
    expect(owner.summary).toMatch(/Software Engineer|Web Developer/i);
    expect(owner.summary.length).toBeLessThan(240);
  });

  it('still has no phone number and no invented availability', () => {
    expect(owner.availability).toBe('');
    expect(JSON.stringify(owner)).not.toMatch(/(?<!\d)(?:\+\d{1,3}[ -]?)?(?:\d[ -]?){9,14}\d(?!\d)/);
  });
});

describe('skills', () => {
  /* The CV's Technical Skills, word for word, as the base of the export. */
  const cvGroups: [string, string[]][] = [
    [
      'AI / LLM',
      [
        'LLM APIs',
        'Portkey',
        'Function / Tool Calling',
        'Structured Outputs (Zod)',
        'Provider Failover',
        'LLM Observability',
      ],
    ],
    ['Languages', ['TypeScript', 'JavaScript (ES6+)', 'C', 'C++', 'Python (basic)']],
    ['Frontend', ['React.js', 'TanStack Query', 'TanStack Router', 'Tailwind CSS', 'shadcn/ui', 'Vite', 'Jotai']],
    ['Backend', ['Node.js', 'Bun', 'Hono', 'Express.js', 'REST APIs', 'WebSockets (Socket.io)']],
    [
      'Databases & Infrastructure',
      ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Drizzle ORM', 'Supabase', 'AWS SQS', 'Docker'],
    ],
    ['Auth & Security', ['Better Auth', 'JWT', 'Zod', 'Helmet']],
    [
      'Testing & Tools',
      ['Vitest', 'Playwright', 'Selenium', 'JMeter', 'Git', 'GitHub', 'Postman', 'ESLint', 'Prettier', 'Husky'],
    ],
  ];

  it('uses the CV groups, in order, as the base', () => {
    expect(skills.map((g) => g.group)).toEqual([
      'AI / LLM',
      'Languages',
      'Frontend',
      'Backend',
      'Databases & Infrastructure',
      'Auth & Security',
      'Testing & Tools',
      'Also in this work',
    ]);
  });

  it('has every CV skill word for word in its own group', () => {
    for (const [group, items] of cvGroups) {
      const actual = skills.find((g) => g.group === group);
      expect(actual, group).toBeDefined();
      expect(actual!.items, group).toEqual(expect.arrayContaining(items));
    }
  });

  it('adds only the tools the repositories document, and no other CV group gains items', () => {
    const extras = skills.at(-1)!;
    expect(extras.items).toEqual(['SQL', 'Lighthouse CI', 'GitHub Actions', 'Cloudflare Workers', 'Render', 'Neon']);

    /* Nothing outside the CV groups may smuggle in an unlisted CV item. */
    const cvItems = new Set(cvGroups.flatMap(([, items]) => items));
    for (const group of skills.slice(0, -1)) {
      for (const item of group.items) expect(cvItems.has(item), `${group.group}: ${item}`).toBe(true);
    }
  });
});
