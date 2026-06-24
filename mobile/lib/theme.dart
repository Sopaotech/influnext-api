import 'package:flutter/material.dart';

class InflunextTheme {
  static const Color background = Color(0xFF0D0820);
  static const Color cardBg = Color(0xFF151030);
  static const Color brandDark = Color(0xFF1A1040);
  static const Color brandMedium = Color(0xFF2D1B69);
  static const Color brandAccent = Color(0xFF7F77DD);
  static const Color brandLight = Color(0xFFC4BEFF);
  static const Color success = Color(0xFF1D9E75);
  static const Color warning = Color(0xFFE58F24);
  static const Color textLight = Colors.white;
  static const Color textMuted = Color(0xFF9E98C7);

  static ThemeData get darkTheme {
    return ThemeData(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: background,
      primaryColor: brandAccent,
      cardColor: cardBg,
      colorScheme: const ColorScheme.dark(
        primary: brandAccent,
        secondary: brandLight,
        surface: cardBg,
        error: Colors.redAccent,
        onPrimary: Colors.white,
        onSecondary: Colors.black,
      ),
      textTheme: const TextTheme(
        headlineLarge: TextStyle(
          fontSize: 28,
          fontWeight: FontWeight.bold,
          color: textLight,
          letterSpacing: -0.5,
        ),
        headlineMedium: TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.bold,
          color: textLight,
          letterSpacing: -0.2,
        ),
        bodyLarge: TextStyle(
          fontSize: 16,
          color: textLight,
        ),
        bodyMedium: TextStyle(
          fontSize: 14,
          color: textMuted,
        ),
        labelLarge: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.bold,
          color: textLight,
        ),
      ),
      cardTheme: CardThemeData(
        color: cardBg,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(
            color: Color(0xFF2E2452),
            width: 1,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: const Color(0xFF120C26),
        hintStyle: const TextStyle(color: textMuted, fontSize: 14),
        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: Color(0xFF2E2452), width: 1),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: Color(0xFF2E2452), width: 1),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: brandAccent, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: Colors.redAccent, width: 1),
        ),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: Color(0xFF070414),
        selectedItemColor: brandLight,
        unselectedItemColor: textMuted,
        selectedLabelStyle: TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
        unselectedLabelStyle: TextStyle(fontSize: 12),
        elevation: 10,
      ),
    );
  }

  // Helper gradients
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [brandMedium, brandAccent],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient bgGradient = LinearGradient(
    colors: [background, Color(0xFF160E33)],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );
}
