import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

const kOcean = Color(0xFF0E86CA);
const kOceanDeep = Color(0xFF0A2D6E);
const kOceanLight = Color(0xFF42C8F5);
const kOceanPale = Color(0xFFE3F4FD);
const kGreenLeaf = Color(0xFF4CAF50);
const kWhite = Color(0xFFFFFFFF);
const kSurface = Color(0xFFF5FAFF);
const kDark = Color(0xFF0A1A3E);
const kGrey = Color(0xFF6B7A8D);
const kLightGrey = Color(0xFFDDE8F0);
const kError = Color(0xFFD32F2F);
const kSuccess = Color(0xFF2E7D32);
const kWarning = Color(0xFFF57C00);

const kOceanGradient = LinearGradient(
  colors: [kOceanDeep, kOcean, kOceanLight],
  begin: Alignment.topLeft,
  end: Alignment.bottomRight,
);

ThemeData get riderTheme => ThemeData(
  useMaterial3: true,
  brightness: Brightness.light,
  colorScheme: ColorScheme.light(
    primary: kOcean, onPrimary: kWhite,
    secondary: kGreenLeaf, onSecondary: kWhite,
    error: kError, surface: kSurface, onSurface: kDark, outline: kLightGrey,
  ),
  scaffoldBackgroundColor: kWhite,
  appBarTheme: AppBarTheme(
    backgroundColor: kWhite, foregroundColor: kDark, elevation: 0,
    titleTextStyle: GoogleFonts.poppins(color: kOcean, fontSize: 18, fontWeight: FontWeight.w700),
    iconTheme: const IconThemeData(color: kDark),
  ),
  textTheme: GoogleFonts.poppinsTextTheme(),
  elevatedButtonTheme: ElevatedButtonThemeData(
    style: ElevatedButton.styleFrom(
      backgroundColor: kOcean, foregroundColor: kWhite,
      minimumSize: const Size(double.infinity, 54),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      textStyle: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 16),
      elevation: 2, shadowColor: kOcean.withOpacity(0.4),
    ),
  ),
  inputDecorationTheme: InputDecorationTheme(
    filled: true, fillColor: kSurface,
    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: kLightGrey)),
    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: kLightGrey)),
    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: kOcean, width: 2)),
    labelStyle: GoogleFonts.poppins(color: kGrey, fontSize: 14),
    prefixIconColor: kOcean,
  ),
  cardTheme: CardTheme(
    color: kWhite, elevation: 2,
    shadowColor: kOcean.withOpacity(0.08),
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: const BorderSide(color: kLightGrey)),
  ),
  bottomNavigationBarTheme: BottomNavigationBarThemeData(
    backgroundColor: kWhite, selectedItemColor: kOcean, unselectedItemColor: kGrey,
    type: BottomNavigationBarType.fixed, elevation: 8,
  ),
  snackBarTheme: SnackBarThemeData(
    backgroundColor: kOceanDeep, contentTextStyle: GoogleFonts.poppins(color: kWhite),
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)), behavior: SnackBarBehavior.floating,
  ),
  bottomSheetTheme: const BottomSheetThemeData(
    backgroundColor: kWhite,
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
    elevation: 8,
  ),
  switchTheme: SwitchThemeData(
    thumbColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? kOcean : Colors.grey.shade400),
    trackColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? kOcean.withOpacity(0.3) : Colors.grey.shade200),
  ),
);
