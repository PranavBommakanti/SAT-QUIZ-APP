import React, { useState, useEffect, useRef } from "react";
import "./App.css";
function App() {
  const TOTAL_TEST_QUESTIONS = 54;
  const TOTAL_TEST_TIME_SECONDS = 64 * 60;

  const [testNumber, setTestNumber] = useState("");
  const [numQuestions, setNumQuestions] = useState("");
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(TOTAL_TEST_TIME_SECONDS);

  const timerRef = useRef(null);

  const fetchQuestions = () => {
    if (!testNumber) return;
    setLoading(true);
    setError("");
    fetch(`http://192.168.29.252:4000/questions/${testNumber}`)
      .then((res) => {
        if (!res.ok) throw new Error("Test not found");
        return res.json();
      })
      .then((data) => {
        let totalAvailable = data.length;
        let count = parseInt(numQuestions, 10);
        if (!count || count > totalAvailable) count = totalAvailable;

        const slicedQuestions = data.slice(0, count).map((item) => ({
          question_index: item.exam_question_index,
          passage_or_sentence: item.passage_or_sentence || "",
          question_text: item.question_text.trim() || "Question text missing.",
          options: {
            A: item.A,
            B: item.B,
            C: item.C,
            D: item.D,
          },
          correct: item.correct,
          explanation: item.explanation || "",
        }));

        const timePerQuestion = TOTAL_TEST_TIME_SECONDS / TOTAL_TEST_QUESTIONS;
        const adjustedTimeLeft = Math.floor(timePerQuestion * count);

        setQuestions(slicedQuestions);
        setCurrentIndex(0);
        setAnswers({});
        setShowResults(false);
        setTimeLeft(adjustedTimeLeft);
      })
      .catch((e) => {
        setError(e.message);
        setQuestions([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (showResults || questions.length === 0) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          setShowResults(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [showResults, questions.length]);

  const handleAnswerSelect = (option) => {
    setAnswers({ ...answers, [currentIndex]: option });
  };

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmit = () => {
    setShowResults(true);
    clearInterval(timerRef.current);
  };

  const handleRestart = () => {
    setTestNumber("");
    setNumQuestions("");
    setQuestions([]);
    setCurrentIndex(0);
    setAnswers({});
    setShowResults(false);
    setTimeLeft(TOTAL_TEST_TIME_SECONDS);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (loading)
    return (
      <div className="container">
        <div className="loading">Loading questions...</div>
      </div>
    );

  if (error)
    return (
      <div className="container">
        <div className="error">Error: {error}</div>
        <button
          className="btn"
          onClick={() => {
            setError("");
            setQuestions([]);
          }}
        >
          Try Again
        </button>
      </div>
    );

  if (questions.length === 0) {
    return (
      <div className="container">
        <h2>Enter Test Number and Number of Questions</h2>
        <input
          type="number"
          value={testNumber}
          onChange={(e) => setTestNumber(e.target.value)}
          placeholder="Test Number"
          className="input"
          min="1"
        />
        <input
          type="number"
          value={numQuestions}
          onChange={(e) => setNumQuestions(e.target.value)}
          placeholder="Number of Questions"
          className="input"
          min="1"
        />
        <button
          className="btn"
          onClick={fetchQuestions}
          disabled={!testNumber}
        >
          Load Test
        </button>
      </div>
    );
  }

  const totalCorrect = questions.reduce((acc, q, i) => {
    if (answers[i] === q.correct) return acc + 1;
    return acc;
  }, 0);
  const totalWrong = questions.length - totalCorrect;

  if (showResults) {
    return (
      <div className="container">
        <h2>Quiz Results</h2>
        <div className="result-summary">
          <p>
            Correct Answers: <span className="correct-count">{totalCorrect}</span>
          </p>
          <p>
            Wrong Answers: <span className="wrong-count">{totalWrong}</span>
          </p>
        </div>
        {questions.map((q, i) => {
          const userAnswer = answers[i];
          const isCorrect = userAnswer === q.correct;
          // Always show full question context when user was wrong
          return (
            <div
              key={i}
              className={`result-item ${isCorrect ? "correct" : "incorrect"}`}
            >
              <div className="question-text">
                <strong>Q{i + 1}:</strong>
                {q.passage_or_sentence && (
                  <div className="passage">{q.passage_or_sentence}</div>
                )}
                <div>{q.question_text}</div>
                <div className="options-result">
                  {Object.entries(q.options).map(([key, text]) => (
                    <span
                      key={key}
                      style={{
                        fontWeight: q.correct === key ? "bold" : "normal",
                        color: userAnswer === key
                          ? isCorrect
                            ? "#2a9d8f"
                            : "#e63946"
                          : "#333",
                        textDecoration:
                          q.correct === key
                            ? "underline"
                            : userAnswer === key
                            ? "line-through"
                            : "none",
                        marginRight: 16,
                      }}
                    >
                      {key}: {text}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                Your Answer: {userAnswer || "No answer selected"} (
                {q.options[userAnswer] || "-"})
              </div>
              <div>
                Correct Answer: {q.correct} ({q.options[q.correct]})
              </div>
              {q.explanation && (
                <div className="explanation">
                  <em>Explanation:</em> {q.explanation}
                </div>
              )}
            </div>
          );
        })}
        <button className="btn" onClick={handleRestart}>
          Restart Quiz
        </button>
      </div>
    );
  }

  const current = questions[currentIndex];
  const selectedAnswer = answers[currentIndex] || "";

  return (
    <div className="container">
      <div className="header">
        <h2>
          SAT Question {currentIndex + 1} / {questions.length}
        </h2>
        <div className="timer">Time Left: {formatTime(timeLeft)}</div>
      </div>
      <div className="question-header">
        <strong>Q{currentIndex + 1}:</strong>
        {current.passage_or_sentence && (
          <div className="passage">{current.passage_or_sentence}</div>
        )}
      </div>
      <div className="question-text">{current.question_text}</div>
      <div className="options">
        {Object.entries(current.options).map(([key, text]) => (
          <label key={key} className="option-label">
            <input
              type="radio"
              name="answer"
              value={key}
              checked={selectedAnswer === key}
              onChange={() => handleAnswerSelect(key)}
            />
            <strong>{key}:</strong> {text}
          </label>
        ))}
      </div>
      <div className="navigation">
        <button
          className="btn"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
        >
          Previous
        </button>
        {currentIndex + 1 === questions.length ? (
          <button
            className="btn"
            onClick={handleSubmit}
            disabled={!selectedAnswer}
          >
            Submit
          </button>
        ) : (
          <button
            className="btn"
            onClick={handleNext}
            disabled={!selectedAnswer}
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}

export default App;
