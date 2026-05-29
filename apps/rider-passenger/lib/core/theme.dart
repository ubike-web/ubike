import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

const kCharcoal = Color(0xFF2E2B26);
const kCharcoalLight = Color(0xFF3D3A35);
const kCharcoalDark = Color(0xFF1A1918);
const kBorder = Color(0xFF4A4540);
const kGold = Color(0xFFBF9340);
const kGoldDark = Color(0xFFA07A32);
const kSienna = Color(0xFF8B2E1E);
const kCream = Color(0xFFF5F0E8);
const kSubtext = Color(0xFF8B8578);
const kSuccess = Color(0xFF2D9E6B);
const kError = Color(0xFFCF4444);
const kWarning = Color(0xFFE8A020);
const kBlue = Color(0xFF1A7BBA);

ThemeData get riderTheme => ThemeData(
  useMaterial3: true,
  brightness: Brightness.dark,
  colorScheme: const ColorScheme.dark(primary: kGold, onPrimary: kCharcoal, secondary: kSienna, surface: kCharcoalLight, background: kCharcoal),
  scaffoldBackgroundColor: kCharcoal,
  appBarTheme: AppBarTheme(
    backgroundColor: kCharcoalDark,
    foregroundColor: kCream,
    elevation: 0,
    titleTextStyle: GoogleFonts.poppins(color: kGold, fontSize: 18, fontWeight: FontWeight.w600),
  ),
  textTheme: GoogleFonts.poppinsTextTheme(ThemeData.dark().textTheme),
  elevatedButtonTheme: ElevatedButtonThemeData(
    style: ElevatedButton.styleFrom(backgroundColor: kGold, foregroundColor: kCharcoal, minimumSize: const Size(double.infinity, 54), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)), textStyle: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 16), elevation: 0),
  ),
  inputDecorationTheme: InputDecorationTheme(
    filled: true,
    fillColor: kCharcoalLight,
    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: kBorder)),
    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: kBorder)),
    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: kGold, width: 2)),
    labelStyle: const TextStyle(color: kSubtext),
    hintStyle: const TextStyle(color: kSubtext),
  ),
  cardTheme: CardTheme(color: kCharcoalLight, elevation: 0, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: const BorderSide(color: kBorder))),
  bottomNavigationBarTheme: const BottomNavigationBarThemeData(backgroundColor: kCharcoalDark, selectedItemColor: kGold, unselectedItemColor: kSubtext, type: BottomNavigationBarType.fixed, elevation: 0),
  snackBarTheme: SnackBarThemeData(backgroundColor: kCharcoalLight, contentTextStyle: const TextStyle(color: kCream), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)), behavior: SnackBarBehavior.floating),
  bottomSheetTheme: const BottomSheetThemeData(backgroundColor: kCharcoalLight, shape: RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24)))),
  switchTheme: SwitchThemeData(thumbColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? kGold : Colors.grey), trackColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? kGold.withOpacity(0.4) : Colors.grey.withOpacity(0.3))),
);
