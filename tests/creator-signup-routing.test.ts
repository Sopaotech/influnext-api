import fs from 'fs';
import path from 'path';

const signupSource = fs.readFileSync(path.resolve(__dirname, '../web/src/app/auth/signup/SignupClient.tsx'), 'utf8');
const callbackSource = fs.readFileSync(path.resolve(__dirname, '../web/src/app/auth/callback/[platform]/page.tsx'), 'utf8');
const authControllerSource = fs.readFileSync(path.resolve(__dirname, '../src/controllers/auth.controller.ts'), 'utf8');

describe('creator and company signup routing', () => {
  it('email creator signup creates and logs in the account, then goes directly to canonical onboarding', () => {
    expect(signupSource).toContain("await api.post('/auth/signup', { email, password, role });");
    expect(signupSource).toContain("api.post<{ user: { role: 'INFLUENCER' | 'COMPANY' | 'ADMIN'; onboardingCompleted: boolean } }>('/auth/login', { email, password })");
    expect(signupSource).toContain('storeSessionMetadata(loginRes.data.user)');
    expect(signupSource).toContain("if (loginRes.data.user.role === 'INFLUENCER') router.push('/onboarding')");
    expect(signupSource).not.toContain('influencerNiches');
    expect(signupSource).not.toContain('yearsOfCareer');
    expect(authControllerSource).toContain("if (role === 'INFLUENCER')");
    expect(authControllerSource).toContain('await prisma.influencerProfile.create({');
  });

  it('Instagram creator signup uses login-mode provider OAuth and callback routes incomplete creators to onboarding', () => {
    expect(signupSource).toContain("getSocialAuthUrl, type SocialAuthProvider");
    expect(signupSource).toContain("'instagram', 'google', 'tiktok'");
    expect(signupSource).toContain('handleSocialRedirect(platform)');
    expect(callbackSource).toContain("if (!user.onboardingCompleted && user.role === 'INFLUENCER')");
    expect(callbackSource).toContain("router.push('/onboarding')");
  });

  it('keeps company signup profile completion and dashboard destination intact', () => {
    expect(signupSource).toContain("else setStep(2)");
    expect(signupSource).toContain('const handleCompanyProfile');
    expect(signupSource).toContain("api.post('/auth/complete-profile'");
    expect(signupSource).toContain("router.push('/dashboard/company')");
    expect(signupSource).toContain('companyName, city: companyCity, state: companyState, segment, employeeCount');
  });
});
