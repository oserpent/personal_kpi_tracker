import { useState } from "react";
import { KeyboardAvoidingView, View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleAuth = async (email, password) => {
    // handle auth
    return;
  };

  return (
    <KeyboardAvoidingView>
      <View>
        <Text variant="displaySmall">Sign In Here!</Text>
        <TextInput
          label="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="test@test.com"
          mode="outlined"
          onChangeText={(newEmail) => setEmail(newEmail)}
        />
        <TextInput
          label="password"
          autoCapitalize="none"
          mode="outlined"
          secureTextEntry
          onChangeText={(newPassword) => setPassword(newPassword)}
        />
        <Button onPress={() => handleAuth(email, password)}>Sign In</Button>
      </View>
    </KeyboardAvoidingView>
  );
}
