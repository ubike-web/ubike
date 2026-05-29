import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';
import '../../../core/theme.dart';
import '../../../core/api_client.dart';

class DestinationSearchScreen extends ConsumerStatefulWidget {
  const DestinationSearchScreen({super.key, this.vehicleType = 'standard', this.scheduled = false});
  final String vehicleType;
  final bool scheduled;
  @override
  ConsumerState<DestinationSearchScreen> createState() => _DestinationSearchScreenState();
}

class _DestinationSearchScreenState extends ConsumerState<DestinationSearchScreen> {
  final _pickupCtrl = TextEditingController(text: 'Current Location');
  final _dropoffCtrl = TextEditingController();
  final _dropoffFocus = FocusNode();
  List<Map<String, dynamic>> _suggestions = [];
  bool _searching = false;
  String? _vehicleType;
  DateTime? _scheduledAt;

  // Saved places (hardcoded for demo, would come from user profile)
  final _saved = [
    {'label': 'Home', 'icon': Icons.home_outlined, 'address': ''},
    {'label': 'Work', 'icon': Icons.work_outline, 'address': ''},
  ];

  final _recent = [
    'Westlands, Nairobi',
    'JKIA Airport',
    'CBD - Tom Mboya Street',
    'Karen Shopping Centre',
  ];

  @override
  void initState() {
    super.initState();
    _vehicleType = widget.vehicleType;
    WidgetsBinding.instance.addPostFrameCallback((_) => _dropoffFocus.requestFocus());
  }

  @override
  void dispose() { _pickupCtrl.dispose(); _dropoffCtrl.dispose(); _dropoffFocus.dispose(); super.dispose(); }

  Future<void> _search(String query) async {
    if (query.length < 3) { setState(() => _suggestions = []); return; }
    setState(() => _searching = true);
    await Future.delayed(const Duration(milliseconds: 400)); // debounce
    // In production: call ORS geocode API
    setState(() {
      _searching = false;
      _suggestions = [
        {'name': query, 'address': 'Nairobi, Kenya', 'lat': -1.2921, 'lng': 36.8219},
      ];
    });
  }

  void _selectDestination(String name, double lat, double lng) {
    context.push('/rides/preview', extra: {
      'pickupAddress': _pickupCtrl.text,
      'pickupLat': -1.2921,
      'pickupLng': 36.8219,
      'dropoffAddress': name,
      'dropoffLat': lat,
      'dropoffLng': lng,
      'vehicleType': _vehicleType,
      'scheduledAt': _scheduledAt?.toIso8601String(),
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kCharcoal,
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
              child: Column(children: [
                // Pickup
                _LocationField(
                  controller: _pickupCtrl,
                  hint: 'Pickup location',
                  dotColor: kGold,
                  readOnly: false,
                ),
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 4, horizontal: 20),
                  child: Row(children: [
                    SizedBox(width: 10, child: VerticalDivider(color: kBorder, thickness: 1, endIndent: 0)),
                  ]),
                ),
                // Dropoff
                _LocationField(
                  controller: _dropoffCtrl,
                  hint: 'Where to?',
                  dotColor: kSienna,
                  focusNode: _dropoffFocus,
                  onChanged: _search,
                ),
                const SizedBox(height: 12),

                // Vehicle type selector
                Row(children: [
                  _VehicleChip(label: 'Standard', icon: Icons.electric_moped, selected: _vehicleType == 'standard', onTap: () => setState(() => _vehicleType = 'standard')),
                  const SizedBox(width: 8),
                  _VehicleChip(label: 'Electric', icon: Icons.electric_bolt, selected: _vehicleType == 'electric', onTap: () => setState(() => _vehicleType = 'electric')),
                  const Spacer(),
                  // Schedule
                  if (widget.scheduled || _scheduledAt != null)
                    TextButton.icon(
                      onPressed: _pickSchedule,
                      icon: const Icon(Icons.schedule, size: 16),
                      label: Text(_scheduledAt == null ? 'Schedule' : '${_scheduledAt!.hour}:${_scheduledAt!.minute.toString().padLeft(2, '0')}'),
                    ),
                ]),
              ]),
            ),

            const Divider(height: 1),

            Expanded(
              child: _dropoffCtrl.text.isEmpty
                ? _QuickSelectList(saved: _saved, recent: _recent, onSelect: (addr) {
                    _dropoffCtrl.text = addr;
                    _selectDestination(addr, -1.3031, 36.8082);
                  })
                : _SuggestionList(
                    suggestions: _suggestions,
                    loading: _searching,
                    onSelect: (s) => _selectDestination(s['name'] as String, (s['lat'] as num).toDouble(), (s['lng'] as num).toDouble()),
                  ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _pickSchedule() async {
    final now = DateTime.now();
    final date = await showDatePicker(context: context, initialDate: now, firstDate: now, lastDate: now.add(const Duration(days: 30)));
    if (date == null || !mounted) return;
    final time = await showTimePicker(context: context, initialTime: TimeOfDay.now());
    if (time == null || !mounted) return;
    setState(() => _scheduledAt = DateTime(date.year, date.month, date.day, time.hour, time.minute));
  }
}

class _LocationField extends StatelessWidget {
  const _LocationField({required this.controller, required this.hint, required this.dotColor, this.focusNode, this.onChanged, this.readOnly = false});
  final TextEditingController controller;
  final String hint;
  final Color dotColor;
  final FocusNode? focusNode;
  final ValueChanged<String>? onChanged;
  final bool readOnly;

  @override
  Widget build(BuildContext context) => Row(children: [
    Container(width: 12, height: 12, decoration: BoxDecoration(color: dotColor, shape: BoxShape.circle, border: Border.all(color: Colors.white, width: 2))),
    const SizedBox(width: 12),
    Expanded(child: TextField(
      controller: controller,
      focusNode: focusNode,
      readOnly: readOnly,
      onChanged: onChanged,
      style: const TextStyle(color: kCream, fontSize: 15),
      decoration: InputDecoration(
        hintText: hint,
        border: InputBorder.none,
        enabledBorder: InputBorder.none,
        focusedBorder: InputBorder.none,
        contentPadding: EdgeInsets.zero,
        isDense: true,
      ),
    )),
    if (controller.text.isNotEmpty) IconButton(
      icon: const Icon(Icons.clear, color: kSubtext, size: 18),
      onPressed: () { controller.clear(); },
    ),
  ]);
}

class _VehicleChip extends StatelessWidget {
  const _VehicleChip({required this.label, required this.icon, required this.selected, required this.onTap});
  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
      decoration: BoxDecoration(
        color: selected ? kGold.withOpacity(0.15) : kCharcoalLight,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: selected ? kGold : kBorder),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(icon, color: selected ? kGold : kSubtext, size: 16),
        const SizedBox(width: 5),
        Text(label, style: TextStyle(color: selected ? kGold : kSubtext, fontSize: 13, fontWeight: FontWeight.w500)),
      ]),
    ),
  );
}

class _QuickSelectList extends StatelessWidget {
  const _QuickSelectList({required this.saved, required this.recent, required this.onSelect});
  final List<Map<String, dynamic>> saved;
  final List<String> recent;
  final ValueChanged<String> onSelect;

  @override
  Widget build(BuildContext context) => ListView(padding: const EdgeInsets.all(16), children: [
    // Saved
    const Text('Saved Places', style: TextStyle(color: kSubtext, fontSize: 12, fontWeight: FontWeight.w600)),
    const SizedBox(height: 8),
    ...saved.map((s) => ListTile(
      leading: Container(width: 36, height: 36, decoration: BoxDecoration(color: kGold.withOpacity(0.1), shape: BoxShape.circle), child: Icon(s['icon'] as IconData, color: kGold, size: 20)),
      title: Text(s['label'] as String, style: const TextStyle(color: kCream)),
      subtitle: Text((s['address'] as String).isEmpty ? 'Tap to set' : s['address'] as String, style: const TextStyle(color: kSubtext, fontSize: 12)),
      onTap: () { if ((s['address'] as String).isNotEmpty) onSelect(s['address'] as String); },
      contentPadding: EdgeInsets.zero,
    )),
    const SizedBox(height: 16),
    const Text('Recent', style: TextStyle(color: kSubtext, fontSize: 12, fontWeight: FontWeight.w600)),
    const SizedBox(height: 8),
    ...recent.map((r) => ListTile(
      leading: const Icon(Icons.history, color: kSubtext, size: 20),
      title: Text(r, style: const TextStyle(color: kCream, fontSize: 14)),
      onTap: () => onSelect(r),
      contentPadding: EdgeInsets.zero,
    )),
  ]);
}

class _SuggestionList extends StatelessWidget {
  const _SuggestionList({required this.suggestions, required this.loading, required this.onSelect});
  final List<Map<String, dynamic>> suggestions;
  final bool loading;
  final ValueChanged<Map<String, dynamic>> onSelect;

  @override
  Widget build(BuildContext context) {
    if (loading) return const Center(child: CircularProgressIndicator(color: kGold));
    if (suggestions.isEmpty) return const Center(child: Text('Type to search for a destination', style: TextStyle(color: kSubtext)));
    return ListView.builder(
      padding: const EdgeInsets.all(8),
      itemCount: suggestions.length,
      itemBuilder: (_, i) {
        final s = suggestions[i];
        return ListTile(
          leading: const Icon(Icons.location_on_outlined, color: kGold),
          title: Text(s['name'] as String, style: const TextStyle(color: kCream)),
          subtitle: Text(s['address'] as String, style: const TextStyle(color: kSubtext, fontSize: 12)),
          onTap: () => onSelect(s),
        );
      },
    );
  }
}
