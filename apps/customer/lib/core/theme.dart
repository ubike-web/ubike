import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

// ─── U-bike Ocean Blue Brand Colors ─────────────────────────────────────────
const kOcean = Color(0xFF0E86CA);        // Primary ocean blue
const kOceanDeep = Color(0xFF0A2D6E);   // Deep navy
const kOceanMid = Color(0xFF1A7BB5);    // Mid ocean
const kOceanLight = Color(0xFF42C8F5);  // Cyan highlight
const kOceanPale = Color(0xFFE3F4FD);   // Very light blue tint
const kGreenLeaf = Color(0xFF4CAF50);   // Leaf green accent
const kWhite = Color(0xFFFFFFFF);
const kSurface = Color(0xFFF5FAFF);     // Off-white with blue tint
const kDark = Color(0xFF0A1A3E);        // Dark navy text
const kGrey = Color(0xFF6B7A8D);        // Secondary text
const kLightGrey = Color(0xFFDDE8F0);  // Borders
const kError = Color(0xFFD32F2F);
const kSuccess = Color(0xFF2E7D32);
const kWarning = Color(0xFFF57C00);

// Gradient used on splash/hero areas
const kOceanGradient = LinearGradient(
  colors: [kOceanDeep, kOcean, kOceanLight],
  begin: Alignment.topLeft,
  end: Alignment.bottomRight,
);

ThemeData get ubikeTheme => ThemeData(
  useMaterial3: true,
  brightness: Brightness.light,
  colorScheme: ColorScheme.light(
    primary: kOcean,
    onPrimary: kWhite,
    secondary: kGreenLeaf,
    onSecondary: kWhite,
    tertiary: kOceanDeep,
    onTertiary: kWhite,
    error: kError,
    onError: kWhite,
    surface: kSurface,
    onSurface: kDark,
    surfaceContainerHighest: kOceanPale,
    outline: kLightGrey,
    shadow: Colors.black12,
  ),
  scaffoldBackgroundColor: kWhite,
  appBarTheme: AppBarTheme(
    backgroundColor: kWhite,
    foregroundColor: kDark,
    elevation: 0,
    scrolledUnderElevation: 0.5,
    surfaceTintColor: Colors.transparent,
    shadowColor: Colors.black12,
    systemOverlayStyle: SystemUiOverlayStyle.dark,
    titleTextStyle: GoogleFonts.poppins(
      color: kOcean,
      fontSize: 18,
      fontWeight: FontWeight.w700,
    ),
    iconTheme: const IconThemeData(color: kDark),
  ),
  textTheme: GoogleFonts.poppinsTextTheme().copyWith(
    displayLarge: GoogleFonts.poppins(color: kDark, fontWeight: FontWeight.w800, fontSize: 32),
    displayMedium: GoogleFonts.poppins(color: kDark, fontWeight: FontWeight.w700, fontSize: 28),
    headlineLarge: GoogleFonts.poppins(color: kDark, fontWeight: FontWeight.w700, fontSize: 24),
    headlineMedium: GoogleFonts.poppins(color: kDark, fontWeight: FontWeight.w600, fontSize: 20),
    headlineSmall: GoogleFonts.poppins(color: kDark, fontWeight: FontWeight.w600, fontSize: 18),
    titleLarge: GoogleFonts.poppins(color: kDark, fontWeight: FontWeight.w600, fontSize: 16),
    titleMedium: GoogleFonts.poppins(color: kDark, fontWeight: FontWeight.w500, fontSize: 14),
    bodyLarge: GoogleFonts.poppins(color: kDark, fontSize: 16),
    bodyMedium: GoogleFonts.poppins(color: kGrey, fontSize: 14),
    bodySmall: GoogleFonts.poppins(color: kGrey, fontSize: 12),
    labelLarge: GoogleFonts.poppins(color: kWhite, fontWeight: FontWeight.w600, fontSize: 16),
  ),
  elevatedButtonTheme: ElevatedButtonThemeData(
    style: ElevatedButton.styleFrom(
      backgroundColor: kOcean,
      foregroundColor: kWhite,
      minimumSize: const Size(double.infinity, 54),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      textStyle: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 16),
      elevation: 2,
      shadowColor: kOcean.withOpacity(0.4),
    ),
  ),
  outlinedButtonTheme: OutlinedButtonThemeData(
    style: OutlinedButton.styleFrom(
      foregroundColor: kOcean,
      side: const BorderSide(color: kOcean, width: 1.5),
      minimumSize: const Size(double.infinity, 54),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      textStyle: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 16),
    ),
  ),
  textButtonTheme: TextButtonThemeData(
    style: TextButton.styleFrom(
      foregroundColor: kOcean,
      textStyle: GoogleFonts.poppins(fontWeight: FontWeight.w500, fontSize: 14),
    ),
  ),
  inputDecorationTheme: InputDecorationTheme(
    filled: true,
    fillColor: kSurface,
    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: kLightGrey)),
    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: kLightGrey)),
    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: kOcean, width: 2)),
    errorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: kError)),
    labelStyle: GoogleFonts.poppins(color: kGrey, fontSize: 14),
    hintStyle: GoogleFonts.poppins(color: kGrey.withOpacity(0.7), fontSize: 14),
    prefixIconColor: kOcean,
  ),
  cardTheme: CardTheme(
    color: kWhite,
    elevation: 2,
    shadowColor: kOcean.withOpacity(0.08),
    margin: EdgeInsets.zero,
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: const BorderSide(color: kLightGrey)),
  ),
  bottomNavigationBarTheme: BottomNavigationBarThemeData(
    backgroundColor: kWhite,
    selectedItemColor: kOcean,
    unselectedItemColor: kGrey,
    type: BottomNavigationBarType.fixed,
    elevation: 8,
    selectedLabelStyle: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.w600),
    unselectedLabelStyle: GoogleFonts.poppins(fontSize: 11),
  ),
  dividerTheme: const DividerThemeData(color: kLightGrey, thickness: 1),
  switchTheme: SwitchThemeData(
    thumbColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? kOcean : Colors.grey.shade400),
    trackColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? kOcean.withOpacity(0.35) : Colors.grey.shade200),
  ),
  snackBarTheme: SnackBarThemeData(
    backgroundColor: kOceanDeep,
    contentTextStyle: GoogleFonts.poppins(color: kWhite),
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
    behavior: SnackBarBehavior.floating,
  ),
  bottomSheetTheme: const BottomSheetThemeData(
    backgroundColor: kWhite,
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
    elevation: 8,
  ),
  dialogTheme: DialogTheme(
    backgroundColor: kWhite,
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
    elevation: 8,
  ),
  chipTheme: ChipThemeData(
    backgroundColor: kOceanPale,
    selectedColor: kOcean.withOpacity(0.15),
    labelStyle: GoogleFonts.poppins(color: kDark, fontSize: 12),
    side: const BorderSide(color: kLightGrey),
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
  ),
  floatingActionButtonTheme: const FloatingActionButtonThemeData(
    backgroundColor: kOcean,
    foregroundColor: kWhite,
    elevation: 4,
  ),
);
