import { useState } from "react";
import "./App.css";
import TodoList from "./components/TodoList";
import Groq from "groq-sdk";
import { RiRobot3Line } from "react-icons/ri";
import { FaSave } from "react-icons/fa";

const groq = new Groq({
  apiKey: "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",
  dangerouslyAllowBrowser: true,
});

async function getGroqChatCompletion(transcript) {
  const response = await groq.chat.completions.create({
    messages: [
      {
        role: "user",
        content: `Based on the following transcript, create a todo list. Respond only with a JSON array of strings formatted as ["Task 1", "Task 2", "Task 3", etc]. Do not provide extra text or commentary. Transcript: "${transcript}"`,
      },
    ],
    model: "llama3-8b-8192",
  });

  let messageContent = response.choices[0].message.content.trim();

  // Check if the content starts with "[" and ends with "]"
  const startIndex = messageContent.indexOf("[");
  const endIndex = messageContent.lastIndexOf("]");

  if (startIndex !== -1 && endIndex !== -1) {
    // Extract the valid JSON array part
    messageContent = messageContent.slice(startIndex, endIndex + 1);
  } else {
    console.error("No valid JSON array found in response");
    // Attempt to format the response into a valid JSON array
    const tasks = messageContent
      .split("\n")
      .map((task) => task.trim())
      .filter((task) => task !== "");
    messageContent = JSON.stringify(tasks);
  }

  // Ensure the content is valid JSON before parsing
  try {
    return JSON.parse(messageContent);
  } catch (error) {
    console.error("Response content is not valid JSON:", messageContent);
    throw new Error("Failed to parse the response from the AI.");
  }
}

function App() {
  const [transcript, setTranscript] = useState("");

  const [manualTodoInput, setManualTodoInput] = useState("");
  const [generatedTodos, setGeneratedTodos] = useState(null);
  const [errorGenerating, setErrorGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [savedLists, setSavedLists] = useState([]);
  const [selectedList, setSelectedList] = useState(null);

  const handleGenerate = async () => {
    if (transcript.trim() === "") {
      // If the transcript is empty, show an error message
      setErrorMessage(
        "Please enter text in the transcript box before generating a to-do list."
      );
      return;
    }

    try {
      const todosFromApi = await getGroqChatCompletion(transcript); // Pass the transcript to the AI
      const formattedTodos = todosFromApi.map((todo, index) => ({
        id: index + 1,
        text: todo,
        isComplete: false,
      }));
      setGeneratedTodos(formattedTodos);
      setErrorGenerating(false);
      setErrorMessage("");
    } catch (error) {
      console.error("Error generating todos:", error);
      setErrorGenerating(true);
    }
  };

  const handleChange = (e) => {
    setTranscript(e.target.value);
    setErrorMessage("");
  };

  const handleManualTodoChange = (e) => {
    setManualTodoInput(e.target.value);
  };

  const handleManualSubmit = () => {
    const todosFromManualInput = manualTodoInput
      .split("\n")
      .filter((todo) => todo.trim() !== "")
      .map((todo, index) => ({
        id: index + 1,
        text: todo.trim(),
        isComplete: false,
      }));

    setGeneratedTodos(todosFromManualInput);
    setErrorMessage("");
    setManualTodoInput("");
  };

  const handleGenerateAnother = () => {
    setGeneratedTodos(null);
    setTranscript("");
    setManualTodoInput("");
    setErrorGenerating(false);
  };

  const handleSaveList = () => {
    if (generatedTodos && generatedTodos.length > 0) {
      const newSavedList = {
        id: Date.now(),
        name: `List ${savedLists.length + 1}`,
        todos: generatedTodos,
      };
      setSavedLists([...savedLists, newSavedList]);
    }
  };

  const handleSelectList = (listId) => {
    const selected = savedLists.find((list) => list.id === listId);
    setSelectedList(selected);
    setGeneratedTodos(selected.todos);
  };

  return (
    <>
      <h1 className="heading-1">Task Mastermind </h1>
      <h1 className="heading-sub">An AI-Powered Task Creator </h1>
      <div className="todo-app">
        {generatedTodos ? (
          <>
            <TodoList todos={generatedTodos} />
            <button
              className="generate-button-2"
              onClick={handleGenerateAnother}
            >
              Generate Your Own To-Do List
            </button>
          </>
        ) : (
          <div className="input-container">
            <h2 className="heading-2">Your To-Do List </h2>
            <textarea
              className="transcript-input"
              placeholder="Paste your transcript here..."
              value={transcript}
              onChange={handleChange}
            />
            <button className="generate-button" onClick={handleGenerate}>
              Generate To-Do List
            </button>
            {errorMessage && (
              <div
                className="error-message"
                style={{ color: "red", marginTop: "10px" }}
              >
                {errorMessage}
              </div>
            )}
            {errorGenerating && (
              <div className="manual-input-container">
                <textarea
                  className="manual-todo-input"
                  placeholder="AI failed to generate a list."
                  value={manualTodoInput}
                  onChange={handleManualTodoChange}
                />
              </div>
            )}
            <button
              className="manual-submit-button"
              onClick={handleManualSubmit}
            >
              Manually Create List
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default App;
