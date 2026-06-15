class AppConstants {
  static const String baseUrl = 'https://quickride-api.onrender.com';
  static const String tokenKey = 'token';
  static const String userTypeKey = 'userType'; // 'user' or 'captain'
}

class VehicleTypeInfo {
  final String id;
  final String label;
  final String icon;
  final String description;
  final int capacity;
  final int basefare;
  final int perKm;
  const VehicleTypeInfo({
    required this.id,
    required this.label,
    required this.icon,
    required this.description,
    required this.capacity,
    required this.basefare,
    required this.perKm,
  });
}

class BikeType {
  static const String standard = 'motorcycle';

  static const List<VehicleTypeInfo> all = [
    VehicleTypeInfo(id: 'motorcycle', label: 'Motorcycle', icon: '🏍️', description: 'Fast & affordable', capacity: 1, basefare: 50, perKm: 15),
  ];
}

class CarType {
  static const List<VehicleTypeInfo> all = [
    VehicleTypeInfo(id: 'car', label: 'Car', icon: '🚗', description: 'Comfortable ride', capacity: 4, basefare: 150, perKm: 30),
    VehicleTypeInfo(id: 'auto', label: 'Auto', icon: '🛺', description: 'Budget-friendly', capacity: 3, basefare: 80, perKm: 20),
  ];
}

class AllVehicleTypes {
  static final List<VehicleTypeInfo> _all = [...BikeType.all, ...CarType.all];

  static VehicleTypeInfo? findById(String id) {
    try {
      return _all.firstWhere((t) => t.id == id);
    } catch (_) {
      return null;
    }
  }
}
