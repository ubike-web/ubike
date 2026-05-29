import 'package:intl/intl.dart';

String formatKes(double amount) => 'KES ${NumberFormat('#,##0').format(amount)}';

String formatDate(String iso) {
  final dt = DateTime.tryParse(iso);
  if (dt == null) return iso;
  return DateFormat('dd MMM yyyy, h:mm a').format(dt.toLocal());
}

String formatShortDate(String iso) {
  final dt = DateTime.tryParse(iso);
  if (dt == null) return iso;
  return DateFormat('dd MMM').format(dt.toLocal());
}

String formatDuration(int minutes) {
  if (minutes < 60) return '${minutes} min';
  return '${minutes ~/ 60}h ${minutes % 60}min';
}

String formatDistance(double km) {
  if (km < 1) return '${(km * 1000).round()} m';
  return '${km.toStringAsFixed(1)} km';
}

String timeAgo(String iso) {
  final dt = DateTime.tryParse(iso);
  if (dt == null) return '';
  final diff = DateTime.now().difference(dt.toLocal());
  if (diff.inSeconds < 60) return 'Just now';
  if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
  if (diff.inHours < 24) return '${diff.inHours}h ago';
  return '${diff.inDays}d ago';
}

String capitalizeWords(String s) =>
    s.split('_').map((w) => w.isEmpty ? '' : '${w[0].toUpperCase()}${w.substring(1)}').join(' ');
