export const LEGACY_ONBOARDING_DRAFT_STORAGE_KEY = 'influnext.creator-onboarding.draft.v1';
export const ONBOARDING_DRAFT_STORAGE_PREFIX = 'influnext.creator-onboarding.draft.v2';
export const ONBOARDING_DRAFT_VERSION = 2;
export const ONBOARDING_INTERVIEW_STEP_COUNT = 9;

const MAX_DRAFT_TEXT_LENGTH = 180;

export type InterviewAnswerKey =
  | 'careerGoal'
  | 'currentMonetization'
  | 'desiredMonetization'
  | 'followersGoal'
  | 'primaryFormats'
  | 'availability'
  | 'difficulty'
  | 'brandExperience'
  | 'growthHistory'
  | 'assistantStyle';

export type InterviewAnswers = Record<InterviewAnswerKey, string>;

export type CreatorOnboardingDraft = {
  version: number;
  step: number;
  interviewStep: number;
  accentColor: string;
  handle: string;
  niche: string;
  audienceTarget: string;
  answers: InterviewAnswers;
};

export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export type InterviewQuestion = {
  id: InterviewAnswerKey;
  title: string;
  description: string;
  required: boolean;
  options: Array<{ value: string; label: string }>;
};

export const INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'careerGoal',
    title: 'Qual é seu objetivo principal nos próximos 12 meses?',
    description: 'Isso orienta o foco estratégico do seu plano.',
    required: true,
    options: [
      { value: 'brands', label: 'Fechar mais parcerias com marcas' },
      { value: 'authority', label: 'Me tornar referência no meu nicho' },
      { value: 'sales', label: 'Vender produtos, serviços ou consultorias' },
      { value: 'growth', label: 'Aumentar audiência e alcance' },
    ],
  },
  {
    id: 'currentMonetization',
    title: 'Como você monetiza hoje?',
    description: 'Conte seu ponto de partida — não é uma meta.',
    required: true,
    options: [
      { value: 'none', label: 'Ainda não monetizo meu conteúdo' },
      { value: 'brands', label: 'Publis e parcerias com marcas' },
      { value: 'products-services', label: 'Produtos, serviços ou mentorias' },
      { value: 'affiliate-ads', label: 'Afiliados, anúncios ou comissões' },
    ],
  },
  {
    id: 'followersGoal',
    title: 'Qual meta de audiência você tem para 12 meses?',
    description: 'Vamos usar a ambição para calibrar o ritmo do plano.',
    required: true,
    options: [
      { value: '10k', label: 'Chegar a 10 mil seguidores' },
      { value: '50k', label: 'Chegar a 50 mil seguidores' },
      { value: '100k', label: 'Chegar a 100 mil seguidores' },
      { value: '500k-plus', label: 'Chegar a 500 mil ou mais' },
    ],
  },
  {
    id: 'primaryFormats',
    title: 'Quais formatos você produz melhor?',
    description: 'Escolha o formato que você consegue manter com qualidade.',
    required: true,
    options: [
      { value: 'reels', label: 'Reels e vídeos curtos' },
      { value: 'stories', label: 'Stories e bastidores' },
      { value: 'feed', label: 'Feed, carrosséis e posts estáticos' },
      { value: 'mixed', label: 'Combino formatos diferentes' },
    ],
  },
  {
    id: 'availability',
    title: 'Quando você consegue produzir com mais foco?',
    description: 'Isso ajuda a propor uma rotina compatível com sua agenda.',
    required: true,
    options: [
      { value: 'morning', label: 'Manhã' },
      { value: 'afternoon', label: 'Tarde' },
      { value: 'evening', label: 'Noite' },
      { value: 'weekend', label: 'Finais de semana' },
    ],
  },
  {
    id: 'difficulty',
    title: 'Qual é seu principal gargalo hoje?',
    description: 'Vamos concentrar as primeiras recomendações aqui.',
    required: true,
    options: [
      { value: 'consistency', label: 'Manter consistência' },
      { value: 'ideas-production', label: 'Ter ideias e produzir conteúdo' },
      { value: 'growth-metrics', label: 'Entender crescimento e métricas' },
      { value: 'commercial', label: 'Prospecção e negociação com marcas' },
    ],
  },
  {
    id: 'brandExperience',
    title: 'Qual sua experiência com publis e marcas?',
    description: 'Isso direciona o apoio comercial adequado ao seu momento.',
    required: true,
    options: [
      { value: 'none', label: 'Ainda não fiz parceria paga' },
      { value: 'prospecting', label: 'Já fiz propostas, mas sem fechar' },
      { value: 'some', label: 'Já fechei algumas campanhas' },
      { value: 'recurring', label: 'Tenho parcerias recorrentes' },
    ],
  },
  {
    id: 'growthHistory',
    title: 'Você usou alguma estratégia de crescimento não orgânico?',
    description: 'Opcional. Esta resposta só dá contexto; não altera alcance, score ou prioridade automaticamente.',
    required: false,
    options: [
      { value: 'organic', label: 'Não, meu crescimento foi orgânico' },
      { value: 'non-organic', label: 'Sim, já usei no passado' },
      { value: 'prefer-not-to-say', label: 'Prefiro não responder' },
    ],
  },
  {
    id: 'assistantStyle',
    title: 'Como prefere receber orientação?',
    description: 'Opcional e separado da sua análise estratégica.',
    required: false,
    options: [
      { value: 'direct', label: 'Direta e objetiva' },
      { value: 'didactic', label: 'Estratégica e didática' },
      { value: 'motivational', label: 'Motivadora e prática' },
      { value: 'no-preference', label: 'Sem preferência' },
    ],
  },
];

export function createEmptyCreatorOnboardingDraft(): CreatorOnboardingDraft {
  return {
    version: ONBOARDING_DRAFT_VERSION,
    step: 1,
    interviewStep: 1,
    accentColor: '#a855f7',
    handle: '',
    niche: '',
    audienceTarget: '',
    answers: {
      careerGoal: '',
      currentMonetization: '',
      desiredMonetization: '',
      followersGoal: '',
      primaryFormats: '',
      availability: '',
      difficulty: '',
      brandExperience: '',
      growthHistory: '',
      assistantStyle: '',
    },
  };
}

function readText(value: unknown, maxLength = MAX_DRAFT_TEXT_LENGTH): string {
  return typeof value === 'string' ? value.slice(0, maxLength) : '';
}

function readStep(value: unknown, max: number): number {
  return typeof value === 'number' && Number.isInteger(value)
    ? Math.min(Math.max(value, 1), max)
    : 1;
}

export function parseCreatorOnboardingDraft(raw: string | null): CreatorOnboardingDraft | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<CreatorOnboardingDraft>;
    if (parsed.version !== ONBOARDING_DRAFT_VERSION || !parsed.answers || typeof parsed.answers !== 'object') {
      return null;
    }

    const empty = createEmptyCreatorOnboardingDraft();
    const answers = parsed.answers as Partial<InterviewAnswers>;
    return {
      version: ONBOARDING_DRAFT_VERSION,
      step: readStep(parsed.step, 5),
      interviewStep: readStep(parsed.interviewStep, ONBOARDING_INTERVIEW_STEP_COUNT),
      accentColor: readText(parsed.accentColor, 32) || empty.accentColor,
      handle: readText(parsed.handle),
      niche: readText(parsed.niche),
      audienceTarget: readText(parsed.audienceTarget),
      answers: {
        careerGoal: readText(answers.careerGoal),
        currentMonetization: readText(answers.currentMonetization),
        desiredMonetization: readText(answers.desiredMonetization),
        followersGoal: readText(answers.followersGoal),
        primaryFormats: readText(answers.primaryFormats),
        availability: readText(answers.availability),
        difficulty: readText(answers.difficulty),
        brandExperience: readText(answers.brandExperience),
        growthHistory: readText(answers.growthHistory),
        assistantStyle: readText(answers.assistantStyle),
      },
    };
  } catch {
    return null;
  }
}

export function getCreatorOnboardingDraftStorageKey(userId: string): string {
  const stableUserId = userId.trim();
  if (!stableUserId) throw new Error('A stable user id is required for an onboarding draft.');
  return `${ONBOARDING_DRAFT_STORAGE_PREFIX}.${encodeURIComponent(stableUserId)}`;
}

export function clearLegacyCreatorOnboardingDraft(storage: StorageLike): void {
  storage.removeItem(LEGACY_ONBOARDING_DRAFT_STORAGE_KEY);
}

export function loadCreatorOnboardingDraft(storage: StorageLike, storageKey: string): CreatorOnboardingDraft {
  return parseCreatorOnboardingDraft(storage.getItem(storageKey))
    || createEmptyCreatorOnboardingDraft();
}

export function saveCreatorOnboardingDraft(storage: StorageLike, storageKey: string, draft: CreatorOnboardingDraft): void {
  storage.setItem(storageKey, JSON.stringify(draft));
}

export function clearCreatorOnboardingDraft(storage: StorageLike, storageKey: string): void {
  storage.removeItem(storageKey);
}

export function isQuestionAnswered(draft: CreatorOnboardingDraft, question: InterviewQuestion): boolean {
  return !question.required || Boolean(draft.answers[question.id]);
}

export function deriveCareerObjective(careerGoal: string): 'SALES' | 'FAME' | 'CONTRACTS' | 'AUTHORITY' {
  if (careerGoal === 'brands' || careerGoal === 'Parcerias pagas com marcas') return 'CONTRACTS';
  if (careerGoal === 'authority' || careerGoal === 'Ser referência no meu nicho') return 'AUTHORITY';
  if (careerGoal === 'sales' || careerGoal === 'Vender produtos, serviços ou consultorias') return 'SALES';
  return 'FAME';
}

export function buildAiInterviewPayload(draft: CreatorOnboardingDraft): string {
  return JSON.stringify({
    schemaVersion: 2,
    careerGoal: draft.answers.careerGoal,
    currentMonetization: draft.answers.currentMonetization,
    desiredMonetization: draft.answers.desiredMonetization,
    audienceTarget: draft.audienceTarget,
    followersGoal: draft.answers.followersGoal,
    primaryFormats: draft.answers.primaryFormats,
    availability: draft.answers.availability,
    primaryChallenge: draft.answers.difficulty,
    brandExperience: draft.answers.brandExperience,
    growthHistory: draft.answers.growthHistory,
    assistantPreference: draft.answers.assistantStyle,
  });
}
