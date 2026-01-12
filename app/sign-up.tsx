import { useAuth } from "@/util/auth";
import { Link } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";

export default function signUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signUp } = useAuth()!;

  return (
    <KeyboardAvoidingView>
      <View>
        <Text variant="displaySmall">Sign Up Here!</Text>
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
        <Button onPress={() => signUp(email, password)}>Sign Up</Button>
        <Link replace href="/login">
          Already have an account? Log in here
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}
