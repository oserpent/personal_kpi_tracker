import { useAuth } from "@/util/auth";
import { View } from "react-native";
import { Button, Text } from "react-native-paper";

export default function Index() {
  const { signOut } = useAuth()!;

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Edit app/index.tsx to edit this screen.</Text>
      <Button onPress={signOut}>Sign Out</Button>
    </View>
  );
}
