import { useAuth } from "@/util/auth";
import { Link } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth()!;

  return (
    <KeyboardAvoidingView>
      <View>
        <Text variant="displaySmall">Login Here!</Text>
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
        <Button onPress={() => login(email, password)}>Login</Button>
        <Link replace href="/sign-up">
          Don't have an account? Sign up here
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}
