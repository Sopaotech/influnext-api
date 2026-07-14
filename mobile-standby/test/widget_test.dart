import 'package:flutter_test/flutter_test.dart';
import 'package:influnext_mobile/main.dart';

void main() {
  testWidgets('Boots into Login Screen successfully', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const InflunextApp());

    // Verify that the login screen title and button are displayed.
    expect(find.text('Influnext'), findsOneWidget);
    expect(find.text('Entrar'), findsOneWidget);
  });
}
