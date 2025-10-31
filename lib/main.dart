import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:kaportapp/core/config/firebase_options.dart';
import 'package:kaportapp/core/state/user_session.dart';
import 'package:kaportapp/features/auth/presentation/login_screen.dart';
import 'package:kaportapp/features/auth/presentation/register_screen.dart';
import 'package:kaportapp/features/dashboard/presentation/admin_dashboard_screen.dart';
import 'package:kaportapp/features/dashboard/presentation/employee_dashboard_screen.dart';
import 'package:kaportapp/features/dashboard/presentation/owner_dashboard_screen.dart';
import 'package:kaportapp/features/home/presentation/home_screen.dart';
import 'package:kaportapp/features/part/presentation/manage_part_statuses_screen.dart';
import 'package:kaportapp/features/profile/presentation/profile_screen.dart';
import 'package:kaportapp/features/shop/presentation/shop_users_screen.dart';
import 'package:kaportapp/features/vehicle/presentation/add_vehicle_screen.dart';
import 'package:kaportapp/features/vehicle/presentation/assign_employee_screen.dart';
import 'package:kaportapp/features/vehicle/presentation/vehicle_list_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await dotenv.load(fileName: '.env');
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  runApp(const ProviderScope(child: KaportApp()));
}

class KaportApp extends ConsumerWidget {
  const KaportApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(userSessionProvider);
    final auth = ref.watch(authServiceProvider);

    return MaterialApp(
      debugShowCheckedModeBanner: false,
      home: Builder(
        builder: (context) {
          if (user == null) {
            if (auth.currentUser != null) {
              return const Scaffold(
                body: Center(child: CircularProgressIndicator()),
              );
            }
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
        ManagePartStatusesScreen.routeName: (context) =>
            const ManagePartStatusesScreen(),
      },
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.orange),
        useMaterial3: true,
      ),
    );
  }
}
