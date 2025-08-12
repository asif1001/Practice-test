// ✅ Redesigned Login.tsx: cleaner UI with modern layout + password reset
import React, { useState } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  useToast,
  Text,
  Flex,
  Divider,
  Link as ChakraLink,
} from "@chakra-ui/react";
import {
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import type { FirebaseError } from "firebase/app";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const handleLogin = async () => {
    const e = email.trim();
    const p = password;

    if (!e || !p) {
      toast({ title: "Enter email and password", status: "warning", isClosable: true });
      return;
    }

    setLoading(true);

    // ✅ Step 1: Hardcoded admin login
    if (e === "asif1001@gmail.com" && p === "12345678") {
      toast({ title: "Admin login successful.", status: "success", isClosable: true });
      setLoading(false);
      navigate("/admin/dashboard");
      return;
    }

    try {
      // Keep user signed in on browser refresh
      await setPersistence(auth, browserLocalPersistence);

      // ✅ Step 2: Firebase login
      const userCredential = await signInWithEmailAndPassword(auth, e, p);
      const uid = userCredential.user.uid;

      const userDoc = await getDoc(doc(db, "userDetails", uid));
      if (userDoc.exists()) {
        toast({ title: "Login successful.", status: "success", isClosable: true });
        navigate("/home");
      } else {
        toast({
          title: "Profile incomplete.",
          description: "Redirecting to registration.",
          status: "info",
          isClosable: true,
        });
        navigate("/register");
      }
    } catch (err) {
      const fe = err as FirebaseError;
      toast({
        title: "Login failed.",
        description: fe.code || fe.message,
        status: "error",
        isClosable: true,
      });
      console.error("LOGIN ERROR:", fe.code, fe.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!email) {
      toast({ title: "Enter your email to reset password", status: "warning", isClosable: true });
      return;
    }
    setResetting(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      toast({
        title: "Password reset email sent.",
        description: "Check your inbox for reset instructions.",
        status: "success",
        isClosable: true,
      });
    } catch (err) {
      const fe = err as FirebaseError;
      toast({
        title: "Error sending reset email.",
        description: fe.code || fe.message,
        status: "error",
        isClosable: true,
      });
    } finally {
      setResetting(false);
    }
  };

  return (
    <Flex align="center" justify="center" height="100vh" bg="gray.100">
      <Box p={10} maxW="400px" w="full" borderRadius="xl" bg="white" boxShadow="xl">
        <VStack spacing={4} align="stretch">
          <Heading size="lg" textAlign="center">Sign In</Heading>

          <FormControl isRequired>
            <FormLabel>Email</FormLabel>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Password</FormLabel>
            <Input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </FormControl>

          {/* Forgot password link */}
          <ChakraLink
            onClick={resetting ? undefined : handleReset}
            textAlign="center"
            color="blue.500"
            cursor="pointer"
            aria-disabled={resetting}
            pointerEvents={resetting ? "none" : "auto"}
            opacity={resetting ? 0.6 : 1}
          >
            {resetting ? "Sending reset email…" : "Forgot password?"}
          </ChakraLink>

          <Button colorScheme="blue" w="full" onClick={handleLogin} mt={2} isLoading={loading}>
            Sign In
          </Button>

          <Divider />

          <Text textAlign="center">
            Don&apos;t have an account?{" "}
            <Link to="/register" style={{ color: "#3182CE", fontWeight: 600 }}>
              Create one
            </Link>
          </Text>
        </VStack>
      </Box>
    </Flex>
  );
};

export default Login;
