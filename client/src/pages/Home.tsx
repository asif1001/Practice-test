import React, { useEffect, useState } from "react";
import {
  Box,
  Heading,
  Text,
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
  Flex,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
  Spinner,
} from "@chakra-ui/react";
import { auth, db } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  orderBy,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

interface Attempt {
  subject: string;
  module: string;
  score: number;
  date: string;
}

const Home: React.FC = () => {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();

  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!user) return;

    const fetchSubjectsAndAttempts = async () => {
      try {
        const subjectsSnapshot = await getDocs(collection(db, "subjects"));
        const subjectList: string[] = [];
        subjectsSnapshot.forEach((doc) => {
          subjectList.push(doc.id);
        });
        setAvailableSubjects(subjectList);
        setSelectedSubject(subjectList[0] || "");

        const attemptsRef = collection(db, "attempts");
        const attemptsQuery = query(
          attemptsRef,
          where("userId", "==", user.uid),
          orderBy("date", "desc")
        );
        const snapshot = await getDocs(attemptsQuery);
        const fetchedAttempts: Attempt[] = snapshot.docs.map((doc) => ({
          ...doc.data(),
        })) as Attempt[];
        setAttempts(fetchedAttempts);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubjectsAndAttempts();
  }, [user]);

  const handleStartTest = () => {
    if (selectedSubject) {
      navigate(`/test/${selectedSubject}`);
    }
  };

  if (!user) return <Text>Please login to access the dashboard.</Text>;
  if (loading) return <Spinner size="xl" />;

  return (
    <Box p={6}>
      <Heading size="lg" mb={4}>
        Welcome to Your Dashboard
      </Heading>

      <Box mb={6}>
        <Text fontSize="lg" fontWeight="semibold">
          Select Subject to Start New Test
        </Text>
        <Flex gap={4} mt={2} align="center">
          <Select
            placeholder="Select Subject"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            maxW="300px"
          >
            {availableSubjects.map((subj) => (
              <option key={subj} value={subj}>
                {subj}
              </option>
            ))}
          </Select>
          <Button colorScheme="teal" onClick={handleStartTest}>
            Start Test
          </Button>
        </Flex>
      </Box>

      <Box>
        <Heading size="md" mb={3}>
          Your Recent Test Attempts
        </Heading>
        {attempts.length === 0 ? (
          <Text>No attempts yet.</Text>
        ) : (
          <TableContainer>
            <Table variant="simple" size="md">
              <Thead>
                <Tr>
                  <Th>Subject</Th>
                  <Th>Module</Th>
                  <Th>Score</Th>
                  <Th>Date</Th>
                </Tr>
              </Thead>
              <Tbody>
                {attempts.map((attempt, index) => (
                  <Tr key={index}>
                    <Td>{attempt.subject}</Td>
                    <Td>{attempt.module}</Td>
                    <Td>{attempt.score}%</Td>
                    <Td>{new Date(attempt.date).toLocaleString()}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Box>
  );
};

export default Home;
