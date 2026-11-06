import 'package:flutter/material.dart';

// Colors copied from the web app (frontend/src/index.css)
class AppColors {
  static const felt = Color(0xFF255D36);
  static const feltDark = Color(0xFF1B4628);
  static const chalk = Color(0xFFE6E6E6);
  static const gold = Color(0xFFF2C14E);
  static const danger = Color(0xFFFFD2CC);
  static const cardBack = Color(0xFFC8261B);
}

final appTheme = ThemeData(
  useMaterial3: true,
  scaffoldBackgroundColor: AppColors.felt,
  colorScheme: ColorScheme.fromSeed(
    seedColor: AppColors.felt,
    brightness: Brightness.dark,
    primary: AppColors.gold,
  ),
  textTheme: ThemeData.dark().textTheme.apply(
    bodyColor: AppColors.chalk,
    displayColor: AppColors.chalk,
  ),
  inputDecorationTheme: InputDecorationTheme(
    filled: true,
    fillColor: AppColors.feltDark,
    border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
  ),
  filledButtonTheme: FilledButtonThemeData(
    style: FilledButton.styleFrom(
      backgroundColor: AppColors.gold,
      foregroundColor: Colors.black87,
      minimumSize: const Size.fromHeight(48),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
    ),
  ),
);