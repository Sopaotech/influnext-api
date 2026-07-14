import 'package:flutter/material.dart';
import '../theme.dart';
import 'main_layout.dart';
import '../widgets/influnext_logo.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController(text: 'alexsandro@influnext.com.br');
  final _passwordController = TextEditingController(text: '••••••••');
  bool _isLoading = false;

  void _handleLogin() async {
    setState(() {
      _isLoading = true;
    });

    // Simulate network delay for premium feedback feel
    await Future.delayed(const Duration(milliseconds: 1500));

    if (mounted) {
      Navigator.of(context).pushReplacement(
        PageRouteBuilder(
          pageBuilder: (context, animation, secondaryAnimation) => const MainLayout(),
          transitionsBuilder: (context, animation, secondaryAnimation, child) {
            return FadeTransition(opacity: animation, child: child);
          },
          transitionDuration: const Duration(milliseconds: 600),
        ),
      );
    }
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    return Scaffold(
      body: Stack(
        children: [
          // Background Gradient
          Container(
            decoration: const BoxDecoration(
              gradient: InflunextTheme.bgGradient,
            ),
          ),
          // Ambient Glow Top Left
          Positioned(
            top: -size.height * 0.2,
            left: -size.width * 0.2,
            child: Container(
              width: size.width * 0.8,
              height: size.width * 0.8,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: InflunextTheme.brandMedium.withValues(alpha: 0.25),
                backgroundBlendMode: BlendMode.screen,
              ),
            ),
          ),
          // Ambient Glow Bottom Right
          Positioned(
            bottom: -size.height * 0.2,
            right: -size.width * 0.2,
            child: Container(
              width: size.width * 0.8,
              height: size.width * 0.8,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: InflunextTheme.brandAccent.withValues(alpha: 0.12),
                backgroundBlendMode: BlendMode.screen,
              ),
            ),
          ),
          // Main Scrollable Content
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 28.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const SizedBox(height: 20),
                    // Logo and Branding
                    Center(
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: const Color(0xFF1B113B).withValues(alpha: 0.5),
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: InflunextTheme.brandAccent.withValues(alpha: 0.3),
                            width: 1.5,
                          ),
                        ),
                        child: const InflunextLogo(size: 48),
                      ),
                    ),
                    const SizedBox(height: 24),
                    const Text(
                      'Influnext',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 32,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Plataforma de Marketing de Influência',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 14,
                        color: InflunextTheme.textMuted,
                      ),
                    ),
                    const SizedBox(height: 48),
                    // Email Field
                    const Text(
                      'E-mail',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: Colors.white70,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      decoration: const InputDecoration(
                        hintText: 'Digite seu e-mail',
                        prefixIcon: Icon(Icons.email_outlined, color: InflunextTheme.textMuted),
                      ),
                    ),
                    const SizedBox(height: 20),
                    // Password Field
                    const Text(
                      'Senha',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: Colors.white70,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _passwordController,
                      obscureText: true,
                      decoration: const InputDecoration(
                        hintText: 'Digite sua senha',
                        prefixIcon: Icon(Icons.lock_outline_rounded, color: InflunextTheme.textMuted),
                      ),
                    ),
                    const SizedBox(height: 32),
                    // Login Button
                    Container(
                      height: 56,
                      decoration: BoxDecoration(
                        gradient: InflunextTheme.primaryGradient,
                        borderRadius: BorderRadius.circular(14),
                        boxShadow: [
                          BoxShadow(
                            color: InflunextTheme.brandAccent.withValues(alpha: 0.3),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          )
                        ],
                      ),
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _handleLogin,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.transparent,
                          foregroundColor: Colors.white,
                          shadowColor: Colors.transparent,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                        child: _isLoading
                            ? const SizedBox(
                                height: 24,
                                width: 24,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2.5,
                                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                ),
                              )
                            : const Text(
                                'Entrar',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 0.5,
                                ),
                              ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    // Signup Link or help
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text(
                          'Ainda não tem conta? ',
                          style: TextStyle(color: InflunextTheme.textMuted, fontSize: 13),
                        ),
                        TextButton(
                          onPressed: () {},
                          child: const Text(
                            'Cadastre-se',
                            style: TextStyle(
                              color: InflunextTheme.brandLight,
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
