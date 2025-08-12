// src/pages/Home.tsx

import React, { useEffect, useState } from "react";
import {
  Box,
  Heading,
  Text,
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
  Spinner,
} from "@chakra-ui/react";
import { auth, db } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  collection,
  getDocs,
  query,
  where,
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

  const [subjects, setSubjects] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        // Load subjects
        const subjectSnapshot = await getDocs(collection(db, "subjects"));
        const subjectList: string[] = [];
        subjectSnapshot.forEach((doc) => {
          subjectList.push(doc.id);
        });

        console.log("Fetched subjects:", subjectList);
        setSubjects(subjectList);
        setSelectedSubject(subjectList[0] || "");

        // Load attempts
        const attemptsQuery = query(
          collection(db, "attempts"),
          where("userId", "==", user.uid),
          orderBy("date", "desc")
        );
        const attemptsSnapshot = await getDocs(attemptsQuery);
        const userAttempts: Attempt[] = attemptsSnapshot.docs.map((doc) => ({
          ...doc.data(),
        })) as Attempt[];
        setAttempts(userAttempts);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const handleStartTest = () => {
    if (selectedSubject) {
      navigate(`/test/${selectedSubject}`);
    }
  };

  if (!user) return <Text>Please login to continue.</Text>;
  if (loading) return <Spinner size="xl" thickness="4px" speed="0.65s" />;

  return (
    <Box p={6}>
      <Heading size="lg" mb={4}>
        Welcome to Your CSCP Practice Dashboard
      </Heading>

      <Box mb={6}>
        <Text fontWeight="semibold" fontSize="lg" mb={2}>
          Choose a Subject to Start a Test
        </Text>
        {subjects.length > 0 ? (
          <Flex gap={4} align="center">
            <Select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              maxW="300px"
              placeholder="Select Subject"
            >
              {subjects.map((subj) => (
                <option key={subj} value={subj}>
                  {subj}
                </option>
              ))}
            </Select>
            <Button colorScheme="teal" onClick={handleStartTest}>
              Start Test
            </Button>
          </Flex>
        ) : (
          <Text color="red.500">No subjects available. Please contact admin.</Text>
        )}
      </Box>

      <Box>
        <Heading size="md" mb={3}>
          Your Recent Test Attempts
        </Heading>
        {attempts.length === 0 ? (
          <Text>No test attempts found.</Text>
        ) : (
          <TableContainer>
            <Table size="md" variant="striped">
              <Thead>
                <Tr>
                  <Th>Subject</Th>
                  <Th>Module</Th>
                  <Th>Score</Th>
                  <Th>Date</Th>
                </Tr>
              </Thead>
              <Tbody>
                {attempts.map((attempt, i) => (
                  <Tr key={i}>
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

