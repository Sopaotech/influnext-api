import {
  buildAiInterviewPayload,
  clearCreatorOnboardingDraft,
  clearLegacyCreatorOnboardingDraft,
  createEmptyCreatorOnboardingDraft,
  deriveCareerObjective,
  getCreatorOnboardingDraftStorageKey,
  INTERVIEW_QUESTIONS,
  LEGACY_ONBOARDING_DRAFT_STORAGE_KEY,
  loadCreatorOnboardingDraft,
  ONBOARDING_DRAFT_VERSION,
  saveCreatorOnboardingDraft,
  type StorageLike,
} from '../web/src/lib/onboarding-draft';
import fs from 'node:fs';
import path from 'node:path';

function memoryStorage(): StorageLike {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

describe('creator onboarding draft', () => {
  it('preserves the selected answer and interview step across a remount', () => {
    const storage = memoryStorage();
    const storageKey = getCreatorOnboardingDraftStorageKey('creator-a');
    const draft = createEmptyCreatorOnboardingDraft();
    draft.step = 4;
    draft.interviewStep = 2;
    draft.handle = 'criador_teste';
    draft.answers.careerGoal = 'Parcerias pagas com marcas';

    saveCreatorOnboardingDraft(storage, storageKey, draft);

    expect(loadCreatorOnboardingDraft(storage, storageKey)).toMatchObject({
      step: 4,
      interviewStep: 2,
      handle: 'criador_teste',
      answers: { careerGoal: 'Parcerias pagas com marcas' },
    });
  });

  it('keeps earlier answers when navigating back and forth', () => {
    const storage = memoryStorage();
    const storageKey = getCreatorOnboardingDraftStorageKey('creator-a');
    const draft = createEmptyCreatorOnboardingDraft();
    draft.step = 4;
    draft.interviewStep = 3;
    draft.answers.careerGoal = 'Ser referência no meu nicho';
    draft.answers.followersGoal = '100.000 seguidores';
    draft.answers.currentMonetization = 'Publis e parcerias com marcas';

    saveCreatorOnboardingDraft(storage, storageKey, draft);
    const resumed = loadCreatorOnboardingDraft(storage, storageKey);
    resumed.interviewStep = 2;
    saveCreatorOnboardingDraft(storage, storageKey, resumed);

    expect(loadCreatorOnboardingDraft(storage, storageKey).answers).toMatchObject({
      careerGoal: 'Ser referência no meu nicho',
      followersGoal: '100.000 seguidores',
      currentMonetization: 'Publis e parcerias com marcas',
    });
  });

  it('rejects malformed drafts and clears the draft after a successful completion', () => {
    const storage = memoryStorage();
    const storageKey = getCreatorOnboardingDraftStorageKey('creator-a');
    storage.setItem(storageKey, '{not-json');
    expect(loadCreatorOnboardingDraft(storage, storageKey)).toEqual(createEmptyCreatorOnboardingDraft());

    const incompatibleDraft = createEmptyCreatorOnboardingDraft();
    incompatibleDraft.version = 1;
    storage.setItem(storageKey, JSON.stringify(incompatibleDraft));
    expect(loadCreatorOnboardingDraft(storage, storageKey)).toEqual(createEmptyCreatorOnboardingDraft());

    saveCreatorOnboardingDraft(storage, storageKey, createEmptyCreatorOnboardingDraft());
    clearCreatorOnboardingDraft(storage, storageKey);
    expect(storage.getItem(storageKey)).toBeNull();
  });

  it('isolates drafts by stable user id and removes the unscoped legacy draft', () => {
    const storage = memoryStorage();
    const userAKey = getCreatorOnboardingDraftStorageKey('creator-a');
    const userBKey = getCreatorOnboardingDraftStorageKey('creator-b');
    const userADraft = createEmptyCreatorOnboardingDraft();
    userADraft.handle = 'creator-a-handle';

    saveCreatorOnboardingDraft(storage, userAKey, userADraft);
    storage.setItem(LEGACY_ONBOARDING_DRAFT_STORAGE_KEY, JSON.stringify(userADraft));

    expect(loadCreatorOnboardingDraft(storage, userBKey)).toEqual(createEmptyCreatorOnboardingDraft());
    clearLegacyCreatorOnboardingDraft(storage);
    expect(storage.getItem(LEGACY_ONBOARDING_DRAFT_STORAGE_KEY)).toBeNull();
    expect(loadCreatorOnboardingDraft(storage, userAKey).handle).toBe('creator-a-handle');
  });

  it('restores version 2 drafts with removed visual preferences without losing creator progress', () => {
    const storage = memoryStorage();
    const storageKey = getCreatorOnboardingDraftStorageKey('creator-a');
    const legacyDraft = {
      ...createEmptyCreatorOnboardingDraft(),
      version: 2,
      step: 5,
      accentColor: '#d96b27',
      answers: { ...createEmptyCreatorOnboardingDraft().answers, careerGoal: 'brands' },
    };
    storage.setItem(storageKey, JSON.stringify(legacyDraft));

    expect(loadCreatorOnboardingDraft(storage, storageKey)).toMatchObject({
      version: ONBOARDING_DRAFT_VERSION,
      step: 4,
      answers: { careerGoal: 'brands' },
    });
    expect(loadCreatorOnboardingDraft(storage, storageKey)).not.toHaveProperty('accentColor');
  });

  it('keeps the nine-question model aligned with the versioned payload contract', () => {
    expect(INTERVIEW_QUESTIONS).toHaveLength(9);
    expect(new Set(INTERVIEW_QUESTIONS.map(question => question.id)).size).toBe(9);
  });

  it('serializes the revised strategy payload without gender or authentication data', () => {
    const draft = createEmptyCreatorOnboardingDraft();
    draft.audienceTarget = 'Pessoas que querem aprender fotografia mobile';
    draft.answers.careerGoal = 'brands';
    draft.answers.currentMonetization = 'none';
    draft.answers.desiredMonetization = 'publis';
    draft.answers.assistantStyle = 'direta';

    const payload = JSON.parse(buildAiInterviewPayload(draft));

    expect(payload).toMatchObject({
      schemaVersion: 2,
      careerGoal: 'brands',
      currentMonetization: 'none',
      desiredMonetization: 'publis',
      audienceTarget: 'Pessoas que querem aprender fotografia mobile',
      assistantPreference: 'direta',
    });
    expect(payload).not.toHaveProperty('gender');
    expect(payload).not.toHaveProperty('contentFrequency');
    expect(Object.keys(payload)).toEqual([
      'schemaVersion',
      'careerGoal',
      'currentMonetization',
      'desiredMonetization',
      'audienceTarget',
      'followersGoal',
      'primaryFormats',
      'availability',
      'primaryChallenge',
      'brandExperience',
      'growthHistory',
      'assistantPreference',
    ]);
    expect(JSON.stringify(payload)).not.toMatch(/token|secret|password/i);
    expect(deriveCareerObjective('brands')).toBe('CONTRACTS');
    expect(deriveCareerObjective('Ser referência no meu nicho')).toBe('AUTHORITY');
  });

  it('uses the authenticated user id for draft restoration and preserves the onboarding social flow', () => {
    const onboardingSource = fs.readFileSync(path.resolve(__dirname, '../web/src/app/onboarding/page.tsx'), 'utf8');
    const instagramModalSource = fs.readFileSync(path.resolve(__dirname, '../web/src/components/InstagramOnboardingModal.tsx'), 'utf8');
    const tiktokModalSource = fs.readFileSync(path.resolve(__dirname, '../web/src/components/TikTokOnboardingModal.tsx'), 'utf8');

    expect(onboardingSource).toContain("api.get<{ id?: string }>('/auth/me')");
    expect(onboardingSource).toContain('getCreatorOnboardingDraftStorageKey(userId)');
    expect(onboardingSource).toContain("api.get<{ platforms?: string[] }>('/integrations/connected')");
    expect(onboardingSource).not.toContain('loadCreatorOnboardingDraft(window.sessionStorage)');
    expect(instagramModalSource).toContain("params: { from: 'onboarding' }");
    expect(tiktokModalSource).toContain("params: { from: 'onboarding' }");
    expect(onboardingSource).not.toContain('Visual_Sistema');
    expect(onboardingSource).not.toContain('accentColor');
    expect(onboardingSource).toContain('{step === 4 && (');
    expect(onboardingSource).toContain('setStep(4);');
  });
});
