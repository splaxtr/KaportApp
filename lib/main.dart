import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'firebase_options.dart';
import 'screens/add_vehicle_screen.dart';
import 'screens/admin_dashboard_screen.dart';
import 'screens/assign_employee_screen.dart';
import 'screens/employee_dashboard_screen.dart';
import 'screens/home_screen.dart';
import 'screens/owner_dashboard_screen.dart';
import 'screens/login_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/register_screen.dart';
import 'screens/shop_users_screen.dart';
import 'screens/vehicle_list_screen.dart';
import 'state/user_session.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  runApp(const ProviderScope(child: KaportApp()));
}

class KaportApp extends ConsumerWidget {
  const KaportApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(userSessionProvider);

    return MaterialApp(
      debugShowCheckedModeBanner: false,
      home: session.when(
        data: (user) {
          if (user == null) {
            return const LoginScreen();
          }
          if (user.role == 'admin') {
            return const AdminDashboardScreen();
          }
          if (user.role == 'owner') {
            return const OwnerDashboardScreen();
          }
          if (user.role == 'employee') {
            return const EmployeeDashboardScreen();
          }
          return const HomeScreen();
        },
        error: (error, _) =>
            Scaffold(body: Center(child: Text('Hata: $error'))),
        loading: () => const Scaffold(
          body: Center(child: CircularProgressIndicator()),
        ),
      ),
      routes: {
        LoginScreen.routeName: (context) => const LoginScreen(),
        RegisterScreen.routeName: (context) => const RegisterScreen(),
        HomeScreen.routeName: (context) => const HomeScreen(),
        AdminDashboardScreen.routeName: (context) =>
            const AdminDashboardScreen(),
        OwnerDashboardScreen.routeName: (context) =>
            const OwnerDashboardScreen(),
        EmployeeDashboardScreen.routeName: (context) =>
            const EmployeeDashboardScreen(),
        ShopUsersScreen.routeName: (context) => const ShopUsersScreen(),
        AddVehicleScreen.routeName: (context) => const AddVehicleScreen(),
        VehicleListScreen.routeName: (context) => const VehicleListScreen(),
        ProfileScreen.routeName: (context) => const ProfileScreen(),
        AssignEmployeeScreen.routeName: (context) =>
            const AssignEmployeeScreen(),
      },
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.orange),
        useMaterial3: true,
      ),
    );
  }
}
