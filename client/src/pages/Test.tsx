// src/pages/Test.tsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Heading,
  Stack,
  Text,
  useToast,
  Flex,
  IconButton,
  Switch,
  Icon,
} from "@chakra-ui/react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { collection, getDocs, addDoc, query, where } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { FaPause, FaPlay, FaVolumeUp } from "react-icons/fa";

const speak = (text: string) => {
  if (!("speechSynthesis" in window)) return; // ✅ guard for production
  const synth = window.speechSynthesis;
  const utterance = new SpeechSynthesisUtterance(text);
  synth.speak(utterance);
};

const Test: React.FC = () => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [showFeedback, setShowFeedback] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [timer, setTimer] = useState(0);
  const [searchParams] = useSearchParams();
  const subject = searchParams.get("subject") || "";
  const moduleFilter = searchParams.get("module") || "All Modules";
  const [userId, setUserId] = useState("");
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    const fetchQuestions = async () => {
      const questionsRef = collection(db, `quizzes/${subject}/questions`);
      const q =
        moduleFilter === "All Modules"
          ? questionsRef
          : query(questionsRef, where("module", "==", moduleFilter));
      const snapshot = await getDocs(q);
      let data = snapshot.docs.map((doc) => doc.data());
      data = data.sort(() => Math.random() - 0.5); // shuffle questions
      setQuestions(data);
      setSelectedOptions(Array(data.length).fill(""));
    };
    fetchQuestions();
  }, [subject, moduleFilter]);

  useEffect(() => {
    let interval: any;
    if (!isPaused) {
      interval = setInterval(() => setTimer((prev) => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isPaused]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setUserId(user.uid);
    });
    return () => unsubscribe();
  }, []);

  const currentQuestion = questions[currentQuestionIndex];
  const optionLetters = ["A", "B", "C", "D"];
  const selectedOption = selectedOptions[currentQuestionIndex];
  const isCorrect = selectedOption === currentQuestion?.correctAnswer;

  const handleOptionClick = (value: string) => {
    if (!selectedOption) {
      const newSelections = [...selectedOptions];
      newSelections[currentQuestionIndex] = value;
      setSelectedOptions(newSelections);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      finishTest();
    }
  };

  const finishTest = async () => {
    const correctCount = questions.filter(
      (q, i) => selectedOptions[i] === q.correctAnswer
    ).length;

    if (userId) {
      await addDoc(collection(db, "userAttempts"), {
        userId,
        subject,
        module: moduleFilter,
        score: correctCount,
        total: questions.length,
        timeTaken: timer,
        timestamp: new Date(),
      });
    }

    toast({
      title: `Test completed! Score: ${correctCount}/${questions.length}`,
      status: "success",
    });
    navigate("/home");
  };

  // ✅ TS-friendly icon components for Chakra Icon "as"
  const PlayPauseIconComp =
    (isPaused ? FaPlay : FaPause) as unknown as React.ElementType;
  const VolumeIconComp = FaVolumeUp as unknown as React.ElementType;

  return (
    <Box maxW="800px" mx="auto" p={6}>
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="md">Practice Test: {subject}</Heading>
        <Box textAlign="right">
          <Text fontSize="2xl" fontWeight="bold">
            ⏱️ {Math.floor(timer / 60)}:{("0" + (timer % 60)).slice(-2)}
          </Text>
          <Flex mt={2} gap={2} justify="flex-end">
            <IconButton
              aria-label={isPaused ? "Resume" : "Pause"}
              icon={<Icon as={PlayPauseIconComp} />}
              onClick={() => setIsPaused(!isPaused)}
            />
            <Button colorScheme="red" onClick={finishTest}>
              Finish Test
            </Button>
          </Flex>
        </Box>
      </Flex>

      {currentQuestion && (
        <Box>
          <Flex justify="space-between" align="center">
            <Text fontSize="xl" fontWeight="bold">
              Q{currentQuestionIndex + 1}: {currentQuestion.question}
            </Text>
            <IconButton
              aria-label="Speak Question"
              icon={<Icon as={VolumeIconComp} />}
              onClick={() =>
                speak(
                  currentQuestion.question +
                    ". " +
                    currentQuestion.options.join(", ")
                )
              }
              size="sm"
            />
          </Flex>

          <Stack spacing={3} mt={4}>
            {currentQuestion.options.map((option: string, index: number) => {
              const letter = optionLetters[index];
              const isSelected = selectedOption === letter;
              return (
                <Box
                  key={index}
                  p={2}
                  borderWidth={1}
                  borderRadius="md"
                  bg={
                    isSelected
                      ? isCorrect
                        ? "green.100"
                        : "red.100"
                      : "white"
                  }
                  cursor={!selectedOption ? "pointer" : "default"}
                  onClick={() => handleOptionClick(letter)}
                >
                  <Text>
                    <strong>{letter}:</strong> {option}
                  </Text>
                </Box>
              );
            })}
          </Stack>

          <Flex justify="flex-end" mt={6}>
            <Button colorScheme="blue" onClick={handleNext}>
              {currentQuestionIndex === questions.length - 1
                ? "Finish"
                : "Next"}
            </Button>
          </Flex>

          {selectedOption && showFeedback && (
            <Box
              mt={4}
              p={4}
              borderWidth={1}
              borderRadius="md"
              bg={isCorrect ? "green.100" : "red.100"}
            >
              <Text fontWeight="bold">
                {isCorrect
                  ? "✅ Correct Answer!"
                  : `❌ Wrong Answer. Correct is: ${currentQuestion.correctAnswer}`}
              </Text>
              <Text mt={2}>
                <strong>Explanation:</strong> {currentQuestion.explanation}
              </Text>
            </Box>
          )}

          <Flex align="center" mt={4}>
            <Text mr={2}>Show Feedback</Text>
            <Switch
              isChecked={showFeedback}
              onChange={() => setShowFeedback(!showFeedback)}
            />
          </Flex>
        </Box>
      )}
    </Box>
  );
};

export default Test;
