import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

// u-bike Brand Colors
const kCharcoal = Color(0xFF2E2B26);
const kGold = Color(0xFFBF9340);
const kSienna = Color(0xFF8B2E1E);
const kCharcoalLight = Color(0xFF3D3A35);
const kCharcoalDark = Color(0xFF1A1918);
const kGoldLight = Color(0xFFD9B54D);
const kSurface = Color(0xFF3D3A35);
const kOnSurface = Color(0xFFF5F0E8);

ThemeData get ubikeTheme => ThemeData(
      useMaterial3: true,
      colorScheme: const ColorScheme.dark(
        primary: kGold,
        onPrimary: kCharcoal,
        secondary: kSienna,
        onSecondary: Colors.white,
        surface: kSurface,
        onSurface: kOnSurface,
        background: kCharcoal,
        onBackground: kOnSurface,
        error: Color(0xFFCF6679),
      ),
      scaffoldBackgroundColor: kCharcoal,
      appBarTheme: AppBarTheme(
        backgroundColor: kCharcoalDark,
        foregroundColor: kOnSurface,
        elevation: 0,
        titleTextStyle: GoogleFonts.poppins(
          color: kGold,
          fontSize: 20,
          fontWeight: FontWeight.w600,
        ),
      ),
      textTheme: GoogleFonts.poppinsTextTheme(
        const TextTheme(
          headlineLarge: TextStyle(color: kOnSurface, fontWeight: FontWeight.w700),
          headlineMedium: TextStyle(color: kOnSurface, fontWeight: FontWeight.w600),
          titleLarge: TextStyle(color: kOnSurface, fontWeight: FontWeight.w600),
          bodyLarge: TextStyle(color: kOnSurface),
          bodyMedium: TextStyle(color: Color(0xFFBBB5A8)),
          labelLarge: TextStyle(color: kCharcoal, fontWeight: FontWeight.w600),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: kGold,
          foregroundColor: kCharcoal,
          minimumSize: const Size(double.infinity, 52),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          textStyle: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 16),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: kGold,
          side: const BorderSide(color: kGold),
          minimumSize: const Size(double.infinity, 52),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          textStyle: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 16),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: kSurface,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFF4A4540)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFF4A4540)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: kGold, width: 2),
        ),
        labelStyle: const TextStyle(color: Color(0xFF8B8578)),
        hintStyle: const TextStyle(color: Color(0xFF6B6660)),
      ),
      cardTheme: CardTheme(
        color: kSurface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: Color(0xFF4A4540)),
        ),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: kCharcoalDark,
        selectedItemColor: kGold,
        unselectedItemColor: Color(0xFF6B6660),
        type: BottomNavigationBarType.fixed,
      ),
      chipTheme: ChipThemeData(
        backgroundColor: kSurface,
        selectedColor: kGold.withOpacity(0.2),
        labelStyle: const TextStyle(color: kOnSurface),
        side: const BorderSide(color: Color(0xFF4A4540)),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
    );
