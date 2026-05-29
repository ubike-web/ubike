import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

// ─── Brand Colors ───────────────────────────────────────────────────────────
const kCharcoal = Color(0xFF2E2B26);
const kCharcoalLight = Color(0xFF3D3A35);
const kCharcoalMid = Color(0xFF4A4540);
const kCharcoalDark = Color(0xFF1A1918);
const kGold = Color(0xFFBF9340);
const kGoldLight = Color(0xFFD9B54D);
const kGoldDark = Color(0xFFA07A32);
const kSienna = Color(0xFF8B2E1E);
const kSiennaLight = Color(0xFFB04030);
const kCream = Color(0xFFF5F0E8);
const kSubtext = Color(0xFF8B8578);
const kBorder = Color(0xFF4A4540);
const kSuccess = Color(0xFF2D9E6B);
const kError = Color(0xFFCF4444);
const kWarning = Color(0xFFE8A020);
const kBlue = Color(0xFF1A7BBA);

// ─── Light Theme ────────────────────────────────────────────────────────────
ThemeData get ubikeLight => _buildTheme(Brightness.light);

// ─── Dark Theme (default) ───────────────────────────────────────────────────
ThemeData get ubikeDark => _buildTheme(Brightness.dark);

ThemeData _buildTheme(Brightness brightness) {
  final isDark = brightness == Brightness.dark;
  final bg = isDark ? kCharcoal : const Color(0xFFF8F5F0);
  final surface = isDark ? kCharcoalLight : Colors.white;
  final onSurface = isDark ? kCream : kCharcoal;
  final subtext = isDark ? kSubtext : const Color(0xFF6B6660);

  return ThemeData(
    useMaterial3: true,
    brightness: brightness,
    colorScheme: ColorScheme(
      brightness: brightness,
      primary: kGold,
      onPrimary: kCharcoal,
      secondary: kSienna,
      onSecondary: Colors.white,
      tertiary: kBlue,
      onTertiary: Colors.white,
      error: kError,
      onError: Colors.white,
      surface: surface,
      onSurface: onSurface,
      surfaceContainerHighest: isDark ? kCharcoalMid : const Color(0xFFEDE8E0),
      outline: kBorder,
      shadow: Colors.black54,
    ),
    scaffoldBackgroundColor: bg,
    appBarTheme: AppBarTheme(
      backgroundColor: isDark ? kCharcoalDark : Colors.white,
      foregroundColor: onSurface,
      elevation: 0,
      scrolledUnderElevation: 0,
      systemOverlayStyle: isDark
          ? SystemUiOverlayStyle.light
          : SystemUiOverlayStyle.dark,
      titleTextStyle: GoogleFonts.poppins(
        color: isDark ? kGold : kCharcoal,
        fontSize: 18,
        fontWeight: FontWeight.w600,
      ),
      iconTheme: IconThemeData(color: onSurface),
    ),
    textTheme: GoogleFonts.poppinsTextTheme().copyWith(
      displayLarge: GoogleFonts.poppins(color: onSurface, fontWeight: FontWeight.w700, fontSize: 32),
      displayMedium: GoogleFonts.poppins(color: onSurface, fontWeight: FontWeight.w700, fontSize: 28),
      headlineLarge: GoogleFonts.poppins(color: onSurface, fontWeight: FontWeight.w700, fontSize: 24),
      headlineMedium: GoogleFonts.poppins(color: onSurface, fontWeight: FontWeight.w600, fontSize: 20),
      headlineSmall: GoogleFonts.poppins(color: onSurface, fontWeight: FontWeight.w600, fontSize: 18),
      titleLarge: GoogleFonts.poppins(color: onSurface, fontWeight: FontWeight.w600, fontSize: 16),
      titleMedium: GoogleFonts.poppins(color: onSurface, fontWeight: FontWeight.w500, fontSize: 14),
      bodyLarge: GoogleFonts.poppins(color: onSurface, fontSize: 16),
      bodyMedium: GoogleFonts.poppins(color: subtext, fontSize: 14),
      bodySmall: GoogleFonts.poppins(color: subtext, fontSize: 12),
      labelLarge: GoogleFonts.poppins(color: kCharcoal, fontWeight: FontWeight.w600, fontSize: 16),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: kGold,
        foregroundColor: kCharcoal,
        minimumSize: const Size(double.infinity, 54),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        textStyle: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 16),
        elevation: 0,
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: kGold,
        side: const BorderSide(color: kGold, width: 1.5),
        minimumSize: const Size(double.infinity, 54),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        textStyle: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 16),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: kGold,
        textStyle: GoogleFonts.poppins(fontWeight: FontWeight.w500, fontSize: 14),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: surface,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: kBorder.withOpacity(0.6)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: kBorder.withOpacity(0.6)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: kGold, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: kError),
      ),
      labelStyle: GoogleFonts.poppins(color: subtext, fontSize: 14),
      hintStyle: GoogleFonts.poppins(color: subtext.withOpacity(0.7), fontSize: 14),
    ),
    cardTheme: CardTheme(
      color: surface,
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: kBorder.withOpacity(0.4)),
      ),
    ),
    bottomNavigationBarTheme: BottomNavigationBarThemeData(
      backgroundColor: isDark ? kCharcoalDark : Colors.white,
      selectedItemColor: kGold,
      unselectedItemColor: subtext,
      type: BottomNavigationBarType.fixed,
      elevation: 0,
      selectedLabelStyle: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.w600),
      unselectedLabelStyle: GoogleFonts.poppins(fontSize: 11),
    ),
    dividerTheme: DividerThemeData(
      color: kBorder.withOpacity(0.4),
      thickness: 1,
    ),
    switchTheme: SwitchThemeData(
      thumbColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? kGold : Colors.grey),
      trackColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? kGold.withOpacity(0.4) : Colors.grey.withOpacity(0.3)),
    ),
    snackBarTheme: SnackBarThemeData(
      backgroundColor: isDark ? kCharcoalLight : kCharcoal,
      contentTextStyle: GoogleFonts.poppins(color: kCream),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      behavior: SnackBarBehavior.floating,
    ),
    bottomSheetTheme: BottomSheetThemeData(
      backgroundColor: surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
    ),
    dialogTheme: DialogTheme(
      backgroundColor: surface,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
    ),
  );
}
