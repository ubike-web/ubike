import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

const kCharcoal = Color(0xFF2E2B26);
const kCharcoalLight = Color(0xFF3D3A35);
const kCharcoalDark = Color(0xFF1A1918);
const kBorder = Color(0xFF4A4540);
const kGold = Color(0xFFBF9340);
const kSienna = Color(0xFF8B2E1E);
const kSiennaLight = Color(0xFFB04030);
const kCream = Color(0xFFF5F0E8);
const kSubtext = Color(0xFF8B8578);
const kSuccess = Color(0xFF2D9E6B);
const kError = Color(0xFFCF4444);
const kWarning = Color(0xFFE8A020);
const kBlue = Color(0xFF1A7BBA);

ThemeData get errandsTheme => ThemeData(
  useMaterial3: true,
  brightness: Brightness.dark,
  colorScheme: const ColorScheme.dark(primary: kSienna, onPrimary: Colors.white, secondary: kGold, surface: kCharcoalLight, background: kCharcoal),
  scaffoldBackgroundColor: kCharcoal,
  appBarTheme: AppBarTheme(
    backgroundColor: kCharcoalDark,
    foregroundColor: kCream,
    elevation: 0,
    titleTextStyle: GoogleFonts.poppins(color: kSienna, fontSize: 18, fontWeight: FontWeight.w600),
  ),
  textTheme: GoogleFonts.poppinsTextTheme(ThemeData.dark().textTheme),
  elevatedButtonTheme: ElevatedButtonThemeData(
    style: ElevatedButton.styleFrom(backgroundColor: kSienna, foregroundColor: Colors.white, minimumSize: const Size(double.infinity, 54), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)), textStyle: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 16), elevation: 0),
  ),
  inputDecorationTheme: InputDecorationTheme(
    filled: true, fillColor: kCharcoalLight,
    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: kBorder)),
    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: kBorder)),
    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: kSienna, width: 2)),
    labelStyle: const TextStyle(color: kSubtext),
  ),
  cardTheme: CardTheme(color: kCharcoalLight, elevation: 0, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: const BorderSide(color: kBorder))),
  bottomNavigationBarTheme: const BottomNavigationBarThemeData(backgroundColor: kCharcoalDark, selectedItemColor: kSienna, unselectedItemColor: kSubtext, type: BottomNavigationBarType.fixed, elevation: 0),
);
