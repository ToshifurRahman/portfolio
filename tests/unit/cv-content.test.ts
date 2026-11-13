import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  achievements,
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
  const phoneDigits = ['REDACTED', 'REDACTED', 'REDACTED', 'REDACTED'];

  it('keeps the number out of src/ and public/ (the CV PDF aside)', () => {
    const files = [...walk(join(root, 'src')), ...walk(join(root, 'public'))].filter(
      (file) => statSync(file).isFile() && !/\.(pdf|png|webp|woff2?|ico)$/i.test(file),
    );

    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const text = readFileSync(file, 'utf8');
      for (const digits of phoneDigits) {
        expect(text.includes(digits), `${file} contains the phone number`).toBe(false);
      }
    }
  });

  it('keeps the number out of index.html when it is present', () => {
    const file = join(root, 'index.html');
    if (!existsSync(file)) return;
    const text = readFileSync(file, 'utf8');
    for (const digits of phoneDigits) {
      expect(text.includes(digits), 'index.html contains the phone number').toBe(false);
    }
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
    expect(find('Codeforces')?.links).toContainEqual({
      label: 'Codeforces profile',
      href: 'https://codeforces.com/profile/ToshifurRahman',
    });
    expect(find('CodeChef')?.links).toContainEqual({
      label: 'CodeChef profile',
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

  it('keeps a date only when the file states one', () => {
    const stated = /^(?:\d{1,2} )?[A-Z][a-z]+ \d{4}$|^\d{4}$/;
    for (const cert of certificates) {
      if (cert.date !== undefined) expect(cert.date, cert.slug).toMatch(stated);
    }
    /* Only the files that print a day give one. */
    expect(certificates.find((c) => c.slug === 'cu-contest')?.date).toBe('2024');
    expect(certificates.find((c) => c.slug === 'botany-olympiad')?.date).toBe('2018');
  });

  it('keeps the CV download byte-identical on disk', () => {
    const cv = join(root, 'public', 'cv', 'Toshifur-Rahman-CV.pdf');
    expect(statSync(cv).size).toBeGreaterThan(0);
  });
});

describe('skills', () => {
  it('keeps the existing entries and adds the CV groups', () => {
    const groups = skills.map((g) => g.group);
    for (const group of ['Languages', 'Backend', 'Frontend', 'Quality', 'Platform']) {
      expect(groups).toContain(group);
    }
    const all = skills.flatMap((g) => g.items);
    for (const item of ['TypeScript', 'Hono', 'PostgreSQL', 'Redis', 'React', 'Docker']) {
      expect(all).toContain(item);
    }
    const llm = skills.find((g) => g.group === 'AI / LLM');
    expect(llm?.items).toContain('Portkey');
  });
});
