import fs from 'fs';
import path from 'path';

const repositoryRoot = path.resolve(__dirname, '..');

function readRepositoryFile(...segments: string[]): string {
  return fs.readFileSync(path.join(repositoryRoot, ...segments), 'utf8');
}

describe('G1C1 — contenção da demonstração pública', () => {
  it('torna /demo indisponível em produção no limite server-side da rota', () => {
    const layoutSource = readRepositoryFile('web', 'src', 'app', 'demo', 'layout.tsx');

    expect(layoutSource).toContain("process.env.NODE_ENV === 'production'");
    expect(layoutSource).toContain('notFound()');
    expect(layoutSource).not.toContain("'use client'");
  });

  it('remove o auto-login e qualquer senha literal da página cliente da demo', () => {
    const demoPageSource = readRepositoryFile('web', 'src', 'app', 'demo', 'page.tsx');

    expect(demoPageSource).not.toContain('autoLoginDemo');
    expect(demoPageSource).not.toContain('/auth/login');
    expect(demoPageSource).not.toMatch(/\bpassword\s*:/i);
  });

  it('desabilita o acionamento visual do instant checkout no cliente em produção', () => {
    const publicProfileSource = readRepositoryFile('web', 'src', 'app', 'p', '[handle]', 'PublicProfileView.tsx');

    expect(publicProfileSource).toContain("process.env.NODE_ENV !== 'production'");
    expect(publicProfileSource).toContain('disabled={!instantCheckoutEnabled}');
    expect(publicProfileSource).toContain('{instantCheckoutEnabled && (');
  });
});
