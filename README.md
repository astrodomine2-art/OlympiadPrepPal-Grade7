
# Olympiad Prep Pal

Olympiad Prep Pal is an intelligent, AI-powered quiz platform designed to help Grade 7 students prepare for the Science Olympiad Foundation (SOF) International Mathematics Olympiad (IMO) and National Science Olympiad (NSO) exams. It provides a dynamic and personalized learning experience through custom quizzes, mock exams, and AI-generated feedback.

## ✨ Key Features

- **Custom Quiz Generation**: Tailor your practice sessions by selecting the subject (IMO or NSO), specific topics, the number of questions, and the difficulty level (Easy, Medium, or Hard).
- **Realistic Mock Exams**: Simulate the pressure of the real exam with full-length, timed mock tests for both IMO and NSO.
- **AI-Powered Question Engine**: Leverages the Google Gemini API to generate an endless supply of fresh, high-quality questions when the local question bank is exhausted, ensuring you never run out of practice material.
- **Personalized Feedback**: After each quiz, the AI analyzes your incorrect answers and provides a detailed report on your weak areas, along with specific, actionable suggestions for improvement.
- **Detailed Reporting**: Receive an instant, comprehensive report card after every quiz, showing your score, percentage, time taken, and a question-by-question review with explanations for incorrect answers.
- **Visual Learning with SVG Diagrams**: Questions that require diagrams are accompanied by clean, simple, and accurate SVG images generated on-the-fly by the AI.
- **Persistent Quiz History**: All your quiz attempts are saved locally, allowing you to track your progress over time and revisit past reports to see how you've improved.
- **Offline-First Question Bank**: The app comes pre-loaded with a set of questions that are stored locally, enabling fast quiz generation and a seamless user experience.

## 🚀 Tech Stack

- **Frontend Framework**: [React](https://reactjs.org/) with TypeScript for building a robust and scalable user interface.
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) for a utility-first approach to create a modern, responsive design.
- **AI Integration**: [Google Gemini API (`@google/genai`)](https://ai.google.dev/) is used for:
    - Generating dynamic and unique quiz questions.
    - Creating personalized improvement suggestions based on user performance.
    - Generating SVG diagrams for visual questions.
- **State Management**: Built-in React Hooks (`useState`, `useEffect`, `useCallback`) for efficient state management.
- **Client-Side Storage**: A custom `useLocalStorage` hook is used to persist the user's quiz history and the growing question bank directly in the browser.
- **Development Environment**: The app uses a modern, build-less setup with ES Modules and an `importmap` in `index.html` to handle dependencies.

## ⚙️ How It Works

1.  **Quiz Configuration**: The user starts on the setup screen, where they can configure a custom quiz or select a pre-defined mock exam.
2.  **Question Fetching**: The application first attempts to source questions from its local question bank, which is persisted in `localStorage`. This ensures speed and offline accessibility.
3.  **AI Augmentation**: If the local bank doesn't have enough questions to meet the user's criteria (e.g., specific topic, difficulty, or simply needs more unique questions), the app makes a call to the **Google Gemini API**. It requests new, unique questions, providing context like the subject, topics, and difficulty level.
4.  **Quiz Session**: The user takes the quiz with a clean and interactive interface. For mock exams, a timer adds to the challenge.
5.  **Performance Analysis**: Upon completion, the quiz result is processed. A second call is made to the **Google Gemini API**, sending the topics of the incorrectly answered questions. The AI then returns a concise, markdown-formatted analysis with improvement tips.
6.  **Reporting & History**: The final report card, including the AI-generated feedback, is displayed to the user. The entire quiz result is then saved to `localStorage` for future review in the "Quiz History" section.
