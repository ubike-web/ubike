import 'package:flutter/material.dart';

class AuthLabel extends StatelessWidget {
  final String text;
  const AuthLabel(this.text, {super.key});
  @override
  Widget build(BuildContext context) =>
      Text(text, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14));
}

class AuthInput extends StatelessWidget {
  final TextEditingController controller;
  final String hint;
  final TextInputType type;
  const AuthInput({super.key, required this.controller, required this.hint, this.type = TextInputType.text});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(top: 4, bottom: 4),
      child: TextField(
        controller: controller,
        keyboardType: type,
        style: const TextStyle(fontSize: 14),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: const TextStyle(color: Colors.black38, fontSize: 14),
          filled: true,
          fillColor: const Color(0xFFF4F4F5),
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
        ),
      ),
    );
  }
}

class AuthPasswordInput extends StatelessWidget {
  final TextEditingController controller;
  final bool obscure;
  final VoidCallback onToggle;
  const AuthPasswordInput({super.key, required this.controller, required this.obscure, required this.onToggle});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(top: 4, bottom: 4),
      child: TextField(
        controller: controller,
        obscureText: obscure,
        style: const TextStyle(fontSize: 14),
        decoration: InputDecoration(
          hintText: 'Password',
          hintStyle: const TextStyle(color: Colors.black38, fontSize: 14),
          filled: true,
          fillColor: const Color(0xFFF4F4F5),
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
          suffixIcon: IconButton(
            icon: Icon(obscure ? Icons.visibility_off : Icons.visibility, size: 18, color: Colors.black54),
            onPressed: onToggle,
          ),
        ),
      ),
    );
  }
}

class AuthButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final Color color;
  const AuthButton({super.key, required this.label, this.onPressed, this.color = Colors.black});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: color,
          foregroundColor: Colors.white,
          disabledBackgroundColor: color.withValues(alpha: 0.75),
          disabledForegroundColor: Colors.white70,
          padding: const EdgeInsets.symmetric(vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          elevation: 0,
        ),
        child: Text(label, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
      ),
    );
  }
}
