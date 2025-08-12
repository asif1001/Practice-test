// src/pages/Home.tsx
import React, { useEffect, useState } from "react";
import {
  Box, Heading, Text, SimpleGrid, Stat, StatLabel, StatNumber, StatHelpText,
  Flex, Avatar, Progress, Badge, VStack, Select, Button,
  Table, Thead, Tbody, Tr, Th, Td, TableContainer
} from "@chakra-ui/react";
import { auth, db } from "../firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate } from "react-router-dom";

interface Attempt {
  subject: string;
  module: string;
  score: number;
  total: number;
  timeTaken: number;
  timestamp: any; // Firestore Timestamp
}

const Home: React.FC = () => {
  const [user] = useAuthState(auth);
  const [userData, setUserData] = useState<any>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [allSubjects, setAllSubjects] = useState<string[]>([]); // All subjects from quizzes
  const [subject, setSubject] = useState("");
  const navigate = useNavigate();

  // 1) Load user profile
  useEffect(() => {
    const fetchUserData = async () => {
      if (user?.uid) {
        const userRef = doc(db, "userDetails", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) setUserData(userSnap.data());
      }
    };
    fetchUserData();
  }, [user]);

  // 2) Load user's attempts (for stats)
  useEffect(() => {
    const fetchAttempts = async () => {
      if (!user?.uid) return;
      const attemptsRef = collection(db, "userAttempts");
      const q = query(attemptsRef, where("userId", "==", user.uid));
      const snapshot = await getDocs(q);
      const data: Attempt[] = snapshot.docs.map((d) => d.data() as Attempt);
      setAttempts(data);
    };
    fetchAttempts();
  }, [user]);

  // 3) Load ALL available subjects from Firestore (quizzes collection)
  useEffect(() => {
    const fetchAllSubjects = async () => {
      try {
        const snap = await getDocs(collection(db, "quizzes"));
        const list = snap.docs.map((d) => d.id);
        setAllSubjects(list);
      } catch (error) {
        console.error("Failed to fetch subjects:", error);
        setAllSubjects([]); // Fallback to empty array
      }
    };
    fetchAllSubjects();
  }, []);

  // Subjects the user has attempted (for results table)
  const subjectsFromAttempts = Array.from(new Set(attempts.map((a) => a.subject)));

  const handleStartTest = () => {
    if (subject) navigate(`/test?subject=${encodeURIComponent(subject)}`);
  };

  // Build results table only for subjects that have attempts
  const subjectResults = subjectsFromAttempts.map((subj) => {
    const subAttempts = attempts.filter((a) => a.subject === subj);
    const latest = [...subAttempts].sort(
      (a, b) => b.timestamp.toMillis() - a.timestamp.toMillis()
    )[0];
    const avgScore =
      subAttempts.length > 0
        ? (subAttempts.reduce((acc, a) => acc + a.score, 0) / subAttempts.length).toFixed(1)
        : "0.0";
    return { subject: subj, latest, avgScore, totalAttempts: subAttempts.length };
  });

  return (
    <Box maxW="1200px" mx="auto" p={6}>
      {/* ... (keep existing UI code until the Select dropdown) ... */}

      <VStack align="start" spacing={4} mb={8}>
        <Heading size="md">Start a Practice Test</Heading>

        <Select
          placeholder={allSubjects.length ? "Select Subject" : "Loading subjects..."}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          maxW="400px"
          isDisabled={allSubjects.length === 0}
        >
          {allSubjects.map((subj) => (
            <option key={subj} value={subj}>
              {subj}
            </option>
          ))}
        </Select>

        <Button colorScheme="green" onClick={handleStartTest} isDisabled={!subject}>
          Start Test
        </Button>
      </VStack>

      {/* ... (rest of the code remains the same) ... */}
    </Box>
  );
};

export default Home;