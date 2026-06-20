import { Redirect } from "expo-router";

/** Default entry — AuthGate routes signed-in users to tabs/provider. */
export default function Index() {
  return <Redirect href="/(auth)/language" />;
}
