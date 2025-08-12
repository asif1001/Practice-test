// src/pages/Home.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Flex,
  Avatar,
  Progress,
  Badge,
  VStack,
  Select,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  useToast,
} from "@chakra-ui/react";
import { auth, db } from "../firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  collectionGroup,
} from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate } from "react-router-dom";

type FSTimestamp = { toMillis: () => number };

interface Attempt {
  subject: string;
  module: string;
  score: number;
  total: number;
  timeTaken: number;
  timestamp: FSTimestamp;
}

const Home: React.FC = () => {
  const [user] = useAuthState(auth);
  const [userData, setUserData] = useState<any>(null);

  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [subjectsFromAttempts, setSubjectsFromAttempts] = useState<string[]>([]);
  const [allSubjects, setAllSubjects] = useState<string[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);

  const [subject, setSubject] = useState("");
  const navigate = useNavigate();
  const toast = useToast();

  // 1) Load user profile
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.uid) return;
      try {
        const userRef = doc(db, "userDetails", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) setUserData(userSnap.data());
      } catch (e) {
        console.error("profile load error:", e);
      }
    };
    fetchUserData();
  }, [user]);

  // 2) Load attempts for this user
  useEffect(() => {
    const fetchAttempts = async () => {
      if (!user?.uid) return;
      try {
        const attemptsRef = collection(db, "userAttempts");
        const q = query(attemptsRef, where("userId", "==", user.uid));
        const snapshot = await getDocs(q);
        const data: Attempt[] = snapshot.docs.map((d) => d.data() as Attempt);
        setAttempts(data);
        setSubjectsFromAttempts(Array.from(new Set(data.map((a) => a.subject))));
      } catch (e) {
        console.error("attempts load error:", e);
      }
    };
    fetchAttempts();
  }, [user]);

  // 3) Load ALL subjects by scanning every `questions` subcollection
  useEffect(() => {
    const fetchAllSubjects = async () => {
      setLoadingSubjects(true);
      try {
        const snap = await getDocs(collectionGroup(db, "questions"));
        const subjects = new Set<string>();
        snap.forEach((docSnap) => {
          const subjectId = docSnap.ref.parent.parent?.id; // quizzes/{subject}/questions/{qid}
          const fallback = (docSnap.data() as any)?.subject;
          if (subjectId) subjects.add(subjectId);
          else if (fallback) subjects.add(String(fallback));
        });
        const arr = Array.from(subjects).sort();
        setAllSubjects(arr);
        if (arr.length === 0) {
          toast({
            title: "No subjects found",
            description: "Ask an admin to add questions under quizzes/{subject}/questions",
            status: "info",
          });
        }
      } catch (e) {
        console.error("subjects load error:", e);
        toast({
          title: "Failed to load subjects",
          status: "error",
        });
      } finally {
        setLoadingSubjects(false);
      }
    };
    fetchAllSubjects();
  }, [toast]);

  // Union: show everything available (even if user never attempted it)
  const subjectsForDropdown = useMemo(
    () => Array.from(new Set([...allSubjects, ...subjectsFromAttempts])).sort(),
    [allSubjects, subjectsFromAttempts]
  );

  const handleStartTest = () => {
    if (subject) navigate(`/test?subject=${encodeURIComponent(subject)}`);
  };

  // Build results table for subjects the user has actually attempted
  const subjectResults = useMemo(() => {
    return subjectsFromAttempts.map((subj) => {
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
  }, [attempts, subjectsFromAttempts]);

  return (
    <Box maxW="1200px" mx="auto" p={6}>
      <Flex align="center" mb={6}>
        <Avatar size="lg" name={userData?.fullName} mr={4} />
        <Box>
          <Heading size="lg">Welcome back, {userData?.fullName || "User"} 👋</Heading>
          <Text color="gray.600">Ready to level up your skills?</Text>
        </Box>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={8}>
        <Stat p={4} shadow="md" border="1px solid #eee" borderRadius="xl">
          <StatLabel>XP</StatLabel>
          <StatNumber>{userData?.xp || 0}</StatNumber>
          <StatHelpText>Keep growing!</StatHelpText>
        </Stat>
        <Stat p={4} shadow="md" border="1px solid #eee" borderRadius="xl">
          <StatLabel>Quizzes Taken</StatLabel>
          <StatNumber>{attempts.length}</StatNumber>
        </Stat>
        <Stat p={4} shadow="md" border="1px solid #eee" borderRadius="xl">
          <StatLabel>Level</StatLabel>
          <StatNumber>
            <Badge colorScheme="purple" fontSize="1em">
              {userData?.level || "Beginner"}
            </Badge>
          </StatNumber>
        </Stat>
      </SimpleGrid>

      <Box mb={8}>
        <Text fontWeight="bold" mb={2}>
          Progress
        </Text>
        <Progress
          value={userData?.xpPercent ?? 30}
          size="lg"
          colorScheme="blue"
          borderRadius="full"
        />
      </Box>

      <VStack align="start" spacing={4} mb={8}>
        <Heading size="md">Start a Practice Test</Heading>

        <Select
          placeholder={
            loadingSubjects
              ? "Loading subjects..."
              : subjectsForDropdown.length
              ? "Select Subject"
              : "No subjects available"
          }
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          maxW="400px"
          isDisabled={loadingSubjects || subjectsForDropdown.length === 0}
        >
          {subjectsForDropdown.map((subj) => (
            <option key={subj} value={subj}>
              {subj}
            </option>
          ))}
        </Select>

        <Button colorScheme="green" onClick={handleStartTest} isDisabled={!subject}>
          Start Test
        </Button>
      </VStack>

      {subjectResults.length > 0 && (
        <Box>
          <Heading size="md" mb={4}>
            Your Results by Subject
          </Heading>
          <TableContainer>
            <Table variant="striped" colorScheme="teal">
              <Thead>
                <Tr>
                  <Th>Subject</Th>
                  <Th>Latest Score</Th>
                  <Th>Attempts</Th>
                  <Th>Avg Score</Th>
                  <Th>Last Attempt</Th>
                </Tr>
              </Thead>
              <Tbody>
                {subjectResults.map((res) =>
                  res.latest ? (
                    <Tr key={res.subject}>
                      <Td>{res.subject}</Td>
                      <Td>
                        {res.latest.score}/{res.latest.total}
                      </Td>
                      <Td>{res.totalAttempts}</Td>
                      <Td>{res.avgScore}</Td>
                      <Td>
                        {new Date(res.latest.timestamp.toMillis()).toLocaleString()}
                      </Td>
                    </Tr>
                  ) : null
                )}
              </Tbody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  );
};

export default Home;
